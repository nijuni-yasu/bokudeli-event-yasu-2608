import type { HorizontalNavItems, VerticalNavItems } from '@layouts/types'
import { getMenuPath, getOrderPath, getShopPath } from './utils'
import {
  mdiHome,
  mdiStorefrontOutline,
  mdiFoodForkDrink,
  mdiTruckOutline,
  mdiLightbulbOnOutline,
  mdiHeartOutline,
} from '@mdi/js'

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
      icon: { icon: mdiStorefrontOutline },
    },
    {
      title: $t('navigation.menu'),
      to: { path: getMenuPath() },
      icon: { icon: mdiFoodForkDrink },
    },
    {
      title: $t('navigation.order'),
      to: { path: getOrderPath() },
      icon: { icon: mdiTruckOutline },
    },
    {
      title: $t('navigation.manual'),
      href: 'https://bit.ly/4fYBbiJ',
      target: '_blank',
      icon: { icon: mdiLightbulbOnOutline },
    },
    {
      title: $t('navigation.shokujii'),
      href: 'https://shokujii.jp/',
      target: '_blank',
      icon: { icon: mdiHeartOutline },
    },
    {
      title: $t('navigation.about'),
      href: 'https://about.shokujii.jp/',
      target: '_blank',
      icon: { icon: mdiHeartOutline },
    },
  ]
}
