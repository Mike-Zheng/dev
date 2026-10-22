<script setup lang="ts">
import { ref, watch } from 'vue'
import * as x509 from '@peculiar/x509'
import CodeEditor from '@/components/ui/CodeEditor.vue'
import InfoBar from '@/components/ui/InfoBar.vue'
import { useI18n } from '@/i18n'
import { base64ToBytes } from '@/utils/base64'
import { readFileAsArrayBuffer } from '@/composables/useFiles'

const { t } = useI18n()
const tt = (k: string) => t(`tools.certificate.${k}`)

const input = ref('')
const output = ref('')
const error = ref('')
let seq = 0

function hex(buf: ArrayBuffer, sep = ':'): string {
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join(sep)
    .toUpperCase()
}

function parseInput(raw: string): ArrayBuffer | string {
  const s = raw.trim()
  if (!s) return ''
  if (s.includes('-----BEGIN')) return s
  // raw base64 DER
  const bytes = base64ToBytes(s)
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer
}

async function decode(raw: string, binary?: ArrayBuffer) {
  const my = ++seq
  error.value = ''
  if (!raw.trim() && !binary) {
    output.value = ''
    return
  }
  try {
    const src = binary ?? parseInput(raw)
    const cert = new x509.X509Certificate(src as string)
    const lines: string[] = []
    const now = Date.now()
    const daysLeft = Math.floor((cert.notAfter.getTime() - now) / 86400000)
    lines.push(`${tt('subject')}:   ${cert.subject}`)
    lines.push(`${tt('issuer')}:    ${cert.issuer}`)
    lines.push(`${tt('serial')}:    ${cert.serialNumber.toUpperCase()}`)
    lines.push(`${tt('notBefore')}: ${cert.notBefore.toISOString()}`)
    lines.push(`${tt('notAfter')}:  ${cert.notAfter.toISOString()}  (${daysLeft < 0 ? tt('expired') : `${tt('validFor')} ${daysLeft} ${tt('days')}`})`)
    lines.push(`${tt('sigAlg')}:    ${cert.signatureAlgorithm.name} / ${cert.signatureAlgorithm.hash.name}`)
    const pk = cert.publicKey.algorithm as { name: string; modulusLength?: number; namedCurve?: string }
    lines.push(`${tt('pubKey')}:    ${pk.name}${pk.modulusLength ? ` ${pk.modulusLength} bit` : ''}${pk.namedCurve ? ` ${pk.namedCurve}` : ''}`)
    const [t1, t256] = await Promise.all([cert.getThumbprint('SHA-1'), cert.getThumbprint('SHA-256')])
    lines.push(`${tt('thumbprint')} SHA-1:   ${hex(t1)}`)
    lines.push(`${tt('thumbprint')} SHA-256: ${hex(t256)}`)

    if (cert.extensions.length) {
      lines.push('')
      lines.push(`${tt('extensions')} (${cert.extensions.length}):`)
      for (const ext of cert.extensions) {
        const crit = ext.critical ? ` [${tt('critical')}]` : ''
        if (ext instanceof x509.SubjectAlternativeNameExtension) {
          const names = ext.names.items.map((n) => `${n.type}=${n.value}`).join(', ')
          lines.push(`  - ${tt('san')}${crit}: ${names}`)
        } else if (ext instanceof x509.KeyUsagesExtension) {
          const flags = Object.entries(x509.KeyUsageFlags)
            .filter(([k, v]) => typeof v === 'number' && (ext.usages & (v as number)) !== 0 && Number.isNaN(Number(k)))
            .map(([k]) => k)
          lines.push(`  - ${tt('keyUsage')}${crit}: ${flags.join(', ')}`)
        } else if (ext instanceof x509.ExtendedKeyUsageExtension) {
          lines.push(`  - ${tt('extKeyUsage')}${crit}: ${ext.usages.join(', ')}`)
        } else if (ext instanceof x509.BasicConstraintsExtension) {
          lines.push(`  - ${tt('basicConstraints')}${crit}: ${tt('ca')}=${ext.ca}${ext.pathLength !== undefined ? `, pathLen=${ext.pathLength}` : ''}`)
        } else {
          lines.push(`  - ${ext.type}${crit}`)
        }
      }
    }
    lines.push('')
    lines.push(cert.toString('pem'))
    if (my === seq) output.value = lines.join('\n')
  } catch {
    if (my === seq) {
      output.value = ''
      error.value = tt('invalid')
    }
  }
}

watch(input, (v) => decode(v))

async function onFile(f: File) {
  if (/\.(cer|crt|der|p7b)$/i.test(f.name) || f.type === 'application/x-x509-ca-cert' || f.type === 'application/pkix-cert') {
    const buf = await readFileAsArrayBuffer(f)
    const text = new TextDecoder().decode(buf)
    if (!text.includes('-----BEGIN')) {
      await decode('', buf)
      input.value = `# ${f.name} (binary DER)\n`
    }
  }
}
</script>

<template>
  <div class="space-y-4">
    <InfoBar v-if="error" severity="error" :title="error" />
    <div class="grid gap-4 lg:grid-cols-2">
      <CodeEditor v-model="input" :label="t('common.input')" :placeholder="tt('placeholder')" height-class="min-h-[22rem]" :invalid="!!error" accept=".pem,.cer,.crt,.der,.txt" @file="onFile" />
      <CodeEditor :model-value="output" :label="t('common.output')" readonly height-class="min-h-[22rem]" filename="certificate.txt" />
    </div>
  </div>
</template>
