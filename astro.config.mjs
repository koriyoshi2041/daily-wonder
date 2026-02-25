// @ts-check
import { defineConfig } from 'astro/config'

export default defineConfig({
  site: 'https://daily-wonder.pages.dev',
  output: 'static',
  build: {
    assets: '_assets',
  },
  vite: {
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            p5: ['p5'],
          },
        },
      },
    },
  },
})
