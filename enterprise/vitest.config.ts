import { defineConfig } from 'vitest/config'

import { alias } from './vite.alias'

export default defineConfig({
  define: {
    IS_SERVER: JSON.stringify(true),
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    passWithNoTests: true,
  },
  resolve: {
    alias,
  },
})
