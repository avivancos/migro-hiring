// Admin Login Page

import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/providers/AuthProvider';
import { ExclamationCircleIcon, LockClosedIcon } from '@heroicons/react/24/outline';

export function AdminLogin() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login, isAuthenticated, isAdmin } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Si ya está autenticado, redirigir
  useEffect(() => {
    if (isAuthenticated && isAdmin) {
      const returnUrl = searchParams.get('returnUrl') || '/admin/dashboard';
      navigate(returnUrl, { replace: true });
    }
  }, [isAuthenticated, isAdmin, navigate, searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      setError('Por favor, ingresa email y contraseña');
      return;
    }

    setLoading(true);
    setError(null);

    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/2b14ca23-0842-4fd5-8b43-eab84c4904d2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AdminLogin.tsx:40',message:'Login iniciado - valores del formulario',data:{email:email,emailLength:email.length,emailHasSpaces:email.trim()!==email,passwordLength:password.length,passwordHasSpaces:password.trim()!==password},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion

    try {
      await login(email, password);
      
      // Obtener returnUrl o usar ruta por defecto
      const returnUrl = searchParams.get('returnUrl');
      
      if (returnUrl) {
        navigate(returnUrl, { replace: true });
      } else {
        // Redirigir según la ruta de origen o por defecto a admin
        const path = window.location.pathname;
        if (path.includes('/crm') || path.startsWith('/crm')) {
          navigate('/crm', { replace: true });
        } else {
          navigate('/admin/dashboard', { replace: true });
        }
      }
    } catch (err: any) {
      console.error('❌ Error en login:', err);
      
      // Extraer mensaje de error del formato de FastAPI/Pydantic
      let errorMessage = 'Error al iniciar sesión. Verifica tus credenciales.';
      
      const errorDetail = err?.response?.data?.detail;
      
      if (errorDetail) {
        // Si es un array (formato de validación de FastAPI)
        if (Array.isArray(errorDetail)) {
          // Extraer el primer mensaje de validación
          const firstError = errorDetail[0];
          if (firstError?.msg) {
            errorMessage = firstError.msg;
            // Si hay location, añadirlo para más contexto
            if (firstError.loc && Array.isArray(firstError.loc) && firstError.loc.length > 1) {
              errorMessage = `${firstError.loc[firstError.loc.length - 1]}: ${firstError.msg}`;
            }
          } else {
            errorMessage = 'Error de validación. Por favor, verifica los datos ingresados.';
          }
        } 
        // Si es un string, usarlo directamente
        else if (typeof errorDetail === 'string') {
          errorMessage = errorDetail;
        }
        // Si es un objeto con mensaje
        else if (errorDetail.message) {
          errorMessage = errorDetail.message;
        }
      } 
      // Fallback a message del error
      else if (err?.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
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
            Panel de Administración
          </CardTitle>
          <p className="text-center text-sm text-gray-500 mt-2">
            Migro - Sistema de Contratación
          </p>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError(null);
                }}
                placeholder="juan@migro.es"
                className="mt-1"
                autoFocus
              />
            </div>

            <div>
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError(null);
                }}
                placeholder="Ingresa tu contraseña"
                className="mt-1"
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg flex items-center gap-2">
                <ExclamationCircleIcon width={18} height={18} />
                <p className="text-sm">{error}</p>
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-primary hover:bg-primary-700 text-white"
            >
              {loading ? 'Verificando...' : 'Acceder'}
            </Button>

            <div className="text-center pt-4 border-t">
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

