import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// For custom domain on GitHub Pages (app.iava.ai), use base '/'
export default defineConfig({
  plugins: [react()],
  base: '/',
  server: {
    proxy: {
      // Proxy API calls to production in development
      // This allows the app to work with `npm run dev` without needing `vercel dev`
      '/api': {
        target: 'https://app.iava.ai',
        changeOrigin: true,
        secure: true,
      }
    }
  }
})
