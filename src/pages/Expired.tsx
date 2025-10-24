import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Home, Clock, Mail } from 'lucide-react';

export function Expired() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-white to-orange-50 flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full shadow-xl border-2 border-yellow-200">
        <CardContent className="pt-12 pb-12">
          <div className="text-center">
            <div className="mb-6 flex justify-center">
              <div className="bg-yellow-100 p-8 rounded-full">
                <Clock className="text-yellow-600" size={80} />
              </div>
            </div>

            <h1 className="text-3xl font-bold text-emphasis-900 mb-4">
              Código de Contratación Expirado
            </h1>
            
            <p className="text-lg text-gray-700 mb-6 max-w-md mx-auto">
              El código de contratación que intentas usar ha expirado.
              Los códigos tienen una validez limitada por seguridad.
            </p>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8 max-w-lg mx-auto">
              <div className="flex items-start gap-3">
                <Mail className="text-blue-600 mt-1 flex-shrink-0" size={24} />
                <div className="text-left">
                  <h3 className="font-semibold text-blue-900 mb-2">
                    ¿Qué puedes hacer?
                  </h3>
                  <ul className="space-y-2 text-sm text-blue-800">
                    <li>• Contacta con nuestro equipo para obtener un nuevo código</li>
                    <li>• Revisa tu email por si recibiste un código actualizado</li>
                    <li>• Solicita asistencia si tienes dudas sobre el proceso</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-6">
              <Button
                onClick={() => navigate('/')}
                variant="outline"
                size="lg"
              >
                <Home className="mr-2" size={20} />
                Volver al Inicio
              </Button>
              
              <Button
                onClick={() => window.location.href = 'mailto:soporte@migro.es?subject=Código Expirado'}
                className="bg-primary hover:bg-primary-700 text-white"
                size="lg"
              >
                <Mail className="mr-2" size={20} />
                Contactar Soporte
              </Button>
            </div>

            <div className="text-sm text-gray-500">
              <p>Email de soporte: <span className="font-semibold">soporte@migro.es</span></p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

