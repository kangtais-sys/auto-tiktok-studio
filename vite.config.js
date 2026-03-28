import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/heygen': {
        target: 'https://api.heygen.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/heygen/, '')
      },
      '/tiktok': {
        target: 'https://open.tiktokapis.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/tiktok/, '')
      }
    }
  }
})
