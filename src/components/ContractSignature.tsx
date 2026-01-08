// Step 3: Contract Signature Component (Firma Manual)

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ExclamationCircleIcon, PencilIcon } from '@heroicons/react/24/outline';
import { CheckCircleIcon } from '@heroicons/react/24/solid';

interface ContractSignatureProps {
  hiringCode: string;
  userName: string; // Nombre completo del usuario desde el backend
  isAlreadySigned?: boolean; // Si el contrato ya fue firmado
  onComplete: (signature?: string) => void;
  onBack: () => void;
}

export function ContractSignature({ userName, isAlreadySigned = false, onComplete, onBack }: ContractSignatureProps) {
  const [signature, setSignature] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isValid, setIsValid] = useState(false);

  // Normalizar nombres para comparación (quitar acentos, convertir a mayúsculas, quitar espacios extra)
  const normalizeText = (text: string): string => {
    return text
      .toUpperCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Quitar acentos
      .replace(/\s+/g, ' ') // Normalizar espacios
      .trim();
  };

  const handleSignatureChange = (value: string) => {
    setSignature(value);
    setError(null);

    // Validar que coincida con el nombre del usuario
    const normalizedInput = normalizeText(value);
    const normalizedUserName = normalizeText(userName);

    if (normalizedInput.length > 0 && normalizedInput === normalizedUserName) {
      setIsValid(true);
      setError(null);
    } else if (normalizedInput.length > 0) {
      setIsValid(false);
      setError('El nombre ingresado no coincide con el titular del contrato');
    } else {
      setIsValid(false);
      setError(null);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!isValid) {
      setError('Debe ingresar su nombre completo exactamente como aparece en el contrato');
      return;
    }

    // Firma válida, continuar al siguiente paso
    onComplete(signature);
  };

  // Si ya está firmado, mostrar mensaje y botón para continuar
  if (isAlreadySigned) {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <Card className="shadow-lg border-2 border-green-300 bg-green-50">
          <CardHeader className="bg-gradient-to-r from-green-100 to-green-50">
            <CardTitle className="text-2xl text-green-900 flex items-center gap-2">
              <CheckCircleIcon className="text-green-600" width={28} height={28} />
              Contrato Ya Firmado
            </CardTitle>
          </CardHeader>

          <CardContent className="pt-6 space-y-6">
            <div className="bg-white border border-green-200 rounded-lg p-6">
              <p className="text-lg text-green-900 mb-4">
                ✅ Este contrato ya ha sido firmado digitalmente.
              </p>
              <p className="text-sm text-green-700">
                No es posible volver a firmar un contrato que ya fue aceptado. Puede continuar con el siguiente paso.
              </p>
            </div>

            <div className="flex gap-4">
              <Button
                onClick={onBack}
                variant="outline"
                className="flex-1"
              >
                Volver
              </Button>
              <Button
                onClick={() => onComplete()}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
              >
                Continuar
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      <Card className="shadow-lg">
        <CardHeader className="bg-gradient-to-r from-primary/10 to-secondary/10">
          <CardTitle className="text-2xl text-emphasis-900 flex items-center gap-2">
            <PencilIcon className="text-primary" width={28} height={28} />
            Firma del Contrato
          </CardTitle>
        </CardHeader>

        <CardContent className="pt-6 space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-3">
              📋 Declaración de Aceptación
            </h3>
            <p className="text-blue-800 mb-4">
              Al firmar este contrato, usted declara que:
            </p>
            <ul className="space-y-2 text-sm text-blue-800 ml-4">
              <li>✓ Ha leído y comprendido todos los términos del contrato</li>
              <li>✓ Acepta las condiciones establecidas en el servicio</li>
              <li>✓ La información proporcionada es veraz y exacta</li>
              <li>✓ Autoriza el procesamiento de sus datos personales</li>
            </ul>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-3">
              <Label htmlFor="signature" className="text-base font-semibold text-gray-900">
                Para firmar, escriba su nombre completo con apellidos:
              </Label>
              
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-3">
                <p className="text-sm text-gray-600 mb-1">
                  <strong>Nombre del titular:</strong>
                </p>
                <p className="text-lg font-semibold text-emphasis-900">
                  {userName}
                </p>
              </div>

              <div className="relative">
                <Input
                  id="signature"
                  type="text"
                  value={signature}
                  onChange={(e) => handleSignatureChange(e.target.value)}
                  placeholder="Ej: JUAN SANCHEZ VALDIVIA"
                  className={`text-lg h-14 ${
                    isValid
                      ? 'border-green-500 bg-green-50'
                      : signature.length > 0
                      ? 'border-red-500 bg-red-50'
                      : ''
                  }`}
                  autoComplete="off"
                  autoFocus
                />
                {isValid && (
                  <CheckCircleIcon
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-green-600"
                    width={24} height={24}
                  />
                )}
              </div>

              <p className="text-sm text-gray-500 italic">
                Yo, <strong className="text-gray-700">{signature || '_____________________'}</strong>, 
                autorizo la firma digital de este contrato y acepto todos sus términos y condiciones.
              </p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg flex items-start gap-2">
                <ExclamationCircleIcon width={20} height={20} className="mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold">Error de validación</p>
                  <p className="text-sm">{error}</p>
                </div>
              </div>
            )}

            {isValid && (
              <div className="bg-green-50 border border-green-200 text-green-800 p-4 rounded-lg flex items-start gap-2">
                <CheckCircleIcon width={20} height={20} className="mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold">✅ Firma válida</p>
                  <p className="text-sm">Su nombre ha sido verificado correctamente</p>
                </div>
              </div>
            )}

            <div className="bg-gray-50 border-l-4 border-primary p-4 rounded">
              <p className="text-sm text-gray-700">
                <strong>📌 Nota importante:</strong> Debe escribir su nombre completo 
                exactamente como aparece en el cuadro superior, incluyendo todos los apellidos.
                No se distinguen mayúsculas, minúsculas ni acentos.
              </p>
            </div>

            <div className="flex gap-4 pt-4">
              <Button
                type="button"
                onClick={onBack}
                variant="outline"
                className="flex-1"
              >
                Volver
              </Button>
              <Button
                type="submit"
                disabled={!isValid}
                className="flex-1 bg-primary hover:bg-primary-700 text-white disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {isValid ? (
                  <>
                    <CheckCircleIcon className="mr-2" width={18} height={18} />
                    Confirmar Firma
                  </>
                ) : (
                  'Firmar Contrato'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

