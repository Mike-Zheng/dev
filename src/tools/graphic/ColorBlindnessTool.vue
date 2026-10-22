<script setup lang="ts">
import { ref } from 'vue'
import { Download } from 'lucide-vue-next'
import DropZone from '@/components/ui/DropZone.vue'
import IconButton from '@/components/ui/IconButton.vue'
import { useI18n } from '@/i18n'
import { downloadBlob } from '@/composables/useFiles'
import { DEFICIENCIES, MATRICES, baseName, simulatePixels, type Deficiency } from './colorBlindness'

const { t } = useI18n()
const tt = (k: string) => t(`tools.color-blindness.${k}`)

type Kind = 'original' | Deficiency
interface Result {
  kind: Kind
  url: string
  blob: Blob | null
}

const results = ref<Result[]>([])
const processing = ref(false)
const fileName = ref('image')

function canvasToBlob(c: HTMLCanvasElement): Promise<Blob | null> {
  return new Promise((res) => c.toBlob(res, 'image/png'))
}

async function onFiles(files: File[]) {
  const f = files[0]
  if (!f) return
  processing.value = true
  fileName.value = baseName(f.name)
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
    for (const kind of DEFICIENCIES) {
      const out = new ImageData(simulatePixels(base.data, MATRICES[kind]), base.width, base.height)
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
