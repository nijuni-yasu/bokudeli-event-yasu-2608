module.exports = {
  env: {
    es2021: true,
    node: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:vue/vue3-recommended',
    'prettier',
    './.eslintrc-auto-import.json',
  ],
  parser: 'vue-eslint-parser',
  parserOptions: {
    parser: '@typescript-eslint/parser',
    sourceType: 'module',
    project: './tsconfig.json',
    extraFileExtensions: ['.vue'],
  },
  plugins: ['@typescript-eslint', 'vue'],
  root: true,
  ignorePatterns: ['.eslintrc.js'],
  rules: {
    'vue/multi-word-component-names': 'off',
    '@typescript-eslint/no-explicit-any': 'warn',
  },
  globals: { defineOptions: 'readonly' },
}
