// Clientes Portal - Landing pública para clientes
//
// Nota: esta ruta existe como "slug" /clientes para el portal cliente.
// Desde aquí se inicia el flujo de contratación usando un hiring code.

import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { fadeIn, slideUp, staggerContainer, staggerItem } from '@/utils/animations';
import { useAuth } from '@/providers/AuthProvider';
import { getErrorMessage } from '@/services/api';

function normalizeIdentifier(raw: string): string {
  // Email: mantener (trim)
  // Teléfono: quitar espacios/guiones/paréntesis para que el backend pueda normalizar mejor
  const v = raw.trim();
  if (v.includes('@')) return v;
  return v.replace(/[()\s-]/g, '');
}

export function ClientesPortal() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { requestOtp, loginOtp, isAuthenticated, isLoading, user } = useAuth();

  const [hiringCode, setHiringCode] = useState('');
  const [identifier, setIdentifier] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState<'request' | 'verify'>('request');
  const [info, setInfo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const normalizedIdentifier = useMemo(() => normalizeIdentifier(identifier), [identifier]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (hiringCode.trim()) {
      navigate(`/clientes/${hiringCode}`);
    }
  };

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);

    if (!normalizedIdentifier) {
      setError('Por favor, ingresa tu email o teléfono.');
      return;
    }

    setLoading(true);
    try {
      await requestOtp(normalizedIdentifier);
      setStep('verify');
      setInfo('Código enviado. Revisa tu email/SMS y escribe el código para continuar.');
    } catch (err: unknown) {
      setError(getErrorMessage(err) || 'No se pudo enviar el código.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);

    if (!normalizedIdentifier) {
      setError('Por favor, ingresa tu email o teléfono.');
      return;
    }
    if (!code.trim()) {
      setError('Por favor, ingresa el código.');
      return;
    }

    setLoading(true);
    try {
      await loginOtp(normalizedIdentifier, code.trim());

      const returnUrl = searchParams.get('returnUrl');
      if (returnUrl) {
        navigate(returnUrl, { replace: true });
      }
      // Si no hay returnUrl, nos quedamos en /clientes y mostramos el estado de sesión
    } catch (err: unknown) {
      setError(getErrorMessage(err) || 'Código inválido o expirado.');
    } finally {
      setLoading(false);
    }
  };

  const features = [
    {
      title: 'Verifica Datos',
      description: 'Confirma tu información personal de forma segura',
    },
    {
      title: 'KYC Identity',
      description: 'Verificación de identidad con Stripe Identity',
    },
    {
      title: 'Pago Seguro',
      description: 'Procesa tu pago de forma segura con Stripe',
    },
    {
      title: 'Contrato Digital',
      description: 'Descarga tu contrato firmado instantáneamente',
    },
  ];

  return (
    <Layout>
      <motion.div
        className="max-w-5xl mx-auto px-4 py-12"
        initial="hidden"
        animate="visible"
        variants={fadeIn}
      >
        {/* Hero Section */}
        <motion.div className="text-center mb-16" variants={slideUp}>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Portal de Clientes
            <span className="block text-primary mt-2">Migro</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Completa tu proceso de contratación de forma autónoma, segura y 100% digital.
          </p>
        </motion.div>

        <motion.div variants={slideUp} className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {/* Login */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>Iniciar sesión</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isAuthenticated && user ? (
                <div className="text-sm text-gray-700">
                  Sesión iniciada como <span className="font-medium">{user.email}</span>.
                </div>
              ) : (
                <form
                  onSubmit={step === 'request' ? handleRequestOtp : handleVerifyOtp}
                  className="space-y-3"
                >
                  <div>
                    <Label htmlFor="clientes-identifier">Email o teléfono</Label>
                    <Input
                      id="clientes-identifier"
                      type="text"
                      value={identifier}
                      onChange={(e) => {
                        setIdentifier(e.target.value);
                        setError(null);
                        setInfo(null);
                      }}
                      placeholder="tu@email.com o +34..."
                      disabled={isLoading || loading || step === 'verify'}
                      className="mt-1"
                    />
                    {step === 'verify' && (
                      <p className="text-xs text-gray-500 mt-2">
                        Si necesitas cambiarlo, vuelve y solicita un nuevo código.
                      </p>
                    )}
                  </div>

                  {step === 'verify' && (
                    <div>
                      <Label htmlFor="clientes-code">Código OTP</Label>
                      <Input
                        id="clientes-code"
                        type="text"
                        value={code}
                        onChange={(e) => {
                          setCode(e.target.value);
                          setError(null);
                          setInfo(null);
                        }}
                        placeholder="123456"
                        disabled={isLoading || loading}
                        className="mt-1"
                        inputMode="numeric"
                      />
                    </div>
                  )}

                  {info && (
                    <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800">
                      {info}
                    </div>
                  )}

                  {error && (
                    <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                      {error}
                    </div>
                  )}

                  {step === 'request' ? (
                    <Button
                      type="submit"
                      disabled={isLoading || loading}
                      className="w-full bg-primary hover:bg-primary-700 text-white"
                    >
                      {loading ? 'Enviando...' : 'Enviar código'}
                    </Button>
                  ) : (
                    <div className="space-y-2">
                      <Button
                        type="submit"
                        disabled={isLoading || loading}
                        className="w-full bg-primary hover:bg-primary-700 text-white"
                      >
                        {loading ? 'Verificando...' : 'Verificar y entrar'}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        disabled={isLoading || loading}
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
                        disabled={isLoading || loading}
                        className="w-full"
                        onClick={async () => {
                          setError(null);
                          setInfo(null);
                          setLoading(true);
                          try {
                            await requestOtp(normalizedIdentifier);
                            setInfo('Código reenviado. Revisa tu email/SMS.');
                          } catch (err: unknown) {
                            setError(getErrorMessage(err) || 'No se pudo reenviar el código.');
                          } finally {
                            setLoading(false);
                          }
                        }}
                      >
                        Reenviar código
                      </Button>
                    </div>
                  )}
                </form>
              )}
            </CardContent>
          </Card>

          {/* Acceso con código */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>Continuar con tu código</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-gray-600">
                Si ya tienes tu código de contratación, puedes iniciar el proceso directamente.
              </p>
              <form onSubmit={handleSubmit} className="flex gap-3">
                <Input
                  type="text"
                  placeholder="AB12C"
                  maxLength={5}
                  value={hiringCode}
                  onChange={(e) => setHiringCode(e.target.value.toUpperCase())}
                  className="uppercase text-center font-mono"
                />
                <Button type="submit" className="bg-green-600 hover:bg-green-700 text-white">
                  Continuar
                </Button>
              </form>
            </CardContent>
          </Card>
        </motion.div>

        {/* Features */}
        <motion.div
          className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12"
          variants={staggerContainer}
        >
          {features.map((feature, index) => (
            <motion.div key={index} variants={staggerItem}>
              <Card className="h-full">
                <CardHeader>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">{feature.description}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* Info */}
        <motion.div className="mt-12 text-center text-sm text-gray-500" variants={fadeIn}>
          <p>¿No tienes un código? Contacta con tu asesor de Migro</p>
        </motion.div>
      </motion.div>
    </Layout>
  );
}

