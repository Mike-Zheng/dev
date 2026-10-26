import type { InstaFilter } from '@xdadda/mini-gl'

// Instagram-like filter presets from xdadda/mini-photo-editor (MIT). LUT images are loaded on first use.
type LutLoader = () => Promise<{ default: string }>

interface FilterPreset {
  id: string
  type: InstaFilter['type']
  mtx?: InstaFilter['mtx']
  map1?: LutLoader
  map2?: LutLoader
}

export const FILTER_PRESETS: FilterPreset[] = [
  { id: 'aden', type: '1', map1: () => import('./luts/aden.png') },
  { id: 'crema', type: '1', map1: () => import('./luts/crema.png') },
  { id: 'clarendon', type: '2', map1: () => import('./luts/clarendon1.png'), map2: () => import('./luts/clarendon2.png') },
  { id: 'gingham', type: '3', map1: () => import('./luts/gingham1.png'), map2: () => import('./luts/gingham_lgg.png') },
  { id: 'juno', type: '1', map1: () => import('./luts/juno.png') },
  { id: 'lark', type: '1', map1: () => import('./luts/lark.png') },
  { id: 'ludwig', type: '1', map1: () => import('./luts/ludwig.png') },
  { id: 'moon', type: '4', map1: () => import('./luts/moon1.png'), map2: () => import('./luts/moon2.png') },
  { id: 'reyes', type: '1', map1: () => import('./luts/reyes.png') },
  { id: 'polaroid', type: 'MTX', mtx: 'polaroid' },
  { id: 'kodak', type: 'MTX', mtx: 'kodachrome' },
  { id: 'browni', type: 'MTX', mtx: 'browni' },
  { id: 'vintage', type: 'MTX', mtx: 'vintage' },
]

async function loadImage(loader: LutLoader): Promise<HTMLImageElement> {
  const img = new Image()
  img.src = (await loader()).default
  await img.decode()
  return img
}

const cache = new Map<string, Promise<InstaFilter>>()

/** Resolve a preset into the filter object mini-gl expects (LUT images decoded and cached). */
export function loadFilter(id: string): Promise<InstaFilter> {
  let p = cache.get(id)
  if (!p) {
    const preset = FILTER_PRESETS.find((f) => f.id === id)
    if (!preset) return Promise.reject(new Error(`unknown filter ${id}`))
    p = (async () => {
      const [map1, map2] = await Promise.all([preset.map1 && loadImage(preset.map1), preset.map2 && loadImage(preset.map2)])
      return { type: preset.type, mtx: preset.mtx, map1, map2 }
    })()
    p.catch(() => cache.delete(id))
    cache.set(id, p)
  }
  return p
}
