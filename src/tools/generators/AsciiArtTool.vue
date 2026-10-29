<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { Check, ChevronLeft, ChevronRight, Copy, GalleryVertical, MessageSquareCode, MoveHorizontal, MoveVertical, Scissors, Type, WrapText } from 'lucide-vue-next'
import ConfigSection from '@/components/ui/ConfigSection.vue'
import SettingCard from '@/components/ui/SettingCard.vue'
import BaseSwitch from '@/components/ui/BaseSwitch.vue'
import BaseSelect from '@/components/ui/BaseSelect.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import IconButton from '@/components/ui/IconButton.vue'
import NumberInput from '@/components/ui/NumberInput.vue'
import TextInput from '@/components/ui/TextInput.vue'
import SectionTitle from '@/components/ui/SectionTitle.vue'
import InfoBar from '@/components/ui/InfoBar.vue'
import CodeEditor from '@/components/ui/CodeEditor.vue'
import { useI18n } from '@/i18n'
import { useClipboard } from '@/composables/useClipboard'
import { DEFAULT_FONT, fontNames, loadFont, missingChars, renderAsciiArt, type AsciiLayout, type CommentStyle } from './asciiArt'

const { t } = useI18n()
const tt = (k: string, p?: Record<string, string | number>) => t(`tools.ascii-art.${k}`, p)
const { copy } = useClipboard()

const font = ref(DEFAULT_FONT)
const horizontalLayout = ref<AsciiLayout>('default')
const verticalLayout = ref<AsciiLayout>('default')
const width = ref(0)
const whitespaceBreak = ref(true)
const trimTrailing = ref(true)
const comment = ref<CommentStyle>('none')
const input = ref('dev')

const fontOptions = fontNames.map((f) => ({ value: f, label: f }))

const layoutOptions = computed<{ value: AsciiLayout; label: string }[]>(() => [
  { value: 'default', label: tt('layoutDefault') },
  { value: 'full', label: tt('layoutFull') },
  { value: 'fitted', label: tt('layoutFitted') },
  { value: 'controlled smushing', label: tt('layoutSmushR') },
  { value: 'universal smushing', label: tt('layoutSmushU') },
])

const commentOptions = computed<{ value: CommentStyle; label: string }[]>(() =>
  (['none', 'slash', 'hash', 'dash', 'semicolon', 'percent', 'apostrophe', 'rem', 'c', 'javadoc', 'html'] as const).map((value) => ({
    value,
    label: tt(`comment_${value}`),
  })),
)

function stepFont(d: number) {
  const i = fontNames.indexOf(font.value)
  font.value = fontNames[(i + d + fontNames.length) % fontNames.length]!
}

/** Last font that finished loading; the output keeps showing it while the next one loads. */
const activeFont = ref<string | null>(null)
const loadFailed = ref(false)
watch(
  font,
  async (f) => {
    const ok = await loadFont(f)
    if (font.value !== f) return
    loadFailed.value = !ok
    if (ok) activeFont.value = f
  },
  { immediate: true },
)

const layout = computed(() => ({
  horizontalLayout: horizontalLayout.value,
  verticalLayout: verticalLayout.value,
  width: width.value,
  whitespaceBreak: whitespaceBreak.value,
  trimTrailing: trimTrailing.value,
}))

const result = computed(() => (activeFont.value ? renderAsciiArt(input.value, { ...layout.value, font: activeFont.value, comment: comment.value }) : null))
const output = computed(() => (result.value?.ok ? result.value.art : ''))
const error = computed(() => (loadFailed.value ? 'fontLoadFailed' : result.value && !result.value.ok ? result.value.error : null))
const missing = computed(() => (activeFont.value ? missingChars(input.value, activeFont.value) : []))

// ---------- All-fonts gallery ----------
const galleryOpen = ref(false)
const galleryFilter = ref('')
/** Fonts loaded for the gallery so far, in `fontNames` order. */
const galleryFonts = ref<string[]>([])
const galleryText = ref(input.value)
let galleryTimer: ReturnType<typeof setTimeout> | undefined
let cancelled = false

watch(input, (v) => {
  clearTimeout(galleryTimer)
  galleryTimer = setTimeout(() => (galleryText.value = v), 250)
})
onBeforeUnmount(() => {
  cancelled = true
  clearTimeout(galleryTimer)
})

async function openGallery() {
  galleryOpen.value = true
  if (galleryFonts.value.length) return
  const batch = 16
  for (let i = 0; i < fontNames.length && !cancelled; i += batch) {
    const names = fontNames.slice(i, i + batch)
    const ok = await Promise.all(names.map(loadFont))
    galleryFonts.value = [...galleryFonts.value, ...names.filter((_, j) => ok[j])]
  }
}

const galleryLoading = computed(() => galleryOpen.value && galleryFonts.value.length < fontNames.length)

