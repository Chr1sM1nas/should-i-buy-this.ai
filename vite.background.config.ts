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
        background: path.resolve(__dirname, 'src/background/background.ts')
      },
      output: {
        format: 'iife',
        entryFileNames: 'background/background.js'
      }
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  }
})
