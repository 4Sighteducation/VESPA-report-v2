import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      output: {
        entryFileNames: 'reference-inbox1a.js',
        chunkFileNames: 'reference-inbox1a-[hash].js',
        assetFileNames: 'reference-inbox1a-[name][extname]'
      }
    }
  }
})

