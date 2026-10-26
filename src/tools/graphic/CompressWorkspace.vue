<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { ArrowLeft, Feather, Gem, Loader2, Medal, RotateCw, Star, ZoomIn } from 'lucide-vue-next'
import { useI18n } from '@/i18n'
import { formatBytes } from '@/composables/useFiles'
import CompressViewer, { type LensRect } from './CompressViewer.vue'
import CompressChart, { type ChartPoint } from './CompressChart.vue'
import {
  bestQualityIndex,
  canDrill,
  differenceImage,
  formatChange,
  levelsOf,
  pointOf,
  recommend,
  sizeChange,
  smallestIndex,
  type CompressItem,
  type QualityMetric,
} from './imageCompressor'

const props = defineProps<{
  item: CompressItem
  metric: QualityMetric
  /** Level currently used for this image (picked or recommended) */
  chosen: number | null
}>()
const emit = defineEmits<{
  (e: 'pick', level: number): void
  (e: 'drill', level: number | null): void
  (e: 'retry', level: number): void
}>()

const { t } = useI18n()
const tt = (k: string, p?: Record<string, string | number>) => t(`tools.image-compressor.${k}`, p)

const isSvg = computed(() => props.item.output === 'svg')
const levelLabel = (level: number) => (isSvg.value ? tt('decimals', { n: level }) : `Q${level}`)
const cellLabel = (level: number) => (isSvg.value ? tt('decimalsShort', { n: level }) : `Q${level}`)

const levels = computed(() => levelsOf(props.item))
const variants = computed(() => levels.value.map((l) => props.item.variants[l]))
const points = computed(() => variants.value.map(pointOf))
const rec = computed(() => recommend(points.value, props.metric))
const minIdx = computed(() => smallestIndex(points.value))
const maxIdx = computed(() => bestQualityIndex(points.value, props.metric))
const levelAt = (i: number) => (i >= 0 ? levels.value[i]! : null)

function badge(i: number) {
  if (i === rec.value.best) return { icon: Star, cls: 'bg-warning-soft text-warning', tip: tt('badgeBest') }
  if (i === rec.value.runnerUp) return { icon: Medal, cls: 'bg-surface text-fg-muted', tip: tt('badgeRunnerUp') }
  if (i === minIdx.value) return { icon: Feather, cls: 'bg-accent-soft text-accent', tip: tt('badgeSmallest') }
  if (i === maxIdx.value) return { icon: Gem, cls: 'bg-success-soft text-success', tip: tt('badgeBestQuality') }
  return null
}

const chartPoints = computed<ChartPoint[]>(() =>
  levels.value.map((level, i) => {
    const p = points.value[i]
    return { level, label: String(level), size: p?.size ?? null, ssim: p?.ssim ?? null, psnr: p?.psnr ?? null }
  }),
)

const selected = computed(() => (props.chosen !== null ? props.item.variants[props.chosen] : undefined))
const selectedChange = computed(() => (selected.value?.blob ? sizeChange(props.item.file.size, selected.value.blob.size) : 0))

const fmtMetric = (v: { ssim: number; psnr: number } | null | undefined) =>
  !v ? '—' : props.metric === 'ssim' ? `${(v.ssim * 100).toFixed(1)}%` : `${v.psnr >= 100 ? '∞' : v.psnr.toFixed(1)} dB`

// ---------------------------------------------------------------- decoded images for the grid

type Source = ImageBitmap | HTMLImageElement
const sources = new Map<number, Source>()
let original: Source | null = null
let alive = true

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('load failed'))
    img.src = url
  })
}

async function decode(blob: Blob, url: string): Promise<Source> {
  return isSvg.value ? loadImage(url) : createImageBitmap(blob)
}

const decoding = new Set<number>()
function syncSources() {
  for (const [level, v] of Object.entries(props.item.variants)) {
    const l = Number(level)
    if (v.status !== 'done' || !v.blob || sources.has(l) || decoding.has(l)) continue
    decoding.add(l)
    void decode(v.blob, v.url)
      .then((src) => {
        if (!alive) return src instanceof ImageBitmap && src.close()
        sources.set(l, src)
        scheduleDraw()
      })
      .catch(() => {})
      .finally(() => decoding.delete(l))
  }
}
watch(() => Object.values(props.item.variants).map((v) => v.url).join('|'), syncSources, { immediate: true })

