<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { Archive, Download, FileImage, Gauge, Loader2, Star, Trash2, X } from 'lucide-vue-next'
import ConfigSection from '@/components/ui/ConfigSection.vue'
import SettingCard from '@/components/ui/SettingCard.vue'
import BaseSelect from '@/components/ui/BaseSelect.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import DropZone from '@/components/ui/DropZone.vue'
import IconButton from '@/components/ui/IconButton.vue'
import { useI18n } from '@/i18n'
import { useToast } from '@/composables/useToast'
import { downloadBlob, formatBytes } from '@/composables/useFiles'
import CompressWorkspace from './CompressWorkspace.vue'
import { CancelledError, CompressorPool } from './imageCompressorPool'
import {
  FORMAT_INFO,
  OUTPUT_CHOICES,
  centerOutOrder,
  createZip,
  defaultLevels,
  detectFormat,
  formatChange,
  levelsOf,
  measureDistortion,
  outputFileName,
  pointOf,
  recommend,
  resolveOutputFormat,
  sizeChange,
  uniqueNames,
  type CompressItem,
  type CompressFormat,
  type OutputChoice,
  type QualityMetric,
  type Variant,
} from './imageCompressor'

const { t } = useI18n()
const tt = (k: string, p?: Record<string, string | number>) => t(`tools.image-compressor.${k}`, p)
const { show } = useToast()

const ACCEPT = 'image/jpeg,image/png,image/webp,image/svg+xml,.jpg,.jpeg,.jfif,.png,.webp,.svg'
/** Larger images risk running the WASM encoders out of memory */
const MAX_PIXELS = 50_000_000
/** SVG metrics are measured on a raster of at most this many pixels per side */
const SVG_RASTER = 1024

const output = ref<OutputChoice>('auto')
const outputOptions = computed(() => OUTPUT_CHOICES.map((c) => ({ value: c, label: c === 'auto' ? tt('outputAuto') : FORMAT_INFO[c].label })))
const metric = ref<QualityMetric>('ssim')
const metricOptions = computed(() => [
  { value: 'ssim' as const, label: tt('metricSsim') },
  { value: 'psnr' as const, label: tt('metricPsnr') },
])

const items = ref<CompressItem[]>([])
const activeId = ref<number | null>(null)
const active = computed(() => items.value.find((it) => it.id === activeId.value) ?? null)
const pool = new CompressorPool()
watch(activeId, (id) => (pool.priority = id ?? -1))
let seq = 0

/** SVG sources: markup for SVGO and a raster of the original for the metrics */
const svgSources = new Map<number, { text: string; pixels: Uint8ClampedArray; width: number; height: number }>()

// ---------------------------------------------------------------- loading

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('load failed'))
    img.src = url
  })
}

function rasterize(img: CanvasImageSource, width: number, height: number): Uint8ClampedArray {
  const c = document.createElement('canvas')
  c.width = width
  c.height = height
  const ctx = c.getContext('2d', { willReadFrequently: true })!
  ctx.drawImage(img, 0, 0, width, height)
  return ctx.getImageData(0, 0, width, height).data
}

async function prepare(it: CompressItem) {
  try {
    if (it.input === 'svg') {
      const [text, img] = await Promise.all([it.file.text(), loadImage(it.original)])
      it.width = img.naturalWidth || 512
      it.height = img.naturalHeight || 512
      const s = Math.min(1, SVG_RASTER / Math.max(it.width, it.height))
      const width = Math.max(1, Math.round(it.width * s))
      const height = Math.max(1, Math.round(it.height * s))
      svgSources.set(it.id, { text, pixels: rasterize(img, width, height), width, height })
    } else {
      const bmp = await createImageBitmap(it.file)
      it.width = bmp.width
      it.height = bmp.height
      bmp.close()
      if (it.width * it.height > MAX_PIXELS) return void (it.error = tt('tooLarge', { max: '50' }))
    }
    enqueue(it, levelsOf(it))
  } catch {
    it.error = tt('loadFailed')
  }
}

function addFiles(files: File[]) {
  const skipped: string[] = []
  for (const file of files) {
    const input = detectFormat(file.name, file.type)
    if (!input) {
      skipped.push(file.name)
      continue
    }
    items.value.push({
      id: ++seq,
      file,
      input,
      output: resolveOutputFormat(input, output.value),
      original: URL.createObjectURL(file),
      width: 0,
      height: 0,
      drill: null,
      variants: {},
      pick: null,
      error: '',
    })
    const it = items.value[items.value.length - 1]!
    activeId.value ??= it.id
    void prepare(it)
  }
  if (skipped.length) show(tt('unsupported', { names: skipped.join(', ') }), 'error', 3500)
}

function onPaste(e: ClipboardEvent) {
  const target = e.target as HTMLElement | null
  if (target?.closest('input, textarea, [contenteditable="true"]')) return
  const files = Array.from(e.clipboardData?.files ?? []).filter((f) => detectFormat(f.name, f.type))
  if (files.length) {
    e.preventDefault()
    addFiles(files)
  }
}
onMounted(() => document.addEventListener('paste', onPaste))

// ---------------------------------------------------------------- compression

function setVariant(it: CompressItem, level: number, v: Variant) {
  const old = it.variants[level]
  if (old?.url && old.url !== v.url) URL.revokeObjectURL(old.url)
  it.variants[level] = v
}

async function runLevel(it: CompressItem, level: number) {
  const format = it.output
  try {
    const svg = svgSources.get(it.id)
    const res =
      format === 'svg'
        ? await pool.run(it.id, { type: 'svg', text: svg!.text, precision: level })
        : await pool.run(it.id, { type: 'encode', key: it.id, source: it.file, format, level })
    const blob = new Blob([res.bytes], { type: FORMAT_INFO[format].mime })
    let metrics = res.metrics
    if (format === 'svg' && svg) {
      const url = URL.createObjectURL(blob)
      try {
        const img = await loadImage(url)
        metrics = measureDistortion(svg.pixels, rasterize(img, svg.width, svg.height), svg.width, svg.height)
      } finally {
        URL.revokeObjectURL(url)
      }
    }
    // discard results of removed images or of a previous output format
    if (!items.value.includes(it) || it.output !== format) return
    setVariant(it, level, { level, status: 'done', blob, url: URL.createObjectURL(blob), metrics })
  } catch (err) {
    if (err instanceof CancelledError || !items.value.includes(it) || it.output !== format) return
    setVariant(it, level, { level, status: 'error', blob: null, url: '', metrics: null })
  }
}

/** Queues the missing (or failed) levels, middle first. */
function enqueue(it: CompressItem, levels: number[]) {
  for (const i of centerOutOrder(levels.length)) {
    const level = levels[i]!
    const v = it.variants[level]
    if (v && v.status !== 'error') continue
    setVariant(it, level, { level, status: 'queued', blob: null, url: '', metrics: null })
    void runLevel(it, level)
  }
}

function reset(it: CompressItem, format: CompressFormat) {
  pool.cancel(it.id)
  for (const v of Object.values(it.variants)) if (v.url) URL.revokeObjectURL(v.url)
  it.variants = {}
  it.drill = null
  it.pick = null
  it.output = format
  if (!it.error && it.width) enqueue(it, levelsOf(it))
}

watch(output, (choice) => {
  for (const it of items.value) {
    const format = resolveOutputFormat(it.input, choice)
    if (format !== it.output) reset(it, format)
  }
})

function onDrill(it: CompressItem, level: number | null) {
  it.drill = level
  enqueue(it, levelsOf(it))
}

// ---------------------------------------------------------------- choice & summary

/** The picked level, or the recommendation over the default grid */
function chosenLevel(it: CompressItem): number | null {
  if (it.pick !== null && it.variants[it.pick]?.status === 'done') return it.pick
  const levels = defaultLevels(it.output)
  const { best } = recommend(levels.map((l) => pointOf(it.variants[l])), metric.value)
  return best >= 0 ? levels[best]! : null
}
const chosen = computed(() => new Map(items.value.map((it) => [it.id, chosenLevel(it)])))
const chosenVariant = (it: CompressItem) => {
  const level = chosen.value.get(it.id)
  return level != null ? it.variants[level] : undefined
}

function progress(it: CompressItem) {
  const levels = levelsOf(it)
  const done = levels.filter((l) => it.variants[l] && it.variants[l].status !== 'queued').length
  return { done, total: levels.length }
}
const busy = (it: CompressItem) => !it.error && (it.width === 0 || Object.values(it.variants).some((v) => v.status === 'queued'))

