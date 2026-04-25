import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import electron from 'vite-plugin-electron'
import renderer from 'vite-plugin-electron-renderer'
import { resolve } from 'path'

const ELECTRON_EXTERNALS = [
  'electron', 'path', 'fs', 'os', 'url', 'child_process', 'crypto', 'net', 'http', 'express', 'electron-updater'
]

export default defineConfig({
  plugins: [
    react(),
    electron([
      {
        entry: 'electron/main.ts',
        vite: {
          define: {
            'process.env.GOOGLE_CLIENT_ID': JSON.stringify(process.env.GOOGLE_CLIENT_ID || '')
          },
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
