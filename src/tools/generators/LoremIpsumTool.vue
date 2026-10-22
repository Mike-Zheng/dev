<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { BookOpen, ListOrdered, Ruler, RefreshCw, Quote } from 'lucide-vue-next'
import ConfigSection from '@/components/ui/ConfigSection.vue'
import SettingCard from '@/components/ui/SettingCard.vue'
import BaseSelect from '@/components/ui/BaseSelect.vue'
import BaseSwitch from '@/components/ui/BaseSwitch.vue'
import NumberInput from '@/components/ui/NumberInput.vue'
import CodeEditor from '@/components/ui/CodeEditor.vue'
import IconButton from '@/components/ui/IconButton.vue'
import { useI18n } from '@/i18n'
import { generate, type CorpusId } from '@/utils/lorem'

const { t } = useI18n()
const tt = (k: string) => t(`tools.lorem-ipsum.${k}`)

type Kind = 'words' | 'sentences' | 'paragraphs'
const corpus = ref<CorpusId>('lorem')
const kind = ref<Kind>('paragraphs')
const length = ref(3)
const startWithLorem = ref(true)
const output = ref('')

const corpusOptions = computed<{ value: CorpusId; label: string }[]>(() => [
  { value: 'lorem', label: tt('c_lorem') },
  { value: 'raven', label: tt('c_raven') },
  { value: 'faust', label: tt('c_faust') },
  { value: 'bateau', label: tt('c_bateau') },
])
const kindOptions = computed<{ value: Kind; label: string }[]>(() => [
  { value: 'words', label: tt('words') },
  { value: 'sentences', label: tt('sentences') },
  { value: 'paragraphs', label: tt('paragraphs') },
])

function refresh() {
  output.value = generate(corpus.value, kind.value, length.value, startWithLorem.value)
}
watch([corpus, kind, length, startWithLorem], refresh, { immediate: true })
</script>

<template>
  <div class="space-y-6">
    <ConfigSection>
      <SettingCard :icon="BookOpen" :title="tt('corpus')" :description="tt('corpusDesc')">
        <BaseSelect v-model="corpus" :options="corpusOptions" />
      </SettingCard>
      <SettingCard :icon="ListOrdered" :title="t('common.type')" :description="tt('typeDesc')">
        <BaseSelect v-model="kind" :options="kindOptions" />
      </SettingCard>
      <SettingCard :icon="Ruler" :title="t('common.length')" :description="tt('lengthDesc')">
        <NumberInput v-model="length" :min="1" :max="1000" />
      </SettingCard>
      <SettingCard v-if="corpus === 'lorem'" :icon="Quote" :title="tt('startWithLorem')" :description="tt('startWithLoremDesc')">
        <BaseSwitch v-model="startWithLorem" :on-label="t('common.on')" :off-label="t('common.off')" />
      </SettingCard>
    </ConfigSection>

    <CodeEditor :model-value="output" :label="t('common.output')" readonly :mono="false" height-class="min-h-[20rem]" filename="lorem-ipsum.txt">
      <template #actions>
        <IconButton size="sm" :title="t('common.refresh')" @click="refresh"><RefreshCw class="h-4 w-4" /></IconButton>
      </template>
    </CodeEditor>
  </div>
</template>
