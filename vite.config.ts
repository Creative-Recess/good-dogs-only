/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vite'
import { scopeCss } from './scripts/lib/scope-css.ts'

/** 98.css styles bare elements (button, fieldset, select...). Fence it in to the Windows 98 theme at build time. */
const scope98css = (): Plugin => ({
  name: 'scope-98css',
  enforce: 'pre',
  transform(code, id) {
    if (id.endsWith('/src/vendor/98css/98.css')) return scopeCss(code, 'vendor', ':root[data-theme="win98"]')
  },
})

// https://vite.dev/config/
export default defineConfig({
  plugins: [scope98css(), react()],
  // The whole breed catalogue (src/data/breeds.json) is bundled on purpose: it's ~150 KB gzipped and needed at once.
  // Safari 17.4 is the first with CSS @scope, which the themes rely on.
  build: { chunkSizeWarningLimit: 800, target: ['safari17.4', 'es2022'], cssTarget: ['safari17.4'] },
  test: {
    include: ['src/**/*.test.ts', 'scripts/**/*.test.ts', 'worker/**/*.test.ts'],
  },
})
