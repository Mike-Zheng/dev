<script setup lang="ts">
import { computed, ref } from 'vue'
import { JSONPath } from 'jsonpath-plus'
import { ChevronDown } from 'lucide-vue-next'
import CodeEditor from '@/components/ui/CodeEditor.vue'
import TextInput from '@/components/ui/TextInput.vue'
import InfoBar from '@/components/ui/InfoBar.vue'
import { useI18n } from '@/i18n'

const { t } = useI18n()
const tt = (k: string) => t(`tools.jsonpath.${k}`)

const json = ref('')
const path = ref('$')
const showCheat = ref(false)

const result = computed<{ output: string; error: string; info: string }>(() => {
  const src = json.value.trim()
  if (!src) return { output: '', error: '', info: '' }
  let obj: unknown
  try {
    obj = JSON.parse(src)
  } catch {
    return { output: '', error: tt('invalidJson'), info: '' }
  }
  const p = path.value.trim()
  if (!p) return { output: '', error: '', info: '' }
  try {
    const res = JSONPath({ path: p, json: obj as object, wrap: true }) as unknown[]
    if (!res.length) return { output: '', error: '', info: tt('noMatch') }
    return { output: JSON.stringify(res, null, 2), error: '', info: '' }
  } catch {
    return { output: '', error: tt('invalidPath'), info: '' }
  }
})

const cheat = computed(() => [
  { syntax: '$', desc: tt('cs_root') },
  { syntax: '@', desc: tt('cs_current') },
  { syntax: '.name', desc: tt('cs_dot') },
  { syntax: "['name']", desc: tt('cs_bracket') },
  { syntax: '..name', desc: tt('cs_recursive') },
  { syntax: '*', desc: tt('cs_wildcard') },
  { syntax: '[n]', desc: tt('cs_index') },
  { syntax: '[n1,n2]', desc: tt('cs_union') },
  { syntax: '[start:end:step]', desc: tt('cs_slice') },
  { syntax: '[?(expression)]', desc: tt('cs_filter') },
])
</script>

<template>
  <div class="space-y-4">
    <div class="space-y-1.5">
      <label class="text-xs font-semibold uppercase tracking-wider text-fg-muted">{{ tt('path') }}</label>
      <TextInput v-model="path" mono placeholder="$.store.book[*].author" :invalid="result.error === tt('invalidPath')" />
    </div>

    <InfoBar v-if="result.error" severity="error" :title="result.error" />
    <InfoBar v-else-if="result.info" severity="info" :title="result.info" />

    <div class="grid gap-4 lg:grid-cols-2">
      <CodeEditor v-model="json" :label="tt('json')" height-class="min-h-[22rem]" accept=".json,.txt" :invalid="result.error === tt('invalidJson')" />
      <CodeEditor :model-value="result.output" :label="tt('output')" readonly height-class="min-h-[22rem]" filename="jsonpath-result.json" />
    </div>

    <div class="rounded-card border border-line bg-surface">
      <button type="button" class="flex w-full items-center gap-2 px-4 py-2.5 text-sm font-medium text-fg" @click="showCheat = !showCheat">
        <ChevronDown class="h-4 w-4 text-fg-muted transition-transform" :class="showCheat ? 'rotate-180' : ''" />
        {{ t('common.cheatSheet') }}
      </button>
      <div v-if="showCheat" class="border-t border-line overflow-x-auto">
        <table class="w-full text-sm">
          <thead class="text-left text-xs text-fg-muted">
            <tr class="border-b border-line">
              <th class="px-4 py-2 font-medium">{{ t('common.syntax') }}</th>
              <th class="px-4 py-2 font-medium">{{ t('common.description') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="c in cheat" :key="c.syntax" class="border-b border-line last:border-0">
              <td class="whitespace-nowrap px-4 py-1.5 font-mono text-accent">{{ c.syntax }}</td>
              <td class="px-4 py-1.5 text-fg-muted">{{ c.desc }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
