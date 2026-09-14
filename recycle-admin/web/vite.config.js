import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

// 独立回收后台：与维修后台不同端口（5175），API 代理到回收后台服务（3005）
const apiTarget = process.env.VITE_API_TARGET || 'http://localhost:3005'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  },
  server: {
    port: 5175,
    proxy: {
      '/api': {
        target: apiTarget,
        changeOrigin: true
      }
    }
  },
  build: {
    chunkSizeWarningLimit: 1600
  }
})
