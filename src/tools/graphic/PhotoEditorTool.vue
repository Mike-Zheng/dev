<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, reactive, ref, watch, type Component } from 'vue'
import {
  Aperture,
  ChartArea,
  Check,
  Columns2,
  Crop,
  Download,
  FlipHorizontal2,
  FlipVertical2,
  FolderOpen,
  RotateCcw,
  RotateCcwSquare,
  RotateCwSquare,
  SlidersHorizontal,
  Spline,
  Undo2,
  WandSparkles,
} from 'lucide-vue-next'
import { minigl, type InstaFilter, type MiniGL } from '@xdadda/mini-gl'
import DropZone from '@/components/ui/DropZone.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseSelect from '@/components/ui/BaseSelect.vue'
import IconButton from '@/components/ui/IconButton.vue'
import { useI18n } from '@/i18n'
import { useToast } from '@/composables/useToast'
import { downloadBlob, formatBytes, pickFile } from '@/composables/useFiles'
import PhotoSlider from './PhotoSlider.vue'
import PhotoCurveEditor from './PhotoCurveEditor.vue'
import PhotoCropOverlay from './PhotoCropOverlay.vue'
import { FILTER_PRESETS, loadFilter } from './photoEditorFilters'
import {
  ADJUSTMENT_GROUPS,
  ASPECTS,
  CURVE_CHANNELS,
  EXPORT_FORMATS,
  FULL_CROP,
  aspectRatio,
  clamp,
  cropToPixels,
  curvesParam,
  defaultAdjustments,
  fitAspect,
  histogram,
  histogramPath,
  histogramScale,
  isFullCrop,
  isGroupNeutral,
  isLinearCurve,
  linearCurve,
  normalizedRatio,
  outputName,
  resizeKeepingRatio,
  rotateQuarter,
  rotatedSize,
  straightenScale,
  type AdjustmentGroup,
  type Aspect,
  type CropRect,
  type CurveChannel,
  type CurvePoint,
  type ExportFormat,
  type Histogram,
  type QuarterTurn,
} from './photoEditor'

const { t } = useI18n()
const tt = (k: string, p?: Record<string, string | number>) => t(`tools.photo-editor.${k}`, p)
const { show } = useToast()

// ---------------------------------------------------------------- image & WebGL

const loaded = ref(false)
const imageKey = ref(0)
const fileName = ref('')
const fileSize = ref(0)
const imageSize = ref({ width: 0, height: 0 })
const canvasSize = ref({ width: 0, height: 0 })
const canvas = ref<HTMLCanvasElement | null>(null)
const sourceUrl = ref('')
const originalSrc = ref('')
let gl: MiniGL | null = null

type Tab = 'composition' | 'adjust' | 'curves' | 'filters' | 'blur'
const TABS: { id: Tab; icon: Component }[] = [
  { id: 'composition', icon: Crop },
  { id: 'adjust', icon: SlidersHorizontal },
  { id: 'curves', icon: Spline },
  { id: 'filters', icon: WandSparkles },
  { id: 'blur', icon: Aperture },
]
const tab = ref<Tab>('adjust')
const composing = computed(() => loaded.value && tab.value === 'composition')

// composition
const rotation = ref<QuarterTurn>(0)
const angle = ref(0)
const flipH = ref(false)
const flipV = ref(false)
const aspect = ref<Aspect>('free')
const crop = ref<CropRect>({ ...FULL_CROP })

// adjustments
const adj = reactive(defaultAdjustments())

// curves
const newCurves = (): Record<CurveChannel, CurvePoint[]> => ({ rgb: linearCurve(), red: linearCurve(), green: linearCurve(), blue: linearCurve() })
const curves = reactive(newCurves())
const curveChannel = ref<CurveChannel>('rgb')

// filters
const filterId = ref<string | null>(null)
const filterStrength = ref(1)
let filter: InstaFilter | null = null

// blur
const BLUR_DEFAULTS = { bokeh: 0, gaussian: 0, lens: 0.5, centerX: 0.5, centerY: 0.5 }
const blur = reactive({ ...BLUR_DEFAULTS })

