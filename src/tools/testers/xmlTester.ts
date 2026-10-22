import { xmlParseError } from '../formatters/xmlFormatter'

export type XmlTestResult =
  | { kind: 'needBoth' }
  | { kind: 'malformedXml' | 'malformedXsd' | 'invalid'; message: string }
  /** `missingNamespace` is set when the schema has a targetNamespace the XML never mentions. */
  | { kind: 'valid'; missingNamespace: string | null }

export function targetNamespace(xsdSrc: string): string | null {
  const m = /targetNamespace\s*=\s*"([^"]+)"/.exec(xsdSrc)
  return m?.[1] ?? null
}

/**
 * Validates `xml` against the `xsd` schema with libxml2 (WebAssembly, loaded on demand).
 * Returns null when both inputs are blank; `onLoading` fires right before the validator is loaded.
 */
export async function validateXmlWithXsd(xml: string, xsd: string, onLoading?: () => void): Promise<XmlTestResult | null> {
  const x = xml.trim()
  const s = xsd.trim()
  if (!x || !s) return x || s ? { kind: 'needBoth' } : null
  const xmlErr = xmlParseError(x)
  if (xmlErr) return { kind: 'malformedXml', message: xmlErr }
  const xsdErr = xmlParseError(s)
  if (xsdErr) return { kind: 'malformedXsd', message: xsdErr }
  onLoading?.()
  try {
    const { validateXML } = await import('xmllint-wasm')
    const res = await validateXML({
      xml: [{ fileName: 'document.xml', contents: x }],
      schema: [{ fileName: 'schema.xsd', contents: s }],
    })
    if (res.valid) {
      const ns = targetNamespace(s)
      return { kind: 'valid', missingNamespace: ns && !x.includes(ns) ? ns : null }
    }
    const message = res.errors.map((e) => (e.loc ? `line ${e.loc.lineNumber}: ${e.message}` : e.message)).join('\n')
    return { kind: 'invalid', message: message || res.rawOutput }
  } catch (e) {
    return { kind: 'invalid', message: (e as Error).message }
  }
}
