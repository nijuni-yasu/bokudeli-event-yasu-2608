import { getHomePath, getNewEventPath, getCommunityListPath } from '@/router/utils'

export default [
  {
    title: 'イベント一覧',
    to: { path: getHomePath() },
    icon: { icon: 'mdi-calendar-heart' },
  },
  {
    title: 'コミュニティ一覧',
    to: { path: getCommunityListPath() },
    icon: { icon: 'mdi-account-group' },
  },
  {
    title: 'shokujiiって？',
    href: 'https://shokujii.studio.site/',
    target: '_blank',
    icon: { icon: 'mdi-food-fork-drink' },
  },
  {
    title: 'イベント作成',
    to: { path: getNewEventPath() },
    icon: { icon: 'mdi-calendar-plus' },
  },
  // {
  //   title: 'ログイン',
  //   to: { path: '/login' },
  //   icon: { icon: 'mdi-login' },
  //   loginRequired: false,
  // },
]