// view
const showSplit = ref(false)
const split = ref(0.5)
const showHisto = ref(true)
const hist = ref<Histogram | null>(null)

// export
const format = ref<ExportFormat>('jpeg')
const quality = ref(90)
const exporting = ref(false)

function syncCanvasSize() {
  const c = gl?.gl.canvas
  if (c) canvasSize.value = { width: c.width, height: c.height }
}

function compositionIsIdentity() {
  return rotation.value === 0 && angle.value === 0 && !flipH.value && !flipV.value && isFullCrop(crop.value)
}

/** Run the whole mini-gl pipeline. With `bake`, rotation/flip/straighten and the crop are burnt into a new base texture. */
function render(bake = false) {
  const g = gl
  if (!g) return
  g.loadImage()

  if (composing.value || bake) {
    const c = g.gl.canvas
    g.filterMatrix({
      translateX: 0,
      translateY: 0,
      angle: angle.value + rotation.value,
      scale: straightenScale(c.width, c.height, angle.value),
      fliph: flipH.value ? 1 : 0,
      flipv: flipV.value ? 1 : 0,
    })
    if (bake) {
      g.crop(cropToPixels(crop.value, c.width, c.height))
      g.loadImage()
    }
  }

  g.filterAdjustments({ ...adj })
  if (adj.bloom) g.filterBloom(adj.bloom)
  if (adj.noise) g.filterNoise(adj.noise)
  if (adj.shadows || adj.highlights) g.filterHighlightsShadows(adj.highlights, -adj.shadows)

  const cp = curvesParam(curves)
  if (cp) g.filterCurves(cp)
  if (filter) g.filterInsta(filter, filterStrength.value - 1)

  const center = { centerX: blur.centerX, centerY: blur.centerY }
  if (blur.bokeh) g.filterBlurBokeh({ bokehstrength: blur.bokeh, bokehlensout: blur.lens, ...center })
  if (blur.gaussian) g.filterBlurGaussian({ gaussianstrength: blur.gaussian, gaussianlensout: blur.lens, ...center })

  g.paintCanvas()
  syncCanvasSize()
  updateHistogram()
}

let frame = 0
function scheduleRender() {
  if (!frame) {
    frame = requestAnimationFrame(() => {
      frame = 0
      render()
    })
  }
}

const histCanvas = document.createElement('canvas')
function updateHistogram() {
  const src = gl?.gl.canvas
  if (!showHisto.value || !(src instanceof HTMLCanvasElement)) return
  // Sample a downscaled copy of the freshly painted frame (still valid within this task).
  const s = Math.min(1, 240 / Math.max(src.width, src.height))
  histCanvas.width = Math.max(1, Math.round(src.width * s))
  histCanvas.height = Math.max(1, Math.round(src.height * s))
  const ctx = histCanvas.getContext('2d', { willReadFrequently: true })
  if (!ctx) return
  ctx.clearRect(0, 0, histCanvas.width, histCanvas.height)
  ctx.drawImage(src, 0, 0, histCanvas.width, histCanvas.height)
  hist.value = histogram(ctx.getImageData(0, 0, histCanvas.width, histCanvas.height).data)
}

const HIST_W = 256
const HIST_H = 64
const histPaths = computed(() => {
  const h = hist.value
  if (!h) return null
  const max = histogramScale(h)
  return {
    r: histogramPath(h.r, HIST_W, HIST_H, max),
    g: histogramPath(h.g, HIST_W, HIST_H, max),
    b: histogramPath(h.b, HIST_W, HIST_H, max),
  }
})

function destroyGl() {
  if (!gl) return
  const ctx = gl.gl
  gl.destroy()
  ctx.getExtension('WEBGL_lose_context')?.loseContext()
  gl = null
}

function resetEdits() {
  tab.value = 'adjust'
  rotation.value = 0
  angle.value = 0
  flipH.value = false
  flipV.value = false
  aspect.value = 'free'
  crop.value = { ...FULL_CROP }
  Object.assign(adj, defaultAdjustments())
  Object.assign(curves, newCurves())
  curveChannel.value = 'rgb'
  filterId.value = null
  filterStrength.value = 1
  Object.assign(blur, BLUR_DEFAULTS)
  showSplit.value = false
  split.value = 0.5
}

