import type { HorizontalNavItems, VerticalNavItems } from '@layouts/types'
import { getCommunityPath, getMenuPath, getOrderPath, getShopPath } from './utils'
import { mdiHome, mdiStore, mdiFoodForkDrink, mdiBicycle, mdiLightbulbOnOutline, mdiAccountGroup } from '@mdi/js'

export const useNavItems = (): HorizontalNavItems | VerticalNavItems => {
  const { t: $t } = useI18n()
  return [
    {
      title: $t('navigation.home'),
      to: { path: '/' },
      icon: { icon: mdiHome },
    },
    {
      title: $t('navigation.shop'),
      to: { path: getShopPath() },
      icon: { icon: mdiStore },
    },
    {
      title: $t('navigation.menu'),
      to: { path: getMenuPath() },
      icon: { icon: mdiFoodForkDrink },
    },
    {
      title: $t('navigation.order'),
      to: { path: getOrderPath() },
      icon: { icon: mdiBicycle },
    },
    {
      title: $t('navigation.community'),
      to: { path: getCommunityPath() },
      icon: { icon: mdiAccountGroup },
    },
    {
      title: $t('navigation.manual'),
      href: 'https://bit.ly/4bFRS0E',
      target: '_blank',
      icon: { icon: mdiLightbulbOnOutline },
    },
  ]
}
