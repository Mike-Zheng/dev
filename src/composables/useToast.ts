import { ref } from 'vue'

export interface Toast {
  id: number
  message: string
  kind: 'info' | 'success' | 'error'
}

const toasts = ref<Toast[]>([])
let seq = 0

export function useToast() {
  function show(message: string, kind: Toast['kind'] = 'info', ms = 1800) {
    const id = ++seq
    toasts.value.push({ id, message, kind })
    window.setTimeout(() => {
      toasts.value = toasts.value.filter((t) => t.id !== id)
    }, ms)
  }
  return { toasts, show }
}
