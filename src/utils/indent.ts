import { computed } from 'vue'

export type Indent = 'two' | 'four' | 'tab' | 'minified'

export function useIndentOptions(t: (k: string) => string, withMinified = true) {
  return computed(() => {
    const opts: { value: Indent; label: string }[] = [
      { value: 'two', label: t('common.twoSpaces') },
      { value: 'four', label: t('common.fourSpaces') },
      { value: 'tab', label: t('common.oneTab') },
    ]
    if (withMinified) opts.push({ value: 'minified', label: t('common.minified') })
    return opts
  })
}

export function indentString(i: Indent): string {
  return i === 'two' ? '  ' : i === 'four' ? '    ' : i === 'tab' ? '\t' : ''
}
