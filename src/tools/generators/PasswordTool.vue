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

const { t } = useI18n()
const tt = (k: string) => t(`tools.password.${k}`)

const UPPER = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
const LOWER = 'abcdefghijklmnopqrstuvwxyz'
const DIGITS = '0123456789'
const SPECIAL = '!"#$%&\'()*+,-./:;<=>?@[\\]^_`{|}~'

const length = ref(30)
const count = ref(1)
const useUpper = ref(true)
const useLower = ref(true)
const useDigits = ref(true)
const useSpecial = ref(true)
const exclude = ref('')
const output = ref('')

const alphabet = computed(() => {
  const ex = new Set(exclude.value)
  let chars = ''
  if (useUpper.value) chars += UPPER
  if (useLower.value) chars += LOWER
  if (useDigits.value) chars += DIGITS
  if (useSpecial.value) chars += SPECIAL
  return Array.from(chars).filter((c) => !ex.has(c))
})

const entropyBits = computed(() => (alphabet.value.length > 1 ? Math.round(length.value * Math.log2(alphabet.value.length)) : 0))

function randomInt(n: number): number {
  const limit = Math.floor(0x100000000 / n) * n
  const buf = new Uint32Array(1)
  let v: number
  do {
    crypto.getRandomValues(buf)
    v = buf[0]!
  } while (v >= limit)
  return v % n
}

function onePassword(): string {
  const sets = [
    useUpper.value ? UPPER : '',
    useLower.value ? LOWER : '',
    useDigits.value ? DIGITS : '',
    useSpecial.value ? SPECIAL : '',
  ]
    .map((s) => Array.from(s).filter((c) => !exclude.value.includes(c)))
    .filter((s) => s.length > 0)
  const all = alphabet.value
  const chars: string[] = []
  // guarantee at least one char of each enabled set when length allows
  for (const s of sets) if (chars.length < length.value) chars.push(s[randomInt(s.length)]!)
  while (chars.length < length.value) chars.push(all[randomInt(all.length)]!)
  for (let i = chars.length - 1; i > 0; i--) {
    const j = randomInt(i + 1)
    ;[chars[i], chars[j]] = [chars[j]!, chars[i]!]
  }
  return chars.join('')
}

function refresh() {
  if (!alphabet.value.length) {
    output.value = ''
    return
  }
  output.value = Array.from({ length: count.value }, onePassword).join('\n')
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
        <span>{{ tt('strength') }}: {{ entropyBits }} bits</span>
      </template>
    </CodeEditor>
  </div>
</template>
