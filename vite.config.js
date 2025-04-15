import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      manifest: {
        name: 'Coliblanco Dashboard',
        short_name: 'Coliblanco',
        description: 'Coliblanco Dashboard met spraakinterface',
        theme_color: '#1B406F',
        background_color: '#EED0BA',
        display: 'standalone',
        icons: [
          {
            src: 'pwa-assets/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-assets/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'pwa-assets/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          }
        ]
      }
    })
  ],
  base: '/',
})
