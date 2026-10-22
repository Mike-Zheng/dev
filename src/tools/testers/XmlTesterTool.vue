<script setup lang="ts">
import { ref, watch } from 'vue'
import CodeEditor from '@/components/ui/CodeEditor.vue'
import InfoBar from '@/components/ui/InfoBar.vue'
import { useI18n } from '@/i18n'

const { t } = useI18n()
const tt = (k: string, p?: Record<string, string>) => t(`tools.xml-tester.${k}`, p)

const xsd = ref('')
const xml = ref('')
const status = ref<{ severity: 'info' | 'success' | 'warning' | 'error'; title: string; message?: string } | null>(null)
let seq = 0
let timer: number | undefined

function wellFormed(src: string): string | null {
  const doc = new DOMParser().parseFromString(src, 'application/xml')
  const err = doc.querySelector('parsererror')
  return err ? (err.textContent ?? '').split('\n')[0] ?? 'parse error' : null
}

function targetNamespace(xsdSrc: string): string | null {
  const m = /targetNamespace\s*=\s*"([^"]+)"/.exec(xsdSrc)
  return m?.[1] ?? null
}

async function validate() {
  const my = ++seq
  const x = xml.value.trim()
  const s = xsd.value.trim()
  if (!x || !s) {
    status.value = x || s ? { severity: 'info', title: tt('needBoth') } : null
    return
  }
  const xmlErr = wellFormed(x)
  if (xmlErr) {
    status.value = { severity: 'error', title: tt('malformedXml'), message: xmlErr }
    return
  }
  const xsdErr = wellFormed(s)
  if (xsdErr) {
    status.value = { severity: 'error', title: tt('malformedXsd'), message: xsdErr }
    return
  }
  status.value = { severity: 'info', title: tt('loading') }
  try {
    const { validateXML } = await import('xmllint-wasm')
    const res = await validateXML({
      xml: [{ fileName: 'document.xml', contents: x }],
      schema: [{ fileName: 'schema.xsd', contents: s }],
    })
    if (my !== seq) return
    if (res.valid) {
      const ns = targetNamespace(s)
      if (ns && !x.includes(ns)) {
        status.value = { severity: 'warning', title: tt('valid'), message: tt('nsHint', { ns }) }
      } else {
        status.value = { severity: 'success', title: tt('valid') }
      }
    } else {
      const msg = res.errors.map((e) => (e.loc ? `line ${e.loc.lineNumber}: ${e.message}` : e.message)).join('\n')
      status.value = { severity: 'error', title: tt('invalid'), message: msg || res.rawOutput }
    }
  } catch (e) {
    if (my === seq) status.value = { severity: 'error', title: tt('invalid'), message: (e as Error).message }
  }
}

watch([xml, xsd], () => {
  window.clearTimeout(timer)
  timer = window.setTimeout(() => void validate(), 300)
})
</script>

<template>
  <div class="space-y-4">
    <InfoBar v-if="status" :severity="status.severity" :title="status.title" :message="status.message" />
    <div class="grid gap-4 lg:grid-cols-2">
      <CodeEditor v-model="xsd" :label="tt('xsd')" height-class="min-h-[24rem]" accept=".xsd,.xml,.txt" />
      <CodeEditor v-model="xml" :label="tt('xml')" height-class="min-h-[24rem]" accept=".xml,.txt" />
    </div>
  </div>
</template>
