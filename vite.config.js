import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  root: 'src',
  base: './',
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'src/index.html')
      },
      output: {
        manualChunks: {
          vendor: ['pinyin-pro']
        }
      }
    },
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    },
    assetsInlineLimit: 4096,
    cssCodeSplit: true,
    sourcemap: true
  },
  server: {
    port: 3000,
    open: true,
    cors: true
  },
  preview: {
    port: 4173
  },
  css: {
    devSourcemap: true
  }
})
