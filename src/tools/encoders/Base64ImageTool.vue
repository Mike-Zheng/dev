<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { Download, Link2, Trash2 } from 'lucide-vue-next'
import ConfigSection from '@/components/ui/ConfigSection.vue'
import SettingCard from '@/components/ui/SettingCard.vue'
import BaseSwitch from '@/components/ui/BaseSwitch.vue'
import CodeEditor from '@/components/ui/CodeEditor.vue'
import DropZone from '@/components/ui/DropZone.vue'
import InfoBar from '@/components/ui/InfoBar.vue'
import IconButton from '@/components/ui/IconButton.vue'
import { useI18n } from '@/i18n'
import { readFileAsDataUrl, downloadBlob, formatBytes } from '@/composables/useFiles'
import { baseFileName, dataUrlPayload, decodeDataUrl, decodedSize, toPreviewUrl } from './base64Image'

const { t } = useI18n()
const tt = (k: string) => t(`tools.base64-image.${k}`)

const withPrefix = ref(true)
const base64 = ref('')
const error = ref('')
const fileName = ref('image')
const rawDataUrl = ref('')

const previewUrl = computed(() => toPreviewUrl(base64.value))

const sizeLabel = computed(() => {
  const size = decodedSize(base64.value)
  return size === null ? '' : formatBytes(size)
})

async function onFiles(files: File[]) {
  const f = files[0]
  if (!f) return
  error.value = ''
  fileName.value = baseFileName(f.name)
  rawDataUrl.value = await readFileAsDataUrl(f)
  applyPrefix()
}

function applyPrefix() {
  if (!rawDataUrl.value) return
  base64.value = withPrefix.value ? rawDataUrl.value : dataUrlPayload(rawDataUrl.value)
}

watch(withPrefix, () => {
  if (rawDataUrl.value && (base64.value === rawDataUrl.value || base64.value === dataUrlPayload(rawDataUrl.value))) {
    applyPrefix()
  }
})

watch(base64, (v) => {
  error.value = ''
  if (v && !v.startsWith('data:') && rawDataUrl.value && v !== dataUrlPayload(rawDataUrl.value)) {
    rawDataUrl.value = ''
  }
})

function onImageError() {
  if (base64.value.trim()) error.value = tt('invalid')
}

function download() {
  const url = previewUrl.value
  if (!url) return
  try {
    const { bytes, mime, ext } = decodeDataUrl(url)
    downloadBlob(new Blob([bytes as BlobPart], { type: mime }), `${fileName.value}.${ext}`)
  } catch {
    error.value = tt('invalid')
  }
}

function clear() {
  base64.value = ''
  rawDataUrl.value = ''
  error.value = ''
}
</script>

<template>
  <div class="space-y-6">
    <ConfigSection>
      <SettingCard :icon="Link2" :title="tt('dataUrl')" :description="tt('dataUrlDesc')">
        <BaseSwitch v-model="withPrefix" :on-label="t('common.on')" :off-label="t('common.off')" />
      </SettingCard>
    </ConfigSection>

    <InfoBar v-if="error" severity="error" :title="error" />

    <div class="grid gap-4 lg:grid-cols-2">
      <CodeEditor v-model="base64" :label="tt('base64Input')" height-class="min-h-[22rem]" filename="image.base64.txt" accept="image/*,.txt" @file="(f) => f.type.startsWith('image/') && onFiles([f])">
        <template #footer>
          <span v-if="sizeLabel">{{ tt('size') }}: {{ sizeLabel }}</span>
        </template>
      </CodeEditor>

      <div class="flex flex-col rounded-card border border-line bg-surface overflow-hidden">
        <div class="flex items-center gap-1 border-b border-line bg-surface-2/60 px-2 py-1.5 min-h-[38px]">
          <span class="px-1.5 text-xs font-semibold uppercase tracking-wider text-fg-muted">{{ tt('preview') }}</span>
          <span class="flex-1" />
          <IconButton size="sm" :title="t('common.download')" :disabled="!previewUrl" @click="download"><Download class="h-4 w-4" /></IconButton>
          <IconButton size="sm" :title="t('common.clear')" :disabled="!base64" @click="clear"><Trash2 class="h-4 w-4" /></IconButton>
        </div>
        <div class="flex flex-1 flex-col p-3 gap-3">
          <DropZone accept="image/*" compact @files="onFiles" />
          <div
            v-if="previewUrl"
            class="flex flex-1 items-center justify-center rounded-lg border border-line p-3 min-h-[12rem] bg-[linear-gradient(45deg,var(--c-surface-2)_25%,transparent_25%,transparent_75%,var(--c-surface-2)_75%),linear-gradient(45deg,var(--c-surface-2)_25%,transparent_25%,transparent_75%,var(--c-surface-2)_75%)] bg-[length:16px_16px] bg-[position:0_0,8px_8px]"
          >
            <img :src="previewUrl" alt="" class="max-h-[22rem] max-w-full object-contain" @error="onImageError" @load="error = ''" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
