import { MeshoptSimplifier } from 'meshoptimizer/simplifier'

/** An indexed triangle mesh: xyz per vertex, three vertex indices per triangle. */
export interface Mesh {
  positions: Float32Array
  indices: Uint32Array
}

export type LowPolyError = 'unsupported' | 'invalid' | 'empty'
export type ParseResult = { mesh: Mesh } | { error: LowPolyError }

export type Axis = 'x' | 'y' | 'z'

export const triangleCount = (m: Mesh) => m.indices.length / 3
export const vertexCount = (m: Mesh) => m.positions.length / 3

/** Axis-aligned bounding box as [minX, minY, minZ, maxX, maxY, maxZ]. */
export function bounds(m: Mesh): [number, number, number, number, number, number] {
  const p = m.positions
  if (!p.length) return [0, 0, 0, 0, 0, 0]
  const b: [number, number, number, number, number, number] = [Infinity, Infinity, Infinity, -Infinity, -Infinity, -Infinity]
  for (let i = 0; i < p.length; i += 3) {
    for (let k = 0; k < 3; k++) {
      const v = p[i + k]!
      if (v < b[k]!) b[k] = v
      if (v > b[k + 3]!) b[k + 3] = v
    }
  }
  return b
}

/**
 * Merge coincident vertices of a triangle soup (9 floats per triangle) into an indexed mesh,
 * dropping triangles that collapse to a line or point. Vertices closer than `tolerance`
 * (relative to the bounding-box diagonal) are treated as the same vertex.
 */
export function weld(soup: ArrayLike<number>, tolerance = 1e-6): Mesh {
  const n = Math.floor(soup.length / 9) * 9
  const lo = [Infinity, Infinity, Infinity]
  const hi = [-Infinity, -Infinity, -Infinity]
  for (let i = 0; i < n; i++) {
    const v = soup[i]!
    if (!Number.isFinite(v)) continue
    if (v < lo[i % 3]!) lo[i % 3] = v
    if (v > hi[i % 3]!) hi[i % 3] = v
  }
  const diag = n ? Math.hypot(hi[0]! - lo[0]!, hi[1]! - lo[1]!, hi[2]! - lo[2]!) || 0 : 0
  const q = diag > 0 ? 1 / (diag * tolerance) : 1
  const map = new Map<string, number>()
  const pos: number[] = []
  const idx: number[] = []
  const keys = ['', '', '']
  outer: for (let i = 0; i < n; i += 9) {
    for (let v = 0; v < 3; v++) {
      const x = soup[i + v * 3]!
      const y = soup[i + v * 3 + 1]!
      const z = soup[i + v * 3 + 2]!
      if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(z)) continue outer
      keys[v] = `${Math.round(x * q)},${Math.round(y * q)},${Math.round(z * q)}`
    }
    if (keys[0] === keys[1] || keys[1] === keys[2] || keys[0] === keys[2]) continue
    for (let v = 0; v < 3; v++) {
      let id = map.get(keys[v]!)
      if (id === undefined) {
        id = pos.length / 3
        map.set(keys[v]!, id)
        pos.push(soup[i + v * 3]!, soup[i + v * 3 + 1]!, soup[i + v * 3 + 2]!)
      }
      idx.push(id)
    }
  }
  return { positions: new Float32Array(pos), indices: new Uint32Array(idx) }
}

/** Expand an indexed mesh back into a triangle soup. */
function toSoup(m: Mesh): Float32Array {
  const out = new Float32Array(m.indices.length * 3)
  for (let i = 0; i < m.indices.length; i++) {
    const v = m.indices[i]! * 3
    out[i * 3] = m.positions[v]!
    out[i * 3 + 1] = m.positions[v + 1]!
    out[i * 3 + 2] = m.positions[v + 2]!
  }
  return out
}

function isBinaryStl(buf: ArrayBuffer): boolean {
  if (buf.byteLength < 84) return false
  const count = new DataView(buf).getUint32(80, true)
  return 84 + count * 50 === buf.byteLength
}

