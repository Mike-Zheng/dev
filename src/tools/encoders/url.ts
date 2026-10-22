/** encodeURIComponent plus the RFC 3986 reserved characters it leaves alone (! ' ( ) *). */
export function urlEncode(s: string): string {
  return encodeURIComponent(s).replace(/[!'()*]/g, (c) => '%' + c.charCodeAt(0).toString(16).toUpperCase())
}

/** Decodes percent-escapes, treating `+` as a space. Throws URIError on malformed input. */
export function urlDecode(s: string): string {
  return decodeURIComponent(s.replace(/\+/g, '%20'))
}

/** Encodes or decodes the whole text, or each line separately when `multiline` is set. Throws on invalid input. */
export function convertUrl(src: string, encode: boolean, multiline: boolean): string {
  const fn = encode ? urlEncode : urlDecode
  return multiline ? src.split(/\r?\n/).map(fn).join('\n') : fn(src)
}
