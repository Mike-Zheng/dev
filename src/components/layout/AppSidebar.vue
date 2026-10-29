<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  ChevronRight,
  Github,
  HeartHandshake,
  LayoutGrid,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  Settings,
  Star,
  X,
} from 'lucide-vue-next'
import ToolLink from '@/components/ui/ToolLink.vue'
import ExternalMark from '@/components/ui/ExternalMark.vue'
import { groups, isExternalTool, tools, toolsOfGroup, type ToolDefinition } from '@/tools/registry'
import { useI18n } from '@/i18n'
import { useSettings } from '@/composables/useSettings'
import { useInspiredBy } from '@/composables/useInspiredBy'

const props = defineProps<{ mobileOpen: boolean }>()
const emit = defineEmits<{ (e: 'close'): void }>()

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const { sidebarCollapsed, favorites } = useSettings()
const inspiredBy = useInspiredBy()

const query = ref('')
const searchFocused = ref(false)
const expanded = ref<Record<string, boolean>>({})

const currentToolId = computed(() => (route.name === 'tool' ? String(route.params.id) : ''))
const currentGroupId = computed(() => (route.name === 'group' ? String(route.params.id) : ''))

watch(
  currentToolId,
  (id) => {
    const tool = tools.find((x) => x.id === id)
    if (tool) expanded.value[tool.group] = true
  },
  { immediate: true },
)

function toolTitle(tool: ToolDefinition) {
  return t(`tools.${tool.id}.title`)
}

function matchScore(tool: ToolDefinition, q: string): number {
  const title = t(`tools.${tool.id}.title`).toLowerCase()
  const short = t(`tools.${tool.id}.short`).toLowerCase()
  const desc = t(`tools.${tool.id}.description`).toLowerCase()
  const kw = (tool.keywords ?? []).join(' ').toLowerCase() + ' ' + (t(`tools.${tool.id}.keywords`) || '').toLowerCase()
  if (title.startsWith(q) || short.startsWith(q)) return 3
  if (title.includes(q) || short.includes(q)) return 2
  if (kw.includes(q) || desc.includes(q)) return 1
  return 0
}

