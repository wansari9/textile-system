import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { designCss, fonts } from './src/design'

/**
 * Injects the design system (CSS theme + font links) from `src/design.ts`.
 * `src/index.css` is intentionally an empty stub so there is one source of truth.
 */
function designSystem(): Plugin {
  return {
    name: 'amirtex-design-system',
    enforce: 'pre',
    transform(_code, id) {
      const file = id.split('?')[0].replace(/\\/g, '/')
      if (file.endsWith('/src/index.css')) {
        return { code: designCss, map: null }
      }
      return null
    },
    transformIndexHtml() {
      return [
        {
          tag: 'link',
          attrs: { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
          injectTo: 'head-prepend',
        },
        {
          tag: 'link',
          attrs: { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
          injectTo: 'head-prepend',
        },
        {
          tag: 'link',
          attrs: { rel: 'stylesheet', href: fonts.googleHref },
          injectTo: 'head',
        },
      ]
    },
  }
}

export default defineConfig({
  plugins: [
    designSystem(),
    react(),
    tailwindcss(),
  ],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        proxyTimeout: 120_000,
        timeout: 120_000,
      },
    },
  },
})
