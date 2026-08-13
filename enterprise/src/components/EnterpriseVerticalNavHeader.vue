<script setup lang="ts">
import EnterpriseNavbarLogo from '@/components/EnterpriseNavbarLogo.vue'
import { closeVerticalOverlayNav } from '@/composable/useVerticalOverlayNavClose'
import { layoutConfig } from '@layouts'
import { useLayoutConfigStore } from '@layouts/stores/config'
import { injectionKeyIsVerticalNavHovered } from '@layouts/symbols'

const configStore = useLayoutConfigStore()
const isHovered = inject(injectionKeyIsVerticalNavHovered, ref(false))
const hideTitleAndIcon = configStore.isVerticalNavMini(isHovered)
</script>

<template>
  <RouterLink to="/" class="app-logo app-title-wrapper">
    <EnterpriseNavbarLogo />

    <Transition name="vertical-nav-app-title">
      <h1 v-show="!hideTitleAndIcon" class="app-logo-title leading-normal">
        {{ layoutConfig.app.title }}
      </h1>
    </Transition>
  </RouterLink>
  <Component
    :is="layoutConfig.app.iconRenderer || 'div'"
    v-show="configStore.isVerticalNavCollapsed"
    class="header-action d-none nav-unpin"
    :class="configStore.isVerticalNavCollapsed && 'd-lg-block'"
    v-bind="layoutConfig.icons.verticalNavUnPinned"
    @click="configStore.isVerticalNavCollapsed = !configStore.isVerticalNavCollapsed"
  />
  <Component
    :is="layoutConfig.app.iconRenderer || 'div'"
    v-show="!configStore.isVerticalNavCollapsed"
    class="header-action d-none nav-pin"
    :class="!configStore.isVerticalNavCollapsed && 'd-lg-block'"
    v-bind="layoutConfig.icons.verticalNavPinned"
    @click="configStore.isVerticalNavCollapsed = !configStore.isVerticalNavCollapsed"
  />
  <Component
    :is="layoutConfig.app.iconRenderer || 'div'"
    class="header-action d-lg-none"
    v-bind="layoutConfig.icons.close"
    @click="closeVerticalOverlayNav()"
  />
</template>