const galleryItems = computed(() => {
  if (!galleryOpen.value) return []
  const q = galleryFilter.value.trim().toLowerCase()
  const text = galleryText.value || 'dev'
  return galleryFonts.value
    .filter((f) => !q || f.toLowerCase().includes(q))
    .map((f) => {
      const r = renderAsciiArt(text, { ...layout.value, font: f, comment: 'none' })
      return { font: f, art: r.ok ? r.art : '' }
    })
})

const top = ref<HTMLElement | null>(null)
function useFont(f: string) {
  font.value = f
  top.value?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}
</script>

<template>
  <div ref="top" class="space-y-6 scroll-mt-4">
    <ConfigSection>
      <SettingCard :icon="Type" :title="tt('font')" stacked :description="tt('fontDesc', { count: fontNames.length })">
        <IconButton size="sm" :title="tt('prevFont')" @click="stepFont(-1)"><ChevronLeft class="h-4 w-4" /></IconButton>
        <BaseSelect v-model="font" :options="fontOptions" />
        <IconButton size="sm" :title="tt('nextFont')" @click="stepFont(1)"><ChevronRight class="h-4 w-4" /></IconButton>
      </SettingCard>
      <SettingCard :icon="MoveHorizontal" :title="tt('charWidth')" :description="tt('charWidthDesc')">
        <BaseSelect v-model="horizontalLayout" :options="layoutOptions" />
      </SettingCard>
      <SettingCard :icon="MoveVertical" :title="tt('charHeight')" :description="tt('charHeightDesc')">
        <BaseSelect v-model="verticalLayout" :options="layoutOptions" />
      </SettingCard>
      <SettingCard :icon="WrapText" :title="tt('maxWidth')" :description="tt('maxWidthDesc')">
        <BaseSwitch v-if="width > 0" v-model="whitespaceBreak" :on-label="tt('wordBreak')" :off-label="tt('charBreak')" />
        <NumberInput v-model="width" :min="0" :max="1000" :step="10" />
      </SettingCard>
      <SettingCard :icon="MessageSquareCode" :title="tt('comment')" stacked :description="tt('commentDesc')">
        <BaseSelect v-model="comment" :options="commentOptions" />
      </SettingCard>
      <SettingCard :icon="Scissors" :title="tt('trimTrailing')" :description="tt('trimTrailingDesc')">
        <BaseSwitch v-model="trimTrailing" :on-label="t('common.on')" :off-label="t('common.off')" />
      </SettingCard>
    </ConfigSection>

    <CodeEditor v-model="input" :label="t('common.input')" :mono="false" height-class="min-h-[5rem]" />

    <InfoBar v-if="error" severity="error" :message="tt(error)" />
    <InfoBar v-else-if="missing.length" severity="warning" :message="tt('missingChars', { font: activeFont ?? '', chars: missing.join(' ') })" />

    <CodeEditor
      :model-value="output"
      :label="t('common.output')"
      readonly
      tight
      :default-wrap="false"
      height-class="min-h-[16rem]"
      filename="ascii-art.txt"
    />

    <section class="space-y-3">
      <SectionTitle :title="tt('allFonts')">
        <BaseButton v-if="!galleryOpen" size="sm" @click="openGallery"><GalleryVertical class="h-4 w-4" />{{ tt('testAll') }}</BaseButton>
        <BaseButton v-else size="sm" variant="ghost" @click="galleryOpen = false">{{ tt('hideAll') }}</BaseButton>
      </SectionTitle>
      <template v-if="galleryOpen">
        <div class="flex flex-wrap items-center gap-3">
          <div class="w-full sm:w-64"><TextInput v-model="galleryFilter" type="search" :placeholder="tt('filterFonts')" /></div>
          <span class="text-xs text-fg-muted">
            {{ galleryLoading ? tt('loadingFonts', { loaded: galleryFonts.length, total: fontNames.length }) : tt('fontCount', { count: galleryItems.length }) }}
          </span>
        </div>
        <div class="space-y-3">
          <div v-for="item in galleryItems" :key="item.font" class="rounded-card border bg-surface overflow-hidden" :class="item.font === font ? 'border-accent' : 'border-line'">
            <div class="flex items-center gap-1 border-b border-line bg-surface-2/60 px-2 py-1 min-h-[34px]">
              <button type="button" class="truncate px-1.5 text-xs font-semibold text-fg hover:text-accent focus-ring rounded" @click="useFont(item.font)">{{ item.font }}</button>
              <span class="flex-1" />
              <IconButton size="sm" :title="tt('useFont')" :active="item.font === font" @click="useFont(item.font)"><Check class="h-4 w-4" /></IconButton>
              <IconButton size="sm" :title="t('common.copy')" :disabled="!item.art" @click="copy(item.art)"><Copy class="h-4 w-4" /></IconButton>
            </div>
            <pre class="overflow-x-auto px-3 py-2 font-mono text-xs leading-tight text-fg">{{ item.art || ' ' }}</pre>
          </div>
        </div>
      </template>
    </section>
  </div>
</template>
