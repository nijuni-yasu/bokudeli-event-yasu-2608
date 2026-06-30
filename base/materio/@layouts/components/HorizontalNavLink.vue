<script lang="ts" setup>
import { layoutConfig } from '..'
import { can } from '../plugins/casl'
import type { NavLink } from '../types'
import { getComputedNavLinkToProp, getDynamicI18nProps, isNavLinkActive } from '../utils'

interface Props {
  item: NavLink

  // ℹ️ We haven't added this prop in vertical nav because we don't need such differentiation in vertical nav for styling
  isSubItem?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isSubItem: false,
})

const handleClick = () => {
  void props.item.onClick?.()
}
</script>

<template>
  <li
    v-if="can(item.action, item.subject)"
    class="nav-link"
    :class="[
      {
        'sub-item': props.isSubItem,
        disabled: item.disable,
      },
    ]"
  >
    <Component
      :is="item.onClick ? 'button' : item.to ? 'RouterLink' : 'a'"
      v-bind="item.onClick ? { type: 'button' } : getComputedNavLinkToProp(item)"
      :class="{ 'router-link-active router-link-exact-active': isNavLinkActive(item, $router) }"
      @click="item.onClick ? handleClick : undefined"
    >
      <Component
        :is="layoutConfig.app.iconRenderer || 'div'"
        class="nav-item-icon"
        v-bind="item.icon || layoutConfig.verticalNav.defaultNavItemIconProps"
      />
      <Component
        :is="layoutConfig.app.i18n.enable ? 'i18n-t' : 'span'"
        class="nav-item-title"
        v-bind="getDynamicI18nProps(item.title, 'span')"
      >
        {{ item.title }}
      </Component>
    </Component>
  </li>
</template>

<style lang="scss">
.layout-horizontal-nav {
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
  }
}
</style>
