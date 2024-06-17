<script lang="ts" setup>
import { useI18n } from 'vue-i18n'
import { getNavItems } from '@/navigation'

import { themeConfig } from '@themeConfig'
import { VNodeRenderer } from '@layouts/components/VNodeRenderer'

// Components
import Footer from './Footer.vue'
import UserProfile from './UserProfile.vue'
import { HorizontalNavLayout } from '@layouts'

const { t: $t } = useI18n()
const navItems = getNavItems($t)

// SECTION: Loading Indicator
const isFallbackStateActive = ref(false)
const refLoadingIndicator = ref()

// watching if the fallback state is active and the refLoadingIndicator component is available
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
        <VNodeRenderer :nodes="themeConfig.app.logo" />
      </RouterLink>
      <VSpacer />

      <UserProfile />
    </template>

    <!-- 👉 Pages -->
    <RouterView v-slot="{ Component }">
      <Suspense :timeout="0" @fallback="isFallbackStateActive = true" @resolve="isFallbackStateActive = false">
        <Component :is="Component" />
      </Suspense>
    </RouterView>

    <!-- 👉 Footer -->
    <template #footer>
      <Footer />
    </template>
  </HorizontalNavLayout>
</template>