/** Parse a binary or ASCII STL file. */
export function parseStl(buf: ArrayBuffer): ParseResult {
  let soup: Float32Array | number[]
  if (isBinaryStl(buf)) {
    const view = new DataView(buf)
    const count = view.getUint32(80, true)
    soup = new Float32Array(count * 9)
    for (let t = 0; t < count; t++) {
      const base = 84 + t * 50 + 12 // skip the facet normal
      for (let k = 0; k < 9; k++) soup[t * 9 + k] = view.getFloat32(base + k * 4, true)
    }
  } else {
    const text = new TextDecoder().decode(buf)
    if (!/^\s*solid/i.test(text) && !/vertex/i.test(text)) return { error: 'invalid' }
    soup = []
    const num = '([-+]?(?:\\d+\\.?\\d*|\\.\\d+)(?:[eE][-+]?\\d+)?)'
    const re = new RegExp(`vertex\\s+${num}\\s+${num}\\s+${num}`, 'gi')
    for (const m of text.matchAll(re)) soup.push(Number(m[1]), Number(m[2]), Number(m[3]))
    if (!soup.length) return { error: /facet/i.test(text) ? 'empty' : 'invalid' }
  }
  const mesh = weld(soup)
  return mesh.indices.length ? { mesh } : { error: 'empty' }
}

/** Parse the geometry (`v` and `f` records) of a Wavefront OBJ file; polygons are fan-triangulated. */
export function parseObj(text: string): ParseResult {
  const verts: number[] = []
  const soup: number[] = []
  let sawFace = false
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim()
    if (line.startsWith('v ') || line.startsWith('v\t')) {
      const [, x, y, z] = line.split(/\s+/)
      verts.push(Number(x), Number(y), Number(z))
    } else if (line.startsWith('f ') || line.startsWith('f\t')) {
      sawFace = true
      const count = verts.length / 3
      const ids = line
        .split(/\s+/)
        .slice(1)
        .map((tok) => {
          const i = parseInt(tok.split('/')[0] ?? '', 10)
          return i < 0 ? count + i : i - 1
        })
      if (ids.some((i) => !Number.isInteger(i) || i < 0 || i >= count)) return { error: 'invalid' }
      for (let k = 1; k + 1 < ids.length; k++) {
        for (const i of [ids[0]!, ids[k]!, ids[k + 1]!]) soup.push(verts[i * 3]!, verts[i * 3 + 1]!, verts[i * 3 + 2]!)
      }
    }
  }
  if (!soup.length) return { error: sawFace || verts.length ? 'empty' : 'invalid' }
  const mesh = weld(soup)
  return mesh.indices.length ? { mesh } : { error: 'empty' }
}

/** Pick a parser from the file name. */
export function parseModel(fileName: string, buf: ArrayBuffer): ParseResult {
  const ext = fileName.toLowerCase().split('.').pop()
  if (ext === 'stl') return parseStl(buf)
  if (ext === 'obj') return parseObj(new TextDecoder().decode(buf))
  return { error: 'unsupported' }
}

/** Rotate every vertex by `degrees` around the given axis (right-handed). */
export function rotateMesh(m: Mesh, axis: Axis, degrees = 90): Mesh {
  const r = (degrees * Math.PI) / 180
  // Snap exact quarter turns so repeated rotation doesn't accumulate float noise.
  const snap = (v: number) => (Math.abs(v) < 1e-12 ? 0 : Math.abs(Math.abs(v) - 1) < 1e-12 ? Math.sign(v) : v)
  const c = snap(Math.cos(r))
  const s = snap(Math.sin(r))
  const [a, b] = axis === 'x' ? [1, 2] : axis === 'y' ? [2, 0] : [0, 1]
  const out = new Float32Array(m.positions)
  for (let i = 0; i < out.length; i += 3) {
    const u = out[i + a]!
    const v = out[i + b]!
    out[i + a] = u * c - v * s
    out[i + b] = u * s + v * c
  }
  return { positions: out, indices: m.indices }
}

export interface SimplifyOptions {
  /** Keep the vertices on open edges (holes, outlines) in place. */
  lockBorder?: boolean
}

