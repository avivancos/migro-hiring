// Step 1: Service Details Component

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatCurrency, formatDate } from '@/utils/formatters';
import type { HiringDetails } from '@/types/hiring';
import { Clock, User, Mail, FileText, Euro } from 'lucide-react';

interface ServiceDetailsProps {
  details: HiringDetails;
  onNext: () => void;
  loading?: boolean;
}

export function ServiceDetails({ details, onNext, loading = false }: ServiceDetailsProps) {
  return (
    <div className="max-w-3xl mx-auto p-6">
      <Card className="shadow-lg">
        <CardHeader className="bg-gradient-to-r from-primary/10 to-secondary/10">
          <CardTitle className="text-3xl text-emphasis-900">
            {details.service_name}
          </CardTitle>
        </CardHeader>
        
        <CardContent className="pt-6 space-y-6">
          {/* Descripción del servicio */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <FileText className="text-primary" size={20} />
              <h3 className="font-semibold text-lg text-emphasis-900">
                Descripción del Servicio
              </h3>
            </div>
            <p className="text-gray-700 leading-relaxed bg-gray-50 p-4 rounded-lg">
              {details.service_description}
            </p>
          </div>

          {/* Nota/Calificación del Estudio */}
          {details.grade && (
            <div className="bg-gradient-to-r from-green-50 to-blue-50 border-2 border-green-200 p-6 rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-sm">{details.grade}</span>
                </div>
                <p className="text-sm text-gray-600 font-medium">Calificación del Estudio Migro</p>
              </div>
              <p className="text-lg font-semibold text-gray-900 mb-2">
                Nota {details.grade} - {details.grade === 'A' ? 'Excelente' : details.grade === 'B' ? 'Buena' : 'Aceptable'}
              </p>
              <p className="text-sm text-gray-600">
                {details.grade === 'A' 
                  ? 'Tu perfil tiene una alta probabilidad de éxito en el proceso administrativo.'
                  : details.grade === 'B'
                  ? 'Tu perfil tiene buenas posibilidades de éxito con algunos requisitos adicionales.'
                  : 'Tu perfil es aceptable pero puede requerir documentación adicional o tiempo extra.'
                }
              </p>
            </div>
          )}

          {/* Precio */}
          <div className="bg-primary/5 border-2 border-primary/20 p-6 rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <Euro className="text-primary" size={20} />
              <p className="text-sm text-gray-600 font-medium">Precio total del servicio</p>
            </div>
            <p className="text-4xl font-bold text-primary">
              {formatCurrency(details.amount, details.currency)}
            </p>
            <p className="text-sm text-gray-600 mt-2">
              200€ ahora y 200€ con la comunicación favorable del expediente
            </p>
          </div>

          {/* Datos del usuario */}
          <div className="border-t pt-6">
            <h3 className="font-semibold text-lg mb-4 text-emphasis-900">
              Tus Datos
            </h3>
            <div className="space-y-3 bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center gap-3">
                <User className="text-gray-500" size={18} />
                <div>
                  <p className="text-xs text-gray-500">Nombre completo</p>
                  <p className="font-medium text-gray-900">{details.user_name}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="text-gray-500" size={18} />
                <div>
                  <p className="text-xs text-gray-500">Email</p>
                  <p className="font-medium text-gray-900">{details.user_email}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Información de expiración */}
          <div className="flex items-center gap-2 text-sm text-gray-500 bg-yellow-50 p-3 rounded-lg border border-yellow-200">
            <Clock size={16} className="text-yellow-600" />
            <p>
              Código válido hasta:{' '}
              <span className="font-semibold text-yellow-700">
                {formatDate(details.expires_at)}
              </span>
            </p>
          </div>

          {/* Botón de acción */}
          <Button
            onClick={onNext}
            disabled={loading}
            className="w-full bg-emphasis hover:bg-emphasis/90 text-white py-6 text-lg font-semibold"
            size="lg"
          >
            {loading ? 'Cargando...' : 'Comenzar Proceso de Contratación'}
          </Button>

          {/* Nota informativa */}
          <p className="text-xs text-center text-gray-500 mt-4">
            Al continuar, comenzarás el proceso de contratación que incluye
            verificación de identidad y pago seguro.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

