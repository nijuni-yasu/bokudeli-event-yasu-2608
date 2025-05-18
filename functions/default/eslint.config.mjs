import pluginJs from '@eslint/js'
import importPlugin from 'eslint-plugin-import'
import globals from 'globals'
import typescriptEslintPlugin from '@typescript-eslint/eslint-plugin'
import typescriptEslintParser from '@typescript-eslint/parser'

export default [
  {
    ignores: [
      'dist/**/*', // Ignore built files.
      'tests/**/*', // Ignore test files.
      'lib/**/*', // Ignore built files.
    ],
  },
  {
    languageOptions: {
      sourceType: 'module',
      globals: { ...globals.browser },
    },
    rules: {
      quotes: ['error', 'single'],
    },
  },
  pluginJs.configs.recommended,
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      globals: { NodeJS: true, ...globals.node },
      parser: typescriptEslintParser,
      parserOptions: {
        project: ['tsconfig.json', 'tsconfig.dev.json'],
      },
    },
    plugins: {
      import: importPlugin,
      '@typescript-eslint': typescriptEslintPlugin,
    },
    rules: {
      ...importPlugin.configs.errors.rules,
      ...importPlugin.configs.warnings.rules,
      ...importPlugin.configs.typescript.rules,
      ...typescriptEslintPlugin.configs.rules,
      'import/no-unresolved': 'off',
      indent: ['error', 2],
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': ['error'],
    },
  },
]
