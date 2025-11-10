import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: './index.html',
      output: {
        entryFileNames: 'report1ab.js',
        chunkFileNames: '[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          if (assetInfo.name?.endsWith('.css')) {
            return 'report1ab.css'
          }
          return '[name]-[hash][extname]'
        }
      }
    },
    cssCodeSplit: false // Bundle all CSS into one file
  },
  define: {
    // Prevent variable name collisions
    'process.env.NODE_ENV': JSON.stringify('production')
  }
})

