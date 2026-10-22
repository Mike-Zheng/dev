<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import {
  Scaling,
  Shuffle,
  Mountain,
  Sparkle,
  Triangle as TriangleIcon,
  Dices,
  Hash,
  Palette,
  Plus,
  X,
  ArrowLeftRight,
  ImagePlus,
  Copy,
  Download,
  FileCode,
} from 'lucide-vue-next'
import ConfigSection from '@/components/ui/ConfigSection.vue'
import SettingCard from '@/components/ui/SettingCard.vue'
import NumberInput from '@/components/ui/NumberInput.vue'
import RangeSlider from '@/components/ui/RangeSlider.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import IconButton from '@/components/ui/IconButton.vue'
import SectionTitle from '@/components/ui/SectionTitle.vue'
import { useI18n } from '@/i18n'
import { useToast } from '@/composables/useToast'
import { downloadBlob, downloadText, pickFile } from '@/composables/useFiles'
import { DEFAULT_OPTIONS, PALETTES, cellPixels, extractPalette, generateTriangles, toSvg, type TriangleOptions } from './triangleGradient'

const { t } = useI18n()
const tt = (k: string, p?: Record<string, string | number>) => t(`tools.triangle-gradient.${k}`, p)
const { show } = useToast()

const width = ref(DEFAULT_OPTIONS.width)
const height = ref(DEFAULT_OPTIONS.height)
const variance = ref(DEFAULT_OPTIONS.variance)
const cellSize = ref(DEFAULT_OPTIONS.cellSize)
const depth = ref(DEFAULT_OPTIONS.depth)
const dither = ref(DEFAULT_OPTIONS.dither)
const seed = ref(DEFAULT_OPTIONS.seed)
const colors = ref<string[]>([...PALETTES[0]!])

const options = computed<TriangleOptions>(() => ({
  width: width.value,
  height: height.value,
  variance: variance.value,
  cellSize: cellSize.value,
  depth: depth.value,
  dither: dither.value,
  colors: colors.value,
  seed: seed.value,
}))
const triangles = computed(() => generateTriangles(options.value))
const currentPalette = computed(() => colors.value.join(','))

const canvas = ref<HTMLCanvasElement | null>(null)
let frame = 0

function draw() {
  frame = 0
  const c = canvas.value
  if (!c) return
  const { width: w, height: h } = options.value
  c.width = w
  c.height = h
  const ctx = c.getContext('2d')!
  ctx.lineWidth = 0.5
  ctx.lineJoin = 'round'
  for (const { points: [a, b, d], color } of triangles.value) {
    const fill = `rgb(${color[0]}, ${color[1]}, ${color[2]})`
    ctx.fillStyle = fill
    ctx.strokeStyle = fill
    ctx.beginPath()
    ctx.moveTo(a[0], a[1])
    ctx.lineTo(b[0], b[1])
    ctx.lineTo(d[0], d[1])
    ctx.closePath()
    ctx.fill()
    ctx.stroke()
  }
}
function scheduleDraw() {
  if (!frame) frame = requestAnimationFrame(draw)
}
watch(triangles, scheduleDraw)
onMounted(draw)

function randomize() {
  seed.value = Math.floor(Math.random() * 1_000_000)
}

function setColor(i: number, value: string) {
  colors.value = colors.value.map((c, j) => (j === i ? value : c))
}
function removeColor(i: number) {
  colors.value = colors.value.filter((_, j) => j !== i)
}
function addColor() {
  colors.value = [...colors.value, colors.value[colors.value.length - 1] ?? '#ffffff']
}
function reverseColors() {
  colors.value = [...colors.value].reverse()
}

async function fromImage() {
  const [file] = await pickFile('image/*')
  if (!file) return
  try {
    const bmp = await createImageBitmap(file)
    const scale = Math.min(1, 200 / Math.max(bmp.width, bmp.height))
    const c = document.createElement('canvas')
    c.width = Math.max(1, Math.round(bmp.width * scale))
    c.height = Math.max(1, Math.round(bmp.height * scale))
    const ctx = c.getContext('2d', { willReadFrequently: true })!
    ctx.drawImage(bmp, 0, 0, c.width, c.height)
    const palette = extractPalette(ctx.getImageData(0, 0, c.width, c.height).data)
    if (palette.length) colors.value = palette
    else show(tt('noColors'), 'error', 2500)
  } catch {
    show(tt('imageFailed'), 'error', 2500)
  }
}

function canvasBlob(): Promise<Blob | null> {
  return new Promise((res) => (canvas.value ? canvas.value.toBlob(res, 'image/png') : res(null)))
}
async function savePng() {
  const blob = await canvasBlob()
  if (blob) downloadBlob(blob, 'triangle-gradient.png')
}
function saveSvg() {
  downloadText(toSvg(triangles.value, width.value, height.value), 'triangle-gradient.svg', 'image/svg+xml')
}
async function copyImage() {
  try {
    const blob = await canvasBlob()
    if (!blob) throw new Error('toBlob failed')
    await navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })])
    show(t('common.copied'), 'success')
  } catch {
    show(tt('copyFailed'), 'error', 2500)
  }
}
</script>