const results = computed(() => {
  const q = query.value.trim().toLowerCase()
  if (!q) return []
  return tools
    .map((tool) => ({ tool, score: matchScore(tool, q) }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((x) => x.tool)
    .slice(0, 8)
})

const showResults = computed(() => query.value.trim().length > 0 && (searchFocused.value || props.mobileOpen))

function go(to: Parameters<typeof router.push>[0]) {
  router.push(to)
  query.value = ''
  emit('close')
}

/** Open a tool: internal tools navigate, external ones open in a new tab. */
function openTool(tool: ToolDefinition) {
  if (isExternalTool(tool)) {
    window.open(tool.href, '_blank', 'noopener,noreferrer')
    query.value = ''
    emit('close')
  } else {
    go({ name: 'tool', params: { id: tool.id } })
  }
}

function onSearchEnter() {
  const first = results.value[0]
  if (first) openTool(first)
}

function toggleGroup(id: string) {
  if (sidebarCollapsed.value) {
    sidebarCollapsed.value = false
    expanded.value[id] = true
    return
  }
  expanded.value[id] = !expanded.value[id]
}

const collapsed = computed(() => sidebarCollapsed.value && !props.mobileOpen)
</script>

<template>
  <aside
    class="flex h-full flex-col bg-bg-soft transition-[width] duration-200"
    :class="collapsed ? 'w-[68px]' : 'w-[280px]'"
  >
    <!-- Brand -->
    <div class="flex h-14 items-center gap-2 px-3 shrink-0" :class="collapsed ? 'justify-center' : ''">
      <RouterLink to="/" class="flex items-center gap-2.5 focus-ring rounded-lg" @click="emit('close')">
        <img src="/favicon.svg" alt="" class="h-8 w-8" />
        <span v-if="!collapsed" class="font-semibold tracking-tight text-accent">dev</span>
      </RouterLink>
      <span class="flex-1" />
      <button
        v-if="!mobileOpen"
        type="button"
        class="hidden lg:inline-flex h-8 w-8 items-center justify-center rounded-md text-fg-muted hover:bg-surface-2 hover:text-fg focus-ring"
        :title="t('app.toggleNav')"
        @click="sidebarCollapsed = !sidebarCollapsed"
      >
        <PanelLeftOpen v-if="collapsed" class="h-4.5 w-4.5" />
        <PanelLeftClose v-else class="h-4.5 w-4.5" />
      </button>
      <button
        v-else
        type="button"
        class="inline-flex h-8 w-8 items-center justify-center rounded-md text-fg-muted hover:bg-surface-2 hover:text-fg lg:hidden"
        @click="emit('close')"
      >
        <X class="h-5 w-5" />
      </button>
    </div>

    <!-- Search -->
    <div class="relative px-3 pb-2 shrink-0" v-if="!collapsed">
      <div class="relative">
        <Search class="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-fg-faint" />
        <input
          v-model="query"
          type="search"
          :placeholder="t('app.search')"
          class="h-9 w-full rounded-md border border-line border-b-line-strong bg-control pl-8 pr-3 text-sm text-fg placeholder:text-fg-faint outline-none hover:bg-control-hover focus:bg-control-active focus:border-b-accent focus:shadow-[inset_0_-1px_0_var(--c-accent)]"
          @focus="searchFocused = true"
          @blur="searchFocused = false"
          @keydown.enter.prevent="onSearchEnter"
          @keydown.esc="query = ''"
        />
      </div>
      <div
        v-if="showResults"
        class="absolute left-3 right-3 top-full z-30 mt-1 overflow-hidden rounded-lg border border-line bg-surface shadow-lg"
      >
        <template v-if="results.length">
          <button
            v-for="tool in results"
            :key="tool.id"
            type="button"
            class="flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm hover:bg-surface-2"
            @mousedown.prevent
            @click="openTool(tool)"
          >
            <component :is="tool.icon" class="h-4 w-4 shrink-0 text-fg-muted" />
            <span class="truncate text-fg">{{ toolTitle(tool) }}</span>
            <ExternalMark :tool="tool" />
            <span class="ml-auto text-[10px] uppercase tracking-wider text-fg-faint">{{ t(`groups.${tool.group}`) }}</span>
          </button>
        </template>
        <div v-else class="px-3 py-3 text-sm text-fg-muted">{{ t('app.noResults') }}</div>
      </div>
    </div>
    <div v-else class="px-3 pb-2 shrink-0">
      <button
        type="button"
        class="flex h-9 w-full items-center justify-center rounded-md border border-line border-b-line-strong bg-control text-fg-muted hover:bg-control-hover hover:text-fg"
        :title="t('app.search')"
        @click="sidebarCollapsed = false"
      >
        <Search class="h-4 w-4" />
      </button>
    </div>

    <!-- Nav -->
    <nav class="flex-1 overflow-y-auto px-2 pb-2 space-y-0.5">
      <RouterLink
        to="/"
        class="nav-item"
        :class="route.name === 'home' ? 'nav-item-active' : ''"
        :title="t('app.allTools')"
        @click="emit('close')"
      >
        <LayoutGrid class="nav-icon" />
        <span v-if="!collapsed" class="truncate">{{ t('app.allTools') }}</span>
      </RouterLink>
      <RouterLink
        v-if="favorites.length"
        :to="{ name: 'group', params: { id: 'favorites' } }"
        class="nav-item"
        :class="currentGroupId === 'favorites' ? 'nav-item-active' : ''"
        :title="t('app.favorites')"
        @click="emit('close')"
      >
        <Star class="nav-icon" />
        <span v-if="!collapsed" class="truncate">{{ t('app.favorites') }}</span>
        <span v-if="!collapsed" class="ml-auto text-[11px] text-fg-faint font-mono">{{ favorites.length }}</span>
      </RouterLink>

      <div class="my-2 h-px bg-line mx-2" />

      <div v-for="g in groups" :key="g.id">
        <div class="flex items-center">
          <RouterLink
            :to="{ name: 'group', params: { id: g.id } }"
            class="nav-item flex-1"
            :class="currentGroupId === g.id ? 'nav-item-active' : ''"
            :title="t(`groups.${g.id}`)"
            @click="collapsed ? toggleGroup(g.id) : emit('close')"
          >
            <component :is="g.icon" class="nav-icon" />
            <span v-if="!collapsed" class="truncate">{{ t(`groups.${g.id}`) }}</span>
          </RouterLink>
          <button
            v-if="!collapsed"
            type="button"
            class="mr-1 h-7 w-7 shrink-0 inline-flex items-center justify-center rounded-md text-fg-faint hover:text-fg hover:bg-surface-2"
            @click="toggleGroup(g.id)"
          >
            <ChevronRight class="h-4 w-4 transition-transform" :class="expanded[g.id] ? 'rotate-90' : ''" />
          </button>
        </div>
        <div v-if="!collapsed && expanded[g.id]" class="ml-4 mt-0.5 border-l border-line pl-2 space-y-0.5">
          <ToolLink
            v-for="tool in toolsOfGroup(g.id)"
            :key="tool.id"
            :tool="tool"
            class="nav-item py-1.5"
            :class="currentToolId === tool.id ? 'nav-item-active' : ''"
            @click="emit('close')"
          >
            <component :is="tool.icon" class="nav-icon h-4 w-4" />
            <span class="truncate">{{ t(`tools.${tool.id}.short`) }}</span>
            <ExternalMark :tool="tool" />
          </ToolLink>
        </div>
      </div>
    </nav>

    <!-- Footer -->
    <div class="shrink-0 border-t border-line p-2 space-y-0.5">
      <button
        type="button"
        class="nav-item w-full"
        :title="t('inspired.title')"
        @click="inspiredBy.show(); emit('close')"
      >
        <HeartHandshake class="nav-icon" />
        <span v-if="!collapsed" class="truncate">{{ t('inspired.title') }}</span>
      </button>
      <a
        href="https://github.com/Mike-Zheng/dev"
        target="_blank"
        rel="noreferrer"
        class="nav-item"
        :title="t('app.github')"
      >
        <Github class="nav-icon" />
        <span v-if="!collapsed" class="truncate">{{ t('app.github') }}</span>
      </a>
      <RouterLink
        to="/settings"
        class="nav-item"
        :class="route.name === 'settings' ? 'nav-item-active' : ''"
        :title="t('app.settings')"
        @click="emit('close')"
      >
        <Settings class="nav-icon" />
        <span v-if="!collapsed" class="truncate">{{ t('app.settings') }}</span>
      </RouterLink>
    </div>
  </aside>
</template>

<style scoped>
@reference "@/style.css";

.nav-item {
  @apply relative flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm text-fg transition-colors hover:bg-surface-2 focus-ring;
}
/* WinUI NavigationViewItem: subtle fill + 3px accent pill on the left */
.nav-item-active {
  @apply bg-surface-2;
}
.nav-item-active::before {
  content: '';
  @apply absolute left-0 top-1/2 h-4 w-[3px] -translate-y-1/2 rounded-full bg-accent;
}
.nav-icon {
  @apply h-[18px] w-[18px] shrink-0;
}
</style>
