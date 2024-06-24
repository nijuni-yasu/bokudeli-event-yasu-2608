import globals from 'globals'
import pluginJs from '@eslint/js'
import tseslint from 'typescript-eslint'
import pluginVue from 'eslint-plugin-vue'
import vueParser from 'vue-eslint-parser'
import disablePrettier from 'eslint-config-prettier'

export default [
  {
    ignores: ['node_modules', 'dist', 'src/@core', 'src/@layout', 'src/assets', '*.d.ts', '.gitignore']
  },
  {
    files: ['**/*.{vue,js,mjs,cjs,ts,tsx,mts}'],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.es2021
      },
      parser: vueParser,
      parserOptions: {
        parser: tseslint.parser,
        sourceType: 'module',
        ecmaVersion: 2021
      }
    }
  },
  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,
  ...pluginVue.configs['flat/essential'],
  disablePrettier,
  {
    rules: {
      'vue/multi-word-component-names': 'off',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': 'warn',
      // 'no-undef' should be off because it's not working with auto-imports
      'no-undef': 'off',
      'no-console': ['warn', { allow: ['warn', 'error'] }]
    }
  }
]
