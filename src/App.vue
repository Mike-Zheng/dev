<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { Menu, Moon, Sun } from 'lucide-vue-next'
import AppSidebar from '@/components/layout/AppSidebar.vue'
import Toaster from '@/components/ui/Toaster.vue'
import InspiredByDialog from '@/components/layout/InspiredByDialog.vue'
import { useI18n } from '@/i18n'
import { useSettings } from '@/composables/useSettings'

const { t } = useI18n()
const { isDark, toggleTheme } = useSettings()
const route = useRoute()
const mobileOpen = ref(false)

watch(
  () => route.fullPath,
  () => {
    mobileOpen.value = false
  },
)
</script>

<template>
  <div class="flex h-full overflow-hidden bg-bg">
    <!-- Desktop sidebar -->
    <div class="hidden lg:block h-full shrink-0">
      <AppSidebar :mobile-open="false" />
    </div>

    <!-- Mobile drawer -->
    <Transition name="fade">
      <div v-if="mobileOpen" class="fixed inset-0 z-40 lg:hidden">
        <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" @click="mobileOpen = false" />
        <div class="absolute inset-y-0 left-0 shadow-2xl">
          <AppSidebar :mobile-open="true" @close="mobileOpen = false" />
        </div>
      </div>
    </Transition>

    <!-- Main -->
    <div class="flex min-w-0 flex-1 flex-col h-full">
      <header class="flex h-14 shrink-0 items-center gap-2 bg-bg px-3 lg:hidden">
        <button
          type="button"
          class="inline-flex h-9 w-9 items-center justify-center rounded-md text-fg-muted hover:bg-surface-2 hover:text-fg focus-ring"
          :title="t('app.toggleNav')"
          @click="mobileOpen = true"
        >
          <Menu class="h-5 w-5" />
        </button>
        <RouterLink to="/" class="font-semibold tracking-tight text-accent">dev</RouterLink>
        <span class="flex-1" />
        <button
          type="button"
          class="inline-flex h-9 w-9 items-center justify-center rounded-md text-fg-muted hover:bg-surface-2 hover:text-fg focus-ring"
          :title="t('app.theme')"
          @click="toggleTheme"
        >
          <Sun v-if="isDark" class="h-5 w-5" />
          <Moon v-else class="h-5 w-5" />
        </button>
      </header>

      <main class="relative flex-1 min-h-0 overflow-y-auto bg-layer border-t border-line lg:mt-2 lg:border-l lg:rounded-tl-lg">
        <RouterView v-slot="{ Component }">
          <Transition name="fade" mode="out-in">
            <component :is="Component" :key="route.fullPath" />
          </Transition>
        </RouterView>
      </main>
    </div>

    <Toaster />
    <InspiredByDialog />
  </div>
</template>
