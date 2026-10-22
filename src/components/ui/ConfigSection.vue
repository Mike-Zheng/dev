<script setup lang="ts">
import SectionTitle from './SectionTitle.vue'
import { useI18n } from '@/i18n'

defineProps<{ title?: string }>()
const { t } = useI18n()
</script>

<template>
  <section class="space-y-2.5">
    <SectionTitle :title="title ?? t('common.configuration')" />
    <div class="space-y-2">
      <slot />
    </div>
  </section>
</template>
