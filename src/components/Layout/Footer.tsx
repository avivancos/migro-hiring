// Footer component
import { config } from '@/config/constants';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white border-t border-gray-200 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          {/* Brand */}
          <div className="text-center md:text-left">
            <p className="text-gray-600 text-sm">
              © {currentYear} Migro. Todos los derechos reservados.
            </p>
          </div>

          {/* Links */}
          <div className="flex gap-6">
            <a
              href="/terminos"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-gray-600 hover:text-primary transition-colors"
            >
              Términos y Condiciones
            </a>
            <a
              href="/privacidad"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-gray-600 hover:text-primary transition-colors"
            >
              Política de Privacidad
            </a>
            <a
              href={config.SHORT_URL_BASE}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-gray-600 hover:text-primary transition-colors"
            >
              Migro.es
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

