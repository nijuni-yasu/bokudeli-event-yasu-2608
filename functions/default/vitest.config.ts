import { defineConfig } from 'vitest/config'

export default defineConfig({
  define: {
    IS_SERVER: JSON.stringify(true),
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
})
