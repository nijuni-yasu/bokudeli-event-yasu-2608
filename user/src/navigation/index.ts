import type { NavLink, NavGroup } from '@layouts/types'
import { getHomePath, getNewEventPath, getCommunityListPath } from '@/router/utils'
import { mdiCalendarHeart, mdiCalendarPlus, mdiAccountGroup, mdiFoodForkDrink } from '@mdi/js'

export const useNavItems = (): (NavLink | NavGroup)[] => {
  const { t: $t } = useI18n()
  return [
    {
      title: $t('navigation.home'),
      to: { path: getHomePath() },
      icon: { icon: mdiCalendarHeart },
    },
    {
      title: $t('navigation.new_event'),
      to: { path: getNewEventPath() },
      icon: { icon: mdiCalendarPlus },
    },
    {
      title: $t('navigation.community'),
      to: { path: getCommunityListPath() },
      icon: { icon: mdiAccountGroup },
    },
    {
      title: $t('navigation.about'),
      href: 'https://shokujii.studio.site/',
      target: '_blank',
      icon: { icon: mdiFoodForkDrink },
    },
  ]
}
