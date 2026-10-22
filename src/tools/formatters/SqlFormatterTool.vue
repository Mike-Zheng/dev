<script setup lang="ts">
import { computed, ref } from 'vue'
import { format as formatSql, type SqlLanguage, type KeywordCase } from 'sql-formatter'
import { Database, IndentIncrease, CaseUpper } from 'lucide-vue-next'
import ConfigSection from '@/components/ui/ConfigSection.vue'
import SettingCard from '@/components/ui/SettingCard.vue'
import BaseSelect from '@/components/ui/BaseSelect.vue'
import CodeEditor from '@/components/ui/CodeEditor.vue'
import InfoBar from '@/components/ui/InfoBar.vue'
import { useI18n } from '@/i18n'
import { useIndentOptions, indentString, type Indent } from '@/utils/indent'

const { t } = useI18n()
const tt = (k: string) => t(`tools.sql-formatter.${k}`)

const languageOptions: { value: SqlLanguage; label: string }[] = [
  { value: 'sql', label: 'Standard SQL' },
  { value: 'mysql', label: 'MySQL' },
  { value: 'mariadb', label: 'MariaDB' },
  { value: 'postgresql', label: 'PostgreSQL' },
  { value: 'transactsql', label: 'Transact-SQL' },
  { value: 'plsql', label: 'PL/SQL' },
  { value: 'sqlite', label: 'SQLite' },
  { value: 'db2', label: 'Db2' },
  { value: 'n1ql', label: 'N1QL' },
  { value: 'redshift', label: 'Amazon Redshift' },
  { value: 'spark', label: 'Spark SQL' },
  { value: 'bigquery', label: 'BigQuery' },
  { value: 'snowflake', label: 'Snowflake' },
  { value: 'trino', label: 'Trino' },
]

const language = ref<SqlLanguage>('sql')
const indent = ref<Indent>('two')
const indentOptions = useIndentOptions(t, false)
const keywordCase = ref<KeywordCase>('preserve')
const keywordCaseOptions = computed<{ value: KeywordCase; label: string }[]>(() => [
  { value: 'preserve', label: tt('preserve') },
  { value: 'upper', label: tt('upper') },
  { value: 'lower', label: tt('lower') },
])
const input = ref('')

const result = computed<{ output: string; error: string }>(() => {
  const src = input.value
  if (!src.trim()) return { output: '', error: '' }
  try {
    const ind = indentString(indent.value)
    return {
      output: formatSql(src, {
        language: language.value,
        useTabs: indent.value === 'tab',
        tabWidth: ind === '\t' ? 4 : ind.length,
        keywordCase: keywordCase.value,
      }),
      error: '',
    }
  } catch (e) {
    return { output: '', error: `${tt('invalid')}: ${(e as Error).message}` }
  }
})
</script>

<template>
  <div class="space-y-6">
    <ConfigSection>
      <SettingCard :icon="Database" :title="tt('language')" :description="tt('languageDesc')">
        <BaseSelect v-model="language" :options="languageOptions" />
      </SettingCard>
      <SettingCard :icon="IndentIncrease" :title="t('common.indentation')" :description="tt('indentationDesc')">
        <BaseSelect v-model="indent" :options="indentOptions" />
      </SettingCard>
      <SettingCard :icon="CaseUpper" :title="tt('keywordCase')" :description="tt('keywordCaseDesc')">
        <BaseSelect v-model="keywordCase" :options="keywordCaseOptions" />
      </SettingCard>
    </ConfigSection>

    <InfoBar v-if="result.error" severity="error" :title="result.error" />

    <div class="grid gap-4 lg:grid-cols-2">
      <CodeEditor v-model="input" :label="t('common.input')" height-class="min-h-[24rem]" :invalid="!!result.error" accept=".sql,.txt" />
      <CodeEditor :model-value="result.output" :label="t('common.output')" readonly height-class="min-h-[24rem]" filename="formatted.sql" />
    </div>
  </div>
</template>