async function openFile(file: File) {
  if (!file.type.startsWith('image/') && file.type !== '') return show(tt('loadFailed'), 'error')
  const url = URL.createObjectURL(file)
  const img = new Image()
  img.src = url
  try {
    await img.decode()
  } catch {
    URL.revokeObjectURL(url)
    return show(tt('loadFailed'), 'error')
  }

  if (frame) cancelAnimationFrame(frame)
  frame = 0
  destroyGl()
  if (sourceUrl.value) URL.revokeObjectURL(sourceUrl.value)
  resetEdits()
  // Settle the reset before the new context exists, so its watchers do not touch the old image.
  await nextTick()

  sourceUrl.value = originalSrc.value = url
  fileName.value = file.name
  fileSize.value = file.size
  imageSize.value = { width: img.naturalWidth, height: img.naturalHeight }
  hist.value = null
  imageKey.value++
  loaded.value = true
  await nextTick()

  try {
    gl = canvas.value ? (minigl(canvas.value, img, 'srgb') ?? null) : null
  } catch {
    gl = null
  }
  if (!gl) {
    loaded.value = false
    return show(tt('webglUnsupported'), 'error', 4000)
  }
  const maxTexture = Number(gl.gl.getParameter(gl.gl.MAX_TEXTURE_SIZE))
  if (Math.max(img.naturalWidth, img.naturalHeight) > maxTexture) {
    destroyGl()
    loaded.value = false
    return show(tt('tooLarge', { max: maxTexture }), 'error', 4000)
  }
  render()
}

async function onFiles(files: File[]) {
  if (files[0]) await openFile(files[0])
}

async function browse() {
  const [file] = await pickFile('image/*')
  if (file) await openFile(file)
}

// ---------------------------------------------------------------- composition

/** Size the canvas for the current quarter turn (only while composing, when no crop is baked in). */
function applyGeometry() {
  const g = gl
  if (!g) return
  const { width, height } = rotatedSize(g.width, g.height, rotation.value)
  const c = g.gl.canvas
  if (c.width !== width || c.height !== height) {
    c.width = width
    c.height = height
    g.setupFiltersTextures()
  }
  syncCanvasSize()
}

watch(composing, (on) => {
  const g = gl
  if (!g) return
  if (on) {
    showSplit.value = false
    g.resetCrop()
    applyGeometry()
    render()
  } else {
    render(!compositionIsIdentity())
    originalSrc.value = g.img_cropped?.src ?? sourceUrl.value
  }
})

/** Crop frame proportions in canvas-relative units, or null for free cropping. */
const cropRatio = computed(() => {
  const { width, height } = canvasSize.value
  const r = width && height ? aspectRatio(aspect.value, width, height) : null
  return r === null ? null : normalizedRatio(r, width, height)
})

watch(aspect, () => {
  crop.value = fitAspect(cropRatio.value)
})

function rotate(deg: 90 | -90) {
  rotation.value = rotateQuarter(rotation.value, deg)
  applyGeometry()
  crop.value = fitAspect(cropRatio.value)
}

/** Output size in the current orientation, before cropping. */
const baseSize = computed(() => rotatedSize(imageSize.value.width, imageSize.value.height, rotation.value))
const scalePercent = computed(() => (baseSize.value.width ? Math.round((canvasSize.value.width / baseSize.value.width) * 1000) / 10 : 100))
const cropPixels = computed(() => cropToPixels(crop.value, canvasSize.value.width, canvasSize.value.height))

function setSize(side: 'width' | 'height', e: Event) {
  const g = gl
  const value = Number((e.target as HTMLInputElement).value)
  if (!g || !Number.isFinite(value) || value <= 0) return syncCanvasSize()
  const base = baseSize.value
  const s = resizeKeepingRatio(side, value, base.width / base.height)
  if (s.width === base.width) g.resetResize()
  else if (rotation.value % 180) g.resize(s.height, s.width)
  else g.resize(s.width, s.height)
  applyGeometry()
  scheduleRender()
}

