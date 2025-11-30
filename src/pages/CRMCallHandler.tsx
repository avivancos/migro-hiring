// CRMCallHandler - Gestión completa de llamadas y leads
// Permite: atender llamada, gestionar lead en embudo, anotar datos del cliente, programar próxima llamada

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Phone, 
  Search, 
  User, 
  Save, 
  Calendar, 
  RefreshCw,
  CheckCircle2,
  TrendingUp
} from 'lucide-react';
import type { 
  KommoLead, 
  KommoContact, 
  CallCreateRequest, 
  ContactCreateRequest,
  Pipeline,
  PipelineStatus,
  TaskCreateRequest
} from '@/types/crm';
import { crmService } from '@/services/crmService';
import { ContactForm } from '@/components/CRM/ContactForm';
import { CRMHeader } from '@/components/CRM/CRMHeader';

export function CRMCallHandler() {
  // Estados principales
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<{ leads: KommoLead[]; contacts: KommoContact[] }>({
    leads: [],
    contacts: [],
  });
  const [selectedEntity, setSelectedEntity] = useState<{
    type: 'lead' | 'contact' | null;
    data: KommoLead | KommoContact | null;
  }>({ type: null, data: null });
  const [searching, setSearching] = useState(false);
  
  // Datos del formulario
  const [callData, setCallData] = useState<Partial<CallCreateRequest>>({
    direction: 'outbound',
    call_status: 'completed',
    duration: 0,
    started_at: new Date().toISOString(),
  });
  const [nextCallDate, setNextCallDate] = useState('');
  const [nextCallNotes, setNextCallNotes] = useState('');
  
  // Estados del lead (embudo)
  const [currentPipeline, setCurrentPipeline] = useState<Pipeline | null>(null);
  const [pipelineStatuses, setPipelineStatuses] = useState<PipelineStatus[]>([]);
  const [selectedStatusId, setSelectedStatusId] = useState<string>('');
  
  // Usuarios responsables
  const [currentUserId, setCurrentUserId] = useState<string>('');
  
  // Edición de datos del cliente
  const [editingContact, setEditingContact] = useState(false);
  const [contactData, setContactData] = useState<KommoContact | null>(null);
  
  // Estado de guardado
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (selectedEntity.data && selectedEntity.type === 'lead') {
      loadLeadPipelineData(selectedEntity.data as KommoLead);
    }
  }, [selectedEntity]);

  const loadInitialData = async () => {
    try {
      const [usersData, pipelinesData] = await Promise.all([
        crmService.getUsers(true),
        crmService.getPipelines().catch(() => []),
      ]);
      
      if (usersData.length > 0) {
        setCurrentUserId(usersData[0].id);
      }
      
      // Buscar pipeline principal
      const mainPipeline = Array.isArray(pipelinesData) 
        ? pipelinesData.find((p: Pipeline) => p.is_main) || pipelinesData[0] || null
        : null;
      setCurrentPipeline(mainPipeline);
    } catch (err) {
      console.error('Error loading initial data:', err);
    }
  };

  const loadLeadPipelineData = async (lead: KommoLead) => {
    try {
      const pipelineId = lead.pipeline_id || currentPipeline?.id;
      if (!pipelineId) return;
      
      const stages = await crmService.getPipelineStages(String(pipelineId));
      setPipelineStatuses(stages);
      
      // Establecer estado actual del lead
      if (lead.status_id) {
        setSelectedStatusId(String(lead.status_id));
      } else if (lead.status && stages.length > 0) {
        // Intentar encontrar por nombre
        const matchingStage = stages.find(
          (s) => s.name.toLowerCase() === lead.status.toLowerCase()
        );
        if (matchingStage) {
          setSelectedStatusId(String(matchingStage.id));
        }
      }
    } catch (err) {
      console.error('Error loading pipeline data:', err);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults({ leads: [], contacts: [] });
      return;
    }

    setSearching(true);
    try {
      const searchLower = searchQuery.toLowerCase();
      
      // Buscar contactos (tiene parámetro search que busca en nombre, email, teléfono)
      const contactsResponse = await crmService.getContacts({ 
        search: searchQuery,
        limit: 20 
      }).catch(() => ({ items: [] }));

      // Buscar leads (cargamos más para filtrar en cliente)
      const leadsResponse = await crmService.getLeads({ 
        limit: 50
      }).catch(() => ({ items: [] }));

      // Filtrar leads por nombre, contacto asociado o teléfono
      const filteredLeads = (leadsResponse.items || []).filter((lead: KommoLead) => {
        const matchesName = lead.name?.toLowerCase().includes(searchLower);
        const matchesContactName = lead.contact?.name?.toLowerCase().includes(searchLower);
        const matchesPhone = lead.contact?.phone?.includes(searchQuery) || 
                           lead.contact?.mobile?.includes(searchQuery);
        const matchesEmail = lead.contact?.email?.toLowerCase().includes(searchLower);
        const matchesDescription = lead.description?.toLowerCase().includes(searchLower);
        
        return matchesName || matchesContactName || matchesPhone || matchesEmail || matchesDescription;
      });

      setSearchResults({
        leads: filteredLeads.slice(0, 10), // Limitar a 10 resultados
        contacts: (contactsResponse.items || []).slice(0, 10),
      });
    } catch (err) {
      console.error('Error searching:', err);
      alert('Error al buscar. Por favor, intenta de nuevo.');
    } finally {
      setSearching(false);
    }
  };

  const handleSelectEntity = async (type: 'lead' | 'contact', entity: KommoLead | KommoContact) => {
    setSelectedEntity({ type, data: entity });
    setEditingContact(false);
    
    // Cargar datos del contacto si es un lead con contacto asociado
    if (type === 'lead' && (entity as KommoLead).contact_id) {
      try {
        const contact = await crmService.getContact(String((entity as KommoLead).contact_id));
        setContactData(contact);
      } catch (err) {
        console.error('Error loading contact:', err);
        // Si no hay contacto asociado, crear uno nuevo para el formulario
        setContactData(null);
      }
    } else if (type === 'contact') {
      setContactData(entity as KommoContact);
    } else {
      setContactData(null);
    }
    
    // Prellenar datos de la llamada
    let phone = '';
    if (type === 'lead') {
      phone = (entity as KommoLead).contact?.phone || (entity as KommoLead).contact?.mobile || '';
    } else {
      phone = (entity as KommoContact).phone || (entity as KommoContact).mobile || '';
    }
    
    setCallData(prev => ({
      ...prev,
      phone: phone,
      entity_type: type === 'lead' ? 'leads' : 'contacts',
      entity_id: entity.id,
      started_at: new Date().toISOString(),
    }));
    
    // Limpiar resultados de búsqueda
    setSearchResults({ leads: [], contacts: [] });
    setSearchQuery('');
  };

  const handleSaveContactData = async (formData: Partial<ContactCreateRequest>) => {
    if (!selectedEntity.data || !contactData) return;
    
    try {
      await crmService.updateContact(contactData.id, formData);
      
      // Recargar datos del contacto
      const updatedContact = await crmService.getContact(contactData.id);
      setContactData(updatedContact);
      
      // Si es un lead, recargar también el lead
      if (selectedEntity.type === 'lead') {
        const updatedLead = await crmService.getLead(selectedEntity.data.id);
        setSelectedEntity({ type: 'lead', data: updatedLead });
      } else {
        setSelectedEntity({ type: 'contact', data: updatedContact });
      }
      
      setEditingContact(false);
    } catch (err) {
      console.error('Error saving contact data:', err);
      alert('Error al guardar los datos del cliente');
      throw err;
    }
  };

  const handleUpdateLeadStatus = async (silent = false) => {
    if (!selectedEntity.data || selectedEntity.type !== 'lead' || !selectedStatusId) return;
    
    try {
      const statusObj = pipelineStatuses.find(s => String(s.id) === selectedStatusId);
      if (!statusObj) return;
      
      await crmService.updateLead(selectedEntity.data.id, {
        status: statusObj.name.toLowerCase(),
      });
      
      // Recargar lead
      const updatedLead = await crmService.getLead(selectedEntity.data.id);
      setSelectedEntity({ type: 'lead', data: updatedLead });
      
      if (!silent) {
        alert('Estado del lead actualizado correctamente');
      }
    } catch (err) {
      console.error('Error updating lead status:', err);
      if (!silent) {
        alert('Error al actualizar el estado del lead');
      }
      throw err;
    }
  };

  const handleSaveCallAndNext = async () => {
    if (!selectedEntity.data || !callData.entity_id || !callData.entity_type) {
      alert('Por favor, selecciona un cliente primero');
      return;
    }

    setSaving(true);
    setSaveSuccess(false);
    
    try {
      // 1. No actualizamos datos del contacto aquí, ya que el formulario se guarda cuando se envía
      
      // 2. Actualizar estado del lead si cambió (silencioso, sin alert)
      if (selectedEntity.type === 'lead' && selectedStatusId) {
        try {
          await handleUpdateLeadStatus(true);
        } catch (err) {
          console.error('Error updating lead status during save:', err);
          // Continuar con el guardado aunque falle la actualización del estado
        }
      }
      
      // 3. Registrar la llamada
      const finalCallData: CallCreateRequest = {
        ...callData,
        entity_type: callData.entity_type as 'leads' | 'contacts',
        entity_id: callData.entity_id,
        phone: callData.phone || '',
        call_status: callData.call_status || 'completed',
        direction: callData.direction || 'outbound',
        duration: callData.duration || 0,
        started_at: callData.started_at || new Date().toISOString(),
        responsible_user_id: currentUserId,
        resumen_llamada: callData.resumen_llamada || '',
        proxima_llamada_fecha: nextCallDate ? new Date(nextCallDate).toISOString() : undefined,
      };
      
      await crmService.createCall(finalCallData);
      
      // 4. Crear tarea para próxima llamada si se especificó
      if (nextCallDate) {
        const taskData: TaskCreateRequest = {
          text: nextCallNotes || 'Llamada de seguimiento programada',
          task_type: 'call',
          entity_type: callData.entity_type as 'leads' | 'contacts',
          entity_id: callData.entity_id,
          responsible_user_id: currentUserId,
          complete_till: new Date(nextCallDate).toISOString(),
        };
        
        await crmService.createTask(taskData);
      }
      
      setSaveSuccess(true);
      
      // Limpiar formulario después de 2 segundos
      setTimeout(() => {
        resetForm();
      }, 2000);
      
    } catch (err: any) {
      console.error('Error saving call:', err);
      // Manejar error 400 relacionado con responsible_user_id
      if (err?.response?.status === 400) {
        const errorDetail = err?.response?.data?.detail || '';
        if (errorDetail.includes('responsible') || errorDetail.includes('Only users with role')) {
          alert('Solo abogados y administradores pueden ser responsables. Por favor, selecciona un usuario válido.');
          return;
        }
      }
      alert('Error al guardar la llamada. Por favor, verifica los datos e intenta de nuevo.');
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setSelectedEntity({ type: null, data: null });
    setCallData({
      direction: 'outbound',
      call_status: 'completed',
      duration: 0,
      started_at: new Date().toISOString(),
    });
    setNextCallDate('');
    setNextCallNotes('');
    setEditingContact(false);
    setContactData(null);
    setSelectedStatusId('');
    setSaveSuccess(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <CRMHeader />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="space-y-6">
          {/* Page Header */}
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <Phone className="text-green-600" size={32} />
              Gestión de Llamadas
            </h1>
            <p className="text-gray-600 mt-1">
              Atender llamada, gestionar lead y programar seguimiento
            </p>
          </div>

      {/* Búsqueda de Cliente */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search size={20} />
            Buscar Cliente
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              placeholder="Buscar por nombre, teléfono o email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="flex-1"
            />
            <Button
              onClick={handleSearch}
              disabled={searching}
              className="bg-green-600 hover:bg-green-700"
            >
              {searching ? (
                <RefreshCw size={18} className="animate-spin" />
              ) : (
                <Search size={18} />
              )}
            </Button>
          </div>

          {/* Resultados de búsqueda */}
          {(searchResults.leads.length > 0 || searchResults.contacts.length > 0) && (
            <div className="mt-4 space-y-2">
              {searchResults.leads.length > 0 && (
                <div>
                  <h3 className="font-semibold text-sm text-gray-700 mb-2">Leads</h3>
                  {searchResults.leads.map((lead) => (
                    <button
                      key={lead.id}
                      onClick={() => handleSelectEntity('lead', lead)}
                      className="w-full text-left p-3 border border-gray-200 rounded-md hover:bg-gray-50 hover:border-green-500 transition-colors mb-2"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-medium">{lead.name}</div>
                          {lead.contact && (
                            <div className="text-sm text-gray-500">
                              {lead.contact.phone || lead.contact.mobile}
                            </div>
                          )}
                          <div className="text-xs text-gray-400 mt-1">
                            Estado: {lead.status || 'N/A'}
                          </div>
                        </div>
                        <TrendingUp size={16} className="text-green-600 mt-1" />
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {searchResults.contacts.length > 0 && (
                <div>
                  <h3 className="font-semibold text-sm text-gray-700 mb-2">Contactos</h3>
                  {searchResults.contacts.map((contact) => (
                    <button
                      key={contact.id}
                      onClick={() => handleSelectEntity('contact', contact)}
                      className="w-full text-left p-3 border border-gray-200 rounded-md hover:bg-gray-50 hover:border-green-500 transition-colors mb-2"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-medium">{contact.name}</div>
                          <div className="text-sm text-gray-500">
                            {contact.phone || contact.mobile || 'Sin teléfono'}
                          </div>
                          {contact.email && (
                            <div className="text-xs text-gray-400 mt-1">{contact.email}</div>
                          )}
                        </div>
                        <User size={16} className="text-blue-600 mt-1" />
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Cliente Seleccionado */}
      {selectedEntity.data && (
        <>
          {/* Información del Cliente */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="flex items-center gap-2">
                  <User size={20} />
                  {selectedEntity.type === 'lead' ? 'Lead' : 'Contacto'}: {selectedEntity.data.name || 'Sin nombre'}
                </CardTitle>
                <div className="flex gap-2">
                  {contactData ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingContact(!editingContact)}
                    >
                      {editingContact ? 'Cancelar' : 'Editar Datos del Cliente'}
                    </Button>
                  ) : null}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {editingContact && contactData ? (
                <div className="space-y-4">
                  <ContactForm
                    contact={contactData}
                    onSubmit={handleSaveContactData}
                    onCancel={() => setEditingContact(false)}
                  />
                </div>
              ) : editingContact && !contactData && selectedEntity.type === 'lead' ? (
                <div className="p-4 border border-gray-300 rounded-md text-center text-gray-500">
                  Este lead no tiene un contacto asociado. Por favor, crea un contacto primero desde el detalle del lead.
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {selectedEntity.type === 'contact' ? (
                    <>
                      <div>
                        <Label className="text-xs text-gray-500">Teléfono</Label>
                        <div className="text-sm font-medium">
                          {(selectedEntity.data as KommoContact).phone || (selectedEntity.data as KommoContact).mobile || 'N/A'}
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs text-gray-500">Email</Label>
                        <div className="text-sm font-medium">
                          {(selectedEntity.data as KommoContact).email || 'N/A'}
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs text-gray-500">Nacionalidad</Label>
                        <div className="text-sm font-medium">
                          {(selectedEntity.data as KommoContact).nacionalidad || 'N/A'}
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs text-gray-500">Grading</Label>
                        <div className="text-sm font-medium">
                          {(selectedEntity.data as KommoContact).grading_llamada || 'N/A'}
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <Label className="text-xs text-gray-500">Estado</Label>
                        <div className="text-sm font-medium">
                          {(selectedEntity.data as KommoLead).status || 'N/A'}
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs text-gray-500">Precio</Label>
                        <div className="text-sm font-medium">
                          {(selectedEntity.data as KommoLead).price
                            ? `${(selectedEntity.data as KommoLead).price} ${(selectedEntity.data as KommoLead).currency || 'EUR'}`
                            : 'N/A'}
                        </div>
                      </div>
                      {(selectedEntity.data as KommoLead).contact && (
                        <>
                          <div>
                            <Label className="text-xs text-gray-500">Teléfono</Label>
                            <div className="text-sm font-medium">
                              {(selectedEntity.data as KommoLead).contact?.phone || (selectedEntity.data as KommoLead).contact?.mobile || 'N/A'}
                            </div>
                          </div>
                          <div>
                            <Label className="text-xs text-gray-500">Email</Label>
                            <div className="text-sm font-medium">
                              {(selectedEntity.data as KommoLead).contact?.email || 'N/A'}
                            </div>
                          </div>
                        </>
                      )}
                    </>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Gestión del Embudo (solo para leads) */}
          {selectedEntity.type === 'lead' && pipelineStatuses.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp size={20} />
                  Gestión del Embudo
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4 items-end">
                  <div className="flex-1">
                    <Label>Estado del Lead</Label>
                    <select
                      value={selectedStatusId}
                      onChange={(e) => setSelectedStatusId(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 mt-1"
                    >
                      <option value="">Seleccionar estado...</option>
                      {pipelineStatuses.map((status) => (
                        <option key={status.id} value={status.id}>
                          {status.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <Button
                    onClick={() => handleUpdateLeadStatus()}
                    disabled={!selectedStatusId || saving}
                    variant="outline"
                  >
                    Actualizar Estado
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Registro de Llamada */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Phone size={20} />
                Registrar Llamada
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <Label>Teléfono</Label>
                    <Input
                      type="tel"
                      value={callData.phone || ''}
                      onChange={(e) => setCallData(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="+34600123456"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>Dirección</Label>
                    <select
                      value={callData.direction || 'outbound'}
                      onChange={(e) => setCallData(prev => ({ ...prev, direction: e.target.value as 'inbound' | 'outbound' }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 mt-1"
                    >
                      <option value="inbound">Entrante</option>
                      <option value="outbound">Saliente</option>
                    </select>
                  </div>
                  <div>
                    <Label>Estado</Label>
                    <select
                      value={callData.call_status || 'completed'}
                      onChange={(e) => setCallData(prev => ({ ...prev, call_status: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 mt-1"
                    >
                      <option value="completed">Completada</option>
                      <option value="failed">Fallida</option>
                      <option value="busy">Ocupado</option>
                      <option value="no_answer">Sin respuesta</option>
                      <option value="missed">Perdida</option>
                    </select>
                  </div>
                  <div>
                    <Label>Duración (segundos)</Label>
                    <Input
                      type="number"
                      value={callData.duration || 0}
                      onChange={(e) => setCallData(prev => ({ ...prev, duration: parseInt(e.target.value) || 0 }))}
                      className="mt-1"
                      min="0"
                    />
                  </div>
                </div>

                <div>
                  <Label>Resumen de la Llamada</Label>
                  <Textarea
                    value={callData.resumen_llamada || ''}
                    onChange={(e) => setCallData(prev => ({ ...prev, resumen_llamada: e.target.value }))}
                    placeholder="Anota los detalles importantes de la conversación..."
                    rows={4}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label>Resultado</Label>
                  <Textarea
                    value={callData.call_result || ''}
                    onChange={(e) => setCallData(prev => ({ ...prev, call_result: e.target.value }))}
                    placeholder="Resultado de la llamada..."
                    rows={2}
                    className="mt-1"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Próxima Llamada */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar size={20} />
                Próxima Llamada
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label>Fecha y Hora</Label>
                  <Input
                    type="datetime-local"
                    value={nextCallDate}
                    onChange={(e) => setNextCallDate(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Notas para la Próxima Llamada</Label>
                  <Textarea
                    value={nextCallNotes}
                    onChange={(e) => setNextCallNotes(e.target.value)}
                    placeholder="Puntos importantes a tratar en la próxima llamada..."
                    rows={3}
                    className="mt-1"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Botón Guardar Todo */}
          <div className="sticky bottom-4 flex justify-end">
            <Card className="shadow-lg">
              <CardContent className="p-4">
                {saveSuccess ? (
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle2 size={20} />
                    <span className="font-medium">¡Guardado exitosamente!</span>
                  </div>
                ) : (
                  <Button
                    onClick={handleSaveCallAndNext}
                    disabled={saving || !selectedEntity.data}
                    className="bg-green-600 hover:bg-green-700 text-white px-8 py-6 text-lg"
                    size="lg"
                  >
                    {saving ? (
                      <>
                        <RefreshCw size={20} className="mr-2 animate-spin" />
                        Guardando...
                      </>
                    ) : (
                      <>
                        <Save size={20} className="mr-2" />
                        Guardar Llamada y Próxima Acción
                      </>
                    )}
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
        </div>
      </div>
    </div>
  );
}