onBeforeUnmount(() => {
  alive = false
  cancelAnimationFrame(raf)
  for (const s of sources.values()) if (s instanceof ImageBitmap) s.close()
  if (original instanceof ImageBitmap) original.close()
  for (const url of diffs.values()) URL.revokeObjectURL(url)
  ro?.disconnect()
})

// ---------------------------------------------------------------- grid drawing (RAF-throttled)

const canvases: (HTMLCanvasElement | null)[] = []
const lens = ref<LensRect>({ x: 0, y: 0, size: 1 })
const cellSize = ref(128)
const gridEl = ref<HTMLDivElement | null>(null)
let ro: ResizeObserver | null = null
let raf = 0

function setCanvas(el: unknown, i: number) {
  canvases[i] = el instanceof HTMLCanvasElement ? el : null
}

function drawCells() {
  const dpr = window.devicePixelRatio || 1
  const { x, y, size } = lens.value
  levels.value.forEach((level, i) => {
    const canvas = canvases[i]
    const src = sources.get(level)
    if (!canvas) return
    const w = Math.round(canvas.clientWidth * dpr)
    const h = Math.round(canvas.clientHeight * dpr)
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w
      canvas.height = h
    }
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.clearRect(0, 0, w, h)
    if (!src || props.item.variants[level]?.status !== 'done') return
    // shrink smoothly, magnify as hard pixels so compression artifacts stay visible
    ctx.imageSmoothingEnabled = size > w
    ctx.imageSmoothingQuality = 'high'
    ctx.drawImage(src, x, y, size, size, 0, 0, w, h)
  })
}

function scheduleDraw() {
  if (raf) return
  raf = requestAnimationFrame(() => {
    raf = 0
    drawCells()
  })
}

watch([lens, levels], () => nextTick(scheduleDraw))

onMounted(() => {
  ro = new ResizeObserver(() => {
    const first = gridEl.value?.querySelector('canvas')
    if (first) cellSize.value = Math.max(48, Math.round(first.clientWidth))
    scheduleDraw()
  })
  ro.observe(gridEl.value!)
})

// ---------------------------------------------------------------- view mode & difference image

type ViewMode = 'original' | 'compressed' | 'difference'
const view = ref<ViewMode>('compressed')
const diffs = new Map<number, string>()
const diffUrl = ref('')
const diffBusy = ref(false)

function pixels(src: Source, w: number, h: number): Uint8ClampedArray {
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  const ctx = c.getContext('2d', { willReadFrequently: true })!
  ctx.drawImage(src, 0, 0, w, h)
  return ctx.getImageData(0, 0, w, h).data
}

async function updateDiff() {
  diffUrl.value = ''
  const level = props.chosen
  if (view.value !== 'difference' || level === null || props.item.variants[level]?.status !== 'done') return
  const cached = diffs.get(level)
  if (cached) return void (diffUrl.value = cached)
  diffBusy.value = true
  try {
    original ??= isSvg.value ? await loadImage(props.item.original) : await createImageBitmap(props.item.file)
    const v = props.item.variants[level]!
    const comp = sources.get(level) ?? (await decode(v.blob!, v.url))
    const { width: w, height: h } = props.item
    const data = differenceImage(pixels(original, w, h), pixels(comp, w, h), w, h)
    const c = document.createElement('canvas')
    c.width = w
    c.height = h
    c.getContext('2d')!.putImageData(new ImageData(data, w, h), 0, 0)
    const blob = await new Promise<Blob | null>((res) => c.toBlob(res, 'image/png'))
    if (!blob || !alive) return
    const url = URL.createObjectURL(blob)
    diffs.set(level, url)
    if (props.chosen === level && view.value === 'difference') diffUrl.value = url
  } catch {
    // leave the difference view empty
  } finally {
    diffBusy.value = false
  }
}
watch([view, () => props.chosen, () => selected.value?.status], updateDiff)

const viewSrc = computed(() => {
  if (view.value === 'original') return props.item.original
  if (view.value === 'difference') return diffUrl.value || props.item.original
  return selected.value?.status === 'done' ? selected.value.url : props.item.original
})

const views: ViewMode[] = ['original', 'compressed', 'difference']
</script>

