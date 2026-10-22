<script setup lang="ts">
import { ref } from 'vue'
import { Download } from 'lucide-vue-next'
import DropZone from '@/components/ui/DropZone.vue'
import IconButton from '@/components/ui/IconButton.vue'
import { useI18n } from '@/i18n'
import { downloadBlob } from '@/composables/useFiles'

const { t } = useI18n()
const tt = (k: string) => t(`tools.color-blindness.${k}`)

type Kind = 'original' | 'protanopia' | 'deuteranopia' | 'tritanopia'
interface Result {
  kind: Kind
  url: string
  blob: Blob | null
}

const results = ref<Result[]>([])
const processing = ref(false)
const fileName = ref('image')

/* Brettel/Viénot-style simulation matrices applied in linear RGB (Machado et al. 2009, severity 1.0). */
const MATRICES: Record<Exclude<Kind, 'original'>, number[]> = {
  protanopia: [0.152286, 1.052583, -0.204868, 0.114503, 0.786281, 0.099216, -0.003882, -0.048116, 1.051998],
  deuteranopia: [0.367322, 0.860646, -0.227968, 0.280085, 0.672501, 0.047413, -0.01182, 0.04294, 0.968881],
  tritanopia: [1.255528, -0.076749, -0.178779, -0.078411, 0.930809, 0.147602, 0.004733, 0.691367, 0.3039],
}

const toLinear = new Float32Array(256)
for (let i = 0; i < 256; i++) {
  const c = i / 255
  toLinear[i] = c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
}
function toSrgb(v: number): number {
  const c = v <= 0.0031308 ? v * 12.92 : 1.055 * Math.pow(v, 1 / 2.4) - 0.055
  return Math.max(0, Math.min(255, Math.round(c * 255)))
}

function simulate(src: ImageData, m: number[]): ImageData {
  const out = new ImageData(src.width, src.height)
  const d = src.data
  const o = out.data
  for (let i = 0; i < d.length; i += 4) {
    const r = toLinear[d[i]!]!
    const g = toLinear[d[i + 1]!]!
    const b = toLinear[d[i + 2]!]!
    o[i] = toSrgb(m[0]! * r + m[1]! * g + m[2]! * b)
    o[i + 1] = toSrgb(m[3]! * r + m[4]! * g + m[5]! * b)
    o[i + 2] = toSrgb(m[6]! * r + m[7]! * g + m[8]! * b)
    o[i + 3] = d[i + 3]!
  }
  return out
}

function canvasToBlob(c: HTMLCanvasElement): Promise<Blob | null> {
  return new Promise((res) => c.toBlob(res, 'image/png'))
}

async function onFiles(files: File[]) {
  const f = files[0]
  if (!f) return
  processing.value = true
  fileName.value = f.name.replace(/\.[^.]+$/, '') || 'image'
  for (const r of results.value) URL.revokeObjectURL(r.url)
  results.value = []
  try {
    const bmp = await createImageBitmap(f)
    const c = document.createElement('canvas')
    c.width = bmp.width
    c.height = bmp.height
    const ctx = c.getContext('2d', { willReadFrequently: true })!
    ctx.drawImage(bmp, 0, 0)
    const base = ctx.getImageData(0, 0, c.width, c.height)
    results.value.push({ kind: 'original', url: URL.createObjectURL(f), blob: f })
    for (const kind of ['protanopia', 'deuteranopia', 'tritanopia'] as const) {
      const out = simulate(base, MATRICES[kind])
      const oc = document.createElement('canvas')
      oc.width = out.width
      oc.height = out.height
      oc.getContext('2d')!.putImageData(out, 0, 0)
      const blob = await canvasToBlob(oc)
      results.value.push({ kind, url: blob ? URL.createObjectURL(blob) : '', blob })
      await new Promise((r) => requestAnimationFrame(r))
    }
  } finally {
    processing.value = false
  }
}

function save(r: Result) {
  if (r.blob) downloadBlob(r.blob, `${fileName.value}-${r.kind}.png`)
}
</script>

<template>
  <div class="space-y-4">
    <DropZone accept="image/*" :compact="results.length > 0" @files="onFiles" />
    <div v-if="processing" class="text-sm text-fg-muted">{{ tt('processing') }}</div>

    <div v-if="results.length" class="grid gap-4 md:grid-cols-2">
      <div v-for="r in results" :key="r.kind" class="overflow-hidden rounded-card border border-line bg-surface">
        <div class="flex items-center gap-2 border-b border-line bg-surface-2/60 px-3 py-1.5 min-h-[38px]">
          <div class="min-w-0">
            <div class="text-xs font-semibold uppercase tracking-wider text-fg-muted">{{ tt(r.kind) }}</div>
            <div v-if="r.kind !== 'original'" class="text-[11px] text-fg-faint">{{ tt(`${r.kind}Desc`) }}</div>
          </div>
          <span class="flex-1" />
          <IconButton size="sm" :title="t('common.download')" :disabled="!r.blob" @click="save(r)"><Download class="h-4 w-4" /></IconButton>
        </div>
        <div class="flex items-center justify-center bg-surface-2/40 p-2">
          <img v-if="r.url" :src="r.url" alt="" class="max-h-[22rem] w-auto max-w-full object-contain" />
        </div>
      </div>
    </div>
  </div>
</template>
