<script setup lang="ts">
import { computed, ref } from 'vue'
import { Blend, Droplet, Layers, MoveHorizontal, MoveVertical, Palette, RotateCcw, Copy, SquareRoundCorner, Sparkles, SunMoon } from 'lucide-vue-next'
import ConfigSection from '@/components/ui/ConfigSection.vue'
import SettingCard from '@/components/ui/SettingCard.vue'
import NumberInput from '@/components/ui/NumberInput.vue'
import RangeSlider from '@/components/ui/RangeSlider.vue'
import IconButton from '@/components/ui/IconButton.vue'
import SectionTitle from '@/components/ui/SectionTitle.vue'
import CodeEditor from '@/components/ui/CodeEditor.vue'
import { useI18n } from '@/i18n'
import { useClipboard } from '@/composables/useClipboard'
import {
  DEFAULT_SMOOTH_OPTIONS,
  SHADOW_STYLES,
  SMOOTH_PRESETS,
  layersToCss,
  smoothShadowLayers,
  toCssDeclaration,
  toTailwindClass,
  type SmoothPreset,
  type SmoothShadowOptions,
} from './boxShadow'
import { SHADOW_EXAMPLES } from './boxShadowExamples'

const { t } = useI18n()
const tt = (k: string, p?: Record<string, string | number>) => t(`tools.box-shadow.${k}`, p)
const { copy } = useClipboard()

type Mode = 'smooth' | 'examples'
const mode = ref<Mode>('smooth')

const style = ref(DEFAULT_SMOOTH_OPTIONS.style)
const layers = ref(DEFAULT_SMOOTH_OPTIONS.layers)
const opacity = ref(DEFAULT_SMOOTH_OPTIONS.opacity)
const blur = ref(DEFAULT_SMOOTH_OPTIONS.blur)
const y = ref(DEFAULT_SMOOTH_OPTIONS.y)
const x = ref(DEFAULT_SMOOTH_OPTIONS.x)
const shadowColor = ref(DEFAULT_SMOOTH_OPTIONS.color)

const LIGHT = { background: '#f3f4f6', box: '#ffffff' }
const DARK = { background: '#0f172a', box: '#1e293b' }
const background = ref(LIGHT.background)
const boxColor = ref(LIGHT.box)
const radius = ref(6)

const selected = ref(0)

const options = computed<SmoothShadowOptions>(() => ({
  style: style.value,
  layers: layers.value,
  opacity: opacity.value,
  blur: blur.value,
  y: y.value,
  x: x.value,
  color: shadowColor.value,
}))
const smoothCss = (o: SmoothShadowOptions) => layersToCss(smoothShadowLayers(o)).join(', ')

const example = computed(() => SHADOW_EXAMPLES[selected.value]!)
const shadow = computed(() => (mode.value === 'smooth' ? smoothCss(options.value) : example.value.css))
const previewRadius = computed(() => (mode.value === 'examples' ? (example.value.radius ?? radius.value) : radius.value))

const css = computed(() => toCssDeclaration(shadow.value))
const tailwind = computed(() => toTailwindClass(shadow.value))

const presetGroups = computed(() => {
  const groups = new Map<SmoothPreset['collection'], SmoothPreset[]>()
  for (const p of SMOOTH_PRESETS) groups.set(p.collection, [...(groups.get(p.collection) ?? []), p])
  return [...groups]
})
const presetCss = (p: SmoothPreset) => smoothCss({ ...p.options, color: shadowColor.value })
const isPreset = (p: SmoothPreset) => (Object.keys(p.options) as (keyof SmoothPreset['options'])[]).every((k) => p.options[k] === options.value[k])

function applyPreset(p: SmoothPreset) {
  style.value = p.options.style
  layers.value = p.options.layers
  opacity.value = p.options.opacity
  blur.value = p.options.blur
  y.value = p.options.y
  x.value = p.options.x
}
function resetDistance() {
  y.value = DEFAULT_SMOOTH_OPTIONS.y
  x.value = DEFAULT_SMOOTH_OPTIONS.x
}
function setScheme(s: typeof LIGHT) {
  background.value = s.background
  boxColor.value = s.box
}