/** Triangle count left after removing `reduction` percent of the triangles. */
export function targetTriangles(total: number, reduction: number): number {
  const pct = Math.min(100, Math.max(0, reduction))
  return Math.max(1, Math.round(total * (1 - pct / 100)))
}

/**
 * Remove `reduction` percent (0–100) of the triangles with quadric edge-collapse decimation
 * (meshoptimizer), then drop vertices no longer referenced.
 */
export async function simplifyMesh(m: Mesh, reduction: number, opts: SimplifyOptions = {}): Promise<Mesh> {
  const target = targetTriangles(triangleCount(m), reduction)
  if (target >= triangleCount(m)) return { positions: new Float32Array(m.positions), indices: new Uint32Array(m.indices) }
  await MeshoptSimplifier.ready
  const flags: 'LockBorder'[] = opts.lockBorder ? ['LockBorder'] : []
  // A target error of 1 (the whole model) lets the simplifier keep collapsing until the triangle target is met.
  let [indices] = MeshoptSimplifier.simplify(m.indices, m.positions, 3, target * 3, 1, flags)
  // Locked borders can stop the quality simplifier early; fall back to the sloppy one for the rest.
  if (indices.length / 3 > target * 1.02 && !opts.lockBorder) {
    ;[indices] = MeshoptSimplifier.simplifySloppy(indices, m.positions, 3, null, target * 3, 1)
  }
  return compact({ positions: m.positions, indices })
}

/** Drop unreferenced vertices and renumber indices. */
export function compact(m: Mesh): Mesh {
  const remap = new Int32Array(m.positions.length / 3).fill(-1)
  const pos: number[] = []
  const idx = new Uint32Array(m.indices.length)
  for (let i = 0; i < m.indices.length; i++) {
    const v = m.indices[i]!
    if (remap[v] === -1) {
      remap[v] = pos.length / 3
      pos.push(m.positions[v * 3]!, m.positions[v * 3 + 1]!, m.positions[v * 3 + 2]!)
    }
    idx[i] = remap[v]!
  }
  return { positions: new Float32Array(pos), indices: idx }
}

function faceNormal(p: ArrayLike<number>, o: number): [number, number, number] {
  const ux = p[o + 3]! - p[o]!
  const uy = p[o + 4]! - p[o + 1]!
  const uz = p[o + 5]! - p[o + 2]!
  const vx = p[o + 6]! - p[o]!
  const vy = p[o + 7]! - p[o + 1]!
  const vz = p[o + 8]! - p[o + 2]!
  const nx = uy * vz - uz * vy
  const ny = uz * vx - ux * vz
  const nz = ux * vy - uy * vx
  const len = Math.hypot(nx, ny, nz) || 1
  return [nx / len, ny / len, nz / len]
}

/** Encode as a binary STL. */
export function toStl(m: Mesh, header = 'dev low poly'): ArrayBuffer {
  const soup = toSoup(m)
  const count = soup.length / 9
  const buf = new ArrayBuffer(84 + count * 50)
  const view = new DataView(buf)
  const head = new TextEncoder().encode(header).slice(0, 80)
  new Uint8Array(buf, 0, head.length).set(head)
  view.setUint32(80, count, true)
  for (let t = 0; t < count; t++) {
    const o = 84 + t * 50
    const n = faceNormal(soup, t * 9)
    for (let k = 0; k < 3; k++) view.setFloat32(o + k * 4, n[k]!, true)
    for (let k = 0; k < 9; k++) view.setFloat32(o + 12 + k * 4, soup[t * 9 + k]!, true)
  }
  return buf
}

const fmt = (v: number) => String(Math.round(v * 1e6) / 1e6)

