import { createCRC32, createHMAC, createMD5, createSHA1, createSHA256, createSHA384, createSHA512 } from 'hash-wasm'
import type { IHasher } from 'hash-wasm/dist/lib/WASMInterface'

export const HASH_ALGOS = ['MD5', 'SHA1', 'SHA256', 'SHA384', 'SHA512', 'CRC32'] as const
export type HashAlgo = (typeof HASH_ALGOS)[number]
export type HashResult = Record<HashAlgo, string>

/** Algorithms that are keyed when HMAC is enabled; CRC32 is always a plain checksum. */
const DIGESTS = ['MD5', 'SHA1', 'SHA256', 'SHA384', 'SHA512'] as const

const creators: Record<(typeof DIGESTS)[number], () => Promise<IHasher>> = {
  MD5: createMD5,
  SHA1: createSHA1,
  SHA256: createSHA256,
  SHA384: createSHA384,
  SHA512: createSHA512,
}

export function emptyHashes(): HashResult {
  return { MD5: '', SHA1: '', SHA256: '', SHA384: '', SHA512: '', CRC32: '' }
}

/** Feeds every chunk to all hashers; `hmacKey === null` disables HMAC. Digests are lowercase hex. */
export async function hashChunks(chunks: Iterable<Uint8Array | string> | AsyncIterable<Uint8Array | string>, hmacKey: string | null): Promise<HashResult> {
  const digests = await Promise.all(DIGESTS.map((a) => (hmacKey === null ? creators[a]() : createHMAC(creators[a](), hmacKey))))
  const crc = await createCRC32()
  const hashers = [...digests, crc]
  hashers.forEach((h) => h.init())
  for await (const chunk of chunks) hashers.forEach((h) => h.update(chunk))
  const out = emptyHashes()
  DIGESTS.forEach((a, i) => (out[a] = digests[i]!.digest()))
  out.CRC32 = crc.digest()
  return out
}

export function hashText(text: string, hmacKey: string | null): Promise<HashResult> {
  return hashChunks([text], hmacKey)
}

/** Hashes a file/blob in 4 MiB slices so large files never sit in memory at once. */
export function hashBlob(blob: Blob, hmacKey: string | null, chunkSize = 4 * 1024 * 1024): Promise<HashResult> {
  async function* slices() {
    for (let off = 0; off < blob.size; off += chunkSize) yield new Uint8Array(await blob.slice(off, off + chunkSize).arrayBuffer())
  }
  return hashChunks(slices(), hmacKey)
}

/** True when `candidate` (case-insensitive, trimmed) equals any of the computed hashes. */
export function matchesAnyHash(hashes: HashResult, candidate: string): boolean {
  const v = candidate.trim().toLowerCase()
  return !!v && HASH_ALGOS.some((a) => hashes[a].toLowerCase() === v)
}
