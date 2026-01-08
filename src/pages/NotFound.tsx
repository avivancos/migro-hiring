import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { HomeIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';

export function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-white to-secondary/10 flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full shadow-xl">
        <CardContent className="pt-12 pb-12">
          <div className="text-center">
            <div className="mb-6 flex justify-center">
              <div className="bg-primary/10 p-8 rounded-full">
                <MagnifyingGlassIcon className="text-primary w-20 h-20" />
              </div>
            </div>

            <h1 className="text-6xl font-bold text-emphasis-900 mb-4">404</h1>
            <h2 className="text-3xl font-semibold text-gray-800 mb-4">
              Página No Encontrada
            </h2>
            
            <p className="text-lg text-gray-600 mb-8 max-w-md mx-auto">
              Lo sentimos, la página que buscas no existe o ha sido movida.
            </p>

            <div className="flex gap-4 justify-center">
              <Button
                onClick={() => navigate('/')}
                className="bg-primary hover:bg-primary-700 text-white"
                size="lg"
              >
                <HomeIcon className="mr-2 w-5 h-5" />
                Volver al Inicio
              </Button>
            </div>

            <div className="mt-8 text-sm text-gray-500">
              <p>Si crees que esto es un error, contacta con nosotros:</p>
              <a
                href="mailto:soporte@migro.es"
                className="text-primary hover:underline font-semibold"
              >
                soporte@migro.es
              </a>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

