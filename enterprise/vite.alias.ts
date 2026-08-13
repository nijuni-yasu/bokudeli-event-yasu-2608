import { fileURLToPath, URL } from 'node:url'

const enterpriseFirebaseClient = fileURLToPath(new URL('./src/firebase.client.ts', import.meta.url))

// vite.config.ts と vitest.config.ts で共有する resolve.alias の単一定義。
export const alias = {
  '@shokujii/base/firebase.js': enterpriseFirebaseClient,
  '@shokujii/base/firebase': enterpriseFirebaseClient,
  '@': fileURLToPath(new URL('./src', import.meta.url)),
  '@themeConfig': fileURLToPath(new URL('./src/themeConfig.ts', import.meta.url)),
  '@core': fileURLToPath(new URL('./src/@core', import.meta.url)),
  '@layouts': fileURLToPath(new URL('./src/@layouts', import.meta.url)),
  '@styles': fileURLToPath(new URL('./src/styles/', import.meta.url)),
  '@configured-variables': fileURLToPath(new URL('./src/styles/variables/_template.scss', import.meta.url)),
}
