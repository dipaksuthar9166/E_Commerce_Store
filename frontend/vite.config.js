import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    tailwindcss(),
    react()
  ],
  server: {
    // Allow phone/tablet on same Wi‑Fi: http://<PC-IP>:5173
    host: true,
    port: 5173,
    strictPort: true,
    // Optional same-origin proxy (also helps when API is called as /api)
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:5000',
        changeOrigin: true,
      },
      '/socket.io': {
        target: 'http://127.0.0.1:5000',
        ws: true,
        changeOrigin: true,
      },
    },
  },
  preview: {
    host: true,
    port: 4173,
  },
  build: {
    // Smaller initial download — vendor libs in separate cached chunks
    target: 'es2020',
    cssCodeSplit: true,
    chunkSizeWarningLimit: 700,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return;
          if (id.includes('react-dom') || id.includes('/react/') || id.includes('react-router')) {
            return 'react-vendor';
          }
          if (id.includes('socket.io')) return 'socket';
          if (id.includes('swiper')) return 'swiper';
          if (id.includes('recharts') || id.includes('d3-')) return 'charts';
          if (id.includes('leaflet') || id.includes('react-leaflet')) return 'maps-leaflet';
          if (id.includes('@react-google-maps') || id.includes('google-maps')) return 'maps-google';
          if (id.includes('lucide-react')) return 'icons';
          if (id.includes('axios')) return 'http';
        },
      },
    },
  },
})
