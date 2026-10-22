import { v1 as uuidv1, v4 as uuidv4, v7 as uuidv7 } from 'uuid'

export type UuidVersion = 1 | 4 | 7

export interface UuidOptions {
  version: UuidVersion
  hyphens: boolean
  uppercase: boolean
}

export function generateUuid(o: UuidOptions): string {
  let id = o.version === 1 ? uuidv1() : o.version === 7 ? uuidv7() : uuidv4()
  if (!o.hyphens) id = id.replace(/-/g, '')
  if (o.uppercase) id = id.toUpperCase()
  return id
}

export function generateUuids(o: UuidOptions, count: number): string[] {
  return Array.from({ length: count }, () => generateUuid(o))
}
