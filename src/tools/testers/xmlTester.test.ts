// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest'
import { targetNamespace, validateXmlWithXsd } from './xmlTester'

const XSD = `<?xml version="1.0"?>
<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema">
  <xs:element name="person">
    <xs:complexType>
      <xs:sequence>
        <xs:element name="name" type="xs:string"/>
        <xs:element name="age" type="xs:positiveInteger"/>
      </xs:sequence>
    </xs:complexType>
  </xs:element>
</xs:schema>`

const NS_XSD = `<?xml version="1.0"?>
<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema" targetNamespace="urn:example" elementFormDefault="qualified">
  <xs:element name="note" type="xs:string"/>
</xs:schema>`

describe('targetNamespace', () => {
  it('extracts the schema target namespace', () => {
    expect(targetNamespace(NS_XSD)).toBe('urn:example')
    expect(targetNamespace('<xs:schema targetNamespace = "http://a/b">')).toBe('http://a/b')
  })

  it('returns null when there is none', () => {
    expect(targetNamespace(XSD)).toBeNull()
  })
})

describe('validateXmlWithXsd', () => {
  it('returns null when both inputs are blank', async () => {
    expect(await validateXmlWithXsd('  ', '')).toBeNull()
  })

  it('asks for both inputs when only one is given', async () => {
    expect(await validateXmlWithXsd('<a/>', '')).toEqual({ kind: 'needBoth' })
    expect(await validateXmlWithXsd('', XSD)).toEqual({ kind: 'needBoth' })
  })

  it('reports malformed XML or XSD without loading the validator', async () => {
    const onLoading = vi.fn()
    const xml = await validateXmlWithXsd('<person>', XSD, onLoading)
    expect(xml?.kind).toBe('malformedXml')
    const xsd = await validateXmlWithXsd('<person/>', '<xs:schema>', onLoading)
    expect(xsd?.kind).toBe('malformedXsd')
    expect(onLoading).not.toHaveBeenCalled()
  })

  it('accepts a document that matches the schema', async () => {
    const onLoading = vi.fn()
    const res = await validateXmlWithXsd('<person><name>Ann</name><age>30</age></person>', XSD, onLoading)
    expect(res).toEqual({ kind: 'valid', missingNamespace: null })
    expect(onLoading).toHaveBeenCalledOnce()
  })

  it('lists schema violations with line numbers', async () => {
    const res = await validateXmlWithXsd('<person>\n  <name>Ann</name>\n  <age>-1</age>\n</person>', XSD)
    expect(res?.kind).toBe('invalid')
    expect(res && 'message' in res ? res.message : '').toMatch(/^line 3: .*age/)
  })

  it('rejects elements that are not declared', async () => {
    const res = await validateXmlWithXsd('<animal/>', XSD)
    expect(res?.kind).toBe('invalid')
  })

  it('validates namespaced documents', async () => {
    expect(await validateXmlWithXsd('<note xmlns="urn:example">hi</note>', NS_XSD)).toEqual({ kind: 'valid', missingNamespace: null })
  })
})
