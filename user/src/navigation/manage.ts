import type { NavLink, NavGroup } from '@layouts/types'
import { getManageCommunityListPath, getManageEventListPath } from '@/router/utils'
import { mdiCalendarHeart, mdiAccountGroup, mdiFoodForkDrink } from '@mdi/js'

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
      href: 'https://shokujii.studio.site/',
      target: '_blank',
      icon: { icon: mdiFoodForkDrink },
    },
  ]
}