const chip = (on: boolean) => [
  'inline-flex h-7 items-center gap-1 rounded-md border px-2.5 text-xs font-medium whitespace-nowrap transition-colors focus-ring',
  on ? 'border-accent/40 bg-accent-soft text-accent' : 'border-line text-fg-muted hover:text-fg hover:bg-surface-3',
]
const swatch =
  'block h-8 w-8 cursor-pointer rounded-md border border-line-strong bg-transparent p-0 [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:rounded-[5px] [&::-webkit-color-swatch]:border-0 [&::-moz-color-swatch]:border-0'
</script>

<template>
  <div class="space-y-6">
    <div class="inline-flex rounded-lg border border-line bg-surface p-0.5" role="tablist">
      <button
        v-for="m in (['smooth', 'examples'] as Mode[])"
        :key="m"
        type="button"
        role="tab"
        :aria-selected="mode === m"
        class="h-8 rounded-md px-3 text-sm font-medium transition-colors focus-ring"
        :class="mode === m ? 'bg-accent-soft text-accent' : 'text-fg-muted hover:text-fg'"
        @click="mode = m"
      >
        {{ tt(m === 'smooth' ? 'modeSmooth' : 'modeExamples') }}
      </button>
    </div>

    <div class="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-start">
      <div class="space-y-6">
        <ConfigSection>
          <template v-if="mode === 'smooth'">
            <SettingCard :icon="Sparkles" :title="tt('style')" :description="tt('styleDesc')">
              <button v-for="s in SHADOW_STYLES" :key="s" type="button" :class="chip(style === s)" :aria-pressed="style === s" @click="style = s">
                {{ tt(s) }}
              </button>
            </SettingCard>
            <SettingCard :icon="Blend" :title="tt('opacity')" :description="tt('opacityDesc')" stacked>
              <RangeSlider v-model="opacity" :min="0.01" :max="1" :step="0.01" />
            </SettingCard>
            <SettingCard :icon="Droplet" :title="tt('blur')" :description="tt('blurDesc')" stacked>
              <RangeSlider v-model="blur" :min="0" :max="512" />
            </SettingCard>
            <SettingCard :icon="Layers" :title="tt('layers')" :description="tt('layersDesc')" stacked>
              <RangeSlider v-model="layers" :min="1" :max="10" />
            </SettingCard>
            <SettingCard :icon="MoveVertical" :title="tt('vertical')" :description="tt('verticalDesc')" stacked>
              <RangeSlider v-model="y" :min="-512" :max="512" />
            </SettingCard>
            <SettingCard :icon="MoveHorizontal" :title="tt('horizontal')" :description="tt('horizontalDesc')" stacked>
              <RangeSlider v-model="x" :min="-512" :max="512" />
              <IconButton :title="tt('resetDistance')" @click="resetDistance"><RotateCcw class="h-4 w-4" /></IconButton>
            </SettingCard>
          </template>
          <SettingCard :icon="Palette" :title="tt('colors')" :description="tt('colorsDesc')" stacked>
            <label v-if="mode === 'smooth'" class="flex items-center gap-1.5 text-xs text-fg-muted">
              <input v-model="shadowColor" type="color" :class="swatch" />{{ tt('shadowColor') }}
            </label>
            <label class="flex items-center gap-1.5 text-xs text-fg-muted">
              <input v-model="background" type="color" :class="swatch" />{{ tt('background') }}
            </label>
            <label class="flex items-center gap-1.5 text-xs text-fg-muted">
              <input v-model="boxColor" type="color" :class="swatch" />{{ tt('box') }}
            </label>
          </SettingCard>
          <SettingCard :icon="SunMoon" :title="tt('scheme')" :description="tt('schemeDesc')">
            <button type="button" :class="chip(background === LIGHT.background && boxColor === LIGHT.box)" @click="setScheme(LIGHT)">{{ tt('light') }}</button>
            <button type="button" :class="chip(background === DARK.background && boxColor === DARK.box)" @click="setScheme(DARK)">{{ tt('dark') }}</button>
          </SettingCard>
          <SettingCard :icon="SquareRoundCorner" :title="tt('radius')" :description="tt('radiusDesc')">
            <NumberInput v-model="radius" :min="0" :max="200" size="sm" />
          </SettingCard>
        </ConfigSection>

        <section v-if="mode === 'smooth'" class="space-y-2.5">
          <SectionTitle :title="tt('presets')" />
          <div v-for="[collection, presets] in presetGroups" :key="collection" class="space-y-1.5">
            <div class="text-xs font-medium text-fg-muted">{{ tt(`collection${collection[0]!.toUpperCase()}${collection.slice(1)}`) }}</div>
            <div class="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <button
                v-for="p in presets"
                :key="p.size"
                type="button"
                class="flex flex-col items-center gap-2 overflow-hidden rounded-card border px-3 pb-2 pt-4 focus-ring"
                :class="isPreset(p) ? 'border-accent ring-2 ring-accent' : 'border-line hover:border-line-strong'"
                :style="{ backgroundColor: background }"
                @click="applyPreset(p)"
              >
                <span class="block aspect-[1.6] w-16" :style="{ backgroundColor: boxColor, borderRadius: `${radius}px`, boxShadow: presetCss(p) }" />
                <span class="relative font-mono text-[11px] text-fg-muted">{{ p.size }}px</span>
              </button>
            </div>
          </div>
        </section>

        <section v-else class="space-y-2.5">
          <SectionTitle :title="tt('examples')" />
          <p class="text-xs text-fg-muted">
            {{ tt('examplesDesc') }}
            <a href="https://getcssscan.com/css-box-shadow-examples" target="_blank" rel="noopener noreferrer" class="text-accent hover:underline">CSS Scan</a>
          </p>
          <div class="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-4">
            <div v-for="(e, i) in SHADOW_EXAMPLES" :key="i" class="group relative">
              <button
                type="button"
                class="flex w-full flex-col items-center gap-3 overflow-hidden rounded-card border px-3 pb-2 pt-7 focus-ring"
                :class="selected === i ? 'border-accent ring-2 ring-accent' : 'border-line hover:border-line-strong'"
                :style="{ backgroundColor: background }"
                :aria-label="`#${i} ${e.css}`"
                @click="selected = i"
              >
                <span class="block aspect-square w-14" :style="{ backgroundColor: boxColor, borderRadius: `${e.radius ?? radius}px`, boxShadow: e.css }" />
                <span class="relative mt-4 truncate text-[11px] text-fg-muted">
                  <span class="font-mono">#{{ i }}</span>
                  <template v-if="e.credits"> · {{ e.credits }}</template>
                </span>
              </button>
              <button
                type="button"
                :title="tt('copyExample')"
                :aria-label="tt('copyExample')"
                class="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-md bg-surface/80 text-fg-muted opacity-60 hover:text-fg focus-ring group-hover:opacity-100 focus:opacity-100"
                @click="copy(toCssDeclaration(e.css))"
              >
                <Copy class="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </section>
      </div>

      <div class="space-y-6 lg:sticky lg:top-4">
        <section class="space-y-2.5">
          <SectionTitle :title="tt('preview')" />
          <div class="flex h-72 items-center justify-center overflow-hidden rounded-card border border-line sm:h-80" :style="{ backgroundColor: background }">
            <div class="aspect-[1.6] w-40" :style="{ backgroundColor: boxColor, borderRadius: `${previewRadius}px`, boxShadow: shadow }" />
          </div>
        </section>
        <CodeEditor :model-value="css" readonly label="CSS" height-class="min-h-[12rem]" filename="box-shadow.css" :show-stats="false" />
        <CodeEditor :model-value="tailwind" readonly label="Tailwind CSS" height-class="min-h-[7rem]" filename="box-shadow.txt" :show-stats="false" default-wrap />
      </div>
    </div>
  </div>
</template>
