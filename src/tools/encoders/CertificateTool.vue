<script setup lang="ts">
import { ref, watch } from 'vue'
import CodeEditor from '@/components/ui/CodeEditor.vue'
import InfoBar from '@/components/ui/InfoBar.vue'
import { useI18n } from '@/i18n'
import { readFileAsArrayBuffer } from '@/composables/useFiles'
import { formatCertificate, isCertificateFile, parseCertificateInput, readCertificate } from './certificate'

const { t } = useI18n()
const tt = (k: string) => t(`tools.certificate.${k}`)

const input = ref('')
const output = ref('')
const error = ref('')
let seq = 0
// Placeholder shown in the input after a binary DER file is dropped; it must not be re-decoded as text
let binaryPlaceholder = ''

async function decode(raw: string, binary?: ArrayBuffer) {
  const my = ++seq
  error.value = ''
  if (!raw.trim() && !binary) {
    output.value = ''
    return
  }
  try {
    const info = await readCertificate(binary ?? parseCertificateInput(raw))
    if (my === seq) output.value = formatCertificate(info, tt)
  } catch {
    if (my === seq) {
      output.value = ''
      error.value = tt('invalid')
    }
  }
}

watch(input, (v) => {
  if (v !== binaryPlaceholder) void decode(v)
})

async function onFile(f: File) {
  if (isCertificateFile(f.name, f.type)) {
    const buf = await readFileAsArrayBuffer(f)
    const text = new TextDecoder().decode(buf)
    if (!text.includes('-----BEGIN')) {
      binaryPlaceholder = `# ${f.name} (binary DER)\n`
      input.value = binaryPlaceholder
      await decode('', buf)
    }
  }
}
</script>

<template>
  <div class="space-y-4">
    <InfoBar v-if="error" severity="error" :title="error" />
    <div class="grid gap-4 lg:grid-cols-2">
      <CodeEditor v-model="input" :label="t('common.input')" :placeholder="tt('placeholder')" height-class="min-h-[22rem]" :invalid="!!error" accept=".pem,.cer,.crt,.der,.txt" @file="onFile" />
      <CodeEditor :model-value="output" :label="t('common.output')" readonly height-class="min-h-[22rem]" filename="certificate.txt" />
    </div>
  </div>
</template>
