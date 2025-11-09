import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  plugins: [vue()],
  build: {
    outDir: 'dist',
    lib: {
      entry: resolve(__dirname, 'src/main.js'),
      name: 'VESPAStaffOverviewV2',
      formats: ['iife'],
      fileName: () => 'staff-overview1b.js'
    },
    rollupOptions: {
      output: {
        assetFileNames: (assetInfo) => {
          if (assetInfo.name?.endsWith('.css')) {
            return 'staff-overview1b.css'
          }
          return '[name]-[hash][extname]'
        }
      }
    }
  }
})

