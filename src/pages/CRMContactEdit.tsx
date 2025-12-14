// CRMContactEdit - Página para editar un contacto

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';
import type { KommoContact, ContactCreateRequest, NoteCreateRequest } from '@/types/crm';
import { crmService } from '@/services/crmService';
import { ContactForm } from '@/components/CRM/ContactForm';
import { CRMHeader } from '@/components/CRM/CRMHeader';
import { useRequireAuth } from '@/hooks/useRequireAuth';

export function CRMContactEdit() {
  const { isAuthenticated, isValidating, LoginComponent } = useRequireAuth();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [contact, setContact] = useState<KommoContact | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (isAuthenticated && id && id !== 'new') {
      loadContactData();
    } else if (id === 'new') {
      // Para nuevo contacto, no necesitamos cargar datos
      setLoading(false);
    }
  }, [isAuthenticated, id]);

  const loadContactData = async () => {
    if (!id || id === 'new') return;

    setLoading(true);
    setError(null);
    try {
      const contactData = await crmService.getContact(id);
      setContact(contactData);
    } catch (err: any) {
      console.error('Error loading contact:', err);
      const errorMessage = err?.response?.status === 404 
        ? 'Contacto no encontrado' 
        : err?.response?.data?.detail || err?.message || 'Error al cargar el contacto';
      setError(errorMessage);
      setContact(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (data: ContactCreateRequest) => {
    if (!id) return;

    try {
      setSaveSuccess(false);
      
      if (id === 'new') {
        // Crear nuevo contacto
        const newContact = await crmService.createContact(data);
        setSaveSuccess(true);
        // Redirigir después de un breve delay para mostrar el mensaje de éxito
        setTimeout(() => {
          navigate(`/crm/contacts/${newContact.id}`);
        }, 1500);
      } else {
        // Guardar datos originales para comparar cambios
        const originalContact = contact;
        
        // Actualizar contacto existente
        await crmService.updateContact(id, data);
        
        setSaveSuccess(true);
        
        // Crear nota automática indicando que se ha editado el contacto
        try {
          // Identificar campos que cambiaron (opcional, pero útil)
          const changedFields: string[] = [];
          if (originalContact) {
            if (data.name && data.name !== originalContact.name) changedFields.push('nombre');
            if (data.email && data.email !== originalContact.email) changedFields.push('email');
            if (data.phone && data.phone !== originalContact.phone) changedFields.push('teléfono');
            if (data.mobile && data.mobile !== originalContact.mobile) changedFields.push('móvil');
            if (data.city && data.city !== originalContact.city) changedFields.push('ciudad');
            if (data.state && data.state !== originalContact.state) changedFields.push('provincia');
            if (data.address && data.address !== originalContact.address) changedFields.push('dirección');
            if (data.position && data.position !== originalContact.position) changedFields.push('cargo');
            if (data.grading_llamada && data.grading_llamada !== originalContact.grading_llamada) changedFields.push('grading de llamada');
            if (data.grading_situacion && data.grading_situacion !== originalContact.grading_situacion) changedFields.push('grading de situación');
            if (data.nacionalidad && data.nacionalidad !== originalContact.nacionalidad) changedFields.push('nacionalidad');
            // Agregar más campos si es necesario
          }
          
          const noteContent = changedFields.length > 0
            ? `Contacto editado. Campos modificados: ${changedFields.join(', ')}.`
            : 'Contacto editado.';
          
          const noteData: NoteCreateRequest = {
            entity_type: 'contacts',
            entity_id: id,
            note_type: 'system',
            content: noteContent,
          };
          
          console.log('🟢 [CRMContactEdit] Creando nota de edición:', noteData);
          const createdNote = await crmService.createNote(noteData);
          console.log('✅ [CRMContactEdit] Nota de edición creada exitosamente:', createdNote);
        } catch (noteErr: any) {
          // No bloquear el flujo si falla la creación de la nota, pero loguear el error
          console.error('❌ [CRMContactEdit] Error creando nota de edición:', noteErr);
          console.error('❌ [CRMContactEdit] Error details:', {
            status: noteErr?.response?.status,
            data: noteErr?.response?.data,
            message: noteErr?.message,
          });
        }
        
        // Esperar un momento para asegurar que la nota se haya guardado en el backend
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Redirigir a la vista de detalle con un parámetro de query para forzar recarga
        // Usar replace para evitar que el botón "atrás" vuelva a la página de edición
        navigate(`/crm/contacts/${id}?reload=${Date.now()}`, { replace: true });
      }
    } catch (err: any) {
      console.error('Error saving contact:', err);
      console.error('Error details:', {
        status: err?.response?.status,
        data: err?.response?.data,
        detail: err?.response?.data?.detail,
      });
      
      if (err?.response?.status === 422) {
        const errors = err?.response?.data?.detail || [];
        let errorMessage = 'Error de validación:\n\n';
        
        if (Array.isArray(errors)) {
          errors.forEach((error: any, index: number) => {
            const field = error.loc ? error.loc.join('.') : 'campo desconocido';
            const msg = error.msg || 'Error de validación';
            errorMessage += `${index + 1}. ${field}: ${msg}\n`;
          });
        } else if (typeof errors === 'string') {
          errorMessage = errors;
        } else {
          errorMessage += JSON.stringify(errors, null, 2);
        }
        
        alert(errorMessage);
      } else {
        const errorMsg = err?.response?.data?.detail || err?.message || 'Error desconocido';
        alert(`${id === 'new' ? 'Error al crear el contacto' : 'Error al actualizar el contacto'}: ${errorMsg}`);
      }
    }
  };

  const handleCancel = () => {
    if (id === 'new') {
      navigate('/crm/contacts');
    } else {
      navigate(`/crm/contacts/${id}`);
    }
  };

  if (isValidating) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginComponent />;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <CRMHeader />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Card>
            <CardContent className="py-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Cargando contacto...</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (error && !contact) {
    return (
      <div className="min-h-screen bg-gray-50">
        <CRMHeader />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-gray-500">{error}</p>
              <Button onClick={() => navigate('/crm/contacts')} className="mt-4">
                Volver a Contactos
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <CRMHeader />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="space-y-6">
          <Button
            variant="outline"
            onClick={handleCancel}
          >
            <ArrowLeft size={18} className="mr-2" />
            {id === 'new' ? 'Cancelar' : 'Volver'}
          </Button>

          {/* Mensaje de confirmación de guardado */}
          {saveSuccess && (
            <Card className="border-green-300 bg-green-50 shadow-md">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="text-green-600 flex-shrink-0" size={24} />
                  <div className="flex-1">
                    <p className="font-semibold text-green-900">
                      {id === 'new' ? '¡Contacto creado exitosamente!' : '¡Contacto actualizado exitosamente!'}
                    </p>
                    <p className="text-sm text-green-700 mt-1">
                      {id === 'new' 
                        ? 'El Contacto ha sido creado correctamente. Redirigiendo...' 
                        : 'Los cambios se han guardado correctamente. Redirigiendo...'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <ContactForm
            contact={contact || undefined}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
          />
        </div>
      </div>
    </div>
  );
}
