export default [
  {
    title: 'Home',
    // to: { name: 'index' },
    icon: { icon: 'mdi-home-outline' },
    children: [
      {
        title: 'TOP',
        to: 'index',
      },
      { title: 'コミュニティ', to: 'index' },
      {
        title: 'マイページ',
        to: 'index',
      },
      {
        title: 'イベント作成',
        to: 'index',
      },
    ],
  },
  {
    title: 'Second page',
    to: { name: 'second-page' },
    icon: { icon: 'mdi-file-document-outline' },
  },
]
