/// <reference types="vitest" />

import legacy from '@vitejs/plugin-legacy'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react(), legacy()],
  server: {
    proxy: {
      '/mi': {
        target: 'https://fhd.aostng.ru',
        changeOrigin: true,
        secure: false,
        timeout: 20000,
        proxyTimeout: 20000,
        configure: (proxy) => {
          proxy.on('error', (err, req) => {
            console.log('[proxy error]', req?.url, err?.message)
          })
          proxy.on('proxyRes', (proxyRes, req) => {
            console.log('[proxyRes]', req?.url, proxyRes.statusCode)
          })
        }
      }
    }
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/setupTests.ts',
  }
})