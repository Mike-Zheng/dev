<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { CaseUpper, KeyRound, Copy, CircleCheck, CircleX } from 'lucide-vue-next'
import ConfigSection from '@/components/ui/ConfigSection.vue'
import SettingCard from '@/components/ui/SettingCard.vue'
import BaseSwitch from '@/components/ui/BaseSwitch.vue'
import TextInput from '@/components/ui/TextInput.vue'
import CodeEditor from '@/components/ui/CodeEditor.vue'
import DropZone from '@/components/ui/DropZone.vue'
import IconButton from '@/components/ui/IconButton.vue'
import { useI18n } from '@/i18n'
import { useClipboard } from '@/composables/useClipboard'
import { formatBytes } from '@/composables/useFiles'
import { HASH_ALGOS, emptyHashes, hashBlob, hashText, matchesAnyHash, type HashResult } from './hash'

const { t } = useI18n()
const tt = (k: string) => t(`tools.hash.${k}`)
const { copy } = useClipboard()

const uppercase = ref(false)
const hmac = ref(false)
const secret = ref('')
const input = ref('')
const verify = ref('')
const fileInfo = ref<{ name: string; size: number } | null>(null)
const computing = ref(false)

const hashes = ref<HashResult>(emptyHashes())

let seq = 0
let currentFile: File | null = null

async function recompute() {
  const my = ++seq
  computing.value = true
  try {
    const key = hmac.value ? secret.value : null
    const out = currentFile ? await hashBlob(currentFile, key) : await hashText(input.value, key)
    if (my === seq) hashes.value = out
  } finally {
    if (my === seq) computing.value = false
  }
}

watch([input, hmac, secret], () => {
  if (input.value) {
    currentFile = null
    fileInfo.value = null
  }
  void recompute()
})

async function onFiles(files: File[]) {
  const f = files[0]
  if (!f) return
  currentFile = f
  fileInfo.value = { name: f.name, size: f.size }
  input.value = ''
  await recompute()
}

const rows = computed(() =>
  HASH_ALGOS.map((a) => {
    const v = uppercase.value ? hashes.value[a].toUpperCase() : hashes.value[a]
    return { algo: a, value: v }
  }),
)

const hasInput = computed(() => !!input.value || !!currentFile)

const verifyState = computed<'none' | 'match' | 'mismatch'>(() => {
  if (!verify.value.trim() || !hasInput.value) return 'none'
  return matchesAnyHash(hashes.value, verify.value) ? 'match' : 'mismatch'
})
</script>

<template>
  <div class="space-y-6">
    <ConfigSection>
      <SettingCard :icon="CaseUpper" :title="t('common.uppercase')" :description="tt('uppercaseDesc')">
        <BaseSwitch v-model="uppercase" :on-label="t('common.on')" :off-label="t('common.off')" />
      </SettingCard>
      <SettingCard :icon="KeyRound" :title="tt('hmac')" :description="tt('hmacDesc')">
        <BaseSwitch v-model="hmac" :on-label="t('common.on')" :off-label="t('common.off')" />
        <template v-if="hmac" #content>
          <label class="block text-xs text-fg-muted mb-1">{{ tt('secret') }}</label>
          <TextInput v-model="secret" mono />
        </template>
      </SettingCard>
    </ConfigSection>

    <div class="grid gap-4 lg:grid-cols-[1fr_280px]">
      <CodeEditor v-model="input" :label="tt('inputText')" height-class="min-h-[10rem]" accept="*/*" @file="(f) => onFiles([f])" />
      <div class="flex flex-col gap-2">
        <DropZone compact :label="tt('inputFile')" @files="onFiles" />
        <div v-if="fileInfo" class="rounded-lg border border-line bg-surface px-3 py-2 text-xs">
          <div class="truncate font-medium text-fg">{{ fileInfo.name }}</div>
          <div class="text-fg-muted font-mono">{{ formatBytes(fileInfo.size) }}</div>
        </div>
      </div>
    </div>

    <div class="divide-y divide-line rounded-card border border-line bg-surface">
      <div v-for="r in rows" :key="r.algo" class="flex items-center gap-3 px-4 py-2.5">
        <div class="w-16 shrink-0 text-xs font-semibold text-accent">{{ r.algo }}</div>
        <div class="min-w-0 flex-1 font-mono text-sm text-fg break-all min-h-[1.25rem]" :class="computing ? 'opacity-50' : ''">
          {{ hasInput ? r.value : '' }}
        </div>
        <IconButton size="sm" :title="t('common.copy')" :disabled="!hasInput || !r.value" @click="copy(r.value)"><Copy class="h-4 w-4" /></IconButton>
      </div>
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
