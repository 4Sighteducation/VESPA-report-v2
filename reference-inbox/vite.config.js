import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      output: {
        entryFileNames: 'reference-inbox1d.js',
        chunkFileNames: 'reference-inbox1d-[hash].js',
        assetFileNames: 'reference-inbox1d-[name][extname]'
      }
    }
  }
})