const summary = computed(() => {
  let original = 0
  let compressed = 0
  let ready = 0
  for (const it of items.value) {
    const v = chosenVariant(it)
    if (!v?.blob) continue
    original += it.file.size
    compressed += v.blob.size
    ready++
  }
  return { original, compressed, ready, change: sizeChange(original, compressed) }
})
const anyBusy = computed(() => items.value.some(busy))

const levelLabel = (it: CompressItem, level: number) => (it.output === 'svg' ? tt('decimals', { n: level }) : `Q${level}`)

// ---------------------------------------------------------------- downloads & removal

function download(it: CompressItem) {
  const v = chosenVariant(it)
  if (v?.blob) downloadBlob(v.blob, outputFileName(it.file.name, it.output))
}

const zipping = ref(false)
async function downloadAll() {
  const ready = items.value.flatMap((it) => {
    const v = chosenVariant(it)
    return v?.blob ? [{ it, blob: v.blob }] : []
  })
  if (ready.length === 1) return download(ready[0]!.it)
  if (!ready.length) return
  zipping.value = true
  try {
    const names = uniqueNames(ready.map(({ it }) => outputFileName(it.file.name, it.output)))
    const files = await Promise.all(ready.map(async ({ blob }, i) => ({ name: names[i]!, data: new Uint8Array(await blob.arrayBuffer()) })))
    downloadBlob(new Blob([createZip(files)], { type: 'application/zip' }), tt('zipName'))
  } finally {
    zipping.value = false
  }
}

function release(it: CompressItem) {
  pool.cancel(it.id)
  URL.revokeObjectURL(it.original)
  for (const v of Object.values(it.variants)) if (v.url) URL.revokeObjectURL(v.url)
  svgSources.delete(it.id)
}

function remove(it: CompressItem) {
  const idx = items.value.indexOf(it)
  release(it)
  items.value = items.value.filter((x) => x !== it)
  if (activeId.value === it.id) activeId.value = items.value[Math.min(idx, items.value.length - 1)]?.id ?? null
}

function removeAll() {
  for (const it of items.value) release(it)
  items.value = []
  activeId.value = null
}

onBeforeUnmount(() => {
  document.removeEventListener('paste', onPaste)
  for (const it of items.value) release(it)
  pool.dispose()
})
</script>

