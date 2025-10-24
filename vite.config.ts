import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  
  // Alias para imports más limpios (@/components, @/utils, etc)
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  
  // Configuración del servidor de desarrollo
  server: {
    host: '0.0.0.0', // Escuchar en todas las interfaces
    port: 5173,
    strictPort: true,
    // DESHABILITAR verificación de hosts completamente
    // Esto permite cualquier dominio (necesario para Render, Vercel, dominios custom, etc.)
    allowedHosts: 'all',
    hmr: {
      clientPort: 443, // Para HTTPS en producción
    },
    watch: {
      // Usar polling en Windows/Docker para hot reload
      usePolling: true,
      interval: 100,
    },
    // Proxy para desarrollo local (opcional)
    proxy: {
      // Descomentar si quieres hacer proxy a la API backend
      // '/api': {
      //   target: 'http://localhost:8000',
      //   changeOrigin: true,
      //   rewrite: (path) => path.replace(/^\/api/, '/api/v1'),
      // },
    },
  },
  
  // Configuración de build
  build: {
    outDir: 'dist',
    sourcemap: true,
    // Optimizaciones
    rollupOptions: {
      output: {
        manualChunks: {
          // Separar vendors grandes para mejor caching
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'stripe-vendor': ['@stripe/stripe-js', '@stripe/react-stripe-js'],
        },
      },
    },
    // Aumentar límite de warnings para chunks grandes
    chunkSizeWarningLimit: 1000,
  },
  
  // Variables de entorno con prefijo VITE_
  envPrefix: 'VITE_',
  
  // Preview server (para testing del build)
  preview: {
    host: '0.0.0.0', // Escuchar en todas las interfaces
    port: 4173,
    strictPort: true,
    // DESHABILITAR verificación de hosts completamente
    allowedHosts: 'all',
  },
})
