/**
 * Text to ASCII art (FIGlet), in the spirit of patorjk.com/software/taag.
 * Fonts are the FIGlet fonts bundled with figlet.js, each split into its own lazy chunk.
 */
import figlet from 'figlet'

/** Horizontal / vertical layout: how much adjacent characters are allowed to overlap. */
export type AsciiLayout = 'default' | 'full' | 'fitted' | 'controlled smushing' | 'universal smushing'

export type CommentStyle = 'none' | 'slash' | 'hash' | 'dash' | 'semicolon' | 'percent' | 'apostrophe' | 'rem' | 'c' | 'javadoc' | 'html'

export interface AsciiArtOptions {
  font: string
  horizontalLayout: AsciiLayout
  verticalLayout: AsciiLayout
  /** Maximum line width in columns; 0 disables wrapping. */
  width: number
  /** When wrapping, break only between words. */
  whitespaceBreak: boolean
  trimTrailing: boolean
  comment: CommentStyle
}

export type AsciiArtError = 'fontLoadFailed' | 'renderFailed'

export type AsciiArtResult = { ok: true; art: string } | { ok: false; error: AsciiArtError }

const loaders = import.meta.glob<string>('../../../node_modules/figlet/importable-fonts/*.js', { import: 'default' })
const loaderByName = new Map(Object.entries(loaders).map(([path, load]) => [path.slice(path.lastIndexOf('/') + 1, -3), load]))

/** Every available font, sorted case-insensitively. */
export const fontNames: string[] = [...loaderByName.keys()].sort((a, b) => a.localeCompare(b, 'en', { sensitivity: 'base' }))

export const DEFAULT_FONT = 'Standard'

const loaded = new Set<string>()
const pending = new Map<string, Promise<boolean>>()

/** Load and parse a font once; resolves to false when the font does not exist or cannot be parsed. */
export function loadFont(name: string): Promise<boolean> {
  if (loaded.has(name)) return Promise.resolve(true)
  const inflight = pending.get(name)
  if (inflight) return inflight
  const load = loaderByName.get(name)
  if (!load) return Promise.resolve(false)
  const p = load()
    .then((data) => {
      figlet.parseFont(name, data)
      loaded.add(name)
      return true
    })
    .catch(() => false)
    .finally(() => pending.delete(name))
  pending.set(name, p)
  return p
}

/** Characters of the text that the (loaded) font has no glyph for, in order of first appearance. */
export function missingChars(text: string, font: string): string[] {
  const glyphs = figlet.figFonts[font]
  if (!glyphs) return []
  const seen = new Set<string>()
  for (const ch of text) {
    if (ch === '\n' || ch === '\r' || seen.has(ch)) continue
    if (glyphs[ch.codePointAt(0)!] === undefined) seen.add(ch)
  }
  return [...seen]
}

const LINE_PREFIX: Partial<Record<CommentStyle, string>> = {
  slash: '// ',
  hash: '# ',
  dash: '-- ',
  semicolon: '; ',
  percent: '% ',
  apostrophe: "' ",
  rem: 'REM ',
}

/** Wrap rendered art in a source-code comment. */
export function wrapComment(art: string, style: CommentStyle): string {
  if (style === 'none' || !art) return art
  const lines = art.split('\n')
  const prefix = LINE_PREFIX[style]
  if (prefix) return lines.map((l) => (prefix + l).trimEnd()).join('\n')
  if (style === 'javadoc') return ['/**', ...lines.map((l) => ` * ${l}`.trimEnd()), ' */'].join('\n')
  if (style === 'c') return ['/*', ...lines, '*/'].join('\n')
  return ['<!--', ...lines, '-->'].join('\n')
}

/** Render text with an already loaded font (see `loadFont`). */
export function renderAsciiArt(text: string, opts: AsciiArtOptions): AsciiArtResult {
  if (!text) return { ok: true, art: '' }
  if (!figlet.figFonts[opts.font]) return { ok: false, error: 'fontLoadFailed' }
  let art: string
  try {
    art = figlet.textSync(text.replace(/\r\n?/g, '\n'), {
      font: opts.font,
      horizontalLayout: opts.horizontalLayout,
      verticalLayout: opts.verticalLayout,
      width: opts.width > 0 ? opts.width : undefined,
      whitespaceBreak: opts.whitespaceBreak,
    })
  } catch {
    return { ok: false, error: 'renderFailed' }
  }
  if (opts.trimTrailing) {
    art = art
      .split('\n')
      .map((l) => l.trimEnd())
      .join('\n')
      .replace(/\n+$/, '')
  }
  return { ok: true, art: wrapComment(art, opts.comment) }
}
