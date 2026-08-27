import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { sentryVitePlugin } from '@sentry/vite-plugin'

const withSentry = process.env.SENTRY_AUTH_TOKEN &&
  process.env.SENTRY_ORG &&
  process.env.SENTRY_PROJECT

export default defineConfig({
  plugins: [
    react(),
    withSentry && sentryVitePlugin({
      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT,
      authToken: process.env.SENTRY_AUTH_TOKEN,
      sourcemaps: { filesToDeleteAfterUpload: ['dist/**/*.map'] },
    }),
  ].filter(Boolean),
  base: '/',
  build: {
    // Source maps are generated only when the Sentry plugin is active (CI with secrets set).
    // The plugin uploads them to Sentry and deletes the .map files before Pages deployment.
    sourcemap: !!withSentry,
  },
  test: {
    environment: 'node',
    include: ['src/**/__tests__/**/*.test.js'],
  },
})
