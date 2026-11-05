<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, shallowRef, watch } from 'vue'
import { Box, Download, Eye, Focus, FolderOpen, Grid3x3, LoaderCircle, Lock, Rotate3d, RotateCw, Shrink, Upload } from 'lucide-vue-next'
import ConfigSection from '@/components/ui/ConfigSection.vue'
import SettingCard from '@/components/ui/SettingCard.vue'
import RangeSlider from '@/components/ui/RangeSlider.vue'
import BaseSelect from '@/components/ui/BaseSelect.vue'
import BaseSwitch from '@/components/ui/BaseSwitch.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import IconButton from '@/components/ui/IconButton.vue'
import SectionTitle from '@/components/ui/SectionTitle.vue'
import { useI18n } from '@/i18n'
import { useToast } from '@/composables/useToast'
import { downloadBlob, downloadText, pickFile, readFileAsArrayBuffer } from '@/composables/useFiles'
import LowPolyViewer from './LowPolyViewer.vue'
import {
  SAMPLES,
  baseName,
  bounds,
  parseModel,
  rotateMesh,
  sampleMesh,
  targetTriangles,
  toObj,
  toStl,
  triangleCount,
  vertexCount,
  type Axis,
  type Mesh,
  type SampleId,
} from './lowPoly'
import type { WorkerRequest, WorkerResponse } from './lowPoly.worker'

const { t } = useI18n()
const tt = (k: string, p?: Record<string, string | number>) => t(`tools.low-poly.${k}`, p)
const { show } = useToast()

type ModelChoice = SampleId | 'file'

const model = ref<ModelChoice>('torusKnot')
const fileName = ref('')
const reduction = ref(90)
const lockBorder = ref(false)
const wireframe = ref(true)
const autoRotate = ref(false)
const showOriginal = ref(false)

const fileMesh = shallowRef<Mesh | null>(null)
const source = shallowRef<Mesh | null>(null)
const result = shallowRef<Mesh | null>(null)
const fitKey = ref(0)
const busy = ref(false)
const elapsed = ref<number | null>(null)
const dragging = ref(false)
const viewer = ref<InstanceType<typeof LowPolyViewer> | null>(null)

const modelOptions = computed(() => [
  ...SAMPLES.map((id) => ({ value: id as ModelChoice, label: tt(`sample_${id}`) })),
  ...(fileName.value ? [{ value: 'file' as ModelChoice, label: fileName.value }] : []),
])
const displayed = computed(() => (showOriginal.value ? source.value : result.value))
const originalTris = computed(() => (source.value ? triangleCount(source.value) : 0))
const target = computed(() => targetTriangles(originalTris.value, reduction.value))
const outName = computed(() => `${model.value === 'file' ? baseName(fileName.value) : model.value}-lowpoly`)

const nf = (n: number) => n.toLocaleString()
const size = computed(() => {
  const m = displayed.value
  if (!m) return '—'
  const b = bounds(m)
  const f = (v: number) => String(Number(v.toPrecision(3)))
  return `${f(b[3] - b[0])} × ${f(b[4] - b[1])} × ${f(b[5] - b[2])}`
})
const stats = computed(() => [
  { label: tt('original'), value: nf(originalTris.value) },
  { label: tt('target'), value: nf(target.value) },
  { label: tt('current'), value: result.value ? nf(triangleCount(result.value)) : '—' },
  { label: tt('vertices'), value: displayed.value ? nf(vertexCount(displayed.value)) : '—' },
  { label: tt('size'), value: size.value },
  { label: tt('time'), value: elapsed.value === null ? '—' : `${Math.round(elapsed.value)} ms` },
])

// ---- Decimation worker: one job at a time, newest settings win ----

let worker: Worker | null = null
let job = 0
let pending = false

function getWorker(): Worker {
  if (!worker) {
    worker = new Worker(new URL('./lowPoly.worker.ts', import.meta.url), { type: 'module' })
    worker.onmessage = (e: MessageEvent<WorkerResponse>) => {
      busy.value = false
      const res = e.data
      if (pending) {
        post()
        return
      }
      if (res.job !== job) return
      if (res.ok) {
        result.value = res.mesh
        elapsed.value = res.ms
      } else {
        show(tt('simplifyFailed'), 'error', 3000)
      }
    }
  }
  return worker
}

function post() {
  const src = source.value
  pending = false
  if (!src) return
  busy.value = true
  const req: WorkerRequest = { job: ++job, mesh: src, reduction: reduction.value, lockBorder: lockBorder.value }
  getWorker().postMessage(req)
}

function decimate() {
  if (busy.value) pending = true
  else post()
}

let debounce = 0
watch([reduction, lockBorder], () => {
  clearTimeout(debounce)
  debounce = window.setTimeout(decimate, 120)
})

onBeforeUnmount(() => {
  clearTimeout(debounce)
  worker?.terminate()
})

// ---- Loading ----

function setSource(m: Mesh) {
  source.value = m
  result.value = m
  elapsed.value = null
  fitKey.value++
  decimate()
}

function loadSample(id: SampleId) {
  setSource(sampleMesh(id))
}

async function loadFile(file: File) {
  let buf: ArrayBuffer
  try {
    buf = await readFileAsArrayBuffer(file)
  } catch {
    show(tt('error_read'), 'error', 3000)
    return
  }
  const res = parseModel(file.name, buf)
  if ('error' in res) {
    show(tt(`error_${res.error}`), 'error', 3500)
    return
  }
  fileName.value = file.name
  fileMesh.value = res.mesh
  if (model.value === 'file') setSource(res.mesh)
  else model.value = 'file'
}

async function openFile() {
  const [file] = await pickFile('.stl,.obj')
  if (file) await loadFile(file)
}