/** Encode as a Wavefront OBJ (geometry only). */
export function toObj(m: Mesh, comment = 'dev low poly'): string {
  const lines = [`# ${comment}`, `# ${vertexCount(m)} vertices, ${triangleCount(m)} triangles`]
  const p = m.positions
  for (let i = 0; i < p.length; i += 3) lines.push(`v ${fmt(p[i]!)} ${fmt(p[i + 1]!)} ${fmt(p[i + 2]!)}`)
  const ix = m.indices
  for (let i = 0; i < ix.length; i += 3) lines.push(`f ${ix[i]! + 1} ${ix[i + 1]! + 1} ${ix[i + 2]! + 1}`)
  return lines.join('\n') + '\n'
}

/** File name without extension, safe for downloads. */
export function baseName(name: string): string {
  const stem = name.replace(/\.[^.]+$/, '').trim()
  return stem || 'model'
}

// ---------------------------------------------------------------------------
// Sample models (procedural, Z-up)
// ---------------------------------------------------------------------------

export const SAMPLES = ['torusKnot', 'rock', 'terrain', 'vase'] as const
export type SampleId = (typeof SAMPLES)[number]

type Vec3 = [number, number, number]

/** Grid over (u, v) ∈ [0,1]², optionally wrapping in either direction, triangulated and welded. */
function parametric(fn: (u: number, v: number) => Vec3, segU: number, segV: number, wrapU: boolean, wrapV: boolean): Mesh {
  const cols = wrapU ? segU : segU + 1
  const rows = wrapV ? segV : segV + 1
  const pos = new Float32Array(cols * rows * 3)
  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < cols; i++) {
      const p = fn(i / segU, j / segV)
      pos.set(p, (j * cols + i) * 3)
    }
  }
  const at = (i: number, j: number) => (j % rows) * cols + (i % cols)
  const idx: number[] = []
  for (let j = 0; j < segV; j++) {
    for (let i = 0; i < segU; i++) {
      const a = at(i, j)
      const b = at(i + 1, j)
      const c = at(i + 1, j + 1)
      const d = at(i, j + 1)
      idx.push(a, b, c, a, c, d)
    }
  }
  return weld(toSoup({ positions: pos, indices: new Uint32Array(idx) }))
}

