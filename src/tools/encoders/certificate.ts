import 'reflect-metadata'
import * as x509 from '@peculiar/x509'
import { base64ToBytes } from '@/utils/base64'

export type CertificateExtension = { critical: boolean } & (
  | { kind: 'san'; names: string[] }
  | { kind: 'keyUsage'; flags: string[] }
  | { kind: 'extKeyUsage'; usages: string[] }
  | { kind: 'basicConstraints'; ca: boolean; pathLength?: number }
  | { kind: 'other'; type: string }
)

export interface CertificateInfo {
  subject: string
  issuer: string
  serial: string
  notBefore: Date
  notAfter: Date
  /** Whole days until `notAfter`; negative once expired */
  daysLeft: number
  signatureAlgorithm: string
  publicKey: string
  sha1: string
  sha256: string
  extensions: CertificateExtension[]
  pem: string
}

/** Uppercase hex of a buffer, bytes joined by `sep`. */
export function hex(buf: ArrayBuffer, sep = ':'): string {
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join(sep)
    .toUpperCase()
}

/** PEM text is passed through; anything else is treated as Base64 DER. Throws on invalid Base64. */
export function parseCertificateInput(raw: string): ArrayBuffer | string {
  const s = raw.trim()
  if (!s) return ''
  if (s.includes('-----BEGIN')) return s
  const bytes = base64ToBytes(s)
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer
}

/** Whether a dropped file should be read as binary (possibly DER) rather than as text. */
export function isCertificateFile(name: string, type: string): boolean {
  return /\.(cer|crt|der|p7b)$/i.test(name) || type === 'application/x-x509-ca-cert' || type === 'application/pkix-cert'
}

function describeExtension(ext: x509.Extension): CertificateExtension {
  const critical = ext.critical
  if (ext instanceof x509.SubjectAlternativeNameExtension) {
    return { critical, kind: 'san', names: ext.names.items.map((n) => `${n.type}=${n.value}`) }
  }
  if (ext instanceof x509.KeyUsagesExtension) {
    const flags = Object.entries(x509.KeyUsageFlags)
      .filter(([k, v]) => typeof v === 'number' && (ext.usages & v) !== 0 && Number.isNaN(Number(k)))
      .map(([k]) => k)
    return { critical, kind: 'keyUsage', flags }
  }
  if (ext instanceof x509.ExtendedKeyUsageExtension) {
    return { critical, kind: 'extKeyUsage', usages: ext.usages.map(String) }
  }
  if (ext instanceof x509.BasicConstraintsExtension) {
    return { critical, kind: 'basicConstraints', ca: ext.ca, pathLength: ext.pathLength }
  }
  return { critical, kind: 'other', type: ext.type }
}

/** Parses a PEM string or DER buffer. Throws when it is not a valid X.509 certificate. */
export async function readCertificate(src: string | ArrayBuffer, now = Date.now()): Promise<CertificateInfo> {
  const cert = new x509.X509Certificate(src)
  const pk = cert.publicKey.algorithm as { name: string; modulusLength?: number; namedCurve?: string }
  const [sha1, sha256] = await Promise.all([cert.getThumbprint('SHA-1'), cert.getThumbprint('SHA-256')])
  return {
    subject: cert.subject,
    issuer: cert.issuer,
    serial: cert.serialNumber.toUpperCase(),
    notBefore: cert.notBefore,
    notAfter: cert.notAfter,
    daysLeft: Math.floor((cert.notAfter.getTime() - now) / 86400000),
    signatureAlgorithm: `${cert.signatureAlgorithm.name} / ${cert.signatureAlgorithm.hash.name}`,
    publicKey: `${pk.name}${pk.modulusLength ? ` ${pk.modulusLength} bit` : ''}${pk.namedCurve ? ` ${pk.namedCurve}` : ''}`,
    sha1: hex(sha1),
    sha256: hex(sha256),
    extensions: cert.extensions.map(describeExtension),
    pem: cert.toString('pem'),
  }
}

/** Renders the certificate as the tool's text report; `label` maps keys such as `subject` to display text. */
export function formatCertificate(info: CertificateInfo, label: (key: string) => string): string {
  const validity = info.daysLeft < 0 ? label('expired') : `${label('validFor')} ${info.daysLeft} ${label('days')}`
  const lines = [
    `${label('subject')}:   ${info.subject}`,
    `${label('issuer')}:    ${info.issuer}`,
    `${label('serial')}:    ${info.serial}`,
    `${label('notBefore')}: ${info.notBefore.toISOString()}`,
    `${label('notAfter')}:  ${info.notAfter.toISOString()}  (${validity})`,
    `${label('sigAlg')}:    ${info.signatureAlgorithm}`,
    `${label('pubKey')}:    ${info.publicKey}`,
    `${label('thumbprint')} SHA-1:   ${info.sha1}`,
    `${label('thumbprint')} SHA-256: ${info.sha256}`,
  ]
  if (info.extensions.length) {
    lines.push('', `${label('extensions')} (${info.extensions.length}):`)
    for (const ext of info.extensions) {
      const crit = ext.critical ? ` [${label('critical')}]` : ''
      switch (ext.kind) {
        case 'san':
          lines.push(`  - ${label('san')}${crit}: ${ext.names.join(', ')}`)
          break
        case 'keyUsage':
          lines.push(`  - ${label('keyUsage')}${crit}: ${ext.flags.join(', ')}`)
          break
        case 'extKeyUsage':
          lines.push(`  - ${label('extKeyUsage')}${crit}: ${ext.usages.join(', ')}`)
          break
        case 'basicConstraints':
          lines.push(`  - ${label('basicConstraints')}${crit}: ${label('ca')}=${ext.ca}${ext.pathLength !== undefined ? `, pathLen=${ext.pathLength}` : ''}`)
          break
        default:
          lines.push(`  - ${ext.type}${crit}`)
      }
    }
  }
  lines.push('', info.pem)
  return lines.join('\n')
}
