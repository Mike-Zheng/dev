<script setup lang="ts">
import { Info, Languages, Monitor, Moon, Palette, Star, SunMedium, TextWrap, History, Type } from 'lucide-vue-next'
import SettingCard from '@/components/ui/SettingCard.vue'
import SectionTitle from '@/components/ui/SectionTitle.vue'
import BaseSwitch from '@/components/ui/BaseSwitch.vue'
import BaseSelect from '@/components/ui/BaseSelect.vue'
import NumberInput from '@/components/ui/NumberInput.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import { useI18n, type Locale } from '@/i18n'
import { useSettings, type ThemeMode } from '@/composables/useSettings'
import { useToast } from '@/composables/useToast'

const { t, locale, locales } = useI18n()
const { theme, wordWrap, editorFontSize, favorites, recents } = useSettings()
const { show } = useToast()
const version = __APP_VERSION__

const themeOptions: { value: ThemeMode; label: string; icon: typeof Monitor }[] = [
  { value: 'system', label: 'app.themeSystem', icon: Monitor },
  { value: 'light', label: 'app.themeLight', icon: SunMedium },
  { value: 'dark', label: 'app.themeDark', icon: Moon },
]
const localeOptions = locales.map((l) => ({ value: l.value as Locale, label: l.label }))

function clearFavorites() {
  favorites.value = []
  show(t('settings.cleared'), 'success')
}
function clearRecents() {
  recents.value = []
  show(t('settings.cleared'), 'success')
}
</script>

<template>
  <div class="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
    <h1 class="text-2xl font-semibold tracking-tight text-fg">{{ t('settings.title') }}</h1>

    <section class="space-y-3">
      <SectionTitle :title="t('settings.appearance')" />
      <SettingCard :icon="Palette" :title="t('app.theme')" :description="t('settings.themeDesc')" stacked>
        <div class="inline-flex rounded-lg border border-line bg-surface-2 p-0.5">
          <button
            v-for="o in themeOptions"
            :key="o.value"
            type="button"
            class="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors"
            :class="theme === o.value ? 'bg-accent text-accent-fg' : 'text-fg-muted hover:text-fg'"
            @click="theme = o.value"
          >
            <component :is="o.icon" class="h-3.5 w-3.5" />
            {{ t(o.label) }}
          </button>
        </div>
      </SettingCard>
      <SettingCard :icon="Languages" :title="t('app.language')" :description="t('settings.languageDesc')">
        <BaseSelect v-model="locale" :options="localeOptions" />
      </SettingCard>
    </section>

    <section class="space-y-3">
      <SectionTitle :title="t('settings.editor')" />
      <SettingCard :icon="TextWrap" :title="t('settings.wordWrap')" :description="t('settings.wordWrapDesc')">
        <BaseSwitch v-model="wordWrap" :on-label="t('common.on')" :off-label="t('common.off')" />
      </SettingCard>
      <SettingCard :icon="Type" :title="t('settings.fontSize')" :description="t('settings.fontSizeDesc')">
        <NumberInput v-model="editorFontSize" :min="10" :max="22" />
      </SettingCard>
    </section>

    <section class="space-y-3">
      <SectionTitle :title="t('settings.data')" />
      <SettingCard :icon="Star" :title="t('settings.clearFavorites')" :description="`${favorites.length}`">
        <BaseButton variant="outline" size="sm" :disabled="!favorites.length" @click="clearFavorites">{{ t('common.clear') }}</BaseButton>
      </SettingCard>
      <SettingCard :icon="History" :title="t('settings.clearRecents')" :description="`${recents.length}`">
        <BaseButton variant="outline" size="sm" :disabled="!recents.length" @click="clearRecents">{{ t('common.clear') }}</BaseButton>
      </SettingCard>
    </section>

    <section class="space-y-3">
      <SectionTitle :title="t('settings.about')" />
      <SettingCard :icon="Info" :title="t('app.name')" :description="t('settings.aboutDesc')">
        <span class="font-mono text-xs text-fg-muted">v{{ version }}</span>
      </SettingCard>
    </section>
  </div>
</template>
