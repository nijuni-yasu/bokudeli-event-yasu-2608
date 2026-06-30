<script lang="ts" setup>
import { layoutConfig } from '..'
import { can } from '../plugins/casl'
import { useLayoutConfigStore } from '../stores/config'
import type { NavLink } from '../types'
import { getComputedNavLinkToProp, getDynamicI18nProps, isNavLinkActive } from '../utils'

const props = defineProps<{
  item: NavLink
}>()

const configStore = useLayoutConfigStore()
const hideTitleAndBadge = configStore.isVerticalNavMini()

const handleClick = () => {
  void props.item.onClick?.()
}
</script>

<template>
  <li v-if="can(item.action, item.subject)" class="nav-link" :class="{ disabled: item.disable }">
    <Component
      :is="item.onClick ? 'button' : item.to ? 'RouterLink' : 'a'"
      v-bind="item.onClick ? { type: 'button' } : getComputedNavLinkToProp(item)"
      :class="{ 'router-link-active router-link-exact-active': isNavLinkActive(item, $router) }"
      @click="item.onClick ? handleClick : undefined"
    >
      <Component
        :is="layoutConfig.app.iconRenderer || 'div'"
        v-bind="item.icon || layoutConfig.verticalNav.defaultNavItemIconProps"
        class="nav-item-icon"
      />
      <TransitionGroup name="transition-slide-x">
        <!-- 👉 Title -->
        <Component
          :is="layoutConfig.app.i18n.enable ? 'i18n-t' : 'span'"
          v-show="!hideTitleAndBadge"
          key="title"
          class="nav-item-title"
          v-bind="getDynamicI18nProps(item.title, 'span')"
        >
          {{ item.title }}
        </Component>

        <!-- 👉 Badge -->
        <Component
          :is="layoutConfig.app.i18n.enable ? 'i18n-t' : 'span'"
          v-if="item.badgeContent"
          v-show="!hideTitleAndBadge"
          key="badge"
          class="nav-item-badge"
          :class="item.badgeClass"
          v-bind="getDynamicI18nProps(item.badgeContent, 'span')"
        >
          {{ item.badgeContent }}
        </Component>
      </TransitionGroup>
    </Component>
  </li>
</template>

<style lang="scss">
.layout-vertical-nav {
  .nav-link a,
  .nav-link button {
    display: flex;
    align-items: center;
  }

  .nav-link button {
    background: none;
    border: none;
    cursor: pointer;
    font: inherit;
    color: inherit;
    padding: 0;
    text-align: inherit;
    inline-size: 100%;
  }
}
</style>
