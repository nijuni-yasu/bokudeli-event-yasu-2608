import type { NavLink, NavGroup } from '@layouts/types'
import type { ComposerTranslation } from 'vue-i18n'
import { getHomePath, getNewEventPath, getCommunityListPath } from '@/router/utils'

export const getNavItems = ($t: ComposerTranslation): (NavLink | NavGroup)[] => {
  return [
    {
      title: 'イベント参加',
      to: { path: getHomePath() },
      icon: { icon: 'mdi-calendar-heart' },
    },
    {
      title: 'イベント作成',
      to: { path: getNewEventPath() },
      icon: { icon: 'mdi-calendar-plus' },
    },
    {
      title: 'コミュニティ',
      to: { path: getCommunityListPath() },
      icon: { icon: 'mdi-account-group' },
    },
    {
      title: 'shokujiiって？',
      href: 'https://shokujii.studio.site/',
      target: '_blank',
      icon: { icon: 'mdi-food-fork-drink' },
    },
  ]
}
