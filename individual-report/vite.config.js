import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  plugins: [vue()],
  build: {
    outDir: 'dist',
    lib: {
      entry: resolve(__dirname, 'src/main.js'),
      name: 'VESPAReportV2',
      formats: ['iife'],
      fileName: () => 'report1a.js'
    },
    rollupOptions: {
      output: {
        assetFileNames: (assetInfo) => {
          if (assetInfo.name?.endsWith('.css')) {
            return 'report1a.css'
          }
          return '[name]-[hash][extname]'
        }
      }
    }
  }
})

