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
    title: 'マイページ',
    to: { path: '/mypage' },
    icon: { icon: 'mdi-account' },
    loginRequired: true,
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
