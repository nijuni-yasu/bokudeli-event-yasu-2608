import type { NavLink, NavGroup } from '@layouts/types'
import { getHomePath, getCommunityListPath } from '@/router/utils'
import { mdiCalendarHeart, mdiAccountGroup, mdiNote, mdiHeart } from '@mdi/js'
import XIcon from '@/icons/x'

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
      title: $t('navigation.magagine'),
      href: 'https://note.com/shokujii/m/mc65c92109f2b',
      target: '_blank',
      icon: { icon: mdiNote },
    },
    {
      title: $t('navigation.x'),
      href: 'https://x.com/search?q=%23shokujii&src=typed_query&f=live',
      target: '_blank',
      icon: { icon: XIcon },
    },
    {
      title: $t('navigation.about'),
      href: 'https://about.shokujii.jp/',
      target: '_blank',
      icon: { icon: mdiHeart },
    },
  ]
}
