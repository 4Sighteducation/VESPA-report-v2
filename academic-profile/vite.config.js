import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  build: {
    rollupOptions: {
      output: {
        // CRITICAL: Use IIFE format to isolate scope and prevent variable collisions
        format: 'iife',
        name: 'AcademicProfileApp', // Unique namespace
        // Single file output with version suffix for cache busting
        entryFileNames: 'academic-profile1h.js',
        assetFileNames: (assetInfo) => {
          if (assetInfo.name.endsWith('.css')) {
            return 'academic-profile1h.css'
          }
          return assetInfo.name
        },
        // Don't split into chunks - keep as single file
        manualChunks: undefined
      }
    },
    // Output to dist folder for GitHub
    outDir: 'dist',
    // Don't minify excessively to help with debugging
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: false // Keep console logs for debugging
      }
    }
  },
  define: {
    // Suppress Vue warnings in production
    __VUE_PROD_DEVTOOLS__: false,
    __VUE_OPTIONS_API__: true
  }
})

