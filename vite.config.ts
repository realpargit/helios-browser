import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import electron from 'vite-plugin-electron'
import renderer from 'vite-plugin-electron-renderer'
import { resolve } from 'path'

const ELECTRON_EXTERNALS = [
  'electron', 'path', 'fs', 'os', 'url', 'child_process', 'crypto', 'net', 'http', 'express', 'electron-updater', 'node-html-parser'
]

// Build-time constant: `true` in `vite` dev (`electron:dev`), `false` in
// `vite build` (`electron:build`). Lets us tree-shake bench/debug code out
// of production bundles entirely.
const isDevBuild = process.env.NODE_ENV !== 'production'
const DEFINES = {
  __DEV__: JSON.stringify(isDevBuild),
  'process.env.GOOGLE_CLIENT_ID': JSON.stringify(process.env.GOOGLE_CLIENT_ID || '')
}

export default defineConfig({
  define: { __DEV__: JSON.stringify(isDevBuild) },
  plugins: [
    react(),
    electron([
      {
        entry: 'electron/main.ts',
        vite: {
          define: DEFINES,
          build: {
            outDir: 'dist-electron',
            rollupOptions: { external: ELECTRON_EXTERNALS }
          }
        }
      },
      {
        entry: 'electron/preload.ts',
        onstart(options) { options.reload() },
        vite: {
          define: DEFINES,
          build: {
            outDir: 'dist-electron',
            rollupOptions: { external: ELECTRON_EXTERNALS }
          }
        }
      }
    ]),
    renderer()
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@electron': resolve(__dirname, 'electron')
    }
  },
  server: {
    port: 5173,
    strictPort: true
  }
})
