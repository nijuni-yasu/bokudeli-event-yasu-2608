/* prettier-ignore */
// base workspace 向け Vue コンポーザブル auto-import スタブ（アプリ側 unplugin-auto-import 相当）
export {}
declare global {
  const computed: typeof import('vue')['computed']
  const ref: typeof import('vue')['ref']
  const watch: typeof import('vue')['watch']
  const inject: typeof import('vue')['inject']
  const provide: typeof import('vue')['provide']
  const nextTick: typeof import('vue')['nextTick']
  const onMounted: typeof import('vue')['onMounted']
  const onBeforeUnmount: typeof import('vue')['onBeforeUnmount']
  const useRoute: typeof import('vue-router')['useRoute']
  const useRouter: typeof import('vue-router')['useRouter']
  const useI18n: typeof import('vue-i18n')['useI18n']
  const storeToRefs: typeof import('pinia')['storeToRefs']
  const toRaw: typeof import('vue')['toRaw']
}
