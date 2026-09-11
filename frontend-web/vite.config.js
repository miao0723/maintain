import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

const apiTarget = process.env.VITE_API_TARGET || 'http://localhost'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  },
  build: {
    // 生产构建分包：图表等大体积独立库单独成 chunk，
    // 服务器更新业务代码时浏览器可继续使用缓存的厂商代码
    // 注意：element-plus 不能强制拆分（内部存在循环引用，
    // 强拆会导致 "Cannot access before initialization" 启动报错）
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-vue': ['vue', 'vue-router', 'pinia', 'axios', 'dayjs'],
          'vendor-echarts': ['echarts']
        }
      }
    },
    chunkSizeWarningLimit: 1600
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: apiTarget,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '/api')
      },
      '/uploads': {
        target: apiTarget,
        changeOrigin: true
      },
      '/miniprogram-uploads': {
        target: apiTarget,
        changeOrigin: true
      }
    }
  }
})
