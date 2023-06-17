<script lang="ts" setup>
import { useStoreStoredUser } from '@/stores/storedUser'
import { HorizontalNavGroup, HorizontalNavLink } from '@layouts/components'
import type { HorizontalNavItems, NavGroup, NavLink } from '@layouts/types'

const props = defineProps<{
  navItems: HorizontalNavItems
}>()

const { storedUser } = storeToRefs(useStoreStoredUser())

const items = computed(() => {
  return props.navItems.filter((item) => {
    const logined = !!storedUser.value
    return item.loginRequired === undefined || item.loginRequired === logined
  })
})

const resolveNavItemComponent = (item: NavLink | NavGroup) => {
  if ('children' in item)
    return HorizontalNavGroup

  return HorizontalNavLink
}
</script>

<template>
  <ul class="nav-items">
    <Component
      :is="resolveNavItemComponent(item)"
      v-for="(item, index) in items"
      :key="index"
      :item="item"
    />
  </ul>
</template>

<style lang="scss">
.layout-wrapper.layout-nav-type-horizontal {
  .nav-items {
    display: flex;
    flex-wrap: wrap;
  }
}
</style>
