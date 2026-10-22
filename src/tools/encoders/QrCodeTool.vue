<script setup lang="ts">
import { ref, watch } from 'vue'
import QRCode from 'qrcode'
import jsQR from 'jsqr'
import { Download, Shield } from 'lucide-vue-next'
import ConfigSection from '@/components/ui/ConfigSection.vue'
import SettingCard from '@/components/ui/SettingCard.vue'
import BaseSelect from '@/components/ui/BaseSelect.vue'
import CodeEditor from '@/components/ui/CodeEditor.vue'
import DropZone from '@/components/ui/DropZone.vue'
import InfoBar from '@/components/ui/InfoBar.vue'
import IconButton from '@/components/ui/IconButton.vue'
import { useI18n } from '@/i18n'
import { downloadBlob, downloadText } from '@/composables/useFiles'

const { t } = useI18n()
const tt = (k: string) => t(`tools.qrcode.${k}`)

type Level = 'L' | 'M' | 'Q' | 'H'
const level = ref<Level>('M')
const levelOptions: { value: Level; label: string }[] = [
  { value: 'L', label: 'L (7%)' },
  { value: 'M', label: 'M (15%)' },
  { value: 'Q', label: 'Q (25%)' },
  { value: 'H', label: 'H (30%)' },
]

const text = ref('https://devtoys.app')
const canvas = ref<HTMLCanvasElement | null>(null)
const error = ref('')
const hasQr = ref(false)

async function render() {
  error.value = ''
  const el = canvas.value
  if (!el) return
  if (!text.value) {
    const ctx = el.getContext('2d')
    ctx?.clearRect(0, 0, el.width, el.height)
    hasQr.value = false
    return
  }
  try {
    await QRCode.toCanvas(el, text.value, { errorCorrectionLevel: level.value, width: 320, margin: 2, color: { dark: '#000000', light: '#ffffff' } })
    hasQr.value = true
  } catch (e) {
    hasQr.value = false
    error.value = (e as Error).message
  }
}

watch([text, level], render, { immediate: true })
watch(canvas, render)

function exportPng() {
  canvas.value?.toBlob((b) => b && downloadBlob(b, 'qrcode.png'), 'image/png')
}

async function exportSvg() {
  if (!text.value) return
  const svg = await QRCode.toString(text.value, { type: 'svg', errorCorrectionLevel: level.value, margin: 2 })
  downloadText(svg, 'qrcode.svg', 'image/svg+xml')
}

async function decodeImage(files: File[]) {
  const f = files[0]
  if (!f) return
  error.value = ''
  const url = URL.createObjectURL(f)
  try {
    const img = new Image()
    await new Promise<void>((res, rej) => {
      img.onload = () => res()
      img.onerror = () => rej(new Error('image'))
      img.src = url
    })
    const c = document.createElement('canvas')
    c.width = img.naturalWidth
    c.height = img.naturalHeight
    const ctx = c.getContext('2d')
    if (!ctx) return
    ctx.drawImage(img, 0, 0)
    const data = ctx.getImageData(0, 0, c.width, c.height)
    const code = jsQR(data.data, data.width, data.height)
    if (code?.data) text.value = code.data
    else error.value = tt('noQr')
  } catch {
    error.value = tt('noQr')
  } finally {
    URL.revokeObjectURL(url)
  }
}
</script>

<template>
  <div class="space-y-6">
    <ConfigSection>
      <SettingCard :icon="Shield" :title="tt('errorLevel')" :description="tt('errorLevelDesc')">
        <BaseSelect v-model="level" :options="levelOptions" />
      </SettingCard>
    </ConfigSection>

    <InfoBar v-if="error" severity="error" :title="error" />

    <div class="grid gap-4 lg:grid-cols-2">
      <CodeEditor v-model="text" :label="tt('text')" height-class="min-h-[18rem]" filename="qrcode.txt" />

      <div class="flex flex-col rounded-card border border-line bg-surface overflow-hidden">
        <div class="flex items-center gap-1 border-b border-line bg-surface-2/60 px-2 py-1.5 min-h-[38px]">
          <span class="px-1.5 text-xs font-semibold uppercase tracking-wider text-fg-muted">{{ tt('qr') }}</span>
          <span class="flex-1" />
          <IconButton size="sm" :title="tt('exportPng')" :disabled="!hasQr" @click="exportPng"><Download class="h-4 w-4" /></IconButton>
          <button
            type="button"
            class="h-7 rounded-md px-2 text-xs font-medium text-fg-muted hover:bg-surface-3 hover:text-fg disabled:opacity-40"
            :disabled="!hasQr"
            @click="exportSvg"
          >
            SVG
          </button>
        </div>
        <div class="flex flex-1 flex-col items-center gap-3 p-4">
          <div class="rounded-lg bg-white p-2 shadow-inner">
            <canvas ref="canvas" class="block h-[240px] w-[240px] sm:h-[280px] sm:w-[280px]" />
          </div>
          <DropZone accept="image/*" compact :label="tt('dropHint')" @files="decodeImage" />
        </div>
      </div>
    </div>
  </div>
</template>
