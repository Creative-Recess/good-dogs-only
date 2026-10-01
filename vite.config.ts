/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // The whole breed catalogue (src/data/breeds.json) is bundled on purpose: it's ~150 KB gzipped and needed at once.
  build: { chunkSizeWarningLimit: 800 },
  test: {
    include: ['src/**/*.test.ts', 'scripts/**/*.test.ts'],
  },
})
