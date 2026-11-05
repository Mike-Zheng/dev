import { describe, expect, it } from 'vitest'
import {
  SAMPLES,
  baseName,
  bounds,
  compact,
  parseModel,
  parseObj,
  parseStl,
  rotateMesh,
  sampleMesh,
  simplifyMesh,
  targetTriangles,
  toObj,
  toStl,
  triangleCount,
  vertexCount,
  weld,
  type Mesh,
  type ParseResult,
} from './lowPoly'

// Unit cube: 8 vertices, 12 triangles, outward winding.
const CUBE: Mesh = {
  positions: new Float32Array([0, 0, 0, 1, 0, 0, 1, 1, 0, 0, 1, 0, 0, 0, 1, 1, 0, 1, 1, 1, 1, 0, 1, 1]),
  indices: new Uint32Array([
    0, 2, 1, 0, 3, 2, 4, 5, 6, 4, 6, 7, 0, 1, 5, 0, 5, 4, 1, 2, 6, 1, 6, 5, 2, 3, 7, 2, 7, 6, 3, 0, 4, 3, 4, 7,
  ]),
}

function mesh(r: ParseResult): Mesh {
  if ('error' in r) throw new Error(r.error)
  return r.mesh
}

describe('weld', () => {
  it('merges shared vertices and drops degenerate triangles', () => {
    const soup = [0, 0, 0, 1, 0, 0, 0, 1, 0, /**/ 1, 0, 0, 1, 1, 0, 0, 1, 0, /**/ 0, 0, 0, 0, 0, 0, 1, 1, 1]
    const m = weld(soup)
    expect(vertexCount(m)).toBe(4)
    expect(triangleCount(m)).toBe(2)
    expect(Array.from(m.indices)).toEqual([0, 1, 2, 1, 3, 2])
  })
})

describe('STL', () => {
  it('round-trips binary STL', () => {
    const m = mesh(parseStl(toStl(CUBE)))
    expect(triangleCount(m)).toBe(12)
    expect(vertexCount(m)).toBe(8)
    expect(bounds(m)).toEqual([0, 0, 0, 1, 1, 1])
  })

  it('writes face normals', () => {
    const buf = toStl({ positions: new Float32Array([0, 0, 0, 1, 0, 0, 0, 1, 0]), indices: new Uint32Array([0, 1, 2]) })
    const view = new DataView(buf)
    expect(buf.byteLength).toBe(134)
    expect([0, 4, 8].map((o) => view.getFloat32(84 + o, true))).toEqual([0, 0, 1])
  })

  it('parses ASCII STL', () => {
    const text = `solid t
facet normal 0 0 1
 outer loop
  vertex 0 0 0
  vertex 1.5e0 0 0
  vertex 0 -1 0
 endloop
endfacet
endsolid t`
    const m = mesh(parseStl(new TextEncoder().encode(text).buffer))
    expect(triangleCount(m)).toBe(1)
    expect(Array.from(m.positions)).toEqual([0, 0, 0, 1.5, 0, 0, 0, -1, 0])
  })

  it('reports invalid and empty files', () => {
    expect(parseStl(new TextEncoder().encode('hello').buffer)).toEqual({ error: 'invalid' })
    expect(parseStl(new TextEncoder().encode('solid x\nendsolid x').buffer)).toEqual({ error: 'invalid' })
    const empty = new ArrayBuffer(84)
    expect(parseStl(empty)).toEqual({ error: 'empty' })
  })
})

describe('OBJ', () => {
  it('round-trips OBJ', () => {
    const m = mesh(parseObj(toObj(CUBE)))
    expect(triangleCount(m)).toBe(12)
    expect(vertexCount(m)).toBe(8)
  })

  it('triangulates polygons and supports v/vt/vn and negative indices', () => {
    const m = mesh(parseObj('v 0 0 0\nv 1 0 0\nv 1 1 0\nv 0 1 0\nf 1/1/1 2/2/1 3/3/1 4/4/1\nf -4 -2 -1'))
    expect(triangleCount(m)).toBe(3)
  })

  it('rejects out-of-range faces', () => {
    expect(parseObj('v 0 0 0\nf 1 2 3')).toEqual({ error: 'invalid' })
    expect(parseObj('nothing here')).toEqual({ error: 'invalid' })
  })
})

