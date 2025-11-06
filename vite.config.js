import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// For custom domain on GitHub Pages (app.iava.ai), use base '/'
export default defineConfig({
  plugins: [react()],
  base: '/',
})
