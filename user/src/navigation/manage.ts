import type { NavLink, NavGroup } from '@layouts/types'
import { getManageCommunityListPath, getManageEventListPath } from '@/router/utils'
import { mdiCalendarHeart, mdiAccountGroup, mdiFoodForkDrink, mdiHeart } from '@mdi/js'

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
      title: $t('navigation.guide'),
      href: 'https://bit.ly/3S3L8Sv',
      target: '_blank',
      icon: { icon: mdiFoodForkDrink },
    },
    {
      title: $t('navigation.about'),
      href: 'https://shokujii.studio.site/',
      target: '_blank',
      icon: { icon: mdiHeart },
    },
  ]
}
