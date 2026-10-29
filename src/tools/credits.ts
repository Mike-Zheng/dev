/** Projects and libraries behind the tools, listed in the "Inspired by" dialog. */
export interface Credit {
  name: string
  url: string
  /** Tool ids this credit applies to (rendered as links to the tools). */
  tools: string[]
  /** i18n key of a short note, for credits that don't map to specific tools. */
  note?: string
}

/** Projects whose behaviour, data or design a tool follows. */
export const inspirations: Credit[] = [
  { name: 'DevToys', url: 'https://github.com/DevToys-app/DevToys', tools: [], note: 'inspired.layoutNote' },
  { name: 'r12a · Unicode code converter', url: 'https://r12a.github.io/app-conversion/', tools: ['unicode'] },
  { name: 'CSS Scan · Box-shadow examples', url: 'https://getcssscan.com/css-box-shadow-examples', tools: ['box-shadow'] },
  { name: 'Recompressor', url: 'https://recompressor.com/', tools: ['image-compressor'] },
  { name: 'Matrix Compress', url: 'https://github.com/Mike-Zheng/eagle-plugin-matrix-compress', tools: ['image-compressor'] },
  { name: 'mini-photo-editor', url: 'https://github.com/xdadda/mini-photo-editor', tools: ['photo-editor'] },
]

function npm(name: string, tools: string[]): Credit {
  return { name, url: `https://www.npmjs.com/package/${name}`, tools }
}

/** Open-source libraries the tools run on. */
export const libraries: Credit[] = [
  npm('cron-parser', ['cron']),
  npm('cronstrue', ['cron']),
  npm('js-yaml', ['json-yaml']),
  npm('@peculiar/x509', ['certificate']),
  npm('pako', ['gzip']),
  npm('jose', ['jwt']),
  npm('qrcode', ['qrcode']),
  npm('jsqr', ['qrcode']),
  npm('sql-formatter', ['sql-formatter']),
  npm('xml-formatter', ['xml-formatter']),
  npm('hash-wasm', ['hash', 'md5']),
  npm('uuid', ['uuid']),
  npm('figlet', ['ascii-art']),
  npm('@xdadda/mini-gl', ['photo-editor']),
  npm('@jsquash/jpeg', ['image-compressor']),
  npm('@jsquash/webp', ['image-compressor']),
  npm('libimagequant-wasm', ['image-compressor']),
  npm('svgo', ['image-compressor']),
  npm('jsonpath-plus', ['jsonpath']),
  npm('xmllint-wasm', ['xml-tester']),
  npm('diff', ['text-compare']),
  npm('marked', ['markdown']),
  npm('dompurify', ['markdown']),
]
