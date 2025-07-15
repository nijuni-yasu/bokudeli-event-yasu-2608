import importPlugin from 'eslint-plugin-import'
import globals from 'globals'
import { baseConfig, typescriptConfig } from '../../eslint.config.mjs'

export default [
  ...baseConfig,
  {
    ignores: ['dist/**/*', 'lib/**/*'],
  },
  {
    ...typescriptConfig,
    languageOptions: {
      ...typescriptConfig.languageOptions,
      globals: { NodeJS: true, ...globals.node },
    },
    plugins: {
      ...typescriptConfig.plugins,
      import: importPlugin,
    },
    settings: {
      'import/resolver': {
        typescript: {
          project: './tsconfig.json',
        },
      },
    },
    rules: {
      ...typescriptConfig.rules,
      ...importPlugin.configs.errors.rules,
      ...importPlugin.configs.warnings.rules,
      ...importPlugin.configs.typescript.rules,
      'no-restricted-syntax': [
        'error',
        // Rule for logger.debug
        {
          selector: 'CallExpression[callee.object.name="logger"][callee.property.name="debug"]',
          message: 'logger.debug() is not allowed in production code. Please remove it after debugging.',
        },
        // Rule for logger.log
        {
          selector: 'CallExpression[callee.object.name="logger"][callee.property.name="log"]',
          message: 'Avoid using logger.log(). Please use a more specific log level like .info(), .warn(), or .error().',
        },
      ],
    },
  },
]
