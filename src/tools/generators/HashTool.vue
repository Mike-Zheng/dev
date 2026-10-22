<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { md5, sha1, sha256, sha384, sha512, createMD5, createSHA1, createSHA256, createSHA384, createSHA512, createHMAC, crc32 } from 'hash-wasm'
import type { IHasher } from 'hash-wasm/dist/lib/WASMInterface'
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

const ALGOS = ['MD5', 'SHA1', 'SHA256', 'SHA384', 'SHA512', 'CRC32'] as const
type Algo = (typeof ALGOS)[number]
const hashes = ref<Record<Algo, string>>({ MD5: '', SHA1: '', SHA256: '', SHA384: '', SHA512: '', CRC32: '' })

let seq = 0
let currentFile: File | null = null

const creators: Record<Exclude<Algo, 'CRC32'>, () => Promise<IHasher>> = {
  MD5: createMD5,
  SHA1: createSHA1,
  SHA256: createSHA256,
  SHA384: createSHA384,
  SHA512: createSHA512,
}

async function hashText(text: string) {
  const key = secret.value
  const out: Record<Algo, string> = { MD5: '', SHA1: '', SHA256: '', SHA384: '', SHA512: '', CRC32: '' }
  if (hmac.value) {
    for (const a of ['MD5', 'SHA1', 'SHA256', 'SHA384', 'SHA512'] as const) {
      const h = await createHMAC(creators[a](), key)
      h.init()
      h.update(text)
      out[a] = h.digest()
    }
  } else {
    const [a, b, c, d, e] = await Promise.all([md5(text), sha1(text), sha256(text), sha384(text), sha512(text)])
    out.MD5 = a
    out.SHA1 = b
    out.SHA256 = c
    out.SHA384 = d
    out.SHA512 = e
  }
  out.CRC32 = await crc32(text)
  return out
}

async function hashFile(file: File) {
  const key = secret.value
  const names = ['MD5', 'SHA1', 'SHA256', 'SHA384', 'SHA512'] as const
  const hashers = await Promise.all(names.map((a) => (hmac.value ? createHMAC(creators[a](), key) : creators[a]())))
  hashers.forEach((h) => h.init())
  const chunk = 4 * 1024 * 1024
  for (let off = 0; off < file.size; off += chunk) {
    const buf = new Uint8Array(await file.slice(off, off + chunk).arrayBuffer())
    hashers.forEach((h) => h.update(buf))
  }
  const out: Record<Algo, string> = { MD5: '', SHA1: '', SHA256: '', SHA384: '', SHA512: '', CRC32: '' }
  names.forEach((a, i) => (out[a] = hashers[i]!.digest()))
  out.CRC32 = await crc32(new Uint8Array(await file.arrayBuffer()))
  return out
}

async function recompute() {
  const my = ++seq
  computing.value = true
  try {
    const out = currentFile ? await hashFile(currentFile) : await hashText(input.value)
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
  ALGOS.map((a) => {
    const v = uppercase.value ? hashes.value[a].toUpperCase() : hashes.value[a]
    return { algo: a, value: v }
  }),
)

const hasInput = computed(() => !!input.value || !!currentFile)

const verifyState = computed<'none' | 'match' | 'mismatch'>(() => {
  const v = verify.value.trim().toLowerCase()
  if (!v || !hasInput.value) return 'none'
  return ALGOS.some((a) => hashes.value[a].toLowerCase() === v) ? 'match' : 'mismatch'
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