function resetComposition() {
  rotation.value = 0
  angle.value = 0
  flipH.value = false
  flipV.value = false
  aspect.value = 'free'
  gl?.resetResize()
  applyGeometry()
  crop.value = { ...FULL_CROP }
}

const compositionChanged = computed(
  () => !compositionIsIdentity() || aspect.value !== 'free' || canvasSize.value.width !== baseSize.value.width,
)

// ---------------------------------------------------------------- filters

const filterLoading = ref(false)
watch(filterId, async (id) => {
  if (!id) {
    filter = null
    return scheduleRender()
  }
  filterLoading.value = true
  try {
    const f = await loadFilter(id)
    if (filterId.value === id) {
      filter = f
      scheduleRender()
    }
  } catch {
    show(tt('loadFailed'), 'error')
    filterId.value = null
  } finally {
    filterLoading.value = false
  }
})

// ---------------------------------------------------------------- re-render on any parameter change

watch([adj, curves, blur, filterStrength, angle, flipH, flipV, rotation, showHisto], scheduleRender, { deep: true })

// ---------------------------------------------------------------- preview stage

const viewport = ref<HTMLDivElement | null>(null)
const viewportSize = ref({ width: 0, height: 0 })
const observer = new ResizeObserver(([entry]) => {
  if (entry) viewportSize.value = { width: entry.contentRect.width, height: entry.contentRect.height }
})
watch(viewport, (el, old) => {
  if (old) observer.unobserve(old)
  if (el) observer.observe(el)
})

const stageStyle = computed(() => {
  const { width: vw, height: vh } = viewportSize.value
  const { width: w, height: h } = canvasSize.value
  if (!vw || !vh || !w || !h) return { width: '0px', height: '0px' }
  const s = Math.min(vw / w, vh / h)
  return { width: `${Math.floor(w * s)}px`, height: `${Math.floor(h * s)}px` }
})

const stage = ref<HTMLDivElement | null>(null)
function stagePoint(e: PointerEvent) {
  const r = stage.value!.getBoundingClientRect()
  return { x: clamp((e.clientX - r.left) / r.width, 0, 1), y: clamp((e.clientY - r.top) / r.height, 0, 1) }
}

let draggingFocus = false
function onStageDown(e: PointerEvent) {
  if (tab.value !== 'blur' || showSplit.value) return
  draggingFocus = true
  stage.value?.setPointerCapture(e.pointerId)
  onStageMove(e)
}
function onStageMove(e: PointerEvent) {
  if (!draggingFocus) return
  const p = stagePoint(e)
  blur.centerX = p.x
  blur.centerY = p.y
}

let draggingSplit = false
function onSplitDown(e: PointerEvent) {
  e.stopPropagation()
  draggingSplit = true
  ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
}
function onSplitMove(e: PointerEvent) {
  if (draggingSplit) split.value = stagePoint(e).x
}
function onSplitKey(e: KeyboardEvent) {
  const d = e.key === 'ArrowLeft' ? -0.02 : e.key === 'ArrowRight' ? 0.02 : 0
  if (!d) return
  e.preventDefault()
  split.value = clamp(split.value + d, 0, 1)
}

function toggleSplit() {
  if (composing.value) tab.value = 'adjust'
  showSplit.value = !showSplit.value
}

// ---------------------------------------------------------------- reset helpers

function resetGroup(group: AdjustmentGroup) {
  for (const k of ADJUSTMENT_GROUPS[group]) adj[k] = 0
}
const curvesChanged = computed(() => CURVE_CHANNELS.some((c) => !isLinearCurve(curves[c])))
function resetCurves() {
  Object.assign(curves, newCurves())
}
const blurChanged = computed(() => (Object.keys(BLUR_DEFAULTS) as (keyof typeof BLUR_DEFAULTS)[]).some((k) => blur[k] !== BLUR_DEFAULTS[k]))

function resetBlur() {
  Object.assign(blur, BLUR_DEFAULTS)
}

async function resetAll() {
  resetEdits()
  await nextTick()
  gl?.resetCrop()
  resetComposition()
  originalSrc.value = sourceUrl.value
  scheduleRender()
}

