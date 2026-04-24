import pluginJs from '@eslint/js'
import globals from 'globals'
import typescriptEslintPlugin from '@typescript-eslint/eslint-plugin'
import typescriptEslintParser from '@typescript-eslint/parser'

// 共通の基本設定
export const baseConfig = [
  {
    ignores: [
      'dist/**/*', // Ignore built files.
      'node_modules/**/*', // Ignore node_modules.
    ],
  },
  {
    languageOptions: {
      sourceType: 'module',
      globals: { ...globals.browser },
    },
    rules: {
      quotes: ['error', 'single'],
      curly: ['error', 'multi-line'],
      'no-console': ['warn', { allow: ['warn', 'error'] }],
    },
  },
  pluginJs.configs.recommended,
]

// 共通の TypeScript 設定
export const typescriptConfig = {
  files: ['**/*.ts', '**/*.tsx'],
  languageOptions: {
    parser: typescriptEslintParser,
    parserOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
    },
  },
  plugins: {
    '@typescript-eslint': typescriptEslintPlugin,
  },
  rules: {
    ...typescriptEslintPlugin.configs.recommended.rules,
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/no-unused-vars': 'warn',
    'no-console': ['warn', { allow: ['warn', 'error'] }],
    // TypeScript のオーバーロードを許可するために標準のルールをオフにし、TS 版を有効にする
    'no-redeclare': 'off',
    '@typescript-eslint/no-redeclare': 'error',
  },
}

// デフォルトエクスポート（ルートレベルでの使用）
export default [...baseConfig, typescriptConfig]
