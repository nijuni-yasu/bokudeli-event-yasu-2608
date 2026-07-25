import { watch, type WatchSource } from 'vue'

export const useAutoLoadWhenEmpty = (
  deps: WatchSource<unknown>[],
  config: { shouldLoad: () => boolean; load: () => void },
): void => {
  watch(deps, () => {
    if (config.shouldLoad()) {
      config.load()
    }
  })
}
