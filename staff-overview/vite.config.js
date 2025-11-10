import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: './index.html',
      output: {
        entryFileNames: 'staff-overview1r.js',
        chunkFileNames: '[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          if (assetInfo.name?.endsWith('.css')) {
            return 'staff-overview1r.css'
          }
          return '[name]-[hash][extname]'
        }
      }
    }
  }
})

