<script setup lang="ts">
import { CircleCheck, CircleX, Info } from 'lucide-vue-next'
import { useToast } from '@/composables/useToast'

const { toasts } = useToast()
const icons = { info: Info, success: CircleCheck, error: CircleX }
</script>

<template>
  <div class="pointer-events-none fixed inset-x-0 bottom-4 z-[100] flex flex-col items-center gap-2 px-4">
    <TransitionGroup name="fade">
      <div
        v-for="tst in toasts"
        :key="tst.id"
        class="pointer-events-auto flex items-center gap-2 rounded-lg border border-line bg-surface px-3.5 py-2 text-sm shadow-lg"
      >
        <component
          :is="icons[tst.kind]"
          class="h-4 w-4"
          :class="tst.kind === 'success' ? 'text-success' : tst.kind === 'error' ? 'text-danger' : 'text-info'"
        />
        <span class="text-fg">{{ tst.message }}</span>
      </div>
    </TransitionGroup>
  </div>
</template>