/** Deterministic smooth 3D noise: a sum of seeded plane waves. */
function waves(seed: number, octaves: number) {
  let s = seed >>> 0
  const rnd = () => {
    s = (s + 0x6d2b79f5) >>> 0
    let t = Math.imul(s ^ (s >>> 15), 1 | s)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
  const list = Array.from({ length: octaves * 4 }, (_, i) => {
    const f = 1.3 * 1.9 ** Math.floor(i / 4)
    const th = rnd() * Math.PI * 2
    const ph = Math.acos(rnd() * 2 - 1)
    return { d: [Math.sin(ph) * Math.cos(th) * f, Math.sin(ph) * Math.sin(th) * f, Math.cos(ph) * f], p: rnd() * Math.PI * 2, a: 1 / f }
  })
  return (x: number, y: number, z: number) => list.reduce((acc, w) => acc + w.a * Math.sin(w.d[0]! * x + w.d[1]! * y + w.d[2]! * z + w.p), 0)
}

function icosphere(level: number): Mesh {
  const t = (1 + Math.sqrt(5)) / 2
  let verts: Vec3[] = [
    [-1, t, 0], [1, t, 0], [-1, -t, 0], [1, -t, 0],
    [0, -1, t], [0, 1, t], [0, -1, -t], [0, 1, -t],
    [t, 0, -1], [t, 0, 1], [-t, 0, -1], [-t, 0, 1],
  ]
  let faces = [
    0, 11, 5, 0, 5, 1, 0, 1, 7, 0, 7, 10, 0, 10, 11, 1, 5, 9, 5, 11, 4, 11, 10, 2, 10, 7, 6, 7, 1, 8,
    3, 9, 4, 3, 4, 2, 3, 2, 6, 3, 6, 8, 3, 8, 9, 4, 9, 5, 2, 4, 11, 6, 2, 10, 8, 6, 7, 9, 8, 1,
  ]
  const norm = (v: Vec3): Vec3 => {
    const l = Math.hypot(...v)
    return [v[0] / l, v[1] / l, v[2] / l]
  }
  verts = verts.map(norm)
  for (let l = 0; l < level; l++) {
    const cache = new Map<string, number>()
    const mid = (a: number, b: number) => {
      const key = a < b ? `${a},${b}` : `${b},${a}`
      let id = cache.get(key)
      if (id === undefined) {
        const p = verts[a]!
        const q = verts[b]!
        id = verts.push(norm([(p[0] + q[0]) / 2, (p[1] + q[1]) / 2, (p[2] + q[2]) / 2])) - 1
        cache.set(key, id)
      }
      return id
    }
    const next: number[] = []
    for (let i = 0; i < faces.length; i += 3) {
      const [a, b, c] = [faces[i]!, faces[i + 1]!, faces[i + 2]!]
      const ab = mid(a, b)
      const bc = mid(b, c)
      const ca = mid(c, a)
      next.push(a, ab, ca, b, bc, ab, c, ca, bc, ab, bc, ca)
    }
    faces = next
  }
  return { positions: new Float32Array(verts.flat()), indices: new Uint32Array(faces) }
}

/** Build one of the bundled sample models. */
export function sampleMesh(id: SampleId): Mesh {
  switch (id) {
    case 'torusKnot': {
      const p = 2
      const q = 3
      const curve = (t: number): Vec3 => {
        const a = t * Math.PI * 2 * p
        const r = 2 + Math.cos((q / p) * a)
        return [r * Math.cos(a), r * Math.sin(a), Math.sin((q / p) * a)]
      }
      return parametric(
        (u, v) => {
          const c = curve(u)
          const n = curve(u + 1e-4)
          const T: Vec3 = [n[0] - c[0], n[1] - c[1], n[2] - c[2]]
          let N: Vec3 = [n[0] + c[0], n[1] + c[1], n[2] + c[2]]
          const B: Vec3 = [T[1] * N[2] - T[2] * N[1], T[2] * N[0] - T[0] * N[2], T[0] * N[1] - T[1] * N[0]]
          N = [B[1] * T[2] - B[2] * T[1], B[2] * T[0] - B[0] * T[2], B[0] * T[1] - B[1] * T[0]]
          const ln = Math.hypot(...N)
          const lb = Math.hypot(...B)
          const a = v * Math.PI * 2
          const r = 0.55
          const cx = Math.cos(a) * r
          const cy = Math.sin(a) * r
          return [c[0] + (cx * N[0]) / ln + (cy * B[0]) / lb, c[1] + (cx * N[1]) / ln + (cy * B[1]) / lb, c[2] + (cx * N[2]) / ln + (cy * B[2]) / lb]
        },
        400,
        48,
        true,
        true,
      )
    }
    case 'rock': {
      const sphere = icosphere(6)
      const noise = waves(7, 4)
      const p = sphere.positions
      for (let i = 0; i < p.length; i += 3) {
        const x = p[i]!
        const y = p[i + 1]!
        const z = p[i + 2]!
        const k = 1 + 0.18 * noise(x * 1.5, y * 1.5, z * 1.5)
        p[i] = x * k * 1.3
        p[i + 1] = y * k
        p[i + 2] = z * k * 0.85
      }
      return sphere
    }
    case 'terrain': {
      const noise = waves(42, 5)
      return parametric(
        (u, v) => {
          const x = (u - 0.5) * 8
          const y = (v - 0.5) * 8
          const falloff = Math.max(0, 1 - Math.hypot(x, y) / 6)
          return [x, y, (1.1 * noise(x * 0.45, y * 0.45, 0.3) + 0.6) * falloff + 0.2]
        },
        160,
        160,
        false,
        false,
      )
    }
    case 'vase': {
      return parametric(
        (u, v) => {
          const a = u * Math.PI * 2
          const h = v * 4
          const r = 1 + 0.45 * Math.sin(v * Math.PI * 1.6 + 0.4) - 0.35 * v + 0.06 * Math.cos(a * 8) * Math.sin(v * Math.PI)
          return [r * Math.cos(a), r * Math.sin(a), h]
        },
        256,
        96,
        true,
        false,
      )
    }
  }
}