// ---------------------------------------------------------------- export

async function download() {
  const g = gl
  if (!g || exporting.value) return
  exporting.value = true
  try {
    if (composing.value) {
      tab.value = 'adjust'
      await nextTick()
    }
    render()
    const { width, height } = g.gl.canvas
    const pixels = new ImageData(new Uint8ClampedArray(g.readPixels().buffer), width, height)
    const out = document.createElement('canvas')
    out.width = width
    out.height = height
    const ctx = out.getContext('2d')!
    if (format.value === 'jpeg') {
      // JPEG has no alpha: flatten transparent areas onto white instead of black.
      const tmp = document.createElement('canvas')
      tmp.width = width
      tmp.height = height
      tmp.getContext('2d')!.putImageData(pixels, 0, 0)
      ctx.fillStyle = '#fff'
      ctx.fillRect(0, 0, width, height)
      ctx.drawImage(tmp, 0, 0)
    } else {
      ctx.putImageData(pixels, 0, 0)
    }
    const blob = await new Promise<Blob | null>((res) => out.toBlob(res, `image/${format.value}`, quality.value / 100))
    if (!blob) throw new Error('toBlob failed')
    downloadBlob(blob, outputName(fileName.value, format.value))
  } catch {
    show(tt('exportFailed'), 'error')
  } finally {
    exporting.value = false
  }
}

onBeforeUnmount(() => {
  if (frame) cancelAnimationFrame(frame)
  observer.disconnect()
  destroyGl()
  if (sourceUrl.value) URL.revokeObjectURL(sourceUrl.value)
})

// ---------------------------------------------------------------- view helpers

const chip = (on: boolean) => [
  'inline-flex h-7 items-center justify-center gap-1 rounded-md border px-2.5 text-xs font-medium whitespace-nowrap transition-colors focus-ring',
  on ? 'border-accent/40 bg-accent-soft text-accent' : 'border-line text-fg-muted hover:text-fg hover:bg-surface-3',
]
const CHANNEL_COLOR: Record<CurveChannel, string> = { rgb: 'text-fg', red: 'text-danger', green: 'text-success', blue: 'text-accent' }
const formatOptions = computed(() => EXPORT_FORMATS.map((f) => ({ value: f, label: f === 'jpeg' ? 'JPEG' : f.toUpperCase() })))
const filterLabel = (id: string) => id[0]!.toUpperCase() + id.slice(1)
const numberInput =
  'h-8 w-20 rounded-md border border-line border-b-line-strong bg-control px-2 text-center font-mono text-xs text-fg focus-ring [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none'
</script>

