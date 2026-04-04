import { defineConfig } from 'vite'
import { resolve } from 'path'
import { copyFileSync, mkdirSync, readdirSync, statSync, cpSync } from 'fs'

// Plugin to copy tools directory to dist
function copyToolsPlugin() {
  return {
    name: 'copy-tools',
    closeBundle() {
      try {
        cpSync('tools', 'dist/tools', { recursive: true, force: true })
        console.log('✓ Tools directory copied to dist/')
      } catch (err) {
        console.error('Failed to copy tools:', err)
      }
    }
  }
}

export default defineConfig({
  root: 'src',
  base: './',
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'src/index.html')
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
  },
  plugins: [copyToolsPlugin()]
})
