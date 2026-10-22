<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { CaseUpper, CircleCheck, CircleX, Info, Ruler, Rows3 } from 'lucide-vue-next'
import ConfigSection from '@/components/ui/ConfigSection.vue'
import SettingCard from '@/components/ui/SettingCard.vue'
import BaseSwitch from '@/components/ui/BaseSwitch.vue'
import BaseSelect from '@/components/ui/BaseSelect.vue'
import TextInput from '@/components/ui/TextInput.vue'
import CodeEditor from '@/components/ui/CodeEditor.vue'
import { useI18n } from '@/i18n'
import { md5Matches, md5Text, type Md5Length } from './md5'

const { t } = useI18n()
const tt = (k: string) => t(`tools.md5.${k}`)

const uppercase = ref(false)
const length = ref<Md5Length>(32)
const perLine = ref(false)
const input = ref('')
const output = ref('')
const verify = ref('')
const verifyState = ref<'none' | 'match' | 'mismatch'>('none')

const lengthOptions = computed<{ value: Md5Length; label: string }[]>(() => [
  { value: 32, label: tt('len32') },
  { value: 16, label: tt('len16') },
])

let seq = 0
watch(
  [input, uppercase, length, perLine],
  async () => {
    const my = ++seq
    const out = input.value ? await md5Text(input.value, { uppercase: uppercase.value, length: length.value, perLine: perLine.value }) : ''
    if (my === seq) output.value = out
  },
  { immediate: true },
)

let vseq = 0
watch([input, verify], async () => {
  const my = ++vseq
  const state = verify.value.trim() ? ((await md5Matches(input.value, verify.value)) ? 'match' : 'mismatch') : 'none'
  if (my === vseq) verifyState.value = state
})
</script>

<template>
  <div class="space-y-6">
    <ConfigSection>
      <SettingCard :icon="CaseUpper" :title="t('common.uppercase')" :description="tt('uppercaseDesc')">
        <BaseSwitch v-model="uppercase" :on-label="t('common.on')" :off-label="t('common.off')" />
      </SettingCard>
      <SettingCard :icon="Ruler" :title="t('common.length')" :description="tt('lengthDesc')">
        <BaseSelect v-model="length" :options="lengthOptions" />
      </SettingCard>
      <SettingCard :icon="Rows3" :title="tt('perLine')" :description="tt('perLineDesc')">
        <BaseSwitch v-model="perLine" :on-label="t('common.on')" :off-label="t('common.off')" />
      </SettingCard>
    </ConfigSection>

    <div class="flex items-start gap-2 text-xs text-fg-muted">
      <Info class="mt-px h-4 w-4 shrink-0" />
      <span>{{ tt('oneWay') }}</span>
    </div>

    <div class="grid gap-4 lg:grid-cols-2">
      <CodeEditor v-model="input" :label="t('common.input')" height-class="min-h-[16rem]" />
      <CodeEditor :model-value="output" :label="t('common.output')" readonly height-class="min-h-[16rem]" filename="md5.txt" />
    </div>

    <div class="space-y-1.5">
      <label class="text-xs font-semibold uppercase tracking-wider text-fg-muted">{{ tt('verify') }}</label>
      <div class="flex items-center gap-2">
        <TextInput v-model="verify" mono :placeholder="tt('verifyDesc')" />
        <span v-if="verifyState === 'match'" class="inline-flex shrink-0 items-center gap-1 text-sm text-success"><CircleCheck class="h-4 w-4" />{{ tt('match') }}</span>
        <span v-else-if="verifyState === 'mismatch'" class="inline-flex shrink-0 items-center gap-1 text-sm text-danger"><CircleX class="h-4 w-4" />{{ tt('mismatch') }}</span>
      </div>
    </div>
  </div>
</template>
