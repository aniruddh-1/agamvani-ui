import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const API_URL = env.VITE_API_BASE_URL || 'http://localhost:8002'
  const PORT = parseInt(env.VITE_PORT || '3001')
  
  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      port: PORT,
      proxy: {
        '/api': {
          target: API_URL,
          changeOrigin: true,
        },
        '/radio': {
          target: API_URL,
          changeOrigin: true,
        }
      }
    }
  }
})
