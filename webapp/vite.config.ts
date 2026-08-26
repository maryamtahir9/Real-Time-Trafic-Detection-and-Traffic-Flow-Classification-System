import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import fs from 'fs'
import path from 'path'

const ortDistDir = path.resolve(import.meta.dirname!, 'node_modules/onnxruntime-web/dist')

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    // This plugin intercepts dynamic import() calls for ort-wasm files
    // at the Vite resolve level, before Vite's own resolver can reject them.
    {
      name: 'ort-wasm-resolver',
      enforce: 'pre',
      resolveId(source) {
        // Catch dynamic imports like: import('/ort-wasm-simd-threaded.jsep.mjs')
        // Strip query params and leading slashes to get the bare filename
        const cleanSource = source.split('?')[0]
        const basename = path.basename(cleanSource)
        if (basename.startsWith('ort-wasm') && basename.endsWith('.mjs')) {
          const resolved = path.resolve(ortDistDir, basename)
          if (fs.existsSync(resolved)) {
            return resolved
          }
        }
        return null
      },
    },
    react(),
    {
      name: 'ort-wasm-server',
      configureServer(server) {
        // Serve .wasm binary files via HTTP middleware (these use fetch(), not import())
        server.middlewares.use((req, res, next) => {
          const url = req.url?.split('?')[0] ?? ''
          if (url.startsWith('/ort-wasm') && url.endsWith('.wasm')) {
            const filePath = path.join(ortDistDir, url.replace(/^\//, ''))
            if (fs.existsSync(filePath)) {
              res.setHeader('Content-Type', 'application/wasm')
              res.setHeader('Cache-Control', 'public, max-age=31536000')
              fs.createReadStream(filePath).pipe(res)
              return
            }
          }
          next()
        })
      },
    },
  ],
  optimizeDeps: {
    exclude: ['onnxruntime-web'],
  },
})
