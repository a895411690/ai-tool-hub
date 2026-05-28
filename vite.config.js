import { defineConfig } from 'vite'
import { resolve } from 'path'
import { copyFileSync, cpSync, existsSync } from 'fs'
import { createRequire } from 'module'
const require = createRequire(import.meta.url)
const pkg = require('./package.json')

// Plugin to copy tools directory and tools.json to dist
function copyToolsPlugin() {
  return {
    name: 'copy-tools',
    closeBundle() {
      try {
        if (existsSync('tools')) {
          cpSync('tools', 'dist/tools', { recursive: true, force: true })
        }
        if (existsSync('src/tools.json')) {
          cpSync('src/tools.json', 'dist/tools.json', { force: true })
        } else if (existsSync('tools.json')) {
          cpSync('tools.json', 'dist/tools.json', { force: true })
        }
        if (existsSync('sw.js')) {
          copyFileSync('sw.js', 'dist/sw.js')
        }
        console.log('✓ Files copied to dist/')
      } catch (err) {
        console.error('Failed to copy files:', err)
        // Don't fail the build on copy error
      }
    }
  }
}

export default defineConfig(({ mode }) => ({
  root: '.',
  base: './',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html')
      },
      output: {
      }
    },
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: mode === 'production',
        drop_debugger: mode === 'production'
      }
    },
    assetsInlineLimit: 4096,
    cssCodeSplit: true,
    sourcemap: mode !== 'production' // 生产环境禁用 sourcemap
  },
  server: {
    port: 3001, // 避免与后端端口冲突
    open: true,
    cors: true
  },
  preview: {
    port: 4173
  },
  css: {
    devSourcemap: true
  },
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version)
  },
  plugins: [copyToolsPlugin()]
}))
