import { getHomePath, getCommunityCreatePath, getCommunityListPath } from '@/router/utils'

export default [
  {
    title: 'イベント',
    to: { path: getHomePath() },
    icon: { icon: 'mdi-calendar-star' },
  },
  {
    title: 'コミュニティ',
    to: { path: getCommunityListPath() },
    icon: { icon: 'mdi-account-group' },
  },
  {
    title: 'コミュニティを作る',
    to: { path: getCommunityCreatePath() },
    icon: { icon: 'mdi-heart-outline' },
  },
  {
    title: 'shokujiiって？',
    href: 'https://shokujii.studio.site/',
    target: '_blank',
    icon: { icon: 'mdi-lightbulb-on-outline' },
  },
  {
    title: 'カート',
    to: { path: '/cart' },
    icon: { icon: 'mdi-cart-outline' },
    loginRequired: true,
  },
  // {
  //   title: 'ログイン',
  //   to: { path: '/login' },
  //   icon: { icon: 'mdi-login' },
  //   loginRequired: false,
  // },
]
