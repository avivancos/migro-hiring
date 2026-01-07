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
    // @ts-ignore - allowedHosts acepta 'all' en runtime
    allowedHosts: 'all' as any,
    hmr: {
      protocol: 'ws',
      host: 'localhost',
      port: 5173,
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
    rollupOptions: {
      output: {
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
      },
    },
    chunkSizeWarningLimit: 2000,
    // Minificar con esbuild (más rápido que terser)
    minify: 'esbuild',
    // Eliminar console.log en producción (esbuild lo hace automáticamente)
  },
  
  // Variables de entorno con prefijo VITE_
  envPrefix: 'VITE_',
  
  // Preview server (para testing del build)
  preview: {
    host: '0.0.0.0', // Escuchar en todas las interfaces
    port: 4173,
    strictPort: true,
    // DESHABILITAR verificación de hosts completamente
    // @ts-ignore - allowedHosts acepta 'all' en runtime
    allowedHosts: 'all' as any,
  },
})