function onDragLeave(e: DragEvent) {
  if (!(e.currentTarget as Node).contains(e.relatedTarget as Node | null)) dragging.value = false
}

function onDrop(e: DragEvent) {
  dragging.value = false
  const file = e.dataTransfer?.files[0]
  if (file) void loadFile(file)
}

watch(model, (m) => {
  if (m !== 'file') loadSample(m)
  else if (fileMesh.value) setSource(fileMesh.value)
})

onMounted(() => loadSample(model.value as SampleId))

// ---- Orientation & export ----

function rotate(axis: Axis) {
  if (!source.value) return
  const same = result.value === source.value
  source.value = rotateMesh(source.value, axis)
  result.value = same || !result.value ? source.value : rotateMesh(result.value, axis)
}

function exportStl() {
  if (result.value) downloadBlob(new Blob([toStl(result.value)], { type: 'model/stl' }), `${outName.value}.stl`)
}
function exportObj() {
  if (result.value) downloadText(toObj(result.value), `${outName.value}.obj`, 'model/obj')
}
</script>

<template>
  <div class="space-y-6">
    <ConfigSection>
      <SettingCard :icon="Box" :title="tt('model')" :description="tt('modelDesc')" stacked>
        <BaseSelect v-model="model" :options="modelOptions" size="sm" class="min-w-40" />
        <BaseButton size="sm" @click="openFile"><FolderOpen class="h-4 w-4" />{{ t('common.openFile') }}</BaseButton>
      </SettingCard>
      <SettingCard :icon="Shrink" :title="tt('reduction')" :description="tt('reductionDesc', { n: nf(target) })" stacked>
        <RangeSlider v-model="reduction" :min="0" :max="99" />
      </SettingCard>
      <SettingCard :icon="Lock" :title="tt('lockBorder')" :description="tt('lockBorderDesc')">
        <BaseSwitch v-model="lockBorder" />
      </SettingCard>
    </ConfigSection>

    <section class="space-y-2.5">
      <SectionTitle :title="tt('preview')" />
      <div class="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-6">
        <div v-for="s in stats" :key="s.label" class="rounded-card border border-line bg-surface px-3 py-2">
          <div class="text-[11px] font-medium uppercase tracking-wider text-fg-muted">{{ s.label }}</div>
          <div class="mt-0.5 truncate font-mono text-sm tabular-nums text-fg" :title="s.value">{{ s.value }}</div>
        </div>
      </div>

      <div class="overflow-hidden rounded-card border border-line bg-surface">
        <div class="flex flex-wrap items-center gap-1 border-b border-line bg-surface-2/60 px-2 py-1.5">
          <IconButton :title="tt('rotate', { axis: 'X' })" @click="rotate('x')"><span class="inline-flex items-center gap-0.5 text-xs font-semibold"><RotateCw class="h-3.5 w-3.5" />X</span></IconButton>
          <IconButton :title="tt('rotate', { axis: 'Y' })" @click="rotate('y')"><span class="inline-flex items-center gap-0.5 text-xs font-semibold"><RotateCw class="h-3.5 w-3.5" />Y</span></IconButton>
          <IconButton :title="tt('rotate', { axis: 'Z' })" @click="rotate('z')"><span class="inline-flex items-center gap-0.5 text-xs font-semibold"><RotateCw class="h-3.5 w-3.5" />Z</span></IconButton>
          <span class="mx-1 h-5 w-px bg-line" />
          <IconButton :title="tt('wireframe')" :active="wireframe" @click="wireframe = !wireframe"><Grid3x3 class="h-4 w-4" /></IconButton>
          <IconButton :title="tt('autoRotate')" :active="autoRotate" @click="autoRotate = !autoRotate"><Rotate3d class="h-4 w-4" /></IconButton>
          <IconButton :title="tt('showOriginal')" :active="showOriginal" @click="showOriginal = !showOriginal"><Eye class="h-4 w-4" /></IconButton>
          <IconButton :title="tt('resetView')" @click="viewer?.resetView()"><Focus class="h-4 w-4" /></IconButton>
          <span v-if="busy" class="ml-1 inline-flex items-center gap-1.5 text-xs text-fg-muted">
            <LoaderCircle class="h-3.5 w-3.5 animate-spin" />{{ tt('processing') }}
          </span>
          <span v-else-if="showOriginal" class="ml-1 text-xs text-fg-muted">{{ tt('showingOriginal') }}</span>
          <span class="flex-1" />
          <BaseButton size="sm" :disabled="!result" @click="exportObj"><Download class="h-4 w-4" />OBJ</BaseButton>
          <BaseButton size="sm" variant="primary" :disabled="!result" @click="exportStl"><Download class="h-4 w-4" />STL</BaseButton>
        </div>
        <div
          class="relative h-[60vh] min-h-[320px] bg-surface-2/40"
          @dragover.prevent="dragging = true"
          @dragleave="onDragLeave"
          @drop.prevent="onDrop"
        >
          <LowPolyViewer ref="viewer" :mesh="displayed" :wireframe="wireframe" :auto-rotate="autoRotate" :fit-key="fitKey" />
          <div
            v-if="dragging"
            class="pointer-events-none absolute inset-2 flex flex-col items-center justify-center gap-2 rounded-card border-2 border-dashed border-accent bg-accent-soft text-sm text-fg-muted"
          >
            <Upload class="h-6 w-6 text-accent" />{{ tt('dropHere') }}
          </div>
          <div class="pointer-events-none absolute bottom-2 left-3 text-[11px] text-fg-faint">{{ tt('hint') }}</div>
        </div>
      </div>
    </section>
  </div>
</template>
