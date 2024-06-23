import type { NavLink, NavGroup } from '@layouts/types'
import { getHomePath, getNewEventPath, getCommunityListPath } from '@/router/utils'
import { mdiCalendarHeart, mdiCalendarPlus, mdiAccountGroup, mdiFoodForkDrink } from '@mdi/js'

export const useNavItems = (): (NavLink | NavGroup)[] => {
  // const { t: $t } = useI18n()
  return [
    {
      title: 'イベント参加',
      to: { path: getHomePath() },
      icon: { icon: mdiCalendarHeart },
    },
    {
      title: 'イベント作成',
      to: { path: getNewEventPath() },
      icon: { icon: mdiCalendarPlus },
    },
    {
      title: 'コミュニティ',
      to: { path: getCommunityListPath() },
      icon: { icon: mdiAccountGroup },
    },
    {
      title: 'shokujiiって？',
      href: 'https://shokujii.studio.site/',
      target: '_blank',
      icon: { icon: mdiFoodForkDrink },
    },
  ]
}
