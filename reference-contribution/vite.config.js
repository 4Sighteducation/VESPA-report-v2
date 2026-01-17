import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      output: {
        entryFileNames: 'reference-contribution1a.js',
        chunkFileNames: 'reference-contribution1a-[hash].js',
        assetFileNames: 'reference-contribution1a-[name][extname]'
      }
    }
  }
})

