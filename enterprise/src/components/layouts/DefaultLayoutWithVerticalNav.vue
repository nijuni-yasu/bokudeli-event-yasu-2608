<script lang="ts" setup>
import { ref, watch, type PropType } from 'vue'
import { VerticalNavLayout } from '@layouts'
import type { VerticalNavItems } from '@layouts/types'
import { mdiMenu } from '@mdi/js'
import EnterpriseVerticalNavHeader from '@/components/EnterpriseVerticalNavHeader.vue'
import { registerVerticalOverlayNavClose } from '@/composable/useVerticalOverlayNavClose'

defineProps({
  navItems: {
    type: Array as PropType<VerticalNavItems>,
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

function ensureVerticalOverlayNavToggleRegistered(
  toggle: NonNullable<Parameters<typeof registerVerticalOverlayNavClose>[0]>,
): boolean {
  registerVerticalOverlayNavClose(toggle)
  return false
}
</script>

<template>
  <VerticalNavLayout :nav-items="navItems">
    <template #vertical-nav-header>
      <EnterpriseVerticalNavHeader />
    </template>

    <!-- 👉 navbar -->
    <template #navbar="{ toggleVerticalOverlayNavActive }">
      <template v-if="ensureVerticalOverlayNavToggleRegistered(toggleVerticalOverlayNavActive)" />
      <div class="d-flex h-100 align-center">
        <IconBtn id="vertical-nav-toggle-btn" class="ms-n2 d-lg-none" @click="toggleVerticalOverlayNavActive(true)">
          <VIcon :icon="mdiMenu" />
        </IconBtn>

        <VSpacer />

        <slot name="navbar-icons"></slot>
      </div>
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
  </VerticalNavLayout>
</template>
