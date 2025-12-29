// CompanyForm - Formulario para crear/editar empresas

import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { Company, CRMUser } from '@/types/crm';
import { crmService } from '@/services/crmService';
import { adminService } from '@/services/adminService';

interface CompanyFormProps {
  company?: Company;
  onSubmit: (data: any) => Promise<void>;
  onCancel: () => void;
}

export function CompanyForm({ company, onSubmit, onCancel }: CompanyFormProps) {
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<CRMUser[]>([]);
  const [formData, setFormData] = useState({
    name: company?.name || '',
    description: company?.description || '',
    website: company?.website || '',
    industry: company?.industry || '',
    phone: company?.phone || '',
    email: company?.email || '',
    address: company?.address || '',
    city: company?.city || '',
    country: company?.country || 'España',
    responsible_user_id: company?.responsible_user_id || undefined,
  });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const allUsers = await crmService.getUsers(true);
      // Filtrar para incluir solo lawyers y agentes (no solo lawyers)
      const usersData = allUsers.filter(u => u.role_name === 'lawyer' || u.role_name === 'agent');
      setUsers(usersData);
      
      // Pre-llenar responsable con el usuario actual si no hay uno ya asignado
      if (!formData.responsible_user_id) {
        const currentUser = adminService.getUser();
        if (currentUser?.id) {
          // Buscar el usuario actual en la lista de usuarios del CRM
          const currentCRMUser = usersData.find(u => u.id === currentUser.id || u.email === currentUser.email);
          if (currentCRMUser) {
            setFormData(prev => ({ ...prev, responsible_user_id: currentCRMUser.id }));
          }
        }
      }
    } catch (err) {
      console.error('Error loading users:', err);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await onSubmit(formData);
    } catch (err) {
      console.error('Error submitting form:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {company ? 'Editar Empresa' : 'Nueva Empresa'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Nombre */}
            <div className="md:col-span-2">
              <Label htmlFor="name">
                Nombre de la Empresa <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder="Ej: Empresa SL"
                required
              />
            </div>

            {/* Email */}
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                placeholder="contacto@empresa.com"
              />
            </div>

            {/* Teléfono */}
            <div>
              <Label htmlFor="phone">Teléfono</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                placeholder="+34123456789"
              />
            </div>

            {/* Website */}
            <div>
              <Label htmlFor="website">Sitio Web</Label>
              <Input
                id="website"
                type="url"
                value={formData.website}
                onChange={(e) => handleChange('website', e.target.value)}
                placeholder="https://www.empresa.com"
              />
            </div>

            {/* Industria */}
            <div>
              <Label htmlFor="industry">Industria</Label>
              <Input
                id="industry"
                value={formData.industry}
                onChange={(e) => handleChange('industry', e.target.value)}
                placeholder="Ej: Tecnología, Retail, etc."
              />
            </div>

            {/* Responsable */}
            <div>
              <Label htmlFor="responsible_user_id">Responsable</Label>
              <select
                id="responsible_user_id"
                value={formData.responsible_user_id || ''}
                onChange={(e) => handleChange('responsible_user_id', e.target.value || null)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="">Sin asignar</option>
                {users.map(user => {
                  const displayName = user.name?.trim() || user.email || `Usuario ${user.id?.slice(0, 8) || 'N/A'}`;
                  return (
                    <option key={user.id} value={user.id}>
                      {displayName}
                    </option>
                  );
                })}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Solo abogados y agentes pueden ser responsables
              </p>
            </div>

            {/* País */}
            <div>
              <Label htmlFor="country">País</Label>
              <Input
                id="country"
                value={formData.country}
                onChange={(e) => handleChange('country', e.target.value)}
                placeholder="España"
              />
            </div>

            {/* Ciudad */}
            <div>
              <Label htmlFor="city">Ciudad</Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) => handleChange('city', e.target.value)}
                placeholder="Madrid"
              />
            </div>

            {/* Dirección */}
            <div className="md:col-span-2">
              <Label htmlFor="address">Dirección</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => handleChange('address', e.target.value)}
                placeholder="Calle Example, 123"
              />
            </div>

            {/* Descripción */}
            <div className="md:col-span-2">
              <Label htmlFor="description">Descripción</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                placeholder="Información adicional sobre la empresa..."
                rows={4}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="bg-green-600 hover:bg-green-700"
              disabled={loading}
            >
              {loading ? 'Guardando...' : company ? 'Actualizar' : 'Crear Empresa'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

