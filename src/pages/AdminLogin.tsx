// Admin Login Page

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { adminService } from '@/services/adminService';
import { Lock, AlertCircle } from 'lucide-react';

export function AdminLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      setError('Por favor, ingresa email y contraseña');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('🔐 Iniciando login con:', { email });
      const result = await adminService.login(email, password);
      
      console.log('📋 Resultado del login:', result);
      console.log('✅ Success:', result.success);
      console.log('👤 User:', result.user);
      console.log('🔑 Token:', result.token ? 'Presente' : 'Ausente');
      
      if (result.success && result.user) {
        // Verificar que el usuario sea admin o superuser
        const isAdmin = result.user.is_admin || 
                       result.user.is_superuser || 
                       result.user.role === 'admin' || 
                       result.user.role === 'superuser';
        
        if (isAdmin) {
          console.log('✅ Usuario es admin, navegando a /crm');
          // Navegar al nuevo dashboard CRM
          navigate('/crm');
        } else {
          console.warn('⚠️ Usuario no es admin:', result.user);
          setError('No tienes permisos de administrador');
          adminService.logout();
        }
      } else {
        console.error('❌ Login falló:', result.error);
        setError(result.error || 'Credenciales incorrectas. Verifica tu email y contraseña.');
      }
    } catch (err: any) {
      console.error('❌ Error en login:', err);
      console.error('❌ Error response:', err?.response);
      console.error('❌ Error data:', err?.response?.data);
      setError(err?.response?.data?.detail || err?.message || 'Error al iniciar sesión. Verifica tus credenciales.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl text-center flex items-center justify-center gap-2">
            <Lock className="text-primary" size={28} />
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
                placeholder="agusvc@gmail.com"
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
                <AlertCircle size={18} />
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

