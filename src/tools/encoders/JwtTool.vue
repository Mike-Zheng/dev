<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { Clock, KeyRound, ShieldCheck, Wrench } from 'lucide-vue-next'
import ConfigSection from '@/components/ui/ConfigSection.vue'
import SettingCard from '@/components/ui/SettingCard.vue'
import BaseSwitch from '@/components/ui/BaseSwitch.vue'
import BaseSelect from '@/components/ui/BaseSelect.vue'
import NumberInput from '@/components/ui/NumberInput.vue'
import CodeEditor from '@/components/ui/CodeEditor.vue'
import InfoBar from '@/components/ui/InfoBar.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import { useI18n } from '@/i18n'
import { algorithms, decodeToken as decodeJwt, readClaims, signToken, verifyToken } from './jwt'

const { t } = useI18n()
const tt = (k: string) => t(`tools.jwt.${k}`)

const decodeMode = ref(true)

/* ---------------- Decode ---------------- */
const token = ref('')
const validate = ref(false)
const secret = ref('')
const header = ref('')
const payload = ref('')
const signature = ref('')
const decodeError = ref('')
const verifyStatus = ref<{ ok: boolean; msg: string } | null>(null)

const claims = computed(() => readClaims(payload.value).map((c) => ({ ...c, desc: c.known ? tt(`c_${c.name}`) : '' })))

function decodeToken(v: string) {
  decodeError.value = ''
  verifyStatus.value = null
  const s = v.trim()
  if (!s) {
    header.value = payload.value = signature.value = ''
    return
  }
  try {
    const d = decodeJwt(s)
    header.value = d.header
    payload.value = d.payload
    signature.value = d.signature
  } catch {
    header.value = payload.value = signature.value = ''
    decodeError.value = tt('invalidToken')
  }
}

async function verify() {
  verifyStatus.value = null
  const s = token.value.trim()
  if (!s || !validate.value) return
  const r = await verifyToken(s, secret.value)
  verifyStatus.value = r.ok ? { ok: true, msg: tt('valid') } : { ok: false, msg: tt(r.error) }
}

watch(token, (v) => {
  decodeToken(v)
  void verify()
})
watch([validate, secret], () => void verify())

/* ---------------- Encode ---------------- */
const algOptions = algorithms.map((a) => ({ value: a, label: a }))
const alg = ref('HS256')
const encHeader = ref('{\n  "typ": "JWT"\n}')
const encPayload = ref('{\n  "sub": "1234567890",\n  "name": "John Doe"\n}')
const encSecret = ref('')
const hasExpiration = ref(false)
const expiresIn = ref(60)
const encOutput = ref('')
const encError = ref('')

async function generate() {
  encError.value = ''
  try {
    encOutput.value = await signToken({
      alg: alg.value,
      header: encHeader.value,
      payload: encPayload.value,
      key: encSecret.value,
      expiresInMinutes: hasExpiration.value ? expiresIn.value : undefined,
    })
  } catch (e) {
    encOutput.value = ''
    encError.value = `${tt('encodeError')}: ${(e as Error).message}`
  }
}
</script>

<template>
  <div class="space-y-6">
    <ConfigSection>
      <SettingCard :icon="Wrench" :title="tt('toolMode')" :description="tt('toolModeDesc')">
        <BaseSwitch v-model="decodeMode" :on-label="t('common.decode')" :off-label="t('common.encode')" />
      </SettingCard>

      <template v-if="decodeMode">
        <SettingCard :icon="ShieldCheck" :title="tt('validate')" :description="tt('validateDesc')">
          <BaseSwitch v-model="validate" :on-label="t('common.yes')" :off-label="t('common.no')" />
          <template v-if="validate" #content>
            <CodeEditor v-model="secret" :label="tt('secret')" height-class="min-h-[5rem]" :show-stats="false" />
          </template>
        </SettingCard>
      </template>

      <template v-else>
        <SettingCard :icon="KeyRound" :title="tt('algorithm')">
          <BaseSelect v-model="alg" :options="algOptions" />
          <template #content>
            <CodeEditor v-model="encSecret" :label="tt('secretEncode')" height-class="min-h-[5rem]" :show-stats="false" />
          </template>
        </SettingCard>
        <SettingCard :icon="Clock" :title="tt('hasExpiration')">
          <NumberInput v-if="hasExpiration" v-model="expiresIn" :min="1" :max="525600" />
          <BaseSwitch v-model="hasExpiration" :on-label="t('common.yes')" :off-label="t('common.no')" />
        </SettingCard>
      </template>
    </ConfigSection>

    <!-- DECODE -->
    <template v-if="decodeMode">
      <InfoBar v-if="decodeError" severity="error" :title="decodeError" />
      <InfoBar v-else-if="verifyStatus" :severity="verifyStatus.ok ? 'success' : 'error'" :title="verifyStatus.msg" />

      <CodeEditor v-model="token" :label="tt('token')" height-class="min-h-[7rem]" :invalid="!!decodeError" />
      <div class="grid gap-4 lg:grid-cols-2">
        <CodeEditor :model-value="header" :label="tt('header')" readonly height-class="min-h-[10rem]" filename="header.json" />
        <CodeEditor :model-value="payload" :label="tt('payload')" readonly height-class="min-h-[10rem]" filename="payload.json" />
      </div>
      <div v-if="claims.length" class="overflow-hidden rounded-card border border-line bg-surface">
        <div class="border-b border-line bg-surface-2/60 px-3.5 py-2 text-xs font-semibold uppercase tracking-wider text-fg-muted">{{ tt('claims') }}</div>
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead class="text-left text-xs text-fg-muted">
              <tr class="border-b border-line">
                <th class="px-3.5 py-2 font-medium">{{ tt('claim') }}</th>
                <th class="px-3.5 py-2 font-medium">{{ t('common.value') }}</th>
                <th class="px-3.5 py-2 font-medium hidden md:table-cell">{{ t('common.description') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="c in claims" :key="c.name" class="border-b border-line last:border-0">
                <td class="px-3.5 py-2 font-mono text-accent">{{ c.name }}</td>
                <td class="px-3.5 py-2 font-mono break-all">{{ c.value }}</td>
                <td class="px-3.5 py-2 text-fg-muted hidden md:table-cell">{{ c.desc }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </template>

    <!-- ENCODE -->
    <template v-else>
      <InfoBar v-if="encError" severity="error" :title="encError" />
      <div class="grid gap-4 lg:grid-cols-2">
        <CodeEditor v-model="encHeader" :label="tt('header')" height-class="min-h-[10rem]" />
        <CodeEditor v-model="encPayload" :label="tt('payload')" height-class="min-h-[10rem]" />
      </div>
      <div>
        <BaseButton variant="primary" @click="generate">{{ tt('generate') }}</BaseButton>
      </div>
      <CodeEditor :model-value="encOutput" :label="tt('token')" readonly height-class="min-h-[7rem]" filename="token.jwt" />
    </template>
  </div>
</template>