<template>
  <div class="grid grid-cols-[minmax(0,1fr)] gap-4 lg:grid-cols-[minmax(0,1fr)_24rem] lg:items-start">
    <!-- viewer -->
    <section class="overflow-hidden rounded-card border border-line bg-surface lg:sticky lg:top-4">
      <div class="flex flex-wrap items-center gap-2 border-b border-line px-3 py-2">
        <div class="mr-auto min-w-0">
          <div class="truncate text-sm font-medium text-fg">{{ item.file.name }}</div>
          <div class="font-mono text-[11px] text-fg-muted">{{ item.width }} × {{ item.height }} · {{ formatBytes(item.file.size) }}</div>
        </div>
        <div class="inline-flex rounded-md border border-line bg-surface-2 p-0.5" role="tablist">
          <button
            v-for="v in views"
            :key="v"
            type="button"
            role="tab"
            :aria-selected="view === v"
            class="h-7 rounded px-2.5 text-xs font-medium transition-colors focus-ring"
            :class="view === v ? 'bg-surface text-fg shadow-sm' : 'text-fg-muted hover:text-fg'"
            @click="view = v"
          >
            {{ tt(`view_${v}`) }}
          </button>
        </div>
      </div>

      <div class="relative">
        <CompressViewer
          :src="viewSrc"
          :width="item.width"
          :height="item.height"
          :cell-size="cellSize"
          class="h-[55vh] min-h-72 lg:h-[calc(100vh-15rem)]"
          @lens="lens = $event"
        />
        <div v-if="view === 'difference' && diffBusy" class="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-md bg-surface px-2 py-1 text-xs text-fg-muted shadow-sm">
          <Loader2 class="h-3.5 w-3.5 animate-spin" />{{ tt('computingDiff') }}
        </div>
      </div>

      <!-- metrics of the chosen level -->
      <dl class="grid grid-cols-3 gap-x-4 gap-y-1.5 border-t border-line px-4 py-2.5 text-xs sm:grid-cols-6">
        <div>
          <dt class="text-fg-faint">{{ tt('level') }}</dt>
          <dd class="font-mono text-fg">{{ chosen !== null ? levelLabel(chosen) : '—' }}</dd>
        </div>
        <div>
          <dt class="text-fg-faint">{{ tt('size') }}</dt>
          <dd class="font-mono text-fg">
            {{ selected?.blob ? formatBytes(selected.blob.size) : '—' }}
            <span v-if="selected?.blob" :class="selectedChange < 0 ? 'text-success' : 'text-danger'">{{ formatChange(selectedChange) }}</span>
          </dd>
        </div>
        <div :title="tt('ssimHint')">
          <dt class="text-fg-faint">SSIM</dt>
          <dd class="font-mono text-fg">{{ selected?.metrics ? `${(selected.metrics.ssim * 100).toFixed(2)}%` : '—' }}</dd>
        </div>
        <div :title="tt('psnrHint')">
          <dt class="text-fg-faint">PSNR</dt>
          <dd class="font-mono text-fg">{{ selected?.metrics ? (selected.metrics.psnr >= 100 ? '∞' : `${selected.metrics.psnr.toFixed(2)} dB`) : '—' }}</dd>
        </div>
        <div :title="tt('rmseHint')">
          <dt class="text-fg-faint">RMSE</dt>
          <dd class="font-mono text-fg">{{ selected?.metrics ? selected.metrics.rmse.toFixed(2) : '—' }}</dd>
        </div>
        <div :title="tt('maxErrorHint')">
          <dt class="text-fg-faint">{{ tt('maxError') }}</dt>
          <dd class="font-mono text-fg">{{ selected?.metrics ? selected.metrics.maxError : '—' }}</dd>
        </div>
      </dl>
    </section>

    <!-- grid + chart -->
    <section class="space-y-3">
      <div class="flex min-h-8 items-center gap-2">
        <button
          v-if="item.drill !== null"
          type="button"
          class="inline-flex h-7 items-center gap-1 rounded-md px-2 text-xs font-medium text-accent hover:bg-accent-soft focus-ring"
          @click="emit('drill', null)"
        >
          <ArrowLeft class="h-3.5 w-3.5" />{{ tt('drillBack') }}
        </button>
        <span class="font-mono text-xs text-fg-muted">{{ levelLabel(levels[0]!) }} – {{ levelLabel(levels[levels.length - 1]!) }}</span>
        <span class="ml-auto text-[11px] text-fg-faint">{{ tt('gridHint') }}</span>
      </div>

      <div ref="gridEl" class="grid grid-cols-3 gap-2">
        <div
          v-for="(level, i) in levels"
          :key="level"
          role="button"
          tabindex="0"
          :aria-pressed="chosen === level"
          :aria-label="levelLabel(level)"
          class="group relative aspect-square overflow-hidden rounded-lg border bg-surface focus-ring"
          :class="[
            chosen === level ? 'border-accent ring-2 ring-accent' : 'border-line hover:border-line-strong',
            variants[i]?.status === 'done' ? 'cursor-pointer' : 'cursor-default',
          ]"
          @click="variants[i]?.status === 'done' && emit('pick', level)"
          @keydown.enter.prevent="variants[i]?.status === 'done' && emit('pick', level)"
          @keydown.space.prevent="variants[i]?.status === 'done' && emit('pick', level)"
        >
          <canvas :ref="(el) => setCanvas(el, i)" class="absolute inset-0 h-full w-full" />

          <div v-if="!variants[i] || variants[i]!.status === 'queued'" class="absolute inset-0 flex items-center justify-center bg-surface-2">
            <Loader2 class="h-5 w-5 animate-spin text-fg-faint" />
          </div>
          <div v-else-if="variants[i]!.status === 'error'" class="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-danger-soft p-2 text-center">
            <span class="text-[11px] text-danger">{{ tt('failed') }}</span>
            <button type="button" class="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] font-medium text-fg hover:bg-surface focus-ring" @click.stop="emit('retry', level)">
              <RotateCw class="h-3 w-3" />{{ tt('retry') }}
            </button>
          </div>

          <span
            v-if="badge(i)"
            class="absolute left-1.5 top-1.5 inline-flex h-5 w-5 items-center justify-center rounded-full shadow-sm"
            :class="badge(i)!.cls"
            :title="badge(i)!.tip"
          >
            <component :is="badge(i)!.icon" class="h-3 w-3" :fill="badge(i)!.icon === Star ? 'currentColor' : 'none'" />
          </span>
          <button
            v-if="variants[i]?.status === 'done' && canDrill(item.output, item.drill !== null, level)"
            type="button"
            class="absolute right-1.5 top-1.5 inline-flex h-6 w-6 items-center justify-center rounded-md bg-surface/90 text-fg-muted opacity-0 shadow-sm transition-opacity hover:text-accent focus-ring focus-visible:opacity-100 group-hover:opacity-100 [@media(hover:none)]:opacity-100"
            :title="tt('drillInto', { from: levelLabel(level + 1), to: levelLabel(level + 9) })"
            @click.stop="emit('drill', level)"
          >
            <ZoomIn class="h-3.5 w-3.5" />
          </button>

          <div class="absolute inset-x-0 bottom-0 flex items-center gap-1 overflow-hidden whitespace-nowrap bg-surface/90 px-1.5 py-0.5 font-mono text-[10px] leading-4 sm:text-[11px]">
            <span class="font-semibold" :class="chosen === level ? 'text-accent' : 'text-fg'">{{ cellLabel(level) }}</span>
            <span class="hidden text-fg-muted sm:inline">{{ fmtMetric(points[i]) }}</span>
            <span class="ml-auto text-fg-muted">{{ points[i] ? formatBytes(points[i]!.size) : '' }}</span>
          </div>
        </div>
      </div>

      <div class="rounded-card border border-line bg-surface px-3 pb-2 pt-3">
        <CompressChart :points="chartPoints" :metric="metric" :selected="chosen" :best="levelAt(rec.best)" @pick="emit('pick', $event)" />
        <div class="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-fg-muted">
          <span class="inline-flex items-center gap-1"><span class="h-0.5 w-3 rounded bg-accent" />{{ tt('size') }}</span>
          <span class="inline-flex items-center gap-1">
            <span class="h-0.5 w-3 rounded" :class="metric === 'ssim' ? 'bg-success' : 'bg-warning'" />{{ metric.toUpperCase() }}
          </span>
          <span class="inline-flex items-center gap-1"><Star class="h-3 w-3 text-warning" fill="currentColor" />{{ tt('badgeBest') }}</span>
          <span class="inline-flex items-center gap-1"><Medal class="h-3 w-3" />{{ tt('badgeRunnerUp') }}</span>
          <span class="inline-flex items-center gap-1"><Feather class="h-3 w-3 text-accent" />{{ tt('badgeSmallest') }}</span>
          <span class="inline-flex items-center gap-1"><Gem class="h-3 w-3 text-success" />{{ tt('badgeBestQuality') }}</span>
        </div>
      </div>
    </section>
  </div>
</template>