<template>
  <div class="space-y-4">
    <template v-if="!loaded">
      <DropZone accept="image/*" :label="tt('drop')" @files="onFiles" />
      <p class="text-xs text-fg-muted">
        {{ tt('credit') }}
        <a href="https://github.com/xdadda/mini-photo-editor" target="_blank" rel="noopener noreferrer" class="text-accent hover:underline">mini-photo-editor</a>
        ·
        <a href="https://github.com/xdadda/mini-gl" target="_blank" rel="noopener noreferrer" class="text-accent hover:underline">mini-gl</a>
      </p>
    </template>

    <template v-else>
      <!-- toolbar -->
      <div class="flex flex-wrap items-center gap-2 rounded-card border border-line bg-surface px-3 py-2">
        <div class="mr-auto min-w-0">
          <div class="truncate text-sm font-medium text-fg">{{ fileName }}</div>
          <div class="font-mono text-[11px] text-fg-muted">
            {{ imageSize.width }} × {{ imageSize.height }} · {{ formatBytes(fileSize) }}
            <template v-if="canvasSize.width !== imageSize.width || canvasSize.height !== imageSize.height">
              → {{ canvasSize.width }} × {{ canvasSize.height }}
            </template>
          </div>
        </div>
        <IconButton :title="tt('open')" @click="browse"><FolderOpen class="h-4 w-4" /></IconButton>
        <IconButton :title="tt('splitView')" :active="showSplit" @click="toggleSplit"><Columns2 class="h-4 w-4" /></IconButton>
        <IconButton :title="tt('histogram')" :active="showHisto" @click="showHisto = !showHisto"><ChartArea class="h-4 w-4" /></IconButton>
        <IconButton :title="tt('resetAll')" @click="resetAll"><Undo2 class="h-4 w-4" /></IconButton>
        <span class="mx-1 hidden h-6 w-px bg-line sm:block" />
        <BaseSelect v-model="format" :options="formatOptions" size="sm" :aria-label="tt('format')" />
        <label v-if="format !== 'png'" class="flex items-center gap-1.5 text-xs text-fg-muted" :title="tt('quality')">
          <input v-model.number="quality" type="range" min="10" max="100" step="5" class="w-20 cursor-pointer accent-accent" :aria-label="tt('quality')" />
          <span class="w-7 text-right font-mono tabular-nums">{{ quality }}</span>
        </label>
        <BaseButton variant="primary" size="sm" :disabled="exporting" @click="download">
          <Download class="h-4 w-4" />{{ t('common.download') }}
        </BaseButton>
      </div>

      <div class="grid grid-cols-[minmax(0,1fr)] gap-4 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
        <!-- preview -->
        <div
          class="rounded-card border border-line bg-[linear-gradient(45deg,var(--c-surface-2)_25%,transparent_25%,transparent_75%,var(--c-surface-2)_75%),linear-gradient(45deg,var(--c-surface-2)_25%,transparent_25%,transparent_75%,var(--c-surface-2)_75%)] bg-[length:16px_16px] bg-[position:0_0,8px_8px] p-3 lg:sticky lg:top-4"
        >
          <div ref="viewport" class="flex h-[55vh] min-h-72 items-center justify-center overflow-hidden lg:h-[calc(100vh-13rem)]">
            <div
              ref="stage"
              class="relative shrink-0"
              :class="tab === 'blur' && !showSplit ? 'cursor-crosshair touch-none' : ''"
              :style="stageStyle"
              @pointerdown="onStageDown"
              @pointermove="onStageMove"
              @pointerup="draggingFocus = false"
              @pointercancel="draggingFocus = false"
            >
              <canvas :key="imageKey" ref="canvas" class="block h-full w-full" />

              <template v-if="showSplit && !composing">
                <img
                  :src="originalSrc"
                  alt=""
                  draggable="false"
                  class="pointer-events-none absolute inset-0 h-full w-full select-none"
                  :style="{ clipPath: `inset(0 ${(1 - split) * 100}% 0 0)` }"
                />
                <span class="pointer-events-none absolute left-2 top-2 rounded bg-black/50 px-1.5 py-0.5 text-[11px] text-white">{{ tt('before') }}</span>
                <span class="pointer-events-none absolute right-2 top-2 rounded bg-black/50 px-1.5 py-0.5 text-[11px] text-white">{{ tt('after') }}</span>
                <div
                  class="absolute inset-y-0 flex w-6 -translate-x-1/2 cursor-ew-resize touch-none justify-center focus-ring"
                  :style="{ left: `${split * 100}%` }"
                  role="slider"
                  tabindex="0"
                  :aria-label="tt('splitView')"
                  :aria-valuenow="Math.round(split * 100)"
                  aria-valuemin="0"
                  aria-valuemax="100"
                  @pointerdown="onSplitDown"
                  @pointermove="onSplitMove"
                  @pointerup="draggingSplit = false"
                  @pointercancel="draggingSplit = false"
                  @keydown="onSplitKey"
                >
                  <span class="h-full w-0.5 bg-white shadow-[0_0_0_1px_rgb(0_0_0/0.3)]" />
                  <span class="absolute top-1/2 h-8 w-4 -translate-y-1/2 rounded-full border border-black/30 bg-white" />
                </div>
              </template>

              <PhotoCropOverlay v-if="composing" v-model="crop" :ratio="cropRatio" />

              <span
                v-if="tab === 'blur' && !showSplit"
                class="pointer-events-none absolute h-6 w-6 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-[0_0_0_1px_rgb(0_0_0/0.4)]"
                :style="{ left: `${blur.centerX * 100}%`, top: `${blur.centerY * 100}%` }"
              />
            </div>
          </div>
        </div>

        <!-- controls -->
        <div class="space-y-3">
          <div v-if="showHisto && histPaths" class="rounded-card border border-line bg-surface p-2">
            <svg :viewBox="`0 0 ${HIST_W} ${HIST_H}`" preserveAspectRatio="none" class="block h-16 w-full" role="img" :aria-label="tt('histogram')">
              <path :d="histPaths.r" class="fill-danger" fill-opacity="0.45" />
              <path :d="histPaths.g" class="fill-success" fill-opacity="0.45" />
              <path :d="histPaths.b" class="fill-accent" fill-opacity="0.45" />
            </svg>
          </div>

          <div class="grid grid-cols-5 gap-1 rounded-card border border-line bg-surface p-1" role="tablist">
            <button
              v-for="tb in TABS"
              :key="tb.id"
              type="button"
              role="tab"
              :aria-selected="tab === tb.id"
              class="flex flex-col items-center gap-1 rounded-md px-1 py-1.5 text-[11px] font-medium transition-colors focus-ring"
              :class="tab === tb.id ? 'bg-accent-soft text-accent' : 'text-fg-muted hover:bg-surface-3 hover:text-fg'"
              @click="tab = tb.id"
            >
              <component :is="tb.icon" class="h-4 w-4" />
              <span class="max-w-full truncate">{{ tt(tb.id) }}</span>
            </button>
          </div>

          <div class="rounded-card border border-line bg-surface p-4" role="tabpanel">
            <!-- composition -->
            <div v-if="tab === 'composition'" class="space-y-4">
              <div class="flex items-center gap-1">
                <IconButton :title="tt('rotateLeft')" @click="rotate(-90)"><RotateCcwSquare class="h-4 w-4" /></IconButton>
                <IconButton :title="tt('rotateRight')" @click="rotate(90)"><RotateCwSquare class="h-4 w-4" /></IconButton>
                <IconButton :title="tt('flipH')" :active="flipH" @click="flipH = !flipH"><FlipHorizontal2 class="h-4 w-4" /></IconButton>
                <IconButton :title="tt('flipV')" :active="flipV" @click="flipV = !flipV"><FlipVertical2 class="h-4 w-4" /></IconButton>
                <span class="flex-1" />
                <IconButton :title="tt('reset')" :disabled="!compositionChanged" @click="resetComposition"><RotateCcw class="h-4 w-4" /></IconButton>
              </div>
              <PhotoSlider v-model="angle" :label="tt('straighten')" :min="-45" :max="45" :step="0.25" />

              <div class="space-y-1.5">
                <div class="text-xs font-medium text-fg">{{ tt('aspect') }}</div>
                <div class="flex flex-wrap gap-1.5">
                  <button v-for="a in ASPECTS" :key="a" type="button" :class="chip(aspect === a)" :aria-pressed="aspect === a" @click="aspect = a">
                    {{ a === 'free' ? tt('aspectFree') : a === 'original' ? tt('aspectOriginal') : a }}
                  </button>
                </div>
              </div>

              <div class="space-y-1.5">
                <div class="flex items-baseline justify-between text-xs">
                  <span class="font-medium text-fg">{{ tt('size') }}</span>
                  <span class="font-mono text-fg-muted">{{ scalePercent }}%</span>
                </div>
                <div class="flex items-center gap-2 text-xs text-fg-muted">
                  <input type="number" min="16" :value="canvasSize.width" :class="numberInput" :aria-label="tt('width')" @change="setSize('width', $event)" />
                  ×
                  <input type="number" min="16" :value="canvasSize.height" :class="numberInput" :aria-label="tt('height')" @change="setSize('height', $event)" />
                  px
                </div>
              </div>

              <div class="flex items-center justify-between gap-2 border-t border-line pt-3">
                <span class="text-xs text-fg-muted">{{ tt('output') }} <span class="font-mono text-fg">{{ cropPixels.width }} × {{ cropPixels.height }}</span></span>
                <BaseButton variant="primary" size="sm" @click="tab = 'adjust'"><Check class="h-4 w-4" />{{ tt('apply') }}</BaseButton>
              </div>
              <p class="text-xs text-fg-faint">{{ tt('compositionHint') }}</p>
            </div>

            <!-- adjustments -->
            <div v-else-if="tab === 'adjust'" class="space-y-4">
              <section v-for="(keys, group) in ADJUSTMENT_GROUPS" :key="group" class="space-y-1">
                <div class="flex items-center justify-between">
                  <h3 class="text-xs font-semibold uppercase tracking-wider text-fg-muted">{{ tt(group) }}</h3>
                  <IconButton size="sm" :title="tt('reset')" :disabled="isGroupNeutral(adj, group)" @click="resetGroup(group)">
                    <RotateCcw class="h-3.5 w-3.5" />
                  </IconButton>
                </div>
                <PhotoSlider v-for="k in keys" :key="k" v-model="adj[k]" :label="tt(k)" />
              </section>
              <p class="text-xs text-fg-faint">{{ tt('sliderHint') }}</p>
            </div>

            <!-- curves -->
            <div v-else-if="tab === 'curves'" class="space-y-3">
              <div class="flex items-center gap-1.5">
                <button v-for="c in CURVE_CHANNELS" :key="c" type="button" :class="chip(curveChannel === c)" :aria-pressed="curveChannel === c" @click="curveChannel = c">
                  {{ tt(`channel_${c}`) }}
                </button>
                <span class="flex-1" />
                <IconButton size="sm" :title="tt('reset')" :disabled="!curvesChanged" @click="resetCurves"><RotateCcw class="h-3.5 w-3.5" /></IconButton>
              </div>
              <PhotoCurveEditor
                v-model="curves[curveChannel]"
                :label="tt(`channel_${curveChannel}`)"
                :color-class="CHANNEL_COLOR[curveChannel]"
                class="mx-auto"
                @reset="curves[curveChannel] = linearCurve()"
              />
              <p class="text-xs text-fg-faint">{{ tt('curvesHint') }}</p>
            </div>

            <!-- filters -->
            <div v-else-if="tab === 'filters'" class="space-y-3">
              <div class="grid grid-cols-3 gap-1.5">
                <button type="button" :class="chip(filterId === null)" :aria-pressed="filterId === null" @click="filterId = null">{{ tt('none') }}</button>
                <button v-for="f in FILTER_PRESETS" :key="f.id" type="button" :class="chip(filterId === f.id)" :aria-pressed="filterId === f.id" @click="filterId = f.id">
                  {{ filterLabel(f.id) }}
                </button>
              </div>
              <PhotoSlider v-model="filterStrength" :label="tt('strength')" :min="0" :max="1" :reset="1" />
              <p v-if="filterLoading" class="text-xs text-fg-muted">{{ tt('loading') }}</p>
            </div>

            <!-- blur -->
            <div v-else class="space-y-3">
              <div class="flex items-center justify-between">
                <h3 class="text-xs font-semibold uppercase tracking-wider text-fg-muted">{{ tt('blur') }}</h3>
                <IconButton size="sm" :title="tt('reset')" :disabled="!blurChanged" @click="resetBlur"><RotateCcw class="h-3.5 w-3.5" /></IconButton>
              </div>
              <PhotoSlider v-model="blur.bokeh" :label="tt('bokeh')" :min="0" :max="1" />
              <PhotoSlider v-model="blur.gaussian" :label="tt('gaussian')" :min="0" :max="1" />
              <PhotoSlider v-model="blur.lens" :label="tt('focusSize')" :min="0" :max="1" :reset="0.5" />
              <p class="text-xs text-fg-faint">{{ tt('blurHint') }}</p>
            </div>
          </div>

          <p class="text-xs text-fg-faint">
            {{ tt('credit') }}
            <a href="https://github.com/xdadda/mini-photo-editor" target="_blank" rel="noopener noreferrer" class="text-accent hover:underline">mini-photo-editor</a>
          </p>
        </div>
      </div>
    </template>
  </div>
</template>
