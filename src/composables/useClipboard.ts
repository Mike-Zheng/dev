import { useToast } from './useToast'
import { translate } from '@/i18n'

export function useClipboard() {
  const { show } = useToast()

  async function copy(text: string) {
    if (!text) return
    try {
      await navigator.clipboard.writeText(text)
    } catch {
      const ta = document.createElement('textarea')
      ta.value = text
      ta.style.position = 'fixed'
      ta.style.opacity = '0'
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      ta.remove()
    }
    show(translate('common.copied'), 'success')
  }

  async function paste(): Promise<string | null> {
    try {
      return await navigator.clipboard.readText()
    } catch {
      show(translate('common.pasteFailed'), 'error', 2500)
      return null
    }
  }

  return { copy, paste }
}
