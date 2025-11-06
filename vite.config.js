import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // Use a different base when deploying to GitHub Pages
  base: process.env.GITHUB_PAGES === 'true' ? '/iava.ai/' : '/',
})
