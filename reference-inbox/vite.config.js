import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      output: {
        entryFileNames: 'reference-inbox1b.js',
        chunkFileNames: 'reference-inbox1b-[hash].js',
        assetFileNames: 'reference-inbox1b-[name][extname]'
      }
    }
  }
})