<template>
  <div class="space-y-6">
    <ConfigSection>
      <SettingCard :icon="Scaling" :title="tt('size')" :description="tt('sizeDesc')" stacked>
        <NumberInput v-model="width" :min="1" :max="4000" :step="10" size="sm" />
        <span class="text-fg-faint">×</span>
        <NumberInput v-model="height" :min="1" :max="4000" :step="10" size="sm" />
      </SettingCard>
      <SettingCard :icon="Shuffle" :title="tt('variance')" :description="tt('varianceDesc')" stacked>
        <RangeSlider v-model="variance" />
      </SettingCard>
      <SettingCard :icon="Mountain" :title="tt('depth')" :description="tt('depthDesc')" stacked>
        <RangeSlider v-model="depth" />
      </SettingCard>
      <SettingCard :icon="Sparkle" :title="tt('dither')" :description="tt('ditherDesc')" stacked>
        <RangeSlider v-model="dither" />
      </SettingCard>
      <SettingCard :icon="TriangleIcon" :title="tt('cellSize')" :description="tt('cellSizeDesc', { px: cellPixels(cellSize) })" stacked>
        <RangeSlider v-model="cellSize" />
      </SettingCard>
      <SettingCard :icon="Hash" :title="tt('seed')" :description="tt('seedDesc')">
        <NumberInput v-model="seed" :min="0" :max="2147483646" size="sm" />
        <IconButton :title="tt('random')" @click="randomize"><Dices class="h-4 w-4" /></IconButton>
      </SettingCard>
      <SettingCard :icon="Palette" :title="tt('colors')" :description="tt('colorsDesc')" stacked>
        <BaseButton size="sm" @click="fromImage"><ImagePlus class="h-4 w-4" />{{ tt('fromImage') }}</BaseButton>
        <template #content>
          <div class="flex flex-wrap items-center gap-2">
            <div v-for="(c, i) in colors" :key="i" class="group relative">
              <input
                type="color"
                :value="c"
                :title="c"
                :aria-label="c"
                class="block h-8 w-8 cursor-pointer rounded-md border border-line-strong bg-transparent p-0 [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:rounded-[5px] [&::-webkit-color-swatch]:border-0 [&::-moz-color-swatch]:border-0"
                @input="setColor(i, ($event.target as HTMLInputElement).value)"
              />
              <button
                v-if="colors.length > 1"
                type="button"
                :title="t('common.remove')"
                :aria-label="t('common.remove')"
                class="absolute -right-1.5 -top-1.5 hidden h-4 w-4 items-center justify-center rounded-full border border-line-strong bg-surface text-fg-muted hover:text-danger group-hover:flex group-focus-within:flex"
                @click="removeColor(i)"
              >
                <X class="h-3 w-3" />
              </button>
            </div>
            <IconButton :title="tt('addColor')" @click="addColor"><Plus class="h-4 w-4" /></IconButton>
            <IconButton :title="tt('reverse')" :disabled="colors.length < 2" @click="reverseColors"><ArrowLeftRight class="h-4 w-4" /></IconButton>
          </div>
          <div class="mt-3 text-xs font-medium text-fg-muted">{{ tt('palettes') }}</div>
          <div class="mt-1.5 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
            <button
              v-for="p in PALETTES"
              :key="p.join(',')"
              type="button"
              :aria-label="p.join(', ')"
              class="flex h-6 overflow-hidden rounded-md border focus-ring"
              :class="p.join(',') === currentPalette ? 'border-accent ring-2 ring-accent' : 'border-line hover:border-line-strong'"
              @click="colors = [...p]"
            >
              <span v-for="c in p" :key="c" class="flex-1" :style="{ backgroundColor: c }" />
            </button>
          </div>
        </template>
      </SettingCard>
    </ConfigSection>

    <section class="space-y-2.5">
      <SectionTitle :title="tt('preview')" />
      <div class="overflow-hidden rounded-card border border-line bg-surface">
        <div class="flex flex-wrap items-center gap-2 border-b border-line bg-surface-2/60 px-3 py-1.5">
          <span class="text-xs font-mono text-fg-muted">{{ width }} × {{ height }} px</span>
          <span class="flex-1" />
          <BaseButton size="sm" variant="ghost" @click="copyImage"><Copy class="h-4 w-4" />{{ tt('copyImage') }}</BaseButton>
          <BaseButton size="sm" @click="saveSvg"><FileCode class="h-4 w-4" />SVG</BaseButton>
          <BaseButton size="sm" variant="primary" @click="savePng"><Download class="h-4 w-4" />PNG</BaseButton>
        </div>
        <div class="flex items-center justify-center bg-surface-2/40 p-3">
          <canvas ref="canvas" class="block h-auto max-h-[70vh] w-auto max-w-full rounded-md" />
        </div>
      </div>
    </section>
  </div>
</template>
