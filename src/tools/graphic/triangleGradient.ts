/**
 * Low-poly triangle gradient generator.
 *
 * Points are laid on a staggered (hexagonal) grid, jittered and lifted to a random height,
 * then split into triangles. Each triangle is filled with the background gradient colour
 * sampled near its centre, shaded by a fixed light according to the triangle's normal.
 */

export type Rgb = [number, number, number]
export type Point = [number, number]

export interface TriangleOptions {
  width: number
  height: number
  /** How far vertices drift from the regular grid, 0–100. */
  variance: number
  /** Grid spacing, 0–100 (maps to 30–330 px). */
  cellSize: number
  /** Random vertex height that drives the light / shadow relief, 0–100. */
  depth: number
  /** Random offset of the colour sampling point, 0–100. */
  dither: number
  /** Gradient stops, as #rgb or #rrggbb, laid along the top-left → bottom-right diagonal. */
  colors: string[]
  seed: number
}

export interface Triangle {
  points: [Point, Point, Point]
  color: Rgb
}

export const DEFAULT_OPTIONS: TriangleOptions = {
  width: 1440,
  height: 900,
  variance: 30,
  cellSize: 40,
  depth: 20,
  dither: 10,
  colors: [],
  seed: 0,
}

/** ColorBrewer sequential and diverging schemes. */
export const PALETTES: string[][] = [
  ['#ffffe5', '#f7fcb9', '#d9f0a3', '#addd8e', '#78c679', '#41ab5d', '#238443', '#006837', '#004529'],
  ['#ffffd9', '#edf8b1', '#c7e9b4', '#7fcdbb', '#41b6c4', '#1d91c0', '#225ea8', '#253494', '#081d58'],
  ['#f7fcf0', '#e0f3db', '#ccebc5', '#a8ddb5', '#7bccc4', '#4eb3d3', '#2b8cbe', '#0868ac', '#084081'],
  ['#f7fcfd', '#e5f5f9', '#ccece6', '#99d8c9', '#66c2a4', '#41ae76', '#238b45', '#006d2c', '#00441b'],
  ['#fff7fb', '#ece2f0', '#d0d1e6', '#a6bddb', '#67a9cf', '#3690c0', '#02818a', '#016c59', '#014636'],
  ['#fff7fb', '#ece7f2', '#d0d1e6', '#a6bddb', '#74a9cf', '#3690c0', '#0570b0', '#045a8d', '#023858'],
  ['#f7fcfd', '#e0ecf4', '#bfd3e6', '#9ebcda', '#8c96c6', '#8c6bb1', '#88419d', '#810f7c', '#4d004b'],
  ['#fff7f3', '#fde0dd', '#fcc5c0', '#fa9fb5', '#f768a1', '#dd3497', '#ae017e', '#7a0177', '#49006a'],
  ['#f7f4f9', '#e7e1ef', '#d4b9da', '#c994c7', '#df65b0', '#e7298a', '#ce1256', '#980043', '#67001f'],
  ['#fff7ec', '#fee8c8', '#fdd49e', '#fdbb84', '#fc8d59', '#ef6548', '#d7301f', '#b30000', '#7f0000'],
  ['#ffffcc', '#ffeda0', '#fed976', '#feb24c', '#fd8d3c', '#fc4e2a', '#e31a1c', '#bd0026', '#800026'],
  ['#ffffe5', '#fff7bc', '#fee391', '#fec44f', '#fe9929', '#ec7014', '#cc4c02', '#993404', '#662506'],
  ['#fcfbfd', '#efedf5', '#dadaeb', '#bcbddc', '#9e9ac8', '#807dba', '#6a51a3', '#54278f', '#3f007d'],
  ['#f7fbff', '#deebf7', '#c6dbef', '#9ecae1', '#6baed6', '#4292c6', '#2171b5', '#08519c', '#08306b'],
  ['#f7fcf5', '#e5f5e0', '#c7e9c0', '#a1d99b', '#74c476', '#41ab5d', '#238b45', '#006d2c', '#00441b'],
  ['#fff5eb', '#fee6ce', '#fdd0a2', '#fdae6b', '#fd8d3c', '#f16913', '#d94801', '#a63603', '#7f2704'],
  ['#fff5f0', '#fee0d2', '#fcbba1', '#fc9272', '#fb6a4a', '#ef3b2c', '#cb181d', '#a50f15', '#67000d'],
  ['#ffffff', '#f0f0f0', '#d9d9d9', '#bdbdbd', '#969696', '#737373', '#525252', '#252525', '#000000'],
  ['#7f3b08', '#b35806', '#e08214', '#fdb863', '#fee0b6', '#f7f7f7', '#d8daeb', '#b2abd2', '#8073ac', '#542788', '#2d004b'],
  ['#543005', '#8c510a', '#bf812d', '#dfc27d', '#f6e8c3', '#f5f5f5', '#c7eae5', '#80cdc1', '#35978f', '#01665e', '#003c30'],
  ['#40004b', '#762a83', '#9970ab', '#c2a5cf', '#e7d4e8', '#f7f7f7', '#d9f0d3', '#a6dba0', '#5aae61', '#1b7837', '#00441b'],
  ['#8e0152', '#c51b7d', '#de77ae', '#f1b6da', '#fde0ef', '#f7f7f7', '#e6f5d0', '#b8e186', '#7fbc41', '#4d9221', '#276419'],
  ['#67001f', '#b2182b', '#d6604d', '#f4a582', '#fddbc7', '#f7f7f7', '#d1e5f0', '#92c5de', '#4393c3', '#2166ac', '#053061'],
  ['#67001f', '#b2182b', '#d6604d', '#f4a582', '#fddbc7', '#ffffff', '#e0e0e0', '#bababa', '#878787', '#4d4d4d', '#1a1a1a'],
  ['#a50026', '#d73027', '#f46d43', '#fdae61', '#fee090', '#ffffbf', '#e0f3f8', '#abd9e9', '#74add1', '#4575b4', '#313695'],
  ['#9e0142', '#d53e4f', '#f46d43', '#fdae61', '#fee08b', '#ffffbf', '#e6f598', '#abdda4', '#66c2a5', '#3288bd', '#5e4fa2'],
  ['#a50026', '#d73027', '#f46d43', '#fdae61', '#fee08b', '#ffffbf', '#d9ef8b', '#a6d96a', '#66bd63', '#1a9850', '#006837'],
]

