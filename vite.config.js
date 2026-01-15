import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import fs from 'fs';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        short_name: "LA CENTRAL",
        name: "LA CENTRAL, super heroes de la construccion",
        icons: [
          {
            src: "icon-192.png",
            type: "image/png",
            sizes: "192x192"
          },
          {
            src: "icon-512.png",
            type: "image/png",
            sizes: "512x512"
          }
        ],
        start_url: ".",
        display: "standalone",
        theme_color: "#1976d2",
        background_color: "#ffffff"
      }
    })
  ],
  server: {
    https: {
      key: fs.readFileSync('./localhost-key.pem'),
      cert: fs.readFileSync('./localhost.pem'),
    },
    host: 'localhost',
    port: 4000
  }
})
