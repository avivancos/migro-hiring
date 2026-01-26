// Portal de Facturación para Clientes
//
// Permite a los clientes autenticados ver y gestionar su información de facturación
// mediante Stripe Billing Portal.

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ClientesBillingSection } from '@/components/stripe/ClientesBillingSection';
import { useAuth } from '@/providers/AuthProvider';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

export function ClientesBilling() {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const [hiringCode, setHiringCode] = useState('');
  const [activeCode, setActiveCode] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (hiringCode.trim()) {
      setActiveCode(hiringCode.trim().toUpperCase());
    }
  };

  // Si no está autenticado, redirigir al portal
  if (!isAuthenticated) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto px-4 py-12">
          <Card>
            <CardHeader>
              <CardTitle>Acceso requerido</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-600">
                Debes iniciar sesión para acceder a tu información de facturación.
              </p>
              <Button onClick={() => navigate('/clientes?returnUrl=/clientes/billing')}>
                Iniciar sesión
              </Button>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-5xl mx-auto px-4 py-12">
        <div className="mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/clientes')}
            className="mb-4"
          >
            <ArrowLeftIcon width={16} height={16} className="mr-2" />
            Volver al portal
          </Button>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Facturación y Pagos</h1>
          <p className="text-gray-600">
            {user?.email && `Sesión iniciada como ${user.email}`}
          </p>
        </div>

        {!activeCode ? (
          <Card>
            <CardHeader>
              <CardTitle>Ingresa tu código de contratación</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="hiring-code">Código de contratación</Label>
                  <Input
                    id="hiring-code"
                    type="text"
                    placeholder="AB12C"
                    maxLength={5}
                    value={hiringCode}
                    onChange={(e) => setHiringCode(e.target.value.toUpperCase())}
                    className="uppercase text-center font-mono mt-1"
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    Ingresa el código de contratación que recibiste por email o SMS.
                  </p>
                </div>
                <Button type="submit" className="w-full bg-green-600 hover:bg-green-700 text-white">
                  Ver información de facturación
                </Button>
              </form>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Código: {activeCode}</CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setActiveCode(null);
                      setHiringCode('');
                    }}
                  >
                    Cambiar código
                  </Button>
                </div>
              </CardHeader>
            </Card>
            <ClientesBillingSection hiringCode={activeCode} />
          </div>
        )}
      </div>
    </Layout>
  );
}
