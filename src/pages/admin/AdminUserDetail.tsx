// Admin User Detail - Detalle y edición de usuario
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { adminService } from '@/services/adminService';
import { ArrowLeft, Save, Trash2, Mail, Shield, UserCheck, UserX, Key, UserCog, History, Eye, Lock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/common/Modal';
import type { User, UserRole } from '@/types/user';

export function AdminUserDetail() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [showAuditLogs, setShowAuditLogs] = useState(false);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [passwordData, setPasswordData] = useState({
    newPassword: '',
    confirmPassword: '',
  });
  const [changingPassword, setChangingPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    full_name: '',
    phone_number: '',
    bio: '',
    is_active: true,
    is_verified: false,
    role: 'user' as UserRole,
  });

  useEffect(() => {
    if (id) {
      loadUser();
      loadCurrentUser();
    }
  }, [id]);

  const loadCurrentUser = () => {
    try {
      // getUser() sin parámetros obtiene del localStorage
      const current = adminService.getUser();
      setCurrentUser(current);
    } catch (error) {
      console.error('Error cargando usuario actual:', error);
      setCurrentUser(null);
    }
  };

  const loadUser = async () => {
    setLoading(true);
    try {
      const data = await adminService.getUserById(id!);
      setUser(data);
      setFormData({
        email: data.email || '',
        full_name: data.full_name || '',
        phone_number: data.phone_number || '',
        bio: data.bio || '',
        is_active: data.is_active ?? true,
        is_verified: data.is_verified ?? false,
        role: (data.role || 'user') as UserRole,
      });
    } catch (error) {
      console.error('Error cargando usuario:', error);
      alert('Error al cargar el usuario');
      navigate('/admin/users');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!id) return;

    setSaving(true);
    try {
      // Separar la actualización del rol del resto de campos
      // El rol se actualiza con updateUserRole, no con updateUser
      const { role, ...userDataWithoutRole } = formData;
      
      // Actualizar campos básicos (sin rol)
      await adminService.updateUser(id, userDataWithoutRole);
      
      // Si el rol cambió, actualizarlo por separado
      if (role && user && role !== user.role) {
        await adminService.updateUserRole(id, role);
      }
      
      await loadUser();
      alert('Usuario actualizado correctamente');
    } catch (error: any) {
      console.error('Error actualizando usuario:', error);
      const errorMessage = error.response?.data?.detail || error.message || 'Error al actualizar el usuario';
      alert(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    if (!confirm('¿Estás seguro de que deseas eliminar este usuario? Esta acción no se puede deshacer.')) {
      return;
    }

    try {
      await adminService.deleteUser(id);
      navigate('/admin/users');
    } catch (error: any) {
      console.error('Error eliminando usuario:', error);
      alert(error.response?.data?.detail || 'Error al eliminar el usuario');
    }
  };

  const handleRoleChange = async (newRole: UserRole) => {
    if (!id) return;
    if (!confirm(`¿Cambiar el rol de este usuario a "${newRole}"?`)) {
      return;
    }

    try {
      await adminService.updateUserRole(id, newRole);
      await loadUser();
      alert('Rol actualizado correctamente');
    } catch (error: any) {
      console.error('Error actualizando rol:', error);
      alert(error.response?.data?.detail || 'Error al actualizar el rol');
    }
  };

  const handleStatusChange = async (isActive: boolean) => {
    if (!id) return;
    const action = isActive ? 'activar' : 'desactivar';
    if (!confirm(`¿${action.charAt(0).toUpperCase() + action.slice(1)} este usuario?`)) {
      return;
    }

    try {
      await adminService.updateUserStatus(id, isActive);
      await loadUser();
      alert(`Usuario ${action}do correctamente`);
    } catch (error: any) {
      console.error('Error actualizando estado:', error);
      alert(error.response?.data?.detail || 'Error al actualizar el estado');
    }
  };

  const handleResetPassword = async () => {
    if (!id) return;
    if (!confirm('¿Enviar email de reset de contraseña a este usuario?')) {
      return;
    }

    try {
      await adminService.resetUserPassword(id);
      alert('Email de reset de contraseña enviado correctamente');
    } catch (error: any) {
      console.error('Error reseteando contraseña:', error);
      alert(error.response?.data?.detail || 'Error al resetear la contraseña');
    }
  };

  const handleChangePassword = async () => {
    if (!id) return;

    // Validaciones
    if (!passwordData.newPassword || passwordData.newPassword.length < 8) {
      alert('La contraseña debe tener al menos 8 caracteres');
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert('Las contraseñas no coinciden');
      return;
    }

    if (!confirm('¿Estás seguro de que deseas cambiar la contraseña de este usuario?')) {
      return;
    }

    setChangingPassword(true);
    try {
      await adminService.changeUserPassword(id, passwordData.newPassword);
      alert('Contraseña cambiada correctamente');
      setShowChangePasswordModal(false);
      setPasswordData({ newPassword: '', confirmPassword: '' });
    } catch (error: any) {
      console.error('Error cambiando contraseña:', error);
      alert(error.response?.data?.detail || 'Error al cambiar la contraseña');
    } finally {
      setChangingPassword(false);
    }
  };

  const handleImpersonate = async () => {
    if (!id) return;
    if (!confirm('¿Impersonar a este usuario? Podrás actuar como él.')) {
      return;
    }

    try {
      const response = await adminService.impersonateUser(id);
      // Guardar el token de impersonación
      localStorage.setItem('impersonation_token', response.access_token);
      localStorage.setItem('access_token', response.access_token);
      alert('Impersonación iniciada. Redirigiendo...');
      // Recargar la página para aplicar el nuevo token
      window.location.reload();
    } catch (error: any) {
      console.error('Error impersonando usuario:', error);
      alert(error.response?.data?.detail || 'Error al impersonar usuario. Solo los superusuarios pueden hacer esto.');
    }
  };

  const loadAuditLogs = async () => {
    if (!id) return;
    try {
      const data = await adminService.getAuditLogs({ user_id: id, limit: 50 });
      setAuditLogs(data.items || []);
    } catch (error) {
      console.error('Error cargando logs:', error);
    }
  };

  useEffect(() => {
    if (showAuditLogs && id) {
      loadAuditLogs();
    }
  }, [showAuditLogs, id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando usuario...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Usuario no encontrado</p>
        <Button onClick={() => navigate('/admin/users')} variant="outline" className="mt-4">
          Volver a usuarios
        </Button>
      </div>
    );
  }

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
            <ArrowLeft size={16} />
            <span className="hidden sm:inline">Volver</span>
          </Button>
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Editar Usuario</h2>
            <p className="text-gray-600 mt-1">ID: {user.id}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Form */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Información del Usuario</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
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

                <div>
                  <Label htmlFor="phone_number">Teléfono</Label>
                  <Input
                    id="phone_number"
                    value={formData.phone_number}
                    onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                    placeholder="+34612345678"
                  />
                </div>

                <div>
                  <Label htmlFor="bio">Biografía</Label>
                  <textarea
                    id="bio"
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary min-h-[100px]"
                    placeholder="Biografía del usuario..."
                  />
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

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="is_superuser"
                      checked={formData.is_superuser}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, is_superuser: checked === true })
                      }
                    />
                    <Label htmlFor="is_superuser" className="cursor-pointer">
                      Superusuario
                    </Label>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Admin Actions */}
            {currentUser && (currentUser.is_superuser || currentUser.role === 'admin') && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <UserCog size={20} />
                    Acciones Administrativas
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Button
                      onClick={() => handleRoleChange('lawyer')}
                      variant="outline"
                      disabled={formData.role === 'lawyer'}
                      className="flex items-center gap-2"
                    >
                      <Shield size={16} />
                      Cambiar a Abogado
                    </Button>
                    <Button
                      onClick={() => handleRoleChange('agent')}
                      variant="outline"
                      disabled={formData.role === 'agent'}
                      className="flex items-center gap-2"
                    >
                      <UserCheck size={16} />
                      Cambiar a Agente
                    </Button>
                    <Button
                      onClick={() => handleStatusChange(!formData.is_active)}
                      variant={formData.is_active ? 'destructive' : 'default'}
                      className="flex items-center gap-2"
                    >
                      {formData.is_active ? (
                        <>
                          <UserX size={16} />
                          Desactivar
                        </>
                      ) : (
                        <>
                          <UserCheck size={16} />
                          Activar
                        </>
                      )}
                    </Button>
                    <Button
                      onClick={handleResetPassword}
                      variant="outline"
                      className="flex items-center gap-2"
                    >
                      <Key size={16} />
                      Reset Password
                    </Button>
                    <Button
                      onClick={() => setShowChangePasswordModal(true)}
                      variant="outline"
                      className="flex items-center gap-2"
                    >
                      <Lock size={16} />
                      Cambiar Contraseña
                    </Button>
                  </div>
                  {currentUser.is_superuser && (
                    <Button
                      onClick={handleImpersonate}
                      variant="outline"
                      className="w-full flex items-center gap-2"
                    >
                      <Eye size={16} />
                      Impersonar Usuario
                    </Button>
                  )}
                  <Button
                    onClick={() => {
                      setShowAuditLogs(!showAuditLogs);
                    }}
                    variant="outline"
                    className="w-full flex items-center gap-2"
                  >
                    <History size={16} />
                    {showAuditLogs ? 'Ocultar' : 'Ver'} Logs de Auditoría
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Audit Logs */}
            {showAuditLogs && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <History size={20} />
                    Logs de Auditoría
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {auditLogs.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">No hay logs de auditoría</p>
                  ) : (
                    <div className="space-y-3">
                      {auditLogs.map((log) => (
                        <div key={log.id} className="border-l-4 border-gray-300 pl-4 py-2">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium">{log.action}</p>
                              <p className="text-sm text-gray-600">{log.actor_email}</p>
                              {log.details && (
                                <pre className="text-xs text-gray-500 mt-1">
                                  {JSON.stringify(log.details, null, 2)}
                                </pre>
                              )}
                            </div>
                            <span className="text-xs text-gray-400">
                              {new Date(log.created_at).toLocaleString('es-ES')}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 flex items-center justify-center gap-2"
              >
                <Save size={18} />
                {saving ? 'Guardando...' : 'Guardar Cambios'}
              </Button>
              <Button
                onClick={handleDelete}
                variant="destructive"
                className="flex items-center justify-center gap-2"
              >
                <Trash2 size={18} />
                <span className="hidden sm:inline">Eliminar</span>
              </Button>
            </div>
          </div>

          {/* Sidebar Info */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Estado Actual</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Estado</span>
                  <Badge variant={user.is_active ? 'success' : 'neutral'}>
                    {user.is_active ? 'Activo' : 'Inactivo'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Rol</span>
                  <Badge variant={user.role === 'admin' || user.is_superuser ? 'default' : 'neutral'}>
                    {user.is_superuser ? (
                      <>
                        <Shield size={12} className="mr-1" />
                        Superusuario
                      </>
                    ) : (
                      user.role || 'user'
                    )}
                  </Badge>
                </div>
                {user.last_login && (
                  <div>
                    <span className="text-sm text-gray-600">Último login:</span>
                    <p className="text-sm text-gray-900">
                      {new Date(user.last_login).toLocaleString('es-ES')}
                    </p>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Verificado</span>
                  <Badge variant={user.is_verified ? 'success' : 'neutral'}>
                    {user.is_verified ? 'Sí' : 'No'}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Información del Sistema</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div>
                  <span className="text-gray-600">Creado:</span>
                  <p className="text-gray-900">
                    {new Date(user.created_at).toLocaleString('es-ES')}
                  </p>
                </div>
                {user.updated_at && (
                  <div>
                    <span className="text-gray-600">Actualizado:</span>
                    <p className="text-gray-900">
                      {new Date(user.updated_at).toLocaleString('es-ES')}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Modal de Cambio de Contraseña */}
      <Modal
        open={showChangePasswordModal}
        onClose={() => {
          setShowChangePasswordModal(false);
          setPasswordData({ newPassword: '', confirmPassword: '' });
        }}
        title="Cambiar Contraseña"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Ingresa la nueva contraseña para el usuario <strong>{user?.email}</strong>
          </p>
          
          <div>
            <Label htmlFor="newPassword">Nueva Contraseña *</Label>
            <Input
              id="newPassword"
              type="password"
              value={passwordData.newPassword}
              onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
              placeholder="Mínimo 8 caracteres"
              className="mt-1"
            />
            <p className="text-xs text-gray-500 mt-1">La contraseña debe tener al menos 8 caracteres</p>
          </div>

          <div>
            <Label htmlFor="confirmPassword">Confirmar Contraseña *</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={passwordData.confirmPassword}
              onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
              placeholder="Repite la contraseña"
              className="mt-1"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => {
                setShowChangePasswordModal(false);
                setPasswordData({ newPassword: '', confirmPassword: '' });
              }}
              disabled={changingPassword}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleChangePassword}
              disabled={changingPassword || !passwordData.newPassword || !passwordData.confirmPassword}
            >
              {changingPassword ? 'Cambiando...' : 'Cambiar Contraseña'}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}

