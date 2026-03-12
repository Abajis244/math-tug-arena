import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: '/math-tug-arena/', 
  plugins: [
    react(),
    VitePWA({ 
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}']
      },
      includeAssets: ['icon-192.png', 'icon-512.png'],
      manifest: {
        name: 'Math Tug Arena',
        short_name: 'Math Tug',
        description: 'Cybernetic Math Combat Arena',
        theme_color: '#020617',
        background_color: '#020617',
        display: 'standalone',
        start_url: '/math-tug-arena/', // Crucial for GitHub Pages
        scope: '/math-tug-arena/', // Crucial for GitHub Pages
        icons: [
          {
            src: 'icon-192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'icon-512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ],
})