import { defineConfig } from 'vitest/config'

import { alias } from './vite.alias'

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
  },
  resolve: {
    alias,
  },
})
