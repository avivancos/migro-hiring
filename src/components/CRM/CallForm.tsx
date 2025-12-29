// CallForm - Formulario para registrar llamadas con seguimiento
// Optimizado con React.memo para evitar re-renders innecesarios

import { useState, useEffect, memo } from 'react';
import type { FormEvent } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Phone, Edit2, Check, X } from 'lucide-react';
import type { Call, CRMUser, KommoContact, KommoLead } from '@/types/crm';
import { crmService } from '@/services/crmService';
import { adminService } from '@/services/adminService';

interface CallFormProps {
  call?: Call;
  defaultEntityType?: 'contacts' | 'leads';
  defaultEntityId?: string;
  defaultPhone?: string;
  onSubmit: (data: any) => Promise<void>;
  onCancel: () => void;
}

export const CallForm = memo(function CallForm({
  call,
  defaultEntityType,
  defaultEntityId,
  defaultPhone,
  onSubmit,
  onCancel,
}: CallFormProps) {
  const [loading, setLoading] = useState(false);
  const [loadingEntities, setLoadingEntities] = useState(false);
  const [users, setUsers] = useState<CRMUser[]>([]);
  const [contacts, setContacts] = useState<KommoContact[]>([]);
  const [leads, setLeads] = useState<KommoLead[]>([]);
  const [callTypes, setCallTypes] = useState<Array<{ id: string; name: string; code: string; description?: string }>>([]);
  const [isFirstCall, setIsFirstCall] = useState(false);
  
  // Estados para edición protegida de teléfono y responsable
  const [editingPhone, setEditingPhone] = useState(false);
  const [editingResponsible, setEditingResponsible] = useState(false);
  const [tempPhone, setTempPhone] = useState('');
  const [tempResponsibleId, setTempResponsibleId] = useState('');
  
  // Datos de primera llamada
  const [firstCallData, setFirstCallData] = useState({
    city: '',
    state: '',
    fecha_llegada_espana: '',
    empadronado: undefined as boolean | undefined,
    nacionalidad: '',
    tiene_familiares_espana: undefined as boolean | undefined,
    familiares_espana_detalle: '',
    profesion: '',
    trabajando_actualmente: undefined as boolean | undefined,
    tipo_trabajo_detalle: '',
    servicio_propuesto: '',
    servicio_detalle: '',
    grading_llamada: '' as '' | 'A' | 'B+' | 'B-' | 'C',
    grading_situacion: '' as '' | 'A' | 'B+' | 'B-' | 'C',
  });

  // Opciones de duración en minutos
  const durationOptions = [
    { value: 'less_than_5', label: 'Menos de 5 minutos', seconds: 150 }, // 2.5 min promedio
    { value: '5_to_10', label: 'Entre 5 y 10 minutos', seconds: 450 }, // 7.5 min promedio
    { value: '10_to_15', label: 'Entre 10 y 15 minutos', seconds: 750 }, // 12.5 min promedio
    { value: 'more_than_15', label: 'Más de 15 minutos', seconds: 1200 }, // 20 min representativo
  ];

  // Convertir duración en segundos a opción del select
  const secondsToDurationOption = (seconds: number | null | undefined): string => {
    if (!seconds || seconds === 0) return '';
    const minutes = seconds / 60;
    if (minutes < 5) return 'less_than_5';
    if (minutes >= 5 && minutes < 10) return '5_to_10';
    if (minutes >= 10 && minutes < 15) return '10_to_15';
    return 'more_than_15';
  };
  
  const [formData, setFormData] = useState({
    direction: call?.direction || 'outbound',
    duration: call?.duration ?? null,
    durationOption: secondsToDurationOption(call?.duration),
    phone: call?.phone || defaultPhone || '',
    call_status: call?.call_status || 'completed',
    call_type: call?.call_type || '',
    call_result: call?.call_result || '',
    record_url: call?.record_url || '',
    entity_type: call?.entity_type || defaultEntityType || 'contacts',
    entity_id: call?.entity_id || defaultEntityId || '',
    responsible_user_id: call?.responsible_user_id || '',
    resumen_llamada: call?.resumen_llamada || '',
    proxima_llamada_fecha: call?.proxima_llamada_fecha 
      ? new Date(call.proxima_llamada_fecha).toISOString().slice(0, 16)
      : '',
    proxima_accion_fecha: call?.proxima_accion_fecha
      ? new Date(call.proxima_accion_fecha).toISOString().slice(0, 16)
      : '',
  });

  useEffect(() => {
    loadUsers();
    loadEntities();
    loadCallTypes();
  }, []);

  const loadCallTypes = async () => {
    try {
      const types = await crmService.getCallTypes();
      setCallTypes(types);
    } catch (err) {
      console.error('Error loading call types:', err);
      // Fallback a tipos por defecto
      setCallTypes([
        { id: '1', name: 'Primera Llamada', code: 'primera_llamada' },
        { id: '2', name: 'Seguimiento', code: 'seguimiento' },
        { id: '3', name: 'Llamada de Venta', code: 'venta' },
      ]);
    }
  };

  // Cargar entidades cuando cambie el tipo
  useEffect(() => {
    loadEntities();
  }, [formData.entity_type]);

  // Cargar contacto seleccionado y verificar si es primera llamada
  // Nota: Los leads ahora son contactos unificados, así que siempre cargamos como contacto
  useEffect(() => {
    if ((formData.entity_type === 'contacts' || formData.entity_type === 'leads') && formData.entity_id) {
      // Los leads ahora son contactos, así que siempre cargamos como contacto
      loadSelectedContact();
    } else {
      setIsFirstCall(false);
    }
  }, [formData.entity_id, formData.entity_type]);


  const loadSelectedContact = async () => {
    if (!formData.entity_id) return;
    try {
      // Si es un lead, cargar como contacto (los leads ahora son contactos unificados)
      let contact;
      if (formData.entity_type === 'leads') {
        // Cargar el lead que ahora es un contacto
        const lead = await crmService.getLead(formData.entity_id);
        // El lead ahora es un contacto, así que tiene todos los campos directamente
        contact = lead as any; // El lead tiene todos los campos de contacto
      } else {
        contact = await crmService.getContact(formData.entity_id);
      }
      
      // Verificar si es primera llamada: si faltan datos básicos
      const hasBasicData = contact.city && contact.state && contact.nacionalidad;
      setIsFirstCall(!hasBasicData);
      
      // Pre-llenar teléfono del contacto (priorizar phone, luego mobile)
      const contactPhone = contact.phone || contact.mobile || '';
      if (contactPhone) {
        setFormData(prev => ({ ...prev, phone: contactPhone }));
      }
      
      // Pre-llenar datos si el contacto ya los tiene
      if (contact) {
        setFirstCallData(prev => ({
          ...prev,
          city: contact.city || '',
          state: contact.state || '',
          nacionalidad: contact.nacionalidad || '',
          empadronado: contact.empadronado,
          tiene_familiares_espana: contact.tiene_familiares_espana,
          profesion: contact.position || '',
          trabajando_actualmente: contact.trabaja_b,
          tipo_trabajo_detalle: contact.custom_fields?.tipo_trabajo_detalle || '',
          servicio_propuesto: contact.custom_fields?.servicio_propuesto || '',
          servicio_detalle: contact.custom_fields?.servicio_detalle || '',
          familiares_espana_detalle: contact.custom_fields?.familiares_espana_detalle || '',
          grading_llamada: contact.grading_llamada || '',
          grading_situacion: contact.grading_situacion || '',
        }));
      }
    } catch (err) {
      console.error('Error loading contact:', err);
      setIsFirstCall(false);
    }
  };

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
          } else if (usersData.length > 0) {
            // Si no se encuentra, usar el primero disponible
            setFormData(prev => ({ ...prev, responsible_user_id: usersData[0].id }));
          }
        } else if (usersData.length > 0) {
          setFormData(prev => ({ ...prev, responsible_user_id: usersData[0].id }));
        }
      }
    } catch (err) {
      console.error('Error loading users:', err);
    }
  };

  // Obtener nombre del responsable actual
  const getResponsibleName = (userId: string): string => {
    const user = users.find(u => u.id === userId);
    if (!user) return 'No asignado';
    return user.name?.trim() || user.email || `Usuario ${user.id?.slice(0, 8) || 'N/A'}`;
  };

  // Funciones para manejar edición protegida de teléfono
  const handleStartEditPhone = () => {
    setTempPhone(formData.phone);
    setEditingPhone(true);
  };

  const handleConfirmPhone = () => {
    if (tempPhone.trim()) {
      setFormData(prev => ({ ...prev, phone: tempPhone.trim() }));
    }
    setEditingPhone(false);
    setTempPhone('');
  };

  const handleCancelPhone = () => {
    setEditingPhone(false);
    setTempPhone('');
  };

  // Funciones para manejar edición protegida de responsable
  const handleStartEditResponsible = () => {
    setTempResponsibleId(formData.responsible_user_id);
    setEditingResponsible(true);
  };

  const handleConfirmResponsible = () => {
    if (tempResponsibleId) {
      setFormData(prev => ({ ...prev, responsible_user_id: tempResponsibleId }));
    }
    setEditingResponsible(false);
    setTempResponsibleId('');
  };

  const handleCancelResponsible = () => {
    setEditingResponsible(false);
    setTempResponsibleId('');
  };

  const loadEntities = async () => {
    setLoadingEntities(true);
    try {
      if (formData.entity_type === 'contacts') {
        const contactsData = await crmService.getContacts({ limit: 100 });
        setContacts(contactsData.items || []);
        setLeads([]);
      } else if (formData.entity_type === 'leads') {
        const leadsData = await crmService.getLeads({ limit: 100 });
        setLeads(leadsData.items || []);
        setContacts([]);
      }
    } catch (err) {
      console.error('Error loading entities:', err);
      setContacts([]);
      setLeads([]);
    } finally {
      setLoadingEntities(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    console.log('🟡 [CallForm] handleSubmit llamado');
    console.log('🟡 [CallForm] formData actual:', formData);
    
    // Validar que el teléfono esté presente
    if (!formData.phone || formData.phone.trim() === '') {
      console.warn('⚠️ [CallForm] Teléfono faltante');
      alert('El teléfono es requerido. Por favor, completa este campo.');
      return;
    }
    
    console.log('🟡 [CallForm] Validación de teléfono OK');
    setLoading(true);

    try {
      // Crear objeto de datos sin durationOption (solo para UI)
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { durationOption, ...submitData } = formData;
      submitData.duration = formData.duration ?? 0;

      console.log('🟡 [CallForm] submitData (sin durationOption):', submitData);

      // Agregar started_at si no está presente (requerido por el backend)
      const callDataWithStartedAt: any = {
        ...submitData,
        started_at: (submitData as any).started_at || new Date().toISOString(),
      };
      
      console.log('🟡 [CallForm] callDataWithStartedAt:', callDataWithStartedAt);

      // Convertir fechas a ISO string - solo si tienen valor (no vacío)
      if (callDataWithStartedAt.proxima_llamada_fecha && callDataWithStartedAt.proxima_llamada_fecha.trim() !== '') {
        callDataWithStartedAt.proxima_llamada_fecha = new Date(callDataWithStartedAt.proxima_llamada_fecha).toISOString();
      } else {
        // Eliminar el campo si está vacío para que no se envíe al backend
        delete callDataWithStartedAt.proxima_llamada_fecha;
      }
      
      if (callDataWithStartedAt.proxima_accion_fecha && callDataWithStartedAt.proxima_accion_fecha.trim() !== '') {
        callDataWithStartedAt.proxima_accion_fecha = new Date(callDataWithStartedAt.proxima_accion_fecha).toISOString();
      } else {
        // Eliminar el campo si está vacío para que no se envíe al backend
        delete callDataWithStartedAt.proxima_accion_fecha;
      }

      // Informar al backend si es primera llamada agregando información en el resumen
      // Solo si la llamada está completada (no tiene sentido para llamadas fallidas/no contestadas)
      // Los leads ahora son contactos unificados, así que siempre tratamos como contacto
      if (callDataWithStartedAt.call_status === 'completed' && isFirstCall && (formData.entity_type === 'contacts' || formData.entity_type === 'leads')) {
        if (!callDataWithStartedAt.resumen_llamada) {
          callDataWithStartedAt.resumen_llamada = '';
        }
        callDataWithStartedAt.resumen_llamada = '[PRIMERA LLAMADA]\n' + callDataWithStartedAt.resumen_llamada;
      }

      console.log('🟡 [CallForm] Llamando a onSubmit con callDataWithStartedAt...');
      console.log('🟡 [CallForm] Datos finales a enviar:', callDataWithStartedAt);
      
      // Guardar la llamada primero
      await onSubmit(callDataWithStartedAt);
      
      console.log('✅ [CallForm] onSubmit completado exitosamente');

      // DESPUÉS de guardar la llamada exitosamente, actualizar el contacto con los datos de primera llamada
      // Solo si la llamada está completada (no tiene sentido actualizar datos del cliente si no hubo conversación)
      // Los leads ahora son contactos unificados
      if (formData.call_status === 'completed' && isFirstCall && (formData.entity_type === 'contacts' || formData.entity_type === 'leads') && formData.entity_id) {
        const contactUpdates: any = {};
        
        if (firstCallData.city) contactUpdates.city = firstCallData.city;
        if (firstCallData.state) contactUpdates.state = firstCallData.state;
        if (firstCallData.nacionalidad) contactUpdates.nacionalidad = firstCallData.nacionalidad;
        if (firstCallData.empadronado !== undefined) contactUpdates.empadronado = firstCallData.empadronado;
        if (firstCallData.tiene_familiares_espana !== undefined) {
          contactUpdates.tiene_familiares_espana = firstCallData.tiene_familiares_espana;
        }
        if (firstCallData.profesion) contactUpdates.position = firstCallData.profesion;
        if (firstCallData.trabajando_actualmente !== undefined) {
          contactUpdates.trabaja_b = firstCallData.trabajando_actualmente;
        }
        
        // Tipo de trabajo detalle
        if (firstCallData.trabajando_actualmente === true && firstCallData.tipo_trabajo_detalle) {
          if (!contactUpdates.custom_fields) contactUpdates.custom_fields = {};
          contactUpdates.custom_fields.tipo_trabajo_detalle = firstCallData.tipo_trabajo_detalle;
        }
        
        // Fecha de llegada a España (usar custom_fields o tiempo_espana)
        if (firstCallData.fecha_llegada_espana) {
          // Convertir fecha a formato legible para tiempo_espana o usar custom_fields
          const fecha = new Date(firstCallData.fecha_llegada_espana);
          const hoy = new Date();
          const años = hoy.getFullYear() - fecha.getFullYear();
          const meses = hoy.getMonth() - fecha.getMonth();
          const tiempoTotal = años > 0 ? `${años} ${años === 1 ? 'año' : 'años'}` : `${meses} ${meses === 1 ? 'mes' : 'meses'}`;
          contactUpdates.tiempo_espana = tiempoTotal;
          
          // También guardar la fecha exacta en custom_fields si está disponible
          if (!contactUpdates.custom_fields) contactUpdates.custom_fields = {};
          contactUpdates.custom_fields.fecha_llegada_espana = fecha.toISOString().split('T')[0];
        }
        
        // Detalle de familiares españoles
        if (firstCallData.tiene_familiares_espana && firstCallData.familiares_espana_detalle) {
          if (!contactUpdates.custom_fields) contactUpdates.custom_fields = {};
          contactUpdates.custom_fields.familiares_espana_detalle = firstCallData.familiares_espana_detalle;
        }
        
        // Servicio propuesto y detalle
        if (firstCallData.servicio_propuesto || firstCallData.servicio_detalle) {
          if (!contactUpdates.custom_fields) contactUpdates.custom_fields = {};
          if (firstCallData.servicio_propuesto) {
            contactUpdates.custom_fields.servicio_propuesto = firstCallData.servicio_propuesto;
          }
          if (firstCallData.servicio_detalle) {
            contactUpdates.custom_fields.servicio_detalle = firstCallData.servicio_detalle;
          }
        }
        
        // Gradings
        if (firstCallData.grading_llamada) {
          contactUpdates.grading_llamada = firstCallData.grading_llamada as 'A' | 'B+' | 'B-' | 'C';
        }
        if (firstCallData.grading_situacion) {
          contactUpdates.grading_situacion = firstCallData.grading_situacion as 'A' | 'B+' | 'B-' | 'C';
        }
        
        // Marcar como contactado inicialmente cuando se guarda la primera llamada exitosamente
        // Solo si la llamada tiene resumen (requisito para primera llamada)
        if (callDataWithStartedAt.resumen_llamada && callDataWithStartedAt.resumen_llamada.trim() !== '') {
          contactUpdates.initial_contact_completed = true;
          console.log('🟢 [CallForm] Marcando initial_contact_completed = true para contacto:', formData.entity_id);
        }
        
        // Actualizar contacto si hay cambios
        if (Object.keys(contactUpdates).length > 0) {
          try {
            console.log('🟢 [CallForm] Actualizando contacto con datos de primera llamada:', contactUpdates);
            await crmService.updateContact(formData.entity_id, contactUpdates);
            console.log('✅ [CallForm] Contacto actualizado exitosamente, incluyendo initial_contact_completed');
          } catch (err) {
            console.error('❌ [CallForm] Error actualizando contacto:', err);
            // No lanzar error aquí para no interrumpir el flujo, pero loguear el problema
          }
        }

        // Si hay un lead asociado al contacto, actualizar también el servicio en el lead
        if (firstCallData.servicio_propuesto || firstCallData.servicio_detalle) {
          try {
            // Buscar leads asociados al contacto usando el filtro contact_id
            const leadsResponse = await crmService.getLeads({ 
              contact_id: formData.entity_id,
              limit: 10 
            });
            
            if (leadsResponse.items && leadsResponse.items.length > 0) {
              // Actualizar el lead más reciente (el primero de la lista)
              const leadToUpdate = leadsResponse.items[0];
              const leadUpdates: any = {};
              
              // Mapear servicio propuesto a service_type
              if (firstCallData.servicio_propuesto) {
                const servicioMap: Record<string, string> = {
                  'asilo_proteccion_internacional': 'Asilo/Protección Internacional',
                  'arraigo': 'Arraigo',
                  'reagrupacion_familiar': 'Reagrupación Familiar',
                  'nacionalidad': 'Nacionalidad',
                };
                leadUpdates.service_type = servicioMap[firstCallData.servicio_propuesto] || firstCallData.servicio_propuesto;
              }
              
              if (firstCallData.servicio_detalle) {
                leadUpdates.service_description = firstCallData.servicio_detalle;
              }
              
              if (Object.keys(leadUpdates).length > 0) {
                await crmService.updateLead(leadToUpdate.id, leadUpdates);
              }
            }
          } catch (err) {
            console.error('Error actualizando lead con servicio:', err);
            // Continuar aunque falle la actualización del lead
          }
        }
      }
    } catch (err: any) {
      console.error('❌ [CallForm] Error submitting form:', err);
      console.error('❌ [CallForm] Error details:', {
        message: err?.message,
        status: err?.response?.status,
        data: err?.response?.data,
        detail: err?.response?.data?.detail,
        stack: err?.stack,
      });
      
      // Manejar error 400 relacionado con responsible_user_id
      if (err?.response?.status === 400) {
        const errorDetail = err?.response?.data?.detail || '';
        if (errorDetail.includes('responsible') || errorDetail.includes('Only users with role')) {
          alert('Solo abogados y administradores pueden ser responsables. Por favor, selecciona un usuario válido.');
          return;
        }
      }
      
      // Manejar error 422 (validación)
      if (err?.response?.status === 422) {
        const errors = err?.response?.data?.detail || [];
        let errorMessage = 'Error de validación:\n\n';
        
        if (Array.isArray(errors)) {
          errors.forEach((error: any, index: number) => {
            const field = error.loc ? error.loc.join('.') : 'campo desconocido';
            const msg = error.msg || 'Error de validación';
            errorMessage += `${index + 1}. ${field}: ${msg}\n`;
          });
        } else {
          errorMessage += JSON.stringify(errors, null, 2);
        }
        
        alert(errorMessage);
        return; // No re-lanzar para evitar que se muestre el error genérico
      }
      
      // Re-lanzar el error para que el componente padre lo maneje
      throw err;
    } finally {
      setLoading(false);
      console.log('🟡 [CallForm] handleSubmit finalizado (loading = false)');
    }
  };

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {call ? 'Editar Llamada' : 'Registrar Llamada'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Dirección */}
          <div>
            <Label htmlFor="direction">
              Dirección <span className="text-red-500">*</span>
            </Label>
            <select
              id="direction"
              value={formData.direction}
              onChange={(e) => handleChange('direction', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              required
            >
              <option value="inbound">Entrante</option>
              <option value="outbound">Saliente</option>
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Teléfono - Campo protegido */}
            <div>
              <Label htmlFor="phone">
                Teléfono <span className="text-red-500">*</span>
              </Label>
              {!editingPhone ? (
                <div className="flex items-center gap-2">
                  <div className="flex-1 relative">
                    <Input
                      id="phone_display"
                      type="tel"
                      value={formData.phone || 'No especificado'}
                      readOnly
                      className="bg-gray-50 cursor-not-allowed"
                      tabIndex={-1}
                    />
                    {/* Input oculto para validación HTML */}
                    <input
                      type="hidden"
                      value={formData.phone || ''}
                      required
                    />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleStartEditPhone}
                    className="flex-shrink-0"
                    title="Cambiar teléfono"
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Input
                    id="phone_edit"
                    type="tel"
                    value={tempPhone}
                    onChange={(e) => setTempPhone(e.target.value)}
                    placeholder="+34600123456"
                    className="flex-1"
                    autoFocus
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleConfirmPhone}
                    className="bg-green-600 hover:bg-green-700 text-white flex-shrink-0"
                  >
                    <Check className="w-4 h-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleCancelPhone}
                    className="bg-gray-200 hover:bg-gray-300 flex-shrink-0"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>

            {/* Duración */}
            <div>
              <Label htmlFor="duration">Duración</Label>
              <select
                id="duration"
                value={formData.durationOption || ''}
                onChange={(e) => {
                  const option = durationOptions.find(opt => opt.value === e.target.value);
                  if (option) {
                    setFormData(prev => ({
                      ...prev,
                      durationOption: option.value,
                      duration: option.seconds,
                    }));
                  } else {
                    setFormData(prev => ({
                      ...prev,
                      durationOption: '',
                      duration: null,
                    }));
                  }
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="">Seleccionar duración...</option>
                {durationOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Estado */}
            <div>
              <Label htmlFor="call_status">
                Estado <span className="text-red-500">*</span>
              </Label>
              <select
                id="call_status"
                value={formData.call_status}
                onChange={(e) => handleChange('call_status', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                required
              >
                <option value="completed">Llamada efectiva</option>
                <option value="failed">Fallida</option>
                <option value="busy">Ocupado</option>
                <option value="no_answer">Sin respuesta</option>
                <option value="missed">Perdida</option>
              </select>
            </div>

            {/* Tipo de Llamada */}
            <div>
              <Label htmlFor="call_type">Tipo de Llamada</Label>
              <select
                id="call_type"
                value={formData.call_type}
                onChange={(e) => handleChange('call_type', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="">Seleccionar tipo...</option>
                {callTypes.map((type) => (
                  <option key={type.id} value={type.code}>
                    {type.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Responsable - Campo protegido */}
            <div>
              <Label htmlFor="responsible_user_id">Responsable</Label>
              {!editingResponsible ? (
                <div className="flex items-center gap-2">
                  <Input
                    id="responsible_user_id_display"
                    type="text"
                    value={formData.responsible_user_id ? getResponsibleName(formData.responsible_user_id) : 'No asignado'}
                    readOnly
                    className="bg-gray-50 cursor-not-allowed"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleStartEditResponsible}
                    className="flex-shrink-0"
                    title="Cambiar responsable"
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <select
                    id="responsible_user_id_edit"
                    value={tempResponsibleId}
                    onChange={(e) => setTempResponsibleId(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    autoFocus
                  >
                    <option value="">Seleccionar...</option>
                    {users.map(user => {
                      const displayName = user.name?.trim() || user.email || `Usuario ${user.id?.slice(0, 8) || 'N/A'}`;
                      return (
                        <option key={user.id} value={user.id}>
                          {displayName}
                        </option>
                      );
                    })}
                  </select>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleConfirmResponsible}
                    className="bg-green-600 hover:bg-green-700 text-white flex-shrink-0"
                  >
                    <Check className="w-4 h-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleCancelResponsible}
                    className="bg-gray-200 hover:bg-gray-300 flex-shrink-0"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              )}
              <p className="text-xs text-gray-500 mt-1">
                Solo abogados y agentes pueden ser responsables
              </p>
            </div>
          </div>

          {/* Solo mostrar campos de datos del cliente si la llamada está completada */}
          {formData.call_status === 'completed' && (
            <>
              {/* Resumen de la llamada */}
              <div>
                <Label htmlFor="resumen_llamada">
                  Resumen de la Llamada
                  {(formData.entity_type === 'leads' || formData.entity_type === 'contacts') && (
                    <span className="text-red-500 ml-1" title="Requerido para marcar como contactado inicialmente">*</span>
                  )}
                </Label>
                <Textarea
                  id="resumen_llamada"
                  value={formData.resumen_llamada}
                  onChange={(e) => handleChange('resumen_llamada', e.target.value)}
                  placeholder="Resumen de la conversación..."
                  rows={4}
                  className={(formData.entity_type === 'leads' || formData.entity_type === 'contacts') && !formData.resumen_llamada ? 'border-yellow-300 focus:border-yellow-500' : ''}
                />
                {(formData.entity_type === 'leads' || formData.entity_type === 'contacts') && !formData.resumen_llamada && (
                  <p className="text-xs text-yellow-600 mt-1">
                    ⚠️ Este campo es requerido para poder marcar como contactado inicialmente.
                  </p>
                )}
              </div>

              {/* Resultado */}
              <div>
                <Label htmlFor="call_result">Resultado</Label>
                <Textarea
                  id="call_result"
                  value={formData.call_result}
                  onChange={(e) => handleChange('call_result', e.target.value)}
                  placeholder="Resultado de la llamada..."
                  rows={2}
                />
              </div>
            </>
          )}

          {/* Mensaje informativo cuando la llamada no está completada */}
          {formData.call_status !== 'completed' && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-yellow-800">
                ℹ️ Como la llamada no se completó ({formData.call_status === 'failed' ? 'Fallida' : 
                formData.call_status === 'busy' ? 'Ocupado' : 
                formData.call_status === 'no_answer' ? 'Sin respuesta' : 
                formData.call_status === 'missed' ? 'Perdida' : formData.call_status}), 
                no es necesario completar los datos del cliente ni el resumen de la conversación.
              </p>
            </div>
          )}

          {/* Información de Primera Llamada - Solo mostrar si la llamada está completada */}
          {formData.call_status === 'completed' && isFirstCall && (formData.entity_type === 'contacts' || formData.entity_type === 'leads') && (
            <div className="border-2 border-blue-200 bg-blue-50 rounded-lg p-4 space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <Phone className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-semibold text-blue-900">
                  Información de Primera Llamada
                </h3>
              </div>
              <p className="text-sm text-blue-700 mb-4">
                Por favor, completa la siguiente información del contacto:
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Ciudad */}
                <div>
                  <Label htmlFor="first_call_city">Ciudad de Residencia</Label>
                  <Input
                    id="first_call_city"
                    value={firstCallData.city}
                    onChange={(e) => setFirstCallData(prev => ({ ...prev, city: e.target.value }))}
                    placeholder="Madrid"
                    className="bg-white"
                  />
                </div>

                {/* Provincia */}
                <div>
                  <Label htmlFor="first_call_state">Provincia de Residencia</Label>
                  <Input
                    id="first_call_state"
                    value={firstCallData.state}
                    onChange={(e) => setFirstCallData(prev => ({ ...prev, state: e.target.value }))}
                    placeholder="Madrid"
                    className="bg-white"
                  />
                </div>

                {/* Fecha de llegada a España */}
                <div>
                  <Label htmlFor="first_call_fecha_llegada">Fecha de Llegada a España</Label>
                  <Input
                    id="first_call_fecha_llegada"
                    type="date"
                    value={firstCallData.fecha_llegada_espana}
                    onChange={(e) => setFirstCallData(prev => ({ ...prev, fecha_llegada_espana: e.target.value }))}
                    className="bg-white"
                  />
                </div>

                {/* Nacionalidad */}
                <div>
                  <Label htmlFor="first_call_nacionalidad">Nacionalidad</Label>
                  <Input
                    id="first_call_nacionalidad"
                    value={firstCallData.nacionalidad}
                    onChange={(e) => setFirstCallData(prev => ({ ...prev, nacionalidad: e.target.value }))}
                    placeholder="Colombia, Venezuela, etc."
                    className="bg-white"
                  />
                </div>

                {/* Empadronamiento */}
                <div>
                  <Label htmlFor="first_call_empadronado">¿Tiene Empadronamiento?</Label>
                  <select
                    id="first_call_empadronado"
                    value={firstCallData.empadronado === undefined ? '' : firstCallData.empadronado ? 'true' : 'false'}
                    onChange={(e) => setFirstCallData(prev => ({ 
                      ...prev, 
                      empadronado: e.target.value === '' ? undefined : e.target.value === 'true' 
                    }))}
                    className="flex h-9 w-full rounded-md border border-input bg-white px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="">Seleccionar...</option>
                    <option value="true">Sí</option>
                    <option value="false">No</option>
                  </select>
                </div>

                {/* Profesión */}
                <div>
                  <Label htmlFor="first_call_profesion">Profesión</Label>
                  <Input
                    id="first_call_profesion"
                    value={firstCallData.profesion}
                    onChange={(e) => setFirstCallData(prev => ({ ...prev, profesion: e.target.value }))}
                    placeholder="Abogado, Ingeniero, etc."
                    className="bg-white"
                  />
                </div>

                {/* Trabajando actualmente */}
                <div>
                  <Label htmlFor="first_call_trabajando">¿Está Trabajando Actualmente?</Label>
                  <select
                    id="first_call_trabajando"
                    value={firstCallData.trabajando_actualmente === undefined ? '' : firstCallData.trabajando_actualmente ? 'true' : 'false'}
                    onChange={(e) => {
                      const value = e.target.value === '' ? undefined : e.target.value === 'true';
                      setFirstCallData(prev => ({ 
                        ...prev, 
                        trabajando_actualmente: value,
                        // Limpiar el detalle si cambia a "No"
                        tipo_trabajo_detalle: value === false ? '' : prev.tipo_trabajo_detalle
                      }));
                    }}
                    className="flex h-9 w-full rounded-md border border-input bg-white px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="">Seleccionar...</option>
                    <option value="true">Sí</option>
                    <option value="false">No</option>
                  </select>
                  
                  {firstCallData.trabajando_actualmente === true && (
                    <div className="mt-2">
                      <Label htmlFor="first_call_tipo_trabajo">Tipo de Trabajo</Label>
                      <Input
                        id="first_call_tipo_trabajo"
                        value={firstCallData.tipo_trabajo_detalle}
                        onChange={(e) => setFirstCallData(prev => ({ ...prev, tipo_trabajo_detalle: e.target.value }))}
                        placeholder="Ej: Ingeniero de Software, Camarero, Albañil, etc."
                        className="bg-white"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Familiares españoles */}
              <div>
                <Label htmlFor="first_call_familiares">¿Tiene Familiares Españoles?</Label>
                <select
                  id="first_call_familiares"
                  value={firstCallData.tiene_familiares_espana === undefined ? '' : firstCallData.tiene_familiares_espana ? 'true' : 'false'}
                  onChange={(e) => setFirstCallData(prev => ({ 
                    ...prev, 
                    tiene_familiares_espana: e.target.value === '' ? undefined : e.target.value === 'true' 
                  }))}
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 mb-2"
                >
                  <option value="">Seleccionar...</option>
                  <option value="true">Sí</option>
                  <option value="false">No</option>
                </select>
                
                {firstCallData.tiene_familiares_espana === true && (
                  <div className="mt-2">
                    <Label htmlFor="first_call_familiares_detalle">Especificar Familiares Españoles</Label>
                    <Textarea
                      id="first_call_familiares_detalle"
                      value={firstCallData.familiares_espana_detalle}
                      onChange={(e) => setFirstCallData(prev => ({ ...prev, familiares_espana_detalle: e.target.value }))}
                      placeholder="Ej: Esposo/a español, hijos españoles, padres españoles, etc."
                      rows={2}
                      className="bg-white"
                    />
                  </div>
                )}
              </div>

              {/* Servicio propuesto */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="first_call_servicio_propuesto">Servicio Propuesto</Label>
                  <select
                    id="first_call_servicio_propuesto"
                    value={firstCallData.servicio_propuesto}
                    onChange={(e) => setFirstCallData(prev => ({ ...prev, servicio_propuesto: e.target.value }))}
                    className="flex h-9 w-full rounded-md border border-input bg-white px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="">Seleccionar servicio...</option>
                    <option value="asilo_proteccion_internacional">Asilo/Protección Internacional</option>
                    <option value="arraigo">Arraigo</option>
                    <option value="reagrupacion_familiar">Reagrupación Familiar</option>
                    <option value="nacionalidad">Nacionalidad</option>
                  </select>
                </div>

                {/* Servicio detalle */}
                <div>
                  <Label htmlFor="first_call_servicio_detalle">Detalle del Servicio</Label>
                  <Textarea
                    id="first_call_servicio_detalle"
                    value={firstCallData.servicio_detalle}
                    onChange={(e) => setFirstCallData(prev => ({ ...prev, servicio_detalle: e.target.value }))}
                    placeholder="Explicar mejor el servicio propuesto..."
                    rows={3}
                    className="bg-white"
                  />
                </div>
              </div>

              {/* Gradings */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
                  <Label htmlFor="first_call_grading_llamada">Grading de Interés (Llamada)</Label>
                  <select
                    id="first_call_grading_llamada"
                    value={firstCallData.grading_llamada}
                    onChange={(e) => setFirstCallData(prev => ({ 
                      ...prev, 
                      grading_llamada: e.target.value as '' | 'A' | 'B+' | 'B-' | 'C'
                    }))}
                    className="flex h-9 w-full rounded-md border border-input bg-white px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="">Seleccionar...</option>
                    <option value="A">A - Alto interés</option>
                    <option value="B+">B+ - Buen interés</option>
                    <option value="B-">B- - Interés moderado</option>
                    <option value="C">C - Bajo interés</option>
                  </select>
                </div>

                <div>
                  <Label htmlFor="first_call_grading_situacion">Grading de Situación Administrativa</Label>
                  <select
                    id="first_call_grading_situacion"
                    value={firstCallData.grading_situacion}
                    onChange={(e) => setFirstCallData(prev => ({ 
                      ...prev, 
                      grading_situacion: e.target.value as '' | 'A' | 'B+' | 'B-' | 'C'
                    }))}
                    className="flex h-9 w-full rounded-md border border-input bg-white px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="">Seleccionar...</option>
                    <option value="A">A - Situación excelente</option>
                    <option value="B+">B+ - Situación buena</option>
                    <option value="B-">B- - Situación regular</option>
                    <option value="C">C - Situación complicada</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Gradings - Solo mostrar si la llamada está completada */}
          {formData.call_status === 'completed' && (formData.entity_type === 'contacts' || (formData.entity_type === 'leads' && firstCallData.grading_llamada !== '' || firstCallData.grading_situacion !== '')) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t pt-4">
              <div>
                <Label htmlFor="grading_llamada">Grading de Interés (Llamada)</Label>
                <select
                  id="grading_llamada"
                  value={firstCallData.grading_llamada}
                  onChange={(e) => setFirstCallData(prev => ({ 
                    ...prev, 
                    grading_llamada: e.target.value as '' | 'A' | 'B+' | 'B-' | 'C'
                  }))}
                  className="flex h-9 w-full rounded-md border border-input bg-white px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="">Seleccionar...</option>
                  <option value="A">A - Alto interés</option>
                  <option value="B+">B+ - Buen interés</option>
                  <option value="B-">B- - Interés moderado</option>
                  <option value="C">C - Bajo interés</option>
                </select>
              </div>

              <div>
                <Label htmlFor="grading_situacion">Grading de Situación Administrativa</Label>
                <select
                  id="grading_situacion"
                  value={firstCallData.grading_situacion}
                  onChange={(e) => setFirstCallData(prev => ({ 
                    ...prev, 
                    grading_situacion: e.target.value as '' | 'A' | 'B+' | 'B-' | 'C'
                  }))}
                  className="flex h-9 w-full rounded-md border border-input bg-white px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="">Seleccionar...</option>
                  <option value="A">A - Situación excelente</option>
                  <option value="B+">B+ - Situación buena</option>
                  <option value="B-">B- - Situación regular</option>
                  <option value="C">C - Situación complicada</option>
                </select>
              </div>
            </div>
          )}

          {/* Fechas de seguimiento */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="proxima_llamada_fecha">Próxima Llamada</Label>
              <Input
                id="proxima_llamada_fecha"
                type="datetime-local"
                value={formData.proxima_llamada_fecha}
                onChange={(e) => handleChange('proxima_llamada_fecha', e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="proxima_accion_fecha">Próxima Acción</Label>
              <Input
                id="proxima_accion_fecha"
                type="datetime-local"
                value={formData.proxima_accion_fecha}
                onChange={(e) => handleChange('proxima_accion_fecha', e.target.value)}
              />
            </div>
          </div>

          {/* URL de grabación */}
          <div>
            <Label htmlFor="record_url">URL de Grabación</Label>
            <Input
              id="record_url"
              type="url"
              value={formData.record_url}
              onChange={(e) => handleChange('record_url', e.target.value)}
              placeholder="https://example.com/recording.mp3"
            />
          </div>

          {/* Entity Type (oculto si viene por default) */}
          {!defaultEntityType && (
            <div>
              <Label htmlFor="entity_type">
                Relacionado con <span className="text-red-500">*</span>
              </Label>
              <select
                id="entity_type"
                value={formData.entity_type}
                onChange={(e) => handleChange('entity_type', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                required
              >
                <option value="contacts">Contacto</option>
                <option value="leads">Lead</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Selecciona si la llamada está relacionada con un Contacto o un Lead
              </p>
            </div>
          )}

          {/* Entity ID (oculto si viene por default) */}
          {!defaultEntityId && (
            <div>
              <Label htmlFor="entity_id">
                {formData.entity_type === 'contacts' ? 'Contacto' : 'Lead'}
                <span className="text-red-500">*</span>
              </Label>
              <select
                id="entity_id"
                value={formData.entity_id}
                onChange={(e) => {
                  handleChange('entity_id', e.target.value);
                  // Pre-llenar teléfono cuando se selecciona un contacto o lead
                  if (formData.entity_type === 'contacts' && e.target.value) {
                    const selectedContact = contacts.find(c => c.id === e.target.value);
                    if (selectedContact) {
                      const contactPhone = selectedContact.phone || selectedContact.mobile || '';
                      if (contactPhone) {
                        setFormData(prev => ({ ...prev, phone: contactPhone }));
                      }
                    }
                  } else if (formData.entity_type === 'leads' && e.target.value) {
                    const selectedLead = leads.find(l => l.id === e.target.value);
                    if (selectedLead?.contact) {
                      const contactPhone = selectedLead.contact.phone || selectedLead.contact.mobile || '';
                      if (contactPhone) {
                        setFormData(prev => ({ ...prev, phone: contactPhone }));
                      }
                    }
                  }
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                required
                disabled={loadingEntities}
              >
                <option value="">
                  {loadingEntities 
                    ? 'Cargando...' 
                    : `Seleccionar ${formData.entity_type === 'contacts' ? 'contacto' : 'lead'}...`}
                </option>
                {formData.entity_type === 'contacts' ? (
                  contacts.map(contact => {
                    const displayName = contact.name || 
                      `${contact.first_name || ''} ${contact.last_name || ''}`.trim() || 
                      contact.email || 
                      `Contacto ${contact.id?.slice(0, 8) || 'N/A'}`;
                    return (
                      <option key={contact.id} value={contact.id}>
                        {displayName}
                      </option>
                    );
                  })
                ) : (
                  leads.map(lead => (
                    <option key={lead.id} value={lead.id}>
                      {lead.name || `Lead ${lead.id?.slice(0, 8) || 'N/A'}`}
                    </option>
                  ))
                )}
              </select>
            </div>
          )}

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
              {loading ? 'Guardando...' : call ? 'Actualizar' : 'Registrar Llamada'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}, (prevProps, nextProps) => {
  // Comparación personalizada: solo re-renderizar si cambian props relevantes
  return (
    prevProps.call?.id === nextProps.call?.id &&
    prevProps.defaultEntityType === nextProps.defaultEntityType &&
    prevProps.defaultEntityId === nextProps.defaultEntityId &&
    prevProps.defaultPhone === nextProps.defaultPhone
  );
});


