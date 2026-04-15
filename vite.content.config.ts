import { defineConfig } from 'vite'
import path from 'path'

export default defineConfig({
  build: {
    target: 'ES2020',
    outDir: 'dist',
    emptyOutDir: false,
    minify: false,
    cssCodeSplit: false,
    rollupOptions: {
      input: {
        content: path.resolve(__dirname, 'src/content/content.ts')
      },
      output: {
        format: 'iife',
        entryFileNames: 'content/content.js',
        assetFileNames: 'content/content.css'
      }
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  }
})
