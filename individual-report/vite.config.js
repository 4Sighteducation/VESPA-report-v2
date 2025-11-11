import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: './index.html',
      output: {
                    entryFileNames: 'report1ag.js',
                    chunkFileNames: '[name]-[hash].js',
                    assetFileNames: (assetInfo) => {
                      if (assetInfo.name?.endsWith('.css')) {
                        return 'report1ag.css'
                      }
          return '[name]-[hash][extname]'
        },
        format: 'iife', // Wrap in IIFE to isolate variables
        name: 'VESPAReport' // Window global for the IIFE
      }
    },
    cssCodeSplit: false // Bundle all CSS into one file
  },
  define: {
    // Prevent variable name collisions
    'process.env.NODE_ENV': JSON.stringify('production')
  }
})

