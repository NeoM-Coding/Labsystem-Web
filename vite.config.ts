import { fileURLToPath, URL } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
    },
    server: {
      port: 5173,
      proxy: env.VITE_API_PROXY_TARGET
        ? {
            '/api': { target: env.VITE_API_PROXY_TARGET, changeOrigin: true },
            '/ws': {
              target: env.VITE_API_PROXY_TARGET,
              changeOrigin: true,
              ws: true,
            },
          }
        : undefined,
    },
  }
})
