// Admin Login OTP Page

import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/providers/AuthProvider';
import { ExclamationCircleIcon, LockClosedIcon } from '@heroicons/react/24/outline';
import { getErrorMessage } from '@/services/api';

function normalizeIdentifier(raw: string): string {
  // Email: mantener (trim)
  // Teléfono: quitar espacios/guiones/paréntesis para que el backend pueda normalizar mejor
  const v = raw.trim();
  if (v.includes('@')) return v;
  return v.replace(/[()\s-]/g, '');
}

export function AdminLoginOtp() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { requestOtp, loginOtp, isAuthenticated, isAdmin } = useAuth();

  const [identifier, setIdentifier] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState<'request' | 'verify'>('request');
  const [info, setInfo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const normalizedIdentifier = useMemo(() => normalizeIdentifier(identifier), [identifier]);
  const searchParamsString = searchParams.toString();
  const returnUrlParam = useMemo(
    () => new URLSearchParams(searchParamsString).get('returnUrl'),
    [searchParamsString],
  );

  // Si ya está autenticado, redirigir
  useEffect(() => {
    if (isAuthenticated && isAdmin) {
      const returnUrl = returnUrlParam || '/admin/dashboard';
      navigate(returnUrl, { replace: true });
    }
  }, [isAuthenticated, isAdmin, navigate, returnUrlParam]);

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);

    if (!normalizedIdentifier) {
      setError('Por favor, ingresa tu email o teléfono');
      return;
    }

    setLoading(true);
    try {
      await requestOtp(normalizedIdentifier);
      setStep('verify');
      setInfo('Código enviado. Revisa tu email/SMS y escribe el código para acceder.');
    } catch (err: unknown) {
      setError(getErrorMessage(err) || 'No se pudo enviar el código');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);

    if (!normalizedIdentifier) {
      setError('Por favor, ingresa tu email o teléfono');
      return;
    }
    if (!code.trim()) {
      setError('Por favor, ingresa el código');
      return;
    }

    setLoading(true);
    try {
      await loginOtp(normalizedIdentifier, code.trim());

      const returnUrl = searchParams.get('returnUrl');
      if (returnUrl) {
        navigate(returnUrl, { replace: true });
      } else {
        navigate('/admin/dashboard', { replace: true });
      }
    } catch (err: unknown) {
      setError(getErrorMessage(err) || 'Código inválido o expirado');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl text-center flex items-center justify-center gap-2">
            <LockClosedIcon className="text-primary" width={28} height={28} />
            Panel de Administración (OTP)
          </CardTitle>
          <p className="text-center text-sm text-gray-500 mt-2">
            Acceso con código de un solo uso
          </p>
        </CardHeader>

        <CardContent>
          <form onSubmit={step === 'request' ? handleRequestOtp : handleVerifyOtp} className="space-y-4">
            <div>
              <Label htmlFor="identifier">Email o teléfono</Label>
              <Input
                id="identifier"
                type="text"
                value={identifier}
                onChange={(e) => {
                  setIdentifier(e.target.value);
                  setError(null);
                  setInfo(null);
                }}
                placeholder="juan@migro.es o +34..."
                className="mt-1"
                autoFocus
                disabled={loading || step === 'verify'}
              />
              {step === 'verify' && (
                <p className="text-xs text-gray-500 mt-2">
                  Si necesitas cambiarlo, vuelve y solicita un nuevo código.
                </p>
              )}
            </div>

            {step === 'verify' && (
              <div>
                <Label htmlFor="code">Código OTP</Label>
                <Input
                  id="code"
                  type="text"
                  value={code}
                  onChange={(e) => {
                    setCode(e.target.value);
                    setError(null);
                    setInfo(null);
                  }}
                  placeholder="123456"
                  className="mt-1"
                  disabled={loading}
                  inputMode="numeric"
                />
              </div>
            )}

            {info && (
              <div className="bg-blue-50 border border-blue-200 text-blue-800 p-3 rounded-lg">
                <p className="text-sm">{info}</p>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg flex items-center gap-2">
                <ExclamationCircleIcon width={18} height={18} />
                <p className="text-sm">{error}</p>
              </div>
            )}

            {step === 'request' ? (
              <Button type="submit" disabled={loading} className="w-full bg-primary hover:bg-primary-700 text-white">
                {loading ? 'Enviando...' : 'Enviar código'}
              </Button>
            ) : (
              <div className="space-y-2">
                <Button type="submit" disabled={loading} className="w-full bg-primary hover:bg-primary-700 text-white">
                  {loading ? 'Verificando...' : 'Acceder'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={loading}
                  className="w-full"
                  onClick={() => {
                    setStep('request');
                    setCode('');
                    setInfo(null);
                    setError(null);
                  }}
                >
                  Volver
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  disabled={loading}
                  className="w-full"
                  onClick={async () => {
                    setError(null);
                    setInfo(null);
                    setLoading(true);
                    try {
                      await requestOtp(normalizedIdentifier);
                      setInfo('Código reenviado. Revisa tu email/SMS.');
                    } catch (err: unknown) {
                      setError(getErrorMessage(err) || 'No se pudo reenviar el código');
                    } finally {
                      setLoading(false);
                    }
                  }}
                >
                  Reenviar código
                </Button>
              </div>
            )}

            <div className="text-center pt-4 border-t space-y-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => navigate(`/auth/login${searchParamsString ? `?${searchParamsString}` : ''}`)}
                className="text-gray-600"
              >
                Volver a login con contraseña
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => navigate('/')}
                className="text-gray-600"
              >
                Volver al inicio
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

