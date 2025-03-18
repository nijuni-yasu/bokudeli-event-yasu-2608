import type { NavLink, NavGroup } from '@layouts/types'
import { getManageCommunityListPath, getManageEventListPath } from '@/router/utils'
import { mdiCalendarHeart, mdiAccountGroup, mdiFoodForkDrink, mdiHeart, mdiBullhornVariant, mdiPalette } from '@mdi/js'

export const useNavItems = (): (NavLink | NavGroup)[] => {
  const { t: $t } = useI18n()
  return [
    {
      title: $t('navigation.manage_community'),
      to: { path: getManageCommunityListPath() },
      icon: { icon: mdiAccountGroup },
    },
    {
      title: $t('navigation.manage_event'),
      to: { path: getManageEventListPath() },
      icon: { icon: mdiCalendarHeart },
    },
    {
      title: $t('navigation.guide_top'),
      href: 'https://bit.ly/3S3L8Sv',
      target: '_blank',
      icon: { icon: mdiFoodForkDrink },
    },
    {
      title: $t('navigation.guide_announce'),
      href: 'https://bit.ly/40UmEzA',
      target: '_blank',
      icon: { icon: mdiBullhornVariant },
    },
    {
      title: $t('navigation.canva_template'),
      href: 'https://bit.ly/3AuP9ZV',
      target: '_blank',
      icon: { icon: mdiPalette },
    },
    {
      title: $t('navigation.about'),
      href: 'https://shokujii.studio.site/',
      target: '_blank',
      icon: { icon: mdiHeart },
    },
  ]
}
