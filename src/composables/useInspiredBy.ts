import { ref } from 'vue'

const open = ref(false)

/** Shared open state of the single "Inspired by" dialog mounted in App.vue. */
export function useInspiredBy() {
  return {
    open,
    show: () => {
      open.value = true
    },
  }
}
