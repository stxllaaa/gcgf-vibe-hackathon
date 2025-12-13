import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api/geoserver': {
        target: 'https://climate.gg.go.kr',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/geoserver/, '/ols/api/geoserver')
      },
      '/api/emd': {
        target: 'https://openapi.gg.go.kr',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/emd/, '/TB25BPTGGSIGEMDLOCM')
      }
    }
  }
})
