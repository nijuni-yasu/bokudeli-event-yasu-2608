import { createLayouts } from '@layouts'

type LayoutUserConfig = Parameters<typeof createLayouts>[0]

/**
 * Materio `createLayouts` は `PartialDeep<LayoutConfig>` を要求するが、
 * `defineThemeConfig` が返す `LayoutConfig`（VNode 等）は type-fest の DeepPartial と互換にならない。
 * themeConfig → layouts プラグイン登録用の橋渡し（キャストは本関数に集約）。
 */
export function createLayoutsFromThemeConfig(themeLayoutConfig: unknown): ReturnType<typeof createLayouts> {
  return createLayouts(themeLayoutConfig as LayoutUserConfig)
}
