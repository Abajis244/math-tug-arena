import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  // Ensure the base matches your GitHub repository name
  base: '/math-tug-arena/', 
  plugins: [
    react()
    // VitePWA has been removed to stop service worker registration and 404 errors
  ],
})