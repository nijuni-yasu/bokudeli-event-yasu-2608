import path from 'path'
import globals from 'globals'
import { fileURLToPath } from 'url'
import { baseConfig, typescriptConfig } from '../eslint.config.mjs'

const BASE_DIR = path.dirname(fileURLToPath(import.meta.url))

export default [
  { ignores: ['vitest.config.ts'] },

  // 共通設定を継承
  ...baseConfig,

  // TypeScript + Node.js + import 設定
  {
    ...typescriptConfig,
    languageOptions: {
      ...typescriptConfig.languageOptions,
      globals: { NodeJS: true, ...globals.node },
      parserOptions: {
        ...typescriptConfig.languageOptions.parserOptions,
        project: path.join(BASE_DIR, 'tsconfig.json'),
      },
    },
    plugins: {
      ...typescriptConfig.plugins,
    },
    settings: {
      'import/resolver': {
        typescript: {
          alwaysTryTypes: true,
          project: path.join(BASE_DIR, 'tsconfig.json'),
        },
        node: {
          extensions: ['.js', '.jsx', '.ts', '.tsx'],
        },
      },
      'import/parsers': {
        '@typescript-eslint/parser': ['.ts', '.tsx'],
      },
    },
    rules: {
      ...typescriptConfig.rules,
    },
  },
]
