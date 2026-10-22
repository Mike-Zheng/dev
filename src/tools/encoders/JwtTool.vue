<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import * as jose from 'jose'
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

interface ClaimRow {
  name: string
  value: string
  desc: string
}

const claims = computed<ClaimRow[]>(() => {
  if (!payload.value) return []
  try {
    const obj = JSON.parse(payload.value) as Record<string, unknown>
    const known = ['iss', 'sub', 'aud', 'exp', 'nbf', 'iat', 'jti']
    return Object.entries(obj).map(([k, v]) => {
      let value = typeof v === 'string' ? v : JSON.stringify(v)
      if (['exp', 'nbf', 'iat'].includes(k) && typeof v === 'number') {
        value = `${v} → ${new Date(v * 1000).toISOString()}`
      }
      return { name: k, value, desc: known.includes(k) ? tt(`c_${k}`) : '' }
    })
  } catch {
    return []
  }
})

function decodeToken(v: string) {
  decodeError.value = ''
  verifyStatus.value = null
  const s = v.trim()
  if (!s) {
    header.value = payload.value = signature.value = ''
    return
  }
  try {
    const h = jose.decodeProtectedHeader(s)
    const p = jose.decodeJwt(s)
    header.value = JSON.stringify(h, null, 2)
    payload.value = JSON.stringify(p, null, 2)
    signature.value = s.split('.')[2] ?? ''
  } catch {
    header.value = payload.value = signature.value = ''
    decodeError.value = tt('invalidToken')
  }
}

async function importVerifyKey(alg: string, raw: string): Promise<jose.CryptoKey | Uint8Array> {
  if (alg.startsWith('HS')) return new TextEncoder().encode(raw)
  if (raw.includes('-----BEGIN')) return jose.importSPKI(raw, alg)
  return jose.importJWK(JSON.parse(raw) as jose.JWK, alg)
}

async function verify() {
  verifyStatus.value = null
  const s = token.value.trim()
  if (!s || !validate.value) return
  try {
    const h = jose.decodeProtectedHeader(s)
    const alg = h.alg ?? 'HS256'
    const key = await importVerifyKey(alg, secret.value)
    await jose.jwtVerify(s, key)
    verifyStatus.value = { ok: true, msg: tt('valid') }
  } catch (e) {
    const code = (e as { code?: string }).code
    if (code === 'ERR_JWT_EXPIRED') verifyStatus.value = { ok: false, msg: tt('expired') }
    else if (code === 'ERR_JWT_CLAIM_VALIDATION_FAILED' && String(e).includes('nbf')) verifyStatus.value = { ok: false, msg: tt('notYet') }
    else verifyStatus.value = { ok: false, msg: tt('invalidSig') }
  }
}

watch(token, (v) => {
  decodeToken(v)
  void verify()
})
watch([validate, secret], () => void verify())

/* ---------------- Encode ---------------- */
const algOptions = ['HS256', 'HS384', 'HS512', 'RS256', 'RS384', 'RS512', 'PS256', 'PS384', 'PS512', 'ES256', 'ES384', 'ES512'].map((a) => ({ value: a, label: a }))
const alg = ref('HS256')
const encHeader = ref('{\n  "typ": "JWT"\n}')
const encPayload = ref('{\n  "sub": "1234567890",\n  "name": "John Doe"\n}')
const encSecret = ref('')
const hasExpiration = ref(false)
const expiresIn = ref(60)
const encOutput = ref('')
const encError = ref('')

async function importSignKey(a: string, raw: string): Promise<jose.CryptoKey | Uint8Array> {
  if (a.startsWith('HS')) return new TextEncoder().encode(raw)
  if (raw.includes('-----BEGIN')) return jose.importPKCS8(raw, a)
  return jose.importJWK(JSON.parse(raw) as jose.JWK, a)
}

async function generate() {
  encError.value = ''
  try {
    const h = JSON.parse(encHeader.value || '{}') as Record<string, unknown>
    const p = JSON.parse(encPayload.value || '{}') as jose.JWTPayload
    const key = await importSignKey(alg.value, encSecret.value)
    let builder = new jose.SignJWT(p).setProtectedHeader({ ...h, alg: alg.value, typ: (h.typ as string) ?? 'JWT' })
    if (hasExpiration.value) builder = builder.setIssuedAt().setExpirationTime(`${expiresIn.value}m`)
    encOutput.value = await builder.sign(key)
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
