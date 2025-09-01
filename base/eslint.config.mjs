import globals from 'globals'
import tseslint from 'typescript-eslint'
import pluginVue from 'eslint-plugin-vue'
import vueParser from 'vue-eslint-parser'
import { baseConfig, typescriptConfig } from '../eslint.config.mjs'

export default [
  // 共通設定を継承
  ...baseConfig,

  // TypeScript 設定を継承
  typescriptConfig,

  // Vue.js 固有の設定
  ...pluginVue.configs['flat/essential'],

  {
    ignores: ['materio/**'],
  },
  {
    files: ['**/*.js', '**/*.ts', '*.vue', '**/*.vue'],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.es2021,
      },
      parser: vueParser,
      parserOptions: {
        parser: tseslint.parser,
        sourceType: 'module',
        ecmaVersion: 'latest',
      },
    },
  },
  {
    rules: {
      'vue/multi-word-component-names': 'off',
      // 'no-undef' should be off because it's not working with auto-imports
      'no-undef': 'off',
    },
  },
]