/** Park–Miller minimal standard generator, so a seed always reproduces the same pattern. */
export function createRandom(seed: number): () => number {
  let s = Math.floor(seed) % 0x7fffffff
  if (s <= 0) s += 0x7ffffffe
  return () => {
    s = (16807 * s) % 0x7fffffff
    return (s - 1) / 0x7ffffffe
  }
}

export function parseHex(color: string): Rgb | null {
  const m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(color.trim())
  if (!m) return null
  const h = m[1]!.length === 3 ? [...m[1]!].map((c) => c + c).join('') : m[1]!
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)) as Rgb
}

export function toHex([r, g, b]: Rgb): string {
  return `#${[r, g, b].map((v) => Math.round(Math.min(255, Math.max(0, v))).toString(16).padStart(2, '0')).join('')}`
}

/** Grid spacing in pixels for a 0–100 cell size setting. */
export function cellPixels(cellSize: number): number {
  return 3 * cellSize + 30
}

/**
 * Background colour (0–255 channels) at a pixel: the colours spread along the diagonal,
 * multiplied by a top-to-bottom white → #ccc fade.
 */
export function backgroundAt(x: number, y: number, width: number, height: number, stops: Rgb[]): Rgb {
  if (!stops.length) return [0, 0, 0]
  let c: Rgb = stops[0]!
  if (stops.length > 1) {
    const t = Math.min(1, Math.max(0, (x * width + y * height) / (width * width + height * height)))
    const pos = t * (stops.length - 1)
    const i = Math.min(stops.length - 2, Math.floor(pos))
    const f = pos - i
    const a = stops[i]!
    const b = stops[i + 1]!
    c = [0, 1, 2].map((k) => a[k]! + (b[k]! - a[k]!) * f) as Rgb
  }
  const fade = 1 - (51 / 255) * (y / height)
  return c.map((v) => v * fade) as Rgb
}

const LIGHT = (() => {
  const v = [0.5, 0.5, 1.5]
  const len = Math.hypot(...v)
  return v.map((n) => n / len)
})()

/** Shades a base colour by how much a triangle with the given unit normal faces the light. */
export function shade(base: Rgb, normal: [number, number, number]): Rgb {
  const facing = (LIGHT[0]! * normal[0] + LIGHT[1]! * normal[1] + LIGHT[2]! * normal[2] + 1) / 2
  const dim = Math.min(1.1 * facing, 1)
  const highlight = Math.max(1 - 1.5 * facing, 0)
  return base.map((v) => 255 * (1 - (1 - v / 255) * (1 - highlight)) * dim) as Rgb
}

type Vertex = [number, number, number]

function normalOf(a: Vertex, b: Vertex, c: Vertex): [number, number, number] {
  const u = [b[0] - a[0], b[1] - a[1], b[2] - a[2]]
  const v = [c[0] - a[0], c[1] - a[1], c[2] - a[2]]
  const n: [number, number, number] = [u[1]! * v[2]! - u[2]! * v[1]!, u[2]! * v[0]! - u[0]! * v[2]!, u[0]! * v[1]! - u[1]! * v[0]!]
  const len = Math.hypot(...n)
  return len ? [n[0] / len, n[1] / len, n[2] / len] : [0, 0, 1]
}

