// Type declarations for the parts of @xdadda/mini-gl (WebGL2 photo filters) used by the photo editor.
declare module '@xdadda/mini-gl' {
  export interface MatrixParams {
    translateX: number
    translateY: number
    /** Degrees */
    angle: number
    /** 0 = 1:1 */
    scale: number
    flipv: number
    fliph: number
  }

  export type AdjustmentParams = Partial<
    Record<
      | 'brightness'
      | 'clarity'
      | 'contrast'
      | 'exposure'
      | 'gamma'
      | 'gray'
      | 'saturation'
      | 'sepia'
      | 'temperature'
      | 'tint'
      | 'vibrance'
      | 'vignette',
      number
    >
  >

  /** One curve per channel (luminance/all, R, G, B); null = linear. Points are [x, y] in 0..1. */
  export type CurvePoints = ([number, number][] | null)[]

  export interface InstaFilter {
    /** '1'–'4' are LUT based, 'MTX' is a color matrix */
    type: '1' | '2' | '3' | '4' | 'MTX'
    mtx?: 'polaroid' | 'kodachrome' | 'browni' | 'vintage'
    map1?: HTMLImageElement
    map2?: HTMLImageElement
  }

  export interface BlurParams {
    bokehstrength?: number
    bokehlensin?: number
    bokehlensout?: number
    gaussianstrength?: number
    gaussianlensin?: number
    gaussianlensout?: number
    centerX?: number
    centerY?: number
  }

  export interface Rect {
    left: number
    top: number
    width: number
    height: number
  }

  export interface MiniGL {
    width: number
    height: number
    gl: WebGL2RenderingContext
    img: HTMLImageElement
    /** Set after crop(): the cropped image as an <img> with a PNG data URL */
    img_cropped?: HTMLImageElement
    destroy(): void
    loadImage(): void
    paintCanvas(): void
    crop(rect: Rect): void
    resetCrop(): void
    resize(width: number, height: number): void
    resetResize(): void
    captureImage(type?: string, quality?: number): HTMLImageElement
    readPixels(): Uint8Array<ArrayBuffer>
    setupFiltersTextures(): void
    filterMatrix(params: MatrixParams): void
    filterAdjustments(params: AdjustmentParams): void
    filterBloom(strength: number): void
    filterNoise(strength: number): void
    filterHighlightsShadows(highlights: number, shadows: number): void
    filterCurves(curves: CurvePoints): void
    filterInsta(filter: InstaFilter, mix?: number): void
    filterBlurBokeh(params: BlurParams): void
    filterBlurGaussian(params: BlurParams): void
  }

  export function minigl(canvas: HTMLCanvasElement, image: HTMLImageElement, colorspace?: 'srgb' | 'display-p3'): MiniGL | undefined
}
