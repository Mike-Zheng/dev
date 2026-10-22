<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { Ruler, Hash, CaseUpper, CaseLower, Binary, Asterisk, Ban, RefreshCw } from 'lucide-vue-next'
import ConfigSection from '@/components/ui/ConfigSection.vue'
import SettingCard from '@/components/ui/SettingCard.vue'
import BaseSwitch from '@/components/ui/BaseSwitch.vue'
import NumberInput from '@/components/ui/NumberInput.vue'
import TextInput from '@/components/ui/TextInput.vue'
import CodeEditor from '@/components/ui/CodeEditor.vue'
import InfoBar from '@/components/ui/InfoBar.vue'
import IconButton from '@/components/ui/IconButton.vue'
import { useI18n } from '@/i18n'
import { entropyBits, generatePasswords, passwordAlphabet, type PasswordOptions } from './password'

const { t } = useI18n()
const tt = (k: string) => t(`tools.password.${k}`)

const length = ref(30)
const count = ref(1)
const useUpper = ref(true)
const useLower = ref(true)
const useDigits = ref(true)
const useSpecial = ref(true)
const exclude = ref('')
const output = ref('')

const options = computed<PasswordOptions>(() => ({
  length: length.value,
  upper: useUpper.value,
  lower: useLower.value,
  digits: useDigits.value,
  special: useSpecial.value,
  exclude: exclude.value,
}))
const alphabet = computed(() => passwordAlphabet(options.value))
const entropy = computed(() => entropyBits(options.value))

function refresh() {
  output.value = generatePasswords(options.value, count.value).join('\n')
}
watch([length, count, useUpper, useLower, useDigits, useSpecial, exclude], refresh, { immediate: true })
</script>

<template>
  <div class="space-y-6">
    <ConfigSection>
      <SettingCard :icon="Ruler" :title="t('common.length')" :description="tt('lengthDesc')">
        <NumberInput v-model="length" :min="1" :max="256" />
      </SettingCard>
      <SettingCard :icon="Hash" :title="tt('count')" :description="tt('countDesc')">
        <NumberInput v-model="count" :min="1" :max="500" />
      </SettingCard>
      <SettingCard :icon="CaseUpper" :title="tt('uppercase')" :description="tt('uppercaseDesc')">
        <BaseSwitch v-model="useUpper" :on-label="t('common.on')" :off-label="t('common.off')" />
      </SettingCard>
      <SettingCard :icon="CaseLower" :title="tt('lowercase')" :description="tt('lowercaseDesc')">
        <BaseSwitch v-model="useLower" :on-label="t('common.on')" :off-label="t('common.off')" />
      </SettingCard>
      <SettingCard :icon="Binary" :title="tt('digits')" :description="tt('digitsDesc')">
        <BaseSwitch v-model="useDigits" :on-label="t('common.on')" :off-label="t('common.off')" />
      </SettingCard>
      <SettingCard :icon="Asterisk" :title="tt('special')" :description="tt('specialDesc')">
        <BaseSwitch v-model="useSpecial" :on-label="t('common.on')" :off-label="t('common.off')" />
      </SettingCard>
      <SettingCard :icon="Ban" :title="tt('exclude')" :description="tt('excludeDesc')">
        <div class="w-48"><TextInput v-model="exclude" mono /></div>
      </SettingCard>
    </ConfigSection>

    <InfoBar v-if="!alphabet.length" severity="warning" :title="tt('noSets')" />

    <CodeEditor :model-value="output" :label="tt('output')" readonly height-class="min-h-[12rem]" filename="passwords.txt">
      <template #actions>
        <IconButton size="sm" :title="t('common.refresh')" @click="refresh"><RefreshCw class="h-4 w-4" /></IconButton>
      </template>
      <template #footer>
        <span>{{ tt('strength') }}: {{ entropy }} bits</span>
      </template>
    </CodeEditor>
  </div>
</template>
