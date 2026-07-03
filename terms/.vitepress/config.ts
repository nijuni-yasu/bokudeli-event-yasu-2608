import { defineConfig } from 'vitepress'

export default defineConfig({
  srcDir: 'content',
  outDir: 'dist',
  cleanUrls: true,
  title: 'shokujii',
  description: 'shokujii の利用規約・プライバシーポリシー等',
  lang: 'ja-JP',
  appearance: false,
  themeConfig: {
    nav: [],
    sidebar: false,
    siteTitle: false,
    outline: false,
    docFooter: {
      prev: false,
      next: false,
    },
  },
})
