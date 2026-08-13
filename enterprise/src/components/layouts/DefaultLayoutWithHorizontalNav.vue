<script lang="ts" setup>
import { ref, watch, type PropType } from 'vue'
import EnterpriseNavbarLogo from '@/components/EnterpriseNavbarLogo.vue'
import { HorizontalNavLayout } from '@layouts'
import type { HorizontalNavItems } from '@layouts/types'

defineProps({
  navItems: {
    type: Array as PropType<HorizontalNavItems>,
    required: true,
  },
})

// SECTION: Loading Indicator
const isFallbackStateActive = ref(false)
const refLoadingIndicator = ref()

watch(
  [isFallbackStateActive, refLoadingIndicator],
  () => {
    if (isFallbackStateActive.value && refLoadingIndicator.value) refLoadingIndicator.value.fallbackHandle()

    if (!isFallbackStateActive.value && refLoadingIndicator.value) refLoadingIndicator.value.resolveHandle()
  },
  { immediate: true },
)
// !SECTION
</script>

<template>
  <HorizontalNavLayout :nav-items="navItems">
    <!-- 👉 navbar -->
    <template #navbar>
      <RouterLink to="/" class="d-flex align-start gap-x-4">
        <EnterpriseNavbarLogo />
      </RouterLink>

      <VSpacer />

      <slot name="navbar-icons"></slot>
    </template>

    <!-- 👉 Pages -->
    <RouterView v-slot="{ Component }">
      <Suspense :timeout="0" @fallback="isFallbackStateActive = true" @resolve="isFallbackStateActive = false">
        <Component :is="Component" />
        <template #fallback>
          <div class="loading">
            <div class="effect-1 effects"></div>
            <div class="effect-2 effects"></div>
            <div class="effect-3 effects"></div>
          </div>
        </template>
      </Suspense>
    </RouterView>

    <!-- 👉 Footer -->
    <template #footer>
      <slot name="footer"></slot>
    </template>
  </HorizontalNavLayout>
</template>
