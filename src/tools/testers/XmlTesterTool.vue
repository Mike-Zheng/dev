<script setup lang="ts">
import { ref, watch } from 'vue'
import CodeEditor from '@/components/ui/CodeEditor.vue'
import InfoBar from '@/components/ui/InfoBar.vue'
import { useI18n } from '@/i18n'
import { validateXmlWithXsd, type XmlTestResult } from './xmlTester'

const { t } = useI18n()
const tt = (k: string, p?: Record<string, string>) => t(`tools.xml-tester.${k}`, p)

type Status = { severity: 'info' | 'success' | 'warning' | 'error'; title: string; message?: string }

const xsd = ref('')
const xml = ref('')
const status = ref<Status | null>(null)
let seq = 0
let timer: number | undefined

function toStatus(r: XmlTestResult): Status {
  switch (r.kind) {
    case 'needBoth':
      return { severity: 'info', title: tt('needBoth') }
    case 'malformedXml':
    case 'malformedXsd':
    case 'invalid':
      return { severity: 'error', title: tt(r.kind), message: r.message }
    case 'valid':
      return r.missingNamespace
        ? { severity: 'warning', title: tt('valid'), message: tt('nsHint', { ns: r.missingNamespace }) }
        : { severity: 'success', title: tt('valid') }
  }
}

async function validate() {
  const my = ++seq
  const res = await validateXmlWithXsd(xml.value, xsd.value, () => {
    status.value = { severity: 'info', title: tt('loading') }
  })
  if (my === seq) status.value = res && toStatus(res)
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
