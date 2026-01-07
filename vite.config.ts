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
    // Optimizaciones de chunks
    rollupOptions: {
      output: {
        // Estrategia de code splitting optimizada
        manualChunks: (id) => {
          // Separar node_modules en chunks específicos
          if (id.includes('node_modules')) {
            // React core (más usado, cargar primero)
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) {
              return 'react-vendor';
            }
            
            // PDF generation (pesado, cargar bajo demanda)
            if (id.includes('jspdf') || id.includes('html2canvas')) {
              return 'pdf-vendor';
            }
            
            // Stripe (cargar solo cuando se necesita)
            if (id.includes('@stripe')) {
              return 'stripe-vendor';
            }
            
            // Markdown (pesado, cargar bajo demanda)
            if (id.includes('react-markdown') || id.includes('remark') || id.includes('rehype')) {
              return 'markdown-vendor';
            }
            
            // Framer Motion (animaciones, cargar bajo demanda)
            if (id.includes('framer-motion')) {
              return 'animation-vendor';
            }
            
            // TanStack Query (cargar separado)
            if (id.includes('@tanstack/react-query')) {
              return 'query-vendor';
            }
            
            // Form libraries
            if (id.includes('react-hook-form') || id.includes('@hookform') || id.includes('zod')) {
              return 'form-vendor';
            }
            
            // UI libraries (Radix UI)
            if (id.includes('@radix-ui')) {
              return 'ui-vendor';
            }
            
            // Date libraries
            if (id.includes('date-fns')) {
              return 'date-vendor';
            }
            
            // Axios
            if (id.includes('axios')) {
              return 'http-vendor';
            }
            
            // Librerías que dependen de React deben ir en react-vendor para evitar circular dependency
            // lucide-react debe ir en react-vendor porque usa React internamente
            if (id.includes('lucide-react')) {
              return 'react-vendor';
            }
            
            // Zustand y recharts también dependen de React
            if (id.includes('zustand') || id.includes('recharts')) {
              return 'react-vendor';
            }
            
            // Otros vendors (tailwind, etc.)
            return 'vendor-misc';
          }
          
          // Separar páginas grandes en chunks propios
          if (id.includes('/pages/admin/')) {
            return 'admin-pages';
          }
          
          if (id.includes('/pages/CRM') || id.includes('/pages/CRMDashboard')) {
            return 'crm-pages';
          }
          
          // PDF generators en chunk separado
          if (id.includes('/utils/') && (id.includes('Pdf') || id.includes('pdf'))) {
            return 'pdf-utils';
          }
        },
        // Optimizar nombres de chunks
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
      },
    },
    // Reducir límite de warnings para forzar optimización
    chunkSizeWarningLimit: 500,
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
