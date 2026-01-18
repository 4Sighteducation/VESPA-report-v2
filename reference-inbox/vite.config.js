import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      output: {
        entryFileNames: 'reference-inbox1c.js',
        chunkFileNames: 'reference-inbox1c-[hash].js',
        assetFileNames: 'reference-inbox1c-[name][extname]'
      }
    }
  }
})