describe('parseModel', () => {
  it('dispatches by extension', () => {
    expect(triangleCount(mesh(parseModel('a.STL', toStl(CUBE))))).toBe(12)
    expect(triangleCount(mesh(parseModel('a.obj', new TextEncoder().encode(toObj(CUBE)).buffer)))).toBe(12)
    expect(parseModel('a.ply', new ArrayBuffer(0))).toEqual({ error: 'unsupported' })
  })
})

describe('rotateMesh', () => {
  it('rotates a quarter turn around each axis', () => {
    const p: Mesh = { positions: new Float32Array([1, 2, 3]), indices: new Uint32Array() }
    expect(Array.from(rotateMesh(p, 'x').positions)).toEqual([1, -3, 2])
    expect(Array.from(rotateMesh(p, 'y').positions)).toEqual([3, 2, -1])
    expect(Array.from(rotateMesh(p, 'z').positions)).toEqual([-2, 1, 3])
    expect(Array.from(rotateMesh(rotateMesh(rotateMesh(rotateMesh(p, 'z'), 'z'), 'z'), 'z').positions)).toEqual([1, 2, 3])
  })
})

describe('simplify', () => {
  it('computes the target triangle count', () => {
    expect(targetTriangles(1000, 25)).toBe(750)
    expect(targetTriangles(1000, 100)).toBe(1)
    expect(targetTriangles(1000, -5)).toBe(1000)
  })

  it('reduces the triangle count close to the target', async () => {
    const src = sampleMesh('rock')
    const out = await simplifyMesh(src, 90)
    const target = targetTriangles(triangleCount(src), 90)
    expect(triangleCount(out)).toBeLessThanOrEqual(target)
    expect(triangleCount(out)).toBeGreaterThan(target * 0.8)
    expect(out.indices.reduce((a, b) => Math.max(a, b), 0)).toBe(vertexCount(out) - 1)
  })

  it('keeps open borders when asked', async () => {
    const src = sampleMesh('terrain')
    const b = bounds(src)
    const out = await simplifyMesh(src, 95, { lockBorder: true })
    expect(triangleCount(out)).toBeLessThan(triangleCount(src))
    expect(bounds(out)[0]).toBeCloseTo(b[0])
    expect(bounds(out)[4]).toBeCloseTo(b[4])
  })

  it('returns a copy when nothing is removed', async () => {
    const out = await simplifyMesh(CUBE, 0)
    expect(triangleCount(out)).toBe(12)
    expect(out.indices).not.toBe(CUBE.indices)
  })
})

describe('compact', () => {
  it('drops unused vertices', () => {
    const m = compact({ positions: new Float32Array([9, 9, 9, 0, 0, 0, 1, 0, 0, 0, 1, 0]), indices: new Uint32Array([1, 2, 3]) })
    expect(Array.from(m.indices)).toEqual([0, 1, 2])
    expect(vertexCount(m)).toBe(3)
  })
})

describe('samples', () => {
  it.each(SAMPLES)('%s builds a valid mesh', (id) => {
    const m = sampleMesh(id)
    expect(triangleCount(m)).toBeGreaterThan(5000)
    expect(m.indices.reduce((a, b) => Math.max(a, b), 0)).toBeLessThan(vertexCount(m))
    expect(m.positions.every(Number.isFinite)).toBe(true)
  })
})

describe('baseName', () => {
  it('strips the extension', () => {
    expect(baseName('bunny.stl')).toBe('bunny')
    expect(baseName('.stl')).toBe('model')
  })
})
