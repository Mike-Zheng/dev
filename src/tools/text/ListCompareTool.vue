<script setup lang="ts">
import { computed, ref } from 'vue'
import { CaseSensitive, GitCompare } from 'lucide-vue-next'
import ConfigSection from '@/components/ui/ConfigSection.vue'
import SettingCard from '@/components/ui/SettingCard.vue'
import BaseSwitch from '@/components/ui/BaseSwitch.vue'
import BaseSelect from '@/components/ui/BaseSelect.vue'
import CodeEditor from '@/components/ui/CodeEditor.vue'
import { useI18n } from '@/i18n'

const { t } = useI18n()
const tt = (k: string) => t(`tools.list-compare.${k}`)

type Mode = 'inter' | 'union' | 'aOnly' | 'bOnly'
const caseSensitive = ref(true)
const mode = ref<Mode>('inter')
const modeOptions = computed<{ value: Mode; label: string }[]>(() => [
  { value: 'inter', label: tt('aInterB') },
  { value: 'union', label: tt('aUnionB') },
  { value: 'aOnly', label: tt('aOnly') },
  { value: 'bOnly', label: tt('bOnly') },
])
const a = ref('')
const b = ref('')

function items(s: string): string[] {
  return s
    .split(/\r\n|\r|\n/)
    .map((l) => l.trim())
    .filter(Boolean)
}
const key = (s: string) => (caseSensitive.value ? s : s.toLowerCase())

function unique(list: string[]): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const it of list) {
    const k = key(it)
    if (!seen.has(k)) {
      seen.add(k)
      out.push(it)
    }
  }
  return out
}

const output = computed(() => {
  const la = unique(items(a.value))
  const lb = unique(items(b.value))
  const sa = new Set(la.map(key))
  const sb = new Set(lb.map(key))
  let res: string[]
  switch (mode.value) {
    case 'inter':
      res = la.filter((x) => sb.has(key(x)))
      break
    case 'union':
      res = unique([...la, ...lb])
      break
    case 'aOnly':
      res = la.filter((x) => !sb.has(key(x)))
      break
    default:
      res = lb.filter((x) => !sa.has(key(x)))
  }
  return res.join('\n')
})
const count = computed(() => (output.value ? output.value.split('\n').length : 0))
</script>

<template>
  <div class="space-y-6">
    <ConfigSection>
      <SettingCard :icon="CaseSensitive" :title="tt('caseSensitive')">
        <BaseSwitch v-model="caseSensitive" :on-label="t('common.on')" :off-label="t('common.off')" />
      </SettingCard>
      <SettingCard :icon="GitCompare" :title="tt('mode')" :description="tt('modeDesc')">
        <BaseSelect v-model="mode" :options="modeOptions" />
      </SettingCard>
    </ConfigSection>

    <div class="grid gap-4 lg:grid-cols-2">
      <CodeEditor v-model="a" :label="tt('listA')" height-class="min-h-[14rem]" />
      <CodeEditor v-model="b" :label="tt('listB')" height-class="min-h-[14rem]" />
    </div>
    <CodeEditor :model-value="output" :label="`${t('common.output')} · ${modeOptions.find((o) => o.value === mode)?.label}`" readonly height-class="min-h-[12rem]" filename="list.txt">
      <template #footer><span>{{ count }} {{ tt('items') }}</span></template>
    </CodeEditor>
  </div>
</template>
