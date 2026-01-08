// Admin User Create - Crear nuevo usuario
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { adminService } from '@/services/adminService';
import { ArrowDownTrayIcon, ArrowLeftIcon, UserPlusIcon } from '@heroicons/react/24/outline';
import type { UserRole } from '@/types/user';

export function AdminUserCreate() {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    email: '',
    full_name: '',
    password: '',
    password_confirm: '',
    is_active: true,
    is_verified: false,
    role: 'user' as UserRole,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validaciones
    if (!formData.email || !formData.email.includes('@')) {
      setError('El email es obligatorio y debe ser válido');
      return;
    }

    if (!formData.password || formData.password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres');
      return;
    }

    if (formData.password !== formData.password_confirm) {
      setError('Las contraseñas no coinciden');
      return;
    }

    setSaving(true);
    try {
      const newUser = await adminService.createUser({
        email: formData.email,
        full_name: formData.full_name,
        password: formData.password,
        is_active: formData.is_active,
        is_verified: formData.is_verified,
        role: formData.role,
      });

      alert('Usuario creado correctamente');
      navigate(`/admin/users/${newUser.id}`);
    } catch (error: any) {
      console.error('Error creando usuario:', error);
      setError(error.response?.data?.detail || error.message || 'Error al crear el usuario');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/admin/users')}
            className="flex items-center gap-2"
          >
            <ArrowLeftIcon width={16} height={16} />
            <span className="hidden sm:inline">Volver</span>
          </Button>
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Crear Nuevo Usuario</h2>
            <p className="text-gray-600 mt-1">Añade un nuevo usuario al sistema</p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserPlusIcon width={20} height={20} />
                Información del Usuario
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
                  <p className="text-sm">{error}</p>
                </div>
              )}

              <div>
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="usuario@ejemplo.com"
                  required
                />
              </div>

              <div>
                <Label htmlFor="full_name">Nombre Completo</Label>
                <Input
                  id="full_name"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  placeholder="Juan Pérez"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="password">Contraseña *</Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Mínimo 8 caracteres"
                    required
                    minLength={8}
                  />
                </div>

                <div>
                  <Label htmlFor="password_confirm">Confirmar Contraseña *</Label>
                  <Input
                    id="password_confirm"
                    type="password"
                    value={formData.password_confirm}
                    onChange={(e) => setFormData({ ...formData, password_confirm: e.target.value })}
                    placeholder="Repite la contraseña"
                    required
                    minLength={8}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="role">Rol</Label>
                  <select
                    id="role"
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="user">Usuario</option>
                    <option value="agent">Agente</option>
                    <option value="lawyer">Abogado</option>
                    <option value="admin">Administrador</option>
                  </select>
              </div>

              <div className="space-y-3 pt-4 border-t">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, is_active: checked === true })
                    }
                  />
                  <Label htmlFor="is_active" className="cursor-pointer">
                    Usuario activo
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="is_verified"
                    checked={formData.is_verified}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, is_verified: checked === true })
                    }
                  />
                  <Label htmlFor="is_verified" className="cursor-pointer">
                    Email verificado
                  </Label>
                </div>

              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/admin/users')}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={saving}
                  className="flex-1 flex items-center justify-center gap-2"
                >
                  <ArrowDownTrayIcon width={18} height={18} />
                  {saving ? 'Creando...' : 'Crear Usuario'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      </div>
    </>
  );
}

