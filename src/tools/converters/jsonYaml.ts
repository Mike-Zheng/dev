import yaml from 'js-yaml'

export interface JsonYamlResult {
  output: string
  error: '' | 'invalidJson' | 'invalidYaml'
}

/** Convert JSON to YAML (`jsonToYaml`) or YAML to JSON. */
export function convertJsonYaml(src: string, jsonToYaml: boolean, indent: 2 | 4): JsonYamlResult {
  if (!src.trim()) return { output: '', error: '' }
  if (jsonToYaml) {
    try {
      const obj: unknown = JSON.parse(src)
      return { output: yaml.dump(obj, { indent, lineWidth: -1, noRefs: true }), error: '' }
    } catch {
      return { output: '', error: 'invalidJson' }
    }
  }
  try {
    const obj: unknown = yaml.load(src)
    return { output: JSON.stringify(obj, null, indent), error: '' }
  } catch {
    return { output: '', error: 'invalidYaml' }
  }
}
