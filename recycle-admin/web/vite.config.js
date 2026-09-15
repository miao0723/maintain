import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

// 独立回收后台：与维修后台不同端口（5175），API 代理到回收后台服务（3005）
const apiTarget = process.env.VITE_API_TARGET || 'http://localhost:3005'

// 生产经网关以子路径 /recycle-admin/ 对外时，通过 VITE_BASE 注入；
// 默认 '/' 保持独立端口部署（同域名不同端口）行为不变
const base = process.env.VITE_BASE || '/'

export default defineConfig({
  base,
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
