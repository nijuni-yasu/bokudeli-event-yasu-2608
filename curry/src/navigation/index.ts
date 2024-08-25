import type { NavLink, NavGroup } from '@layouts/types'
import { getHomePath, getCommunityListPath } from '@/router/utils'
import { mdiCalendarHeart, mdiAccountGroup, mdiFoodForkDrink, mdiBowlMix } from '@mdi/js'

export const useNavItems = (): (NavLink | NavGroup)[] => {
  const { t: $t } = useI18n()
  return [
    {
      title: $t('navigation.home'),
      to: { path: getHomePath() },
      icon: { icon: mdiCalendarHeart },
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
    {
      title: $t('navigation.curry'),
      href: 'https://kanda-curry.com/',
      target: '_blank',
      icon: { icon: mdiBowlMix },
    },
  ]
}
