import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/wfs': {
        target: 'https://climate.gg.go.kr',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/wfs/, '/ols/api/geoserver/wfs'),
        secure: false
      }
    }
  }
})
