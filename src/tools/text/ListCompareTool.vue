<script setup lang="ts">
import { computed, ref } from 'vue'
import { CaseSensitive, GitCompare } from 'lucide-vue-next'
import ConfigSection from '@/components/ui/ConfigSection.vue'
import SettingCard from '@/components/ui/SettingCard.vue'
import BaseSwitch from '@/components/ui/BaseSwitch.vue'
import BaseSelect from '@/components/ui/BaseSelect.vue'
import CodeEditor from '@/components/ui/CodeEditor.vue'
import { useI18n } from '@/i18n'
import { compareLists, type ListMode } from './listCompare'

const { t } = useI18n()
const tt = (k: string) => t(`tools.list-compare.${k}`)

const caseSensitive = ref(true)
const mode = ref<ListMode>('inter')
const modeOptions = computed<{ value: ListMode; label: string }[]>(() => [
  { value: 'inter', label: tt('aInterB') },
  { value: 'union', label: tt('aUnionB') },
  { value: 'aOnly', label: tt('aOnly') },
  { value: 'bOnly', label: tt('bOnly') },
])
const a = ref('')
const b = ref('')

const output = computed(() => compareLists(a.value, b.value, mode.value, caseSensitive.value).join('\n'))
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
