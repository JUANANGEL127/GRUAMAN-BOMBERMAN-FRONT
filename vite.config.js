import fs from 'node:fs'
import { fileURLToPath } from 'node:url'
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

const LOCALHOST_KEY_PATH = './localhost-key.pem'
const LOCALHOST_CERT_PATH = './localhost.pem'
const ENV_DIR = fileURLToPath(new URL('.', import.meta.url))

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

const getLocalHttpsConfig = () => {
  if (!fs.existsSync(LOCALHOST_KEY_PATH) || !fs.existsSync(LOCALHOST_CERT_PATH)) {
    return false
  }

  return {
    key: fs.readFileSync(LOCALHOST_KEY_PATH),
    cert: fs.readFileSync(LOCALHOST_CERT_PATH),
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, ENV_DIR, '')
  const useDevHttps = env.VITE_DEV_HTTP === 'true'
  const apiBaseUrl = String(env.VITE_API_BASE_URL || '').trim()
  const proxyTarget = String(env.VITE_PROXY_TARGET || 'http://localhost:3000').trim()
  const proxyConfig =
    apiBaseUrl.startsWith('/')
      ? {
          [apiBaseUrl]: {
            target: proxyTarget,
            changeOrigin: true,
            secure: false,
            rewrite: (path) => path.replace(new RegExp(`^${escapeRegex(apiBaseUrl)}`), ''),
          },
        }
      : undefined

  return {
    plugins: [
      react(),
      VitePWA({
        strategies: 'injectManifest',
        srcDir: 'public',
        filename: 'sw.js',
        injectRegister: false,
        manifest: {
          short_name: 'LA CENTRAL',
          name: 'LA CENTRAL, super heroes de la construccion',
          icons: [
            {
              src: 'icon-192.png',
              type: 'image/png',
              sizes: '192x192',
            },
            {
              src: 'icon-512.png',
              type: 'image/png',
              sizes: '512x512',
            },
          ],
          start_url: '.',
          display: 'standalone',
          theme_color: '#1976d2',
          background_color: '#ffffff',
        },
        injectManifest: {
          injectionPoint: undefined,
          swDest: 'sw.js',
        },
        devOptions: {
          enabled: true,
        },
      }),
    ],
    // This only affects the local Vite dev server.
    // Production keeps using the platform/web server configuration.
    server: {
      // Default to HTTP unless VITE_DEV_HTTPS=true is explicitly set locally.
      https: useDevHttps ? false  : getLocalHttpsConfig(),
      host: 'localhost',
      port: 4000,
      proxy: proxyConfig,
    },
  }
})
