// ContactForm - Formulario para crear/editar contactos

import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { KommoContact, Company } from '@/types/crm';
import { crmService } from '@/services/crmService';

interface ContactFormProps {
  contact?: KommoContact;
  onSubmit: (data: any) => Promise<void>;
  onCancel: () => void;
}

export function ContactForm({ contact, onSubmit, onCancel }: ContactFormProps) {
  const [loading, setLoading] = useState(false);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [formData, setFormData] = useState({
    name: contact?.name || '',
    first_name: contact?.first_name || '',
    last_name: contact?.last_name || '',
    email: contact?.email || '',
    phone: contact?.phone || '',
    mobile: contact?.mobile || '',
    address: contact?.address || '',
    city: contact?.city || '',
    state: contact?.state || '',
    postal_code: contact?.postal_code || '',
    country: contact?.country || 'España',
    company: contact?.company || '',
    company_id: contact?.company_id || undefined,
    position: contact?.position || '',
    notes: contact?.notes || '',
    // Campos Migro específicos
    grading_llamada: contact?.grading_llamada || '',
    grading_situacion: contact?.grading_situacion || '',
    nacionalidad: contact?.nacionalidad || '',
    tiempo_espana: contact?.tiempo_espana || '',
    empadronado: contact?.empadronado ?? undefined,
    lugar_residencia: contact?.lugar_residencia || '',
    tiene_ingresos: contact?.tiene_ingresos ?? undefined,
    trabaja_b: contact?.trabaja_b ?? undefined,
    edad: contact?.edad ?? null,
    tiene_familiares_espana: contact?.tiene_familiares_espana ?? undefined,
  });

  useEffect(() => {
    loadCompanies();
  }, []);

  const loadCompanies = async () => {
    try {
      const response = await crmService.getCompanies({ limit: 100 });
      setCompanies(response.items || []);
    } catch (err: any) {
      // El endpoint de companies puede no existir (404), no es crítico
      if (err?.response?.status !== 404) {
        console.error('Error loading companies:', err);
      }
      // Continuar sin empresas si el endpoint no existe
      setCompanies([]);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Limpiar datos antes de enviar: eliminar campos vacíos, undefined, null innecesarios
      const cleanedData: any = {};
      
      // Campos requeridos siempre se envían
      if (formData.name) cleanedData.name = formData.name.trim();
      
      // Campos opcionales solo si tienen valor
      if (formData.first_name?.trim()) cleanedData.first_name = formData.first_name.trim();
      if (formData.last_name?.trim()) cleanedData.last_name = formData.last_name.trim();
      if (formData.email?.trim()) cleanedData.email = formData.email.trim();
      if (formData.phone?.trim()) cleanedData.phone = formData.phone.trim();
      if (formData.mobile?.trim()) cleanedData.mobile = formData.mobile.trim();
      if (formData.address?.trim()) cleanedData.address = formData.address.trim();
      if (formData.city?.trim()) cleanedData.city = formData.city.trim();
      if (formData.state?.trim()) cleanedData.state = formData.state.trim();
      if (formData.postal_code?.trim()) cleanedData.postal_code = formData.postal_code.trim();
      if (formData.country?.trim()) cleanedData.country = formData.country.trim();
      // company puede ser string o KommoCompany
      if (typeof formData.company === 'string' && formData.company.trim()) {
        cleanedData.company = formData.company.trim();
      } else if (formData.company && typeof formData.company === 'object') {
        // Si es un objeto KommoCompany, usar el ID
        cleanedData.company_id = formData.company.id;
      }
      if (formData.position?.trim()) cleanedData.position = formData.position.trim();
      if (formData.company_id) cleanedData.company_id = formData.company_id;
      // responsible_user_id se obtiene del contacto original si existe
      if (contact?.responsible_user_id) cleanedData.responsible_user_id = contact.responsible_user_id;
      if (formData.notes?.trim()) cleanedData.notes = formData.notes.trim();
      
      // Campos Migro específicos
      if (formData.grading_llamada) cleanedData.grading_llamada = formData.grading_llamada;
      if (formData.grading_situacion) cleanedData.grading_situacion = formData.grading_situacion;
      if (formData.nacionalidad?.trim()) cleanedData.nacionalidad = formData.nacionalidad.trim();
      if (formData.tiempo_espana?.trim()) cleanedData.tiempo_espana = formData.tiempo_espana.trim();
      if (formData.lugar_residencia?.trim()) cleanedData.lugar_residencia = formData.lugar_residencia.trim();
      if (formData.empadronado !== undefined) cleanedData.empadronado = formData.empadronado;
      if (formData.tiene_ingresos !== undefined) cleanedData.tiene_ingresos = formData.tiene_ingresos;
      if (formData.trabaja_b !== undefined) cleanedData.trabaja_b = formData.trabaja_b;
      if (formData.tiene_familiares_espana !== undefined) cleanedData.tiene_familiares_espana = formData.tiene_familiares_espana;
      if (formData.edad !== null && formData.edad !== undefined) cleanedData.edad = formData.edad;
      
      console.log('🟢 [ContactForm] Datos limpiados antes de enviar:', cleanedData);
      await onSubmit(cleanedData);
    } catch (err) {
      console.error('Error submitting form:', err);
      // El error se maneja en el componente padre
      throw err;
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
          {contact ? 'Editar Contacto' : 'Nuevo Contacto'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            {/* Nombre completo (requerido) */}
            <div>
              <Label htmlFor="name" className="text-sm sm:text-base">
                Nombre Completo <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder="Juan Pérez"
                required
                className="text-sm sm:text-base"
              />
            </div>

            {/* Nombre */}
            <div>
              <Label htmlFor="first_name">Nombre</Label>
              <Input
                id="first_name"
                value={formData.first_name}
                onChange={(e) => handleChange('first_name', e.target.value)}
                placeholder="Juan"
              />
            </div>

            {/* Apellido */}
            <div>
              <Label htmlFor="last_name">Apellido</Label>
              <Input
                id="last_name"
                value={formData.last_name}
                onChange={(e) => handleChange('last_name', e.target.value)}
                placeholder="Pérez"
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
                placeholder="juan@example.com"
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

            {/* Móvil */}
            <div>
              <Label htmlFor="mobile">Móvil</Label>
              <Input
                id="mobile"
                type="tel"
                value={formData.mobile}
                onChange={(e) => handleChange('mobile', e.target.value)}
                placeholder="+34612345678"
              />
            </div>

            {/* Empresa */}
            <div>
              <Label htmlFor="company_id">Empresa</Label>
              <select
                id="company_id"
                value={formData.company_id || ''}
                onChange={(e) => handleChange('company_id', e.target.value ? parseInt(e.target.value) : undefined)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="">Sin empresa</option>
                {companies.map(company => (
                  <option key={company.id} value={company.id}>
                    {company.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Cargo */}
            <div>
              <Label htmlFor="position">Cargo</Label>
              <Input
                id="position"
                value={formData.position}
                onChange={(e) => handleChange('position', e.target.value)}
                placeholder="CEO, Manager, etc."
              />
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
            <div className="sm:col-span-2">
              <Label htmlFor="address" className="text-sm sm:text-base">Dirección</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => handleChange('address', e.target.value)}
                placeholder="Calle Example, 123"
                className="text-sm sm:text-base"
              />
            </div>

            {/* Notas */}
            <div className="sm:col-span-2">
              <Label htmlFor="notes" className="text-sm sm:text-base">Notas</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => handleChange('notes', e.target.value)}
                placeholder="Información adicional sobre el contacto..."
                rows={4}
                className="text-sm sm:text-base"
              />
            </div>
          </div>

          {/* Campos Migro Específicos */}
          <div className="border-t pt-4 sm:pt-6 mt-4 sm:mt-6">
            <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Información Migro</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              {/* Grading Llamada */}
              <div>
                <Label htmlFor="grading_llamada">Grading Llamada</Label>
                <select
                  id="grading_llamada"
                  value={formData.grading_llamada}
                  onChange={(e) => handleChange('grading_llamada', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="">Seleccionar...</option>
                  <option value="A">A</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="C">C</option>
                </select>
              </div>

              {/* Grading Situación */}
              <div>
                <Label htmlFor="grading_situacion">Grading Situación</Label>
                <select
                  id="grading_situacion"
                  value={formData.grading_situacion}
                  onChange={(e) => handleChange('grading_situacion', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="">Seleccionar...</option>
                  <option value="A">A</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="C">C</option>
                </select>
              </div>

              {/* Nacionalidad */}
              <div>
                <Label htmlFor="nacionalidad">Nacionalidad</Label>
                <Input
                  id="nacionalidad"
                  value={formData.nacionalidad}
                  onChange={(e) => handleChange('nacionalidad', e.target.value)}
                  placeholder="España"
                />
              </div>

              {/* Tiempo en España */}
              <div>
                <Label htmlFor="tiempo_espana">Tiempo en España</Label>
                <Input
                  id="tiempo_espana"
                  value={formData.tiempo_espana}
                  onChange={(e) => handleChange('tiempo_espana', e.target.value)}
                  placeholder="2 años"
                />
              </div>

              {/* Edad */}
              <div>
                <Label htmlFor="edad">Edad</Label>
                <Input
                  id="edad"
                  type="number"
                  value={formData.edad ?? ''}
                  onChange={(e) => {
                    const v = e.target.value;
                    handleChange('edad', v === '' ? null : (Number(v) || null));
                  }}
                  placeholder="30"
                  min="0"
                />
              </div>

              {/* Lugar de Residencia */}
              <div>
                <Label htmlFor="lugar_residencia">Lugar de Residencia</Label>
                <Input
                  id="lugar_residencia"
                  value={formData.lugar_residencia}
                  onChange={(e) => handleChange('lugar_residencia', e.target.value)}
                  placeholder="Madrid"
                />
              </div>

              {/* Checkboxes */}
              <div className="sm:col-span-2 space-y-2 sm:space-y-3">
                <label className="flex items-center gap-2 text-sm sm:text-base cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.empadronado ?? false}
                    onChange={(e) => handleChange('empadronado', e.target.checked || undefined)}
                    className="w-4 h-4 sm:w-5 sm:h-5"
                  />
                  <span>Empadronado</span>
                </label>
                <label className="flex items-center gap-2 text-sm sm:text-base cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.tiene_ingresos ?? false}
                    onChange={(e) => handleChange('tiene_ingresos', e.target.checked || undefined)}
                    className="w-4 h-4 sm:w-5 sm:h-5"
                  />
                  <span>Tiene Ingresos</span>
                </label>
                <label className="flex items-center gap-2 text-sm sm:text-base cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.trabaja_b ?? false}
                    onChange={(e) => handleChange('trabaja_b', e.target.checked || undefined)}
                    className="w-4 h-4 sm:w-5 sm:h-5"
                  />
                  <span>Trabaja en B (trabajo en negro)</span>
                </label>
                <label className="flex items-center gap-2 text-sm sm:text-base cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.tiene_familiares_espana ?? false}
                    onChange={(e) => handleChange('tiene_familiares_espana', e.target.checked || undefined)}
                    className="w-4 h-4 sm:w-5 sm:h-5"
                  />
                  <span>Tiene Familiares en España</span>
                </label>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 pt-3 sm:pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={loading}
              className="w-full sm:w-auto text-sm sm:text-base"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="bg-green-600 hover:bg-green-700 w-full sm:w-auto text-sm sm:text-base"
              disabled={loading}
            >
              {loading ? 'Guardando...' : contact ? 'Actualizar' : 'Crear Contacto'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

