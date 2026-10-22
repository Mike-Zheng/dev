<script setup lang="ts">
import { computed, ref } from 'vue'
import { ArrowLeftRight } from 'lucide-vue-next'
import ConfigSection from '@/components/ui/ConfigSection.vue'
import SettingCard from '@/components/ui/SettingCard.vue'
import BaseSwitch from '@/components/ui/BaseSwitch.vue'
import CodeEditor from '@/components/ui/CodeEditor.vue'
import InfoBar from '@/components/ui/InfoBar.vue'
import { useI18n } from '@/i18n'

const { t } = useI18n()
const tt = (k: string) => t(`tools.escape.${k}`)

const escapeMode = ref(true)
const input = ref('')

const ESC: Record<string, string> = { '\\': '\\\\', '"': '\\"', "'": "\\'", '\n': '\\n', '\r': '\\r', '\t': '\\t', '\b': '\\b', '\f': '\\f', '\v': '\\v', '\0': '\\0' }
const UNESC: Record<string, string> = { '\\': '\\', '"': '"', "'": "'", n: '\n', r: '\r', t: '\t', b: '\b', f: '\f', v: '\v', '0': '\0', '/': '/' }

function escape(s: string): string {
  return Array.from(s)
    .map((c) => ESC[c] ?? c)
    .join('')
}

function unescape(s: string): string {
  let out = ''
  for (let i = 0; i < s.length; i++) {
    const c = s[i]!
    if (c !== '\\') {
      out += c
      continue
    }
    const n = s[i + 1]
    if (n === undefined) throw new Error('trailing backslash')
    if (n === 'u') {
      const hex = s.slice(i + 2, i + 6)
      if (!/^[0-9a-fA-F]{4}$/.test(hex)) throw new Error('bad \\u')
      out += String.fromCharCode(parseInt(hex, 16))
      i += 5
    } else if (n === 'x') {
      const hex = s.slice(i + 2, i + 4)
      if (!/^[0-9a-fA-F]{2}$/.test(hex)) throw new Error('bad \\x')
      out += String.fromCharCode(parseInt(hex, 16))
      i += 3
    } else if (n in UNESC) {
      out += UNESC[n]
      i++
    } else {
      throw new Error(`unknown escape \\${n}`)
    }
  }
  return out
}

const result = computed<{ output: string; error: string }>(() => {
  const src = input.value
  if (!src) return { output: '', error: '' }
  try {
    return { output: escapeMode.value ? escape(src) : unescape(src), error: '' }
  } catch (e) {
    return { output: '', error: `${tt('invalid')}: ${(e as Error).message}` }
  }
})
</script>

<template>
  <div class="space-y-6">
    <ConfigSection>
      <SettingCard :icon="ArrowLeftRight" :title="t('common.conversion')" :description="tt('conversionDesc')">
        <BaseSwitch v-model="escapeMode" :on-label="tt('escape')" :off-label="tt('unescape')" />
      </SettingCard>
    </ConfigSection>

    <InfoBar v-if="result.error" severity="error" :title="result.error" />

    <div class="grid gap-4 lg:grid-cols-2">
      <CodeEditor v-model="input" :label="t('common.input')" height-class="min-h-[18rem]" :invalid="!!result.error" />
      <CodeEditor :model-value="result.output" :label="t('common.output')" readonly height-class="min-h-[18rem]" filename="escaped.txt" />
    </div>
  </div>
</template>