export function generateTriangles(o: TriangleOptions): Triangle[] {
  const { width, height } = o
  const random = createRandom(o.seed)
  const cell = cellPixels(o.cellSize)
  const variance = o.variance / 100
  const columns = Math.ceil((width + 2 * cell) / cell) + 2
  const rows = Math.ceil((height + 2 * cell) / (0.865 * cell))

  const points: Vertex[] = []
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < columns; col++) {
      const y = row * cell * 0.866 - cell + (random() - 0.5) * variance * cell * 2
      const x = col * cell - cell + (row % 2 ? cell / 2 : 0) + (random() - 0.5) * variance * cell * 2
      const z = (random() * o.depth * cell) / 50
      points.push([x, y, z])
    }
  }

  const faces: [Vertex, Vertex, Vertex][] = []
  for (let i = 0; i < points.length; i++) {
    if (i % columns === columns - 1 || i >= (rows - 1) * columns) continue
    const [a, b, c, d] = [points[i]!, points[i + 1]!, points[i + columns + 1]!, points[i + columns]!]
    if (Math.floor(i / columns) % 2) faces.push([a, c, d], [a, b, c])
    else faces.push([a, b, d], [b, c, d])
  }

  const stops = o.colors.map(parseHex).filter((c): c is Rgb => c !== null)
  const dx = (o.dither / 200) * width
  const dy = (o.dither / 200) * height
  return faces.map(([a, b, c]) => {
    let x = (a[0] + b[0] + c[0]) / 3 + random() * dx - dx / 2
    let y = (a[1] + b[1] + c[1]) / 3 + random() * dy - dy / 2
    x = Math.floor(Math.min(width - 1, Math.max(0, x))) + 0.5
    y = Math.floor(Math.min(height - 1, Math.max(0, y))) + 0.5
    const color = shade(backgroundAt(x, y, width, height, stops), normalOf(a, b, c)).map(Math.round) as Rgb
    return { points: [[a[0], a[1]], [b[0], b[1]], [c[0], c[1]]], color }
  })
}

function intersects(t: Triangle, width: number, height: number): boolean {
  const xs = t.points.map((p) => p[0])
  const ys = t.points.map((p) => p[1])
  return Math.max(...xs) > 0 && Math.min(...xs) < width && Math.max(...ys) > 0 && Math.min(...ys) < height
}

const num = (n: number) => String(Math.round(n * 100) / 100)

/** SVG document of the triangles that touch the canvas; a same-coloured hairline hides anti-aliasing seams. */
export function toSvg(triangles: Triangle[], width: number, height: number): string {
  const paths = triangles
    .filter((t) => intersects(t, width, height))
    .map((t) => {
      const [a, b, c] = t.points
      const hex = toHex(t.color)
      return `<path d="M${num(a[0])} ${num(a[1])}L${num(b[0])} ${num(b[1])}L${num(c[0])} ${num(c[1])}Z" fill="${hex}" stroke="${hex}"/>`
    })
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`,
    `<g stroke-width="0.5" stroke-linejoin="round">`,
    ...paths,
    '</g>',
    '</svg>',
  ].join('\n')
}

function luminance([r, g, b]: Rgb): number {
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

/**
 * Dominant colours of an RGBA buffer by median cut, ordered light → dark like the built-in palettes.
 * Transparent and near-white pixels are ignored.
 */
export function extractPalette(data: ArrayLike<number>, count = 6): string[] {
  const pixels: Rgb[] = []
  const total = Math.floor(data.length / 4)
  const step = Math.max(1, Math.floor(total / 20000))
  for (let i = 0; i < total; i += step) {
    const p = i * 4
    const [r, g, b, a] = [data[p]!, data[p + 1]!, data[p + 2]!, data[p + 3]!]
    if (a < 125 || (r > 250 && g > 250 && b > 250)) continue
    pixels.push([r, g, b])
  }
  if (!pixels.length) return []

  const range = (box: Rgb[], k: number) => {
    let lo = 255
    let hi = 0
    for (const p of box) {
      lo = Math.min(lo, p[k]!)
      hi = Math.max(hi, p[k]!)
    }
    return hi - lo
  }
  const boxes: Rgb[][] = [pixels]
  while (boxes.length < count) {
    // Split the box whose widest channel spans the most, weighted by its population.
    let best = -1
    let bestScore = 0
    let bestChannel = 0
    boxes.forEach((box, i) => {
      if (box.length < 2) return
      const ranges = [0, 1, 2].map((k) => range(box, k))
      const channel = ranges.indexOf(Math.max(...ranges))
      const score = ranges[channel]! * box.length
      if (score > bestScore) [best, bestScore, bestChannel] = [i, score, channel]
    })
    if (best < 0) break
    const box = boxes[best]!.sort((p, q) => p[bestChannel]! - q[bestChannel]!)
    const mid = box.length >> 1
    boxes.splice(best, 1, box.slice(0, mid), box.slice(mid))
  }

  const colors = boxes.map((box) => {
    const sum = box.reduce((s, p) => [s[0] + p[0], s[1] + p[1], s[2] + p[2]], [0, 0, 0])
    return sum.map((v) => v / box.length) as Rgb
  })
  colors.sort((p, q) => luminance(q) - luminance(p))
  return [...new Set(colors.map(toHex))]
}
