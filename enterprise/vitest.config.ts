import { defineConfig } from 'vitest/config'

import { alias } from './vite.alias'

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    passWithNoTests: true,
  },
  resolve: {
    alias,
  },
})
