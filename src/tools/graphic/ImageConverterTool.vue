<script setup lang="ts">
import { ref, watch } from 'vue'
import { Images, Gauge, Maximize2, Download, Trash2 } from 'lucide-vue-next'
import ConfigSection from '@/components/ui/ConfigSection.vue'
import SettingCard from '@/components/ui/SettingCard.vue'
import BaseSelect from '@/components/ui/BaseSelect.vue'
import NumberInput from '@/components/ui/NumberInput.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import DropZone from '@/components/ui/DropZone.vue'
import IconButton from '@/components/ui/IconButton.vue'
import { useI18n } from '@/i18n'
import { downloadBlob, formatBytes } from '@/composables/useFiles'
import { IMAGE_FORMATS, blobQuality, fitWithin, needsOpaqueBackground, outputFileName, type ImageFormat } from './imageConverter'

const { t } = useI18n()
const tt = (k: string) => t(`tools.image-converter.${k}`)

const format = ref<ImageFormat>('image/png')
const formatOptions = IMAGE_FORMATS.map(({ value, label }) => ({ value, label }))
const quality = ref(90)
const maxSize = ref(0)

interface Item {
  id: number
  file: File
  thumb: string
  width: number
  height: number
  out: { blob: Blob; url: string; width: number; height: number } | null
  error: string
  busy: boolean
}
const items = ref<Item[]>([])
let seq = 0

async function convert(it: Item) {
  it.busy = true
  it.error = ''
  try {
    const bmp = await createImageBitmap(it.file)
    it.width = bmp.width
    it.height = bmp.height
    const { width: w, height: h } = fitWithin(bmp.width, bmp.height, maxSize.value)
    const c = document.createElement('canvas')
    c.width = w
    c.height = h
    const ctx = c.getContext('2d')!
    if (needsOpaqueBackground(format.value)) {
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, w, h)
    }
    ctx.drawImage(bmp, 0, 0, w, h)
    const blob = await new Promise<Blob | null>((res) => c.toBlob(res, format.value, blobQuality(quality.value)))
    if (!blob) throw new Error('toBlob failed')
    if (it.out) URL.revokeObjectURL(it.out.url)
    it.out = { blob, url: URL.createObjectURL(blob), width: w, height: h }
  } catch (e) {
    it.out = null
    it.error = `${tt('failed')}: ${(e as Error).message}`
  } finally {
    it.busy = false
  }
}

async function onFiles(files: File[]) {
  for (const f of files) {
    if (!f.type.startsWith('image/')) continue
    const it: Item = { id: ++seq, file: f, thumb: URL.createObjectURL(f), width: 0, height: 0, out: null, error: '', busy: true }
    items.value.push(it)
    void convert(items.value[items.value.length - 1]!)
  }
}

watch([format, quality, maxSize], () => {
  for (const it of items.value) void convert(it)
})

function outName(it: Item) {
  return outputFileName(it.file.name, format.value)
}
function save(it: Item) {
  if (it.out) downloadBlob(it.out.blob, outName(it))
}
function saveAll() {
  for (const it of items.value) save(it)
}
function remove(it: Item) {
  URL.revokeObjectURL(it.thumb)
  if (it.out) URL.revokeObjectURL(it.out.url)
  items.value = items.value.filter((x) => x.id !== it.id)
}
function removeAll() {
  for (const it of [...items.value]) remove(it)
}
</script>

<template>
  <div class="space-y-6">
    <ConfigSection>
      <SettingCard :icon="Images" :title="tt('format')" :description="tt('formatDesc')">
        <BaseSelect v-model="format" :options="formatOptions" />
      </SettingCard>
      <SettingCard v-if="format !== 'image/png'" :icon="Gauge" :title="tt('quality')" :description="tt('qualityDesc')">
        <NumberInput v-model="quality" :min="1" :max="100" />
      </SettingCard>
      <SettingCard :icon="Maximize2" :title="tt('maxSize')" :description="tt('maxSizeDesc')">
        <NumberInput v-model="maxSize" :min="0" :max="16384" :step="64" />
      </SettingCard>
    </ConfigSection>

    <DropZone accept="image/*" multiple :compact="items.length > 0" :label="tt('drop')" @files="onFiles" />

    <div v-if="items.length" class="space-y-3">
      <div class="flex items-center gap-2">
        <BaseButton variant="primary" size="sm" @click="saveAll"><Download class="h-4 w-4" />{{ tt('saveAll') }}</BaseButton>
        <BaseButton variant="outline" size="sm" @click="removeAll"><Trash2 class="h-4 w-4" />{{ tt('deleteAll') }}</BaseButton>
      </div>
      <div class="divide-y divide-line rounded-card border border-line bg-surface">
        <div v-for="it in items" :key="it.id" class="flex items-center gap-3 px-3 py-2.5">
          <img :src="it.out?.url ?? it.thumb" alt="" class="h-12 w-12 shrink-0 rounded-md object-cover bg-surface-2" />
          <div class="min-w-0 flex-1">
            <div class="truncate text-sm font-medium text-fg">{{ it.file.name }} <span class="text-fg-faint">→</span> {{ outName(it) }}</div>
            <div class="text-xs text-fg-muted font-mono">
              <template v-if="it.busy">{{ tt('converting') }}</template>
              <template v-else-if="it.error"><span class="text-danger">{{ it.error }}</span></template>
              <template v-else-if="it.out">
                {{ it.width }}×{{ it.height }} · {{ formatBytes(it.file.size) }}
                <span class="text-fg-faint">→</span>
                {{ it.out.width }}×{{ it.out.height }} · {{ formatBytes(it.out.blob.size) }}
              </template>
            </div>
          </div>
          <IconButton size="sm" :title="tt('save')" :disabled="!it.out" @click="save(it)"><Download class="h-4 w-4" /></IconButton>
          <IconButton size="sm" :title="tt('delete')" @click="remove(it)"><Trash2 class="h-4 w-4" /></IconButton>
        </div>
      </div>
    </div>
  </div>
</template>
