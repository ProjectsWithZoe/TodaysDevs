import { defineConfig } from 'vite'
import tailwindcss      from '@tailwindcss/vite'
import react            from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/api': {
        target: 'https://api.todaysdevs.com',
        changeOrigin: true,
        rewrite: path => path.replace(/^\/api/, '')
      },
    }
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          sentry: ['@sentry/react', '@sentry/tracing']
        }
      }
    }
  }
})