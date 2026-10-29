import 'reflect-metadata'
import { createHash, webcrypto } from 'node:crypto'
import * as x509 from '@peculiar/x509'
import { beforeAll, describe, expect, it } from 'vitest'
import { formatCertificate, hex, isCertificateFile, parseCertificateInput, readCertificate } from './certificate'

const NOT_BEFORE = new Date('2025-01-01T00:00:00.000Z')
const NOT_AFTER = new Date('2026-01-01T00:00:00.000Z')
const DAY = 86400000

let ecCert: x509.X509Certificate
let rsaCert: x509.X509Certificate
let ecDer: Uint8Array

function toB64(buf: ArrayBuffer): string {
  return Buffer.from(buf).toString('base64')
}

beforeAll(async () => {
  x509.cryptoProvider.set(webcrypto as unknown as Crypto)
  const ecKeys = await webcrypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify'])
  ecCert = await x509.X509CertificateGenerator.createSelfSigned({
    serialNumber: '01ab',
    name: 'CN=Dev Test, O=Dev',
    notBefore: NOT_BEFORE,
    notAfter: NOT_AFTER,
    keys: ecKeys as CryptoKeyPair,
    signingAlgorithm: { name: 'ECDSA', hash: 'SHA-256' } as EcdsaParams,
    extensions: [
      new x509.BasicConstraintsExtension(true, 2, true),
      new x509.KeyUsagesExtension(x509.KeyUsageFlags.digitalSignature | x509.KeyUsageFlags.keyCertSign, true),
      new x509.ExtendedKeyUsageExtension([x509.ExtendedKeyUsage.serverAuth]),
      new x509.SubjectAlternativeNameExtension([
        { type: 'dns', value: 'example.com' },
        { type: 'ip', value: '127.0.0.1' },
      ]),
      await x509.SubjectKeyIdentifierExtension.create(ecKeys.publicKey as CryptoKey),
    ],
  })
  ecDer = new Uint8Array(ecCert.rawData)

  const rsaKeys = await webcrypto.subtle.generateKey(
    { name: 'RSASSA-PKCS1-v1_5', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' },
    true,
    ['sign', 'verify'],
  )
  rsaCert = await x509.X509CertificateGenerator.createSelfSigned({
    serialNumber: '7f',
    name: 'CN=RSA Test',
    notBefore: NOT_BEFORE,
    notAfter: NOT_AFTER,
    keys: rsaKeys as CryptoKeyPair,
    signingAlgorithm: { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' } as Algorithm,
  })
})

describe('hex', () => {
  it('formats bytes as uppercase hex joined by a separator', () => {
    const buf = new Uint8Array([0x00, 0x0f, 0xab, 0xff]).buffer
    expect(hex(buf)).toBe('00:0F:AB:FF')
    expect(hex(buf, '')).toBe('000FABFF')
  })

  it('returns an empty string for an empty buffer', () => {
    expect(hex(new ArrayBuffer(0))).toBe('')
  })
})

describe('parseCertificateInput', () => {
  it('returns an empty string for blank input', () => {
    expect(parseCertificateInput('  \n')).toBe('')
  })

  it('passes PEM text through (trimmed)', () => {
    const pem = ecCert.toString('pem')
    expect(parseCertificateInput(`\n${pem}\n\n`)).toBe(pem)
  })

  it('decodes bare Base64 into the DER bytes', () => {
    const out = parseCertificateInput(toB64(ecCert.rawData))
    expect(out).toBeInstanceOf(ArrayBuffer)
    expect(new Uint8Array(out as ArrayBuffer)).toEqual(ecDer)
  })

  it('throws on text that is neither PEM nor Base64', () => {
    expect(() => parseCertificateInput('hello world!')).toThrow()
  })
})

describe('isCertificateFile', () => {
  it('matches certificate extensions case-insensitively', () => {
    expect(isCertificateFile('server.CRT', '')).toBe(true)
    expect(isCertificateFile('a.cer', '')).toBe(true)
    expect(isCertificateFile('a.der', '')).toBe(true)
    expect(isCertificateFile('a.p7b', '')).toBe(true)
  })

  it('matches certificate MIME types', () => {
    expect(isCertificateFile('blob', 'application/x-x509-ca-cert')).toBe(true)
    expect(isCertificateFile('blob', 'application/pkix-cert')).toBe(true)
  })

  it('ignores other files', () => {
    expect(isCertificateFile('cert.pem', 'application/x-pem-file')).toBe(false)
    expect(isCertificateFile('notes.txt', 'text/plain')).toBe(false)
  })
})

describe('readCertificate', () => {
  it('reads the basic fields of an EC certificate', async () => {
    const info = await readCertificate(ecCert.toString('pem'), NOT_BEFORE.getTime())
    expect(info.subject).toBe('CN=Dev Test, O=Dev')
    expect(info.issuer).toBe('CN=Dev Test, O=Dev')
    expect(info.serial).toBe('01AB')
    expect(info.notBefore.toISOString()).toBe('2025-01-01T00:00:00.000Z')
    expect(info.notAfter.toISOString()).toBe('2026-01-01T00:00:00.000Z')
    expect(info.signatureAlgorithm).toBe('ECDSA / SHA-256')
    expect(info.publicKey).toBe('ECDSA P-256')
    expect(info.pem).toBe(ecCert.toString('pem'))
  })

  it('computes thumbprints over the DER encoding', async () => {
    const info = await readCertificate(ecCert.toString('pem'))
    const sha1 = createHash('sha1').update(ecDer).digest('hex').toUpperCase()
    const sha256 = createHash('sha256').update(ecDer).digest('hex').toUpperCase()
    expect(info.sha1.replace(/:/g, '')).toBe(sha1)
    expect(info.sha256.replace(/:/g, '')).toBe(sha256)
    expect(info.sha256).toMatch(/^([0-9A-F]{2}:){31}[0-9A-F]{2}$/)
  })

  it('describes the extensions', async () => {
    const info = await readCertificate(ecCert.toString('pem'))
    expect(info.extensions).toEqual([
      { critical: true, kind: 'basicConstraints', ca: true, pathLength: 2 },
      { critical: true, kind: 'keyUsage', flags: ['digitalSignature', 'keyCertSign'] },
      { critical: false, kind: 'extKeyUsage', usages: ['1.3.6.1.5.5.7.3.1'] },
      { critical: false, kind: 'san', names: ['dns=example.com', 'ip=127.0.0.1'] },
      { critical: false, kind: 'other', type: '2.5.29.14' },
    ])
  })

  it('reads RSA certificates and reports the key size', async () => {
    const info = await readCertificate(rsaCert.toString('pem'))
    expect(info.subject).toBe('CN=RSA Test')
    expect(info.serial).toBe('7F')
    expect(info.signatureAlgorithm).toBe('RSASSA-PKCS1-v1_5 / SHA-256')
    expect(info.publicKey).toBe('RSASSA-PKCS1-v1_5 2048 bit')
    expect(info.extensions).toEqual([])
  })

  it('gives the same result for PEM, Base64 DER and binary DER', async () => {
    const now = NOT_BEFORE.getTime()
    const fromPem = await readCertificate(ecCert.toString('pem'), now)
    const fromB64 = await readCertificate(parseCertificateInput(toB64(ecCert.rawData)), now)
    const fromBin = await readCertificate(ecCert.rawData, now)
    expect(fromB64).toEqual(fromPem)
    expect(fromBin).toEqual(fromPem)
  })

  it('counts whole days left until expiry', async () => {
    const pem = ecCert.toString('pem')
    expect((await readCertificate(pem, NOT_AFTER.getTime() - 10 * DAY)).daysLeft).toBe(10)
    expect((await readCertificate(pem, NOT_AFTER.getTime() - 10 * DAY + 1)).daysLeft).toBe(9)
    expect((await readCertificate(pem, NOT_AFTER.getTime() + 1)).daysLeft).toBe(-1)
  })

  it('throws on invalid input', async () => {
    await expect(readCertificate('-----BEGIN CERTIFICATE-----\nAAAA\n-----END CERTIFICATE-----')).rejects.toThrow()
    await expect(readCertificate(new Uint8Array([1, 2, 3]).buffer)).rejects.toThrow()
    await expect(readCertificate('')).rejects.toThrow()
  })
})

describe('formatCertificate', () => {
  const label = (k: string) => `<${k}>`

  it('renders the report with labels, validity and extensions', async () => {
    const info = await readCertificate(ecCert.toString('pem'), NOT_AFTER.getTime() - 30 * DAY)
    const lines = formatCertificate(info, label).split('\n')
    expect(lines.slice(0, 9)).toEqual([
      '<subject>:   CN=Dev Test, O=Dev',
      '<issuer>:    CN=Dev Test, O=Dev',
      '<serial>:    01AB',
      '<notBefore>: 2025-01-01T00:00:00.000Z',
      '<notAfter>:  2026-01-01T00:00:00.000Z  (<validFor> 30 <days>)',
      '<sigAlg>:    ECDSA / SHA-256',
      '<pubKey>:    ECDSA P-256',
      `<thumbprint> SHA-1:   ${info.sha1}`,
      `<thumbprint> SHA-256: ${info.sha256}`,
    ])
    expect(lines.slice(9, 16)).toEqual([
      '',
      '<extensions> (5):',
      '  - <basicConstraints> [<critical>]: <ca>=true, pathLen=2',
      '  - <keyUsage> [<critical>]: digitalSignature, keyCertSign',
      '  - <extKeyUsage>: 1.3.6.1.5.5.7.3.1',
      '  - <san>: dns=example.com, ip=127.0.0.1',
      '  - 2.5.29.14',
    ])
    expect(lines.slice(16).join('\n')).toBe(`\n${info.pem}`)
  })

  it('marks expired certificates and omits the extension section when there is none', async () => {
    const info = await readCertificate(rsaCert.toString('pem'), NOT_AFTER.getTime() + DAY)
    const text = formatCertificate(info, label)
    expect(text).toContain('<notAfter>:  2026-01-01T00:00:00.000Z  (<expired>)')
    expect(text).not.toContain('<extensions>')
    expect(text.endsWith(`<thumbprint> SHA-256: ${info.sha256}\n\n${info.pem}`)).toBe(true)
  })

  it('omits pathLen when the basic constraints have none', () => {
    const text = formatCertificate(
      {
        subject: 'CN=a',
        issuer: 'CN=a',
        serial: '01',
        notBefore: NOT_BEFORE,
        notAfter: NOT_AFTER,
        daysLeft: 0,
        signatureAlgorithm: 'x',
        publicKey: 'y',
        sha1: '',
        sha256: '',
        extensions: [{ critical: false, kind: 'basicConstraints', ca: false }],
        pem: 'PEM',
      },
      label,
    )
    expect(text).toContain('  - <basicConstraints>: <ca>=false\n')
    expect(text).toContain('(<validFor> 0 <days>)')
  })
})