<template>
  <div class="space-y-6">
    <ConfigSection>
      <SettingCard :icon="FileImage" :title="tt('output')" :description="tt('outputDesc')">
        <BaseSelect v-model="output" :options="outputOptions" />
      </SettingCard>
      <SettingCard :icon="Gauge" :title="tt('metric')" :description="tt('metricDesc')">
        <BaseSelect v-model="metric" :options="metricOptions" />
      </SettingCard>
    </ConfigSection>

    <div class="space-y-2">
      <DropZone :accept="ACCEPT" multiple :compact="items.length > 0" :label="tt('drop')" @files="addFiles" />
      <p class="text-xs text-fg-muted">
        {{ tt('credit') }}
        <a href="https://recompressor.com/" target="_blank" rel="noopener noreferrer" class="text-accent hover:underline">Recompressor</a>
        ·
        <a href="https://github.com/Mike-Zheng/eagle-plugin-matrix-compress" target="_blank" rel="noopener noreferrer" class="text-accent hover:underline">Matrix Compress</a>
        — {{ tt('engines') }}
      </p>
    </div>

    <template v-if="items.length">
      <!-- summary -->
      <div class="flex flex-wrap items-center gap-x-6 gap-y-3 rounded-card border border-line bg-surface px-4 py-3">
        <dl class="flex flex-wrap gap-x-6 gap-y-1 text-sm">
          <div>
            <dt class="text-xs text-fg-faint">{{ tt('images') }}</dt>
            <dd class="font-mono text-fg">{{ items.length }}</dd>
          </div>
          <div>
            <dt class="text-xs text-fg-faint">{{ tt('originalTotal') }}</dt>
            <dd class="font-mono text-fg">{{ formatBytes(summary.original) }}</dd>
          </div>
          <div>
            <dt class="text-xs text-fg-faint">{{ tt('compressedTotal') }}</dt>
            <dd class="font-mono text-fg">{{ formatBytes(summary.compressed) }}</dd>
          </div>
          <div>
            <dt class="text-xs text-fg-faint">{{ tt('change') }}</dt>
            <dd class="font-mono font-semibold" :class="summary.change <= 0 ? 'text-success' : 'text-danger'">
              {{ summary.ready ? formatChange(summary.change) : '—' }}
            </dd>
          </div>
        </dl>
        <Loader2 v-if="anyBusy" class="h-4 w-4 animate-spin text-fg-faint" :aria-label="tt('compressing')" />
        <div class="ml-auto flex items-center gap-2">
          <BaseButton variant="primary" size="sm" :disabled="!summary.ready || zipping" @click="downloadAll">
            <Archive v-if="summary.ready > 1" class="h-4 w-4" /><Download v-else class="h-4 w-4" />
            {{ summary.ready > 1 ? tt('downloadZip') : t('common.download') }}
          </BaseButton>
          <BaseButton variant="outline" size="sm" @click="removeAll"><Trash2 class="h-4 w-4" />{{ tt('clearAll') }}</BaseButton>
        </div>
      </div>

      <!-- image list -->
      <div class="max-h-80 divide-y divide-line overflow-y-auto rounded-card border border-line bg-surface">
        <div
          v-for="it in items"
          :key="it.id"
          role="button"
          tabindex="0"
          class="flex cursor-pointer items-center gap-3 px-3 py-2 transition-colors focus-ring"
          :class="it.id === activeId ? 'bg-accent-soft' : 'hover:bg-surface-2'"
          :aria-current="it.id === activeId"
          @click="activeId = it.id"
          @keydown.enter.prevent="activeId = it.id"
        >
          <img :src="it.original" alt="" class="h-10 w-10 shrink-0 rounded-md bg-surface-2 object-cover" />
          <div class="min-w-0 flex-1">
            <div class="truncate text-sm font-medium text-fg">{{ it.file.name }}</div>
            <div class="truncate font-mono text-xs text-fg-muted">
              <span v-if="it.error" class="text-danger">{{ it.error }}</span>
              <template v-else>
                {{ FORMAT_INFO[it.input].label }}<template v-if="it.output !== it.input"> → {{ FORMAT_INFO[it.output].label }}</template>
                <template v-if="it.width"> · {{ it.width }}×{{ it.height }}</template>
                · {{ formatBytes(it.file.size) }}
                <template v-if="chosenVariant(it)?.blob"> → {{ formatBytes(chosenVariant(it)!.blob!.size) }}</template>
              </template>
            </div>
          </div>
          <span v-if="busy(it)" class="hidden items-center gap-1 font-mono text-xs text-fg-faint sm:inline-flex">
            <Loader2 class="h-3.5 w-3.5 animate-spin" />{{ progress(it).done }}/{{ progress(it).total }}
          </span>
          <template v-if="chosenVariant(it)?.blob">
            <span
              class="hidden items-center gap-1 rounded-full bg-surface-2 px-2 py-0.5 font-mono text-xs text-fg-muted sm:inline-flex"
              :title="it.pick === null ? tt('badgeBest') : tt('picked')"
            >
              <Star v-if="it.pick === null" class="h-3 w-3 text-warning" fill="currentColor" />{{ levelLabel(it, chosen.get(it.id)!) }}
            </span>
            <span
              class="rounded-full px-2 py-0.5 font-mono text-xs font-medium"
              :class="sizeChange(it.file.size, chosenVariant(it)!.blob!.size) <= 0 ? 'bg-success-soft text-success' : 'bg-danger-soft text-danger'"
            >
              {{ formatChange(sizeChange(it.file.size, chosenVariant(it)!.blob!.size)) }}
            </span>
          </template>
          <IconButton size="sm" :title="t('common.download')" :disabled="!chosenVariant(it)?.blob" @click.stop="download(it)"><Download class="h-4 w-4" /></IconButton>
          <IconButton size="sm" :title="t('common.remove')" @click.stop="remove(it)"><X class="h-4 w-4" /></IconButton>
        </div>
      </div>

      <!-- workspace of the selected image -->
      <CompressWorkspace
        v-if="active && active.width && !active.error"
        :key="`${active.id}:${active.output}`"
        :item="active"
        :metric="metric"
        :chosen="chosen.get(active.id) ?? null"
        @pick="active.pick = $event"
        @drill="onDrill(active, $event)"
        @retry="enqueue(active, [$event])"
      />
    </template>
  </div>
</template>
