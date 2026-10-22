const named: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }

/** Escapes the HTML special characters and turns every code point >= U+00A0 into a decimal reference. */
export function htmlEncode(s: string): string {
  let out = ''
  for (const ch of s) {
    const code = ch.codePointAt(0) ?? 0
    if (named[ch]) out += named[ch]
    else if (code >= 160) out += `&#${code};`
    else out += ch
  }
  return out
}

/** Decodes named and numeric references (and drops tags) by letting the browser parse the text. */
export function htmlDecode(s: string): string {
  const doc = new DOMParser().parseFromString(`<!doctype html><body>${s}`, 'text/html')
  return doc.body.textContent ?? ''
}
