export default [
  {
    title: 'イベント',
    to: { path: '/' },
    icon: { icon: 'mdi-calendar-star' },
  },
  {
    title: 'コミュニティ',
    to: { path: '/community' },
    icon: { icon: 'mdi-account-group' },
  },
  {
    title: 'コミュニティを作る',
    to: { path: '/community/setup' },
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
