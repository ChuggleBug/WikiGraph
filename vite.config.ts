import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  base: '/',
  plugins: [
    react(),
    babel({ presets: [reactCompilerPreset()] })
  ],
  server: {
    proxy: {
      '/wikigraph/': {
        target: 'http://localhost:8080/',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/wikigraph/, '')
      }
    }
  },
  preview: {
    proxy: {
      '/wikigraph/': {
        target: 'https://api.chugglebug.dev',
        changeOrigin: true,
      }
    }
  }

})
