import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path, { format } from 'path'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  define: {
    'import.meta.env.BASE_URL': JSON.stringify(process.env.BASE_URL || '/'),
  },
  build: {
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html'), // 指定入口HTML文件
      },
    },
  },
  optimizeDeps: {
    include: ['three']
  },
  worker: {
    format: 'es'
  }
})