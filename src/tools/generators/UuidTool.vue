<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { v1 as uuidv1, v4 as uuidv4, v7 as uuidv7 } from 'uuid'
import { Minus, CaseUpper, Tags, Hash, RefreshCw } from 'lucide-vue-next'
import ConfigSection from '@/components/ui/ConfigSection.vue'
import SettingCard from '@/components/ui/SettingCard.vue'
import BaseSwitch from '@/components/ui/BaseSwitch.vue'
import BaseSelect from '@/components/ui/BaseSelect.vue'
import NumberInput from '@/components/ui/NumberInput.vue'
import CodeEditor from '@/components/ui/CodeEditor.vue'
import IconButton from '@/components/ui/IconButton.vue'
import { useI18n } from '@/i18n'

const { t } = useI18n()
const tt = (k: string) => t(`tools.uuid.${k}`)

type Version = 1 | 4 | 7
const hyphens = ref(true)
const uppercase = ref(false)
const version = ref<Version>(4)
const count = ref(1)
const output = ref('')

const versionOptions = computed<{ value: Version; label: string }[]>(() => [
  { value: 1, label: tt('v1') },
  { value: 4, label: tt('v4') },
  { value: 7, label: tt('v7') },
])

function one(): string {
  let id = version.value === 1 ? uuidv1() : version.value === 7 ? uuidv7() : uuidv4()
  if (!hyphens.value) id = id.replace(/-/g, '')
  if (uppercase.value) id = id.toUpperCase()
  return id
}

function refresh() {
  output.value = Array.from({ length: count.value }, one).join('\n')
}
watch([hyphens, uppercase, version, count], refresh, { immediate: true })
</script>

<template>
  <div class="space-y-6">
    <ConfigSection>
      <SettingCard :icon="Minus" :title="tt('hyphens')" :description="tt('hyphensDesc')">
        <BaseSwitch v-model="hyphens" :on-label="t('common.on')" :off-label="t('common.off')" />
      </SettingCard>
      <SettingCard :icon="CaseUpper" :title="t('common.uppercase')" :description="tt('uppercaseDesc')">
        <BaseSwitch v-model="uppercase" :on-label="t('common.on')" :off-label="t('common.off')" />
      </SettingCard>
      <SettingCard :icon="Tags" :title="tt('version')" :description="tt('versionDesc')">
        <BaseSelect v-model="version" :options="versionOptions" />
      </SettingCard>
      <SettingCard :icon="Hash" :title="tt('count')" :description="tt('countDesc')">
        <NumberInput v-model="count" :min="1" :max="1000" />
      </SettingCard>
    </ConfigSection>

    <CodeEditor :model-value="output" :label="tt('output')" readonly height-class="min-h-[14rem]" filename="uuids.txt">
      <template #actions>
        <IconButton size="sm" :title="t('common.refresh')" @click="refresh"><RefreshCw class="h-4 w-4" /></IconButton>
      </template>
    </CodeEditor>
  </div>
</template>
