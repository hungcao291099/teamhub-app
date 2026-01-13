import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import jsconfigPaths from 'vite-jsconfig-paths' // <-- 1. Import plugin
import path from 'path'
// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    jsconfigPaths() // <-- 2. Thêm plugin vào đây
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    proxy: {
      '/settings': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
      '/hrm': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
      '/auth': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
      '/events': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
      '/funds': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
      '/duty': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
      '/users': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
      '/chat': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
      '/api/music': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
      '/games': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
      '/app': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
      '/uploads': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
      '/socket.io': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        ws: true,
        rewriteWsOrigin: true,
      },
    },
  },
})