// CRM Contact List - Lista de contactos con filtros, ordenamiento y búsqueda avanzada (estilo ActiveCampaign)

import { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { crmService } from '@/services/crmService';
import type { Contact, ContactFilters, CRMUser } from '@/types/crm';
import { ArrowDownIcon, ArrowUpIcon, ArrowsUpDownIcon, CalendarIcon, ChevronLeftIcon, ChevronRightIcon, CogIcon, EllipsisVerticalIcon, EnvelopeIcon, FlagIcon, FunnelIcon, ListBulletIcon, MagnifyingGlassIcon, MapPinIcon, PhoneIcon, PlusIcon, Squares2X2Icon, StarIcon, TrashIcon, UsersIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useAuth } from '@/providers/AuthProvider';
import { isAgent, isAdminOrSuperuser } from '@/utils/searchValidation';
import { Modal } from '@/components/common/Modal';
import { Switch } from '@/components/ui/switch';
import { ContactCard } from '@/components/CRM/ContactCard';
import { ContactTableRow } from '@/components/CRM/ContactTableRow';

type SortField = 'name' | 'email' | 'phone' | 'created_at' | 'updated_at' | 'grading_llamada' | 'grading_situacion' | 'nacionalidad' | 'ultima_llamada' | 'proxima_llamada';
type SortOrder = 'asc' | 'desc';
type ViewMode = 'cards' | 'table';

// Tipos para redimensionamiento de columnas
type ColumnKey = 'name' | 'email' | 'phone' | 'nacionalidad' | 'grading_llamada' | 'grading_situacion' | 'created_at' | 'updated_at' | 'ultima_llamada' | 'proxima_llamada' | 'acciones';
type ColumnWidths = Record<ColumnKey, number>;

const DEFAULT_COLUMN_WIDTHS: ColumnWidths = {
  name: 200,
  email: 200,
  phone: 150,
  nacionalidad: 140,
  grading_llamada: 140,
  grading_situacion: 150,
  created_at: 150,
  updated_at: 150,
  ultima_llamada: 160,
  proxima_llamada: 160,
  acciones: 100,
};

const COLUMN_WIDTHS_STORAGE_KEY = 'crm_contacts_table_column_widths';
const COLUMN_VISIBILITY_STORAGE_KEY = 'crm_contacts_table_column_visibility';
const COLUMN_ORDER_STORAGE_KEY = 'crm_contacts_table_column_order';

export function CRMContactList() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { isAuthenticated, user } = useAuth();
  const userIsAgent = user ? isAgent(user.role) : false;
  const userIsAdmin = user ? isAdminOrSuperuser(user.role, user.is_superuser) : false;
  const currentUserId = user?.id || '';
  const [loading, setLoading] = useState(true);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [users, setUsers] = useState<CRMUser[]>([]);
  const [totalContacts, setTotalContacts] = useState(0);

  // Selección + acciones bulk (solo admin/superuser)
  const [selectedContactIds, setSelectedContactIds] = useState<Set<string>>(new Set<string>());
  const [bulkActionsOpen, setBulkActionsOpen] = useState(false);
  const [bulkBusy, setBulkBusy] = useState(false);
  const [bulkError, setBulkError] = useState<string | null>(null);
  const [bulkResponsibleUserId, setBulkResponsibleUserId] = useState<string>('');
  const [bulkDeleteConfirmStep, setBulkDeleteConfirmStep] = useState(false);
  const [bulkDeleteConfirmed, setBulkDeleteConfirmed] = useState(false);
  const selectAllRef = useRef<HTMLInputElement | null>(null);
  
  // Paginación
  const [pagination, setPagination] = useState({
    skip: parseInt(searchParams.get('skip') || '0'),
    limit: parseInt(searchParams.get('limit') || '100'),
  });
  
  // Estado de búsqueda y filtros
  const searchFromUrl = searchParams.get('search');
  const decodedSearch = searchFromUrl ? decodeURIComponent(searchFromUrl.replace(/\+/g, ' ')) : '';
  const [searchTerm, setSearchTerm] = useState(decodedSearch);
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>((searchParams.get('view') as ViewMode) || 'table');
  
  // Filtros
  const getGradingFromUrl = (param: string | null): 'A' | 'B+' | 'B-' | 'C' | 'D' | '' => {
    if (param === 'A' || param === 'B+' || param === 'B-' || param === 'C' || param === 'D') {
      return param;
    }
    return '';
  };
  
  const [gradingLlamada, setGradingLlamada] = useState<'A' | 'B+' | 'B-' | 'C' | 'D' | ''>(getGradingFromUrl(searchParams.get('grading_llamada')));
  const [gradingSituacion, setGradingSituacion] = useState<'A' | 'B+' | 'B-' | 'C' | 'D' | ''>(getGradingFromUrl(searchParams.get('grading_situacion')));
  const [nacionalidad, setNacionalidad] = useState(searchParams.get('nacionalidad') || '');
  const [nacionalidadFilter, setNacionalidadFilter] = useState<'todos' | 'nacionalidad'>(
    searchParams.get('nacionalidad_filter') === 'nacionalidad' ? 'nacionalidad' : 'todos'
  );
  const [responsibleUserId, setResponsibleUserId] = useState<string | undefined>(searchParams.get('responsible_user_id') || undefined);
  const [empadronado, setEmpadronado] = useState<string>(searchParams.get('empadronado') || '');
  const [tieneIngresos, setTieneIngresos] = useState<string>(searchParams.get('tiene_ingresos') || '');
  const [ultimaLlamadaDesde, setUltimaLlamadaDesde] = useState<string>(searchParams.get('ultima_llamada_desde') || '');
  const [ultimaLlamadaHasta, setUltimaLlamadaHasta] = useState<string>(searchParams.get('ultima_llamada_hasta') || '');
  const [proximaLlamadaDesde, setProximaLlamadaDesde] = useState<string>(searchParams.get('proxima_llamada_desde') || '');
  const [proximaLlamadaHasta, setProximaLlamadaHasta] = useState<string>(searchParams.get('proxima_llamada_hasta') || '');
  const [fechaModificacionDesde, setFechaModificacionDesde] = useState<string>(searchParams.get('fecha_modificacion_desde') || '');
  const [fechaModificacionHasta, setFechaModificacionHasta] = useState<string>(searchParams.get('fecha_modificacion_hasta') || '');
  
  // Ordenamiento
  const [sortField, setSortField] = useState<SortField>((searchParams.get('sort_by') as SortField) || 'created_at');
  const [sortOrder, setSortOrder] = useState<SortOrder>((searchParams.get('sort_order') as SortOrder) || 'desc');

  const isMyContacts = Boolean(currentUserId) && responsibleUserId === currentUserId;
  const handleMyContactsToggle = (checked: boolean) => {
    if (!currentUserId) {
      console.warn('⚠️ [CRMContactList] No hay currentUserId disponible para filtrar');
      return;
    }
    console.log('🔄 [CRMContactList] Toggle "Solo mis contactos":', {
      checked,
      currentUserId,
      previousResponsibleUserId: responsibleUserId,
      willSetTo: checked ? currentUserId : undefined,
    });
    // Asegurar que siempre usamos el currentUserId, nunca un valor diferente
    // Usar undefined en lugar de '' para consistencia con OpportunityFilters
    setResponsibleUserId(checked ? currentUserId : undefined);
  };
  
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Ref para prevenir actualizaciones infinitas
  const isUpdatingUrlRef = useRef(false);
  const isInitialMount = useRef(true);

  useEffect(() => {
    crmService.getUsers(true).then(setUsers).catch(() => setUsers([]));
  }, []);

  // Sincronizar estado con URL solo cuando cambian los filtros (no durante la carga inicial)
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    if (isUpdatingUrlRef.current) {
      return;
    }

    const params = new URLSearchParams();
    if (searchTerm) params.set('search', searchTerm);
    if (gradingLlamada) params.set('grading_llamada', gradingLlamada);
    if (gradingSituacion) params.set('grading_situacion', gradingSituacion);
    if (nacionalidad) params.set('nacionalidad', nacionalidad);
    if (nacionalidadFilter !== 'todos') params.set('nacionalidad_filter', nacionalidadFilter);
    if (responsibleUserId) params.set('responsible_user_id', responsibleUserId);
    if (empadronado) params.set('empadronado', empadronado);
    if (tieneIngresos) params.set('tiene_ingresos', tieneIngresos);
    if (ultimaLlamadaDesde) params.set('ultima_llamada_desde', ultimaLlamadaDesde);
    if (ultimaLlamadaHasta) params.set('ultima_llamada_hasta', ultimaLlamadaHasta);
    if (proximaLlamadaDesde) params.set('proxima_llamada_desde', proximaLlamadaDesde);
    if (proximaLlamadaHasta) params.set('proxima_llamada_hasta', proximaLlamadaHasta);
    if (fechaModificacionDesde) params.set('fecha_modificacion_desde', fechaModificacionDesde);
    if (fechaModificacionHasta) params.set('fecha_modificacion_hasta', fechaModificacionHasta);
    if (sortField) params.set('sort_by', sortField);
    if (sortOrder) params.set('sort_order', sortOrder);
    if (viewMode) params.set('view', viewMode);
    params.set('skip', pagination.skip.toString());
    params.set('limit', pagination.limit.toString());
    
    const newUrl = params.toString();
    const currentUrl = searchParams.toString();
    
    // Solo actualizar si la URL realmente cambió
    if (newUrl !== currentUrl) {
      isUpdatingUrlRef.current = true;
      setSearchParams(params, { replace: true });
      // Resetear el flag después de un pequeño delay
      setTimeout(() => {
        isUpdatingUrlRef.current = false;
      }, 0);
    }
  }, [searchTerm, gradingLlamada, gradingSituacion, nacionalidad, nacionalidadFilter, responsibleUserId, empadronado, tieneIngresos, ultimaLlamadaDesde, ultimaLlamadaHasta, proximaLlamadaDesde, proximaLlamadaHasta, fechaModificacionDesde, fechaModificacionHasta, sortField, sortOrder, viewMode, pagination.skip, pagination.limit, setSearchParams]);

  // Resetear paginación cuando cambian los filtros (excepto cuando cambia explícitamente la paginación)
  const prevFiltersRef = useRef({ searchTerm, gradingLlamada, gradingSituacion, nacionalidad, nacionalidadFilter, responsibleUserId, empadronado, tieneIngresos, ultimaLlamadaDesde, ultimaLlamadaHasta, proximaLlamadaDesde, proximaLlamadaHasta, sortField, sortOrder });
  
  useEffect(() => {
    const currentFilters = { searchTerm, gradingLlamada, gradingSituacion, nacionalidad, nacionalidadFilter, responsibleUserId, empadronado, tieneIngresos, ultimaLlamadaDesde, ultimaLlamadaHasta, proximaLlamadaDesde, proximaLlamadaHasta, sortField, sortOrder };
    const filtersChanged = JSON.stringify(prevFiltersRef.current) !== JSON.stringify(currentFilters);
    
    if (filtersChanged && pagination.skip !== 0) {
      // Resetear a la primera página cuando cambian los filtros
      setPagination(prev => ({ ...prev, skip: 0 }));
    }
    
    prevFiltersRef.current = currentFilters;
  }, [searchTerm, gradingLlamada, gradingSituacion, nacionalidad, nacionalidadFilter, responsibleUserId, empadronado, tieneIngresos, ultimaLlamadaDesde, ultimaLlamadaHasta, proximaLlamadaDesde, proximaLlamadaHasta, sortField, sortOrder]);

  // Sincronizar searchTerm desde URL solo una vez al montar
  useEffect(() => {
    const searchFromUrl = searchParams.get('search');
    if (searchFromUrl && isInitialMount.current) {
      const decoded = decodeURIComponent(searchFromUrl.replace(/\+/g, ' '));
      if (decoded !== searchTerm) {
        setSearchTerm(decoded);
        setTimeout(() => {
          searchInputRef.current?.focus();
          searchInputRef.current?.select();
        }, 300);
      }
    }
  }, []); // Solo ejecutar una vez al montar

  // Función helper para enriquecer un contacto con información de llamadas
  const enrichContactWithCallInfo = async (contact: Contact): Promise<Contact> => {
    try {
      // Obtener llamadas y tareas del contacto
      const [callsResponse, tasksResponse] = await Promise.all([
        crmService.getCalls({ entity_id: contact.id, entity_type: 'contacts', limit: 100 }).catch(() => ({ items: [] })),
        crmService.getTasks({ entity_id: contact.id, entity_type: 'contacts', limit: 100, is_completed: false }).catch(() => ({ items: [] })),
      ]);

      const calls = callsResponse.items || [];
      const tasks = tasksResponse.items || [];

      // Calcular última llamada (la más reciente)
      let ultimaLlamada: string | undefined;
      if (calls.length > 0) {
        const sortedCalls = [...calls].sort((a, b) => {
          const dateA = new Date(a.started_at || a.created_at).getTime();
          const dateB = new Date(b.started_at || b.created_at).getTime();
          return dateB - dateA; // Descendente (más reciente primero)
        });
        ultimaLlamada = sortedCalls[0].started_at || sortedCalls[0].created_at;
      }

      // Calcular próxima llamada (la más próxima futura)
      let proximaLlamada: string | undefined;
      const now = new Date().getTime();
      
      // Buscar en proxima_llamada_fecha de las llamadas
      const proximasLlamadasCalls = calls
        .filter(call => call.proxima_llamada_fecha)
        .map(call => new Date(call.proxima_llamada_fecha!).getTime())
        .filter(date => date > now);
      
      // Buscar en tasks de tipo 'call' que no estén completadas
      const proximasLlamadasTasks = tasks
        .filter(task => task.task_type === 'call' && task.complete_till)
        .map(task => new Date(task.complete_till!).getTime())
        .filter(date => date > now);
      
      // Combinar ambas fuentes y tomar la más próxima
      const todasProximasLlamadas = [...proximasLlamadasCalls, ...proximasLlamadasTasks];
      if (todasProximasLlamadas.length > 0) {
        const fechaMasProxima = Math.min(...todasProximasLlamadas);
        proximaLlamada = new Date(fechaMasProxima).toISOString();
      }

      return {
        ...contact,
        ultima_llamada_fecha: ultimaLlamada,
        proxima_llamada_fecha: proximaLlamada,
      };
    } catch (err) {
      console.error(`Error enriqueciendo contacto ${contact.id}:`, err);
      return contact;
    }
  };

  // Ref para evitar múltiples llamadas simultáneas a loadContacts
  const isLoadingRef = useRef(false);
  const loadContactsTimeoutRef = useRef<number | null>(null);
  const loadContactsRef = useRef<() => Promise<void>>(() => Promise.resolve());

  const loadContacts = useCallback(async () => {
    if (isLoadingRef.current) {
      return; // Ya hay una carga en progreso
    }
    
    isLoadingRef.current = true;
    setLoading(true);
    try {
      const filters: ContactFilters = {
        skip: pagination.skip,
        limit: pagination.limit,
      };
      
      // Todos los usuarios pueden ver todos los contactos sin restricciones
      // Solo aplicar filtro por responsable si se selecciona manualmente
      if (responsibleUserId) {
        // Validación: si el switch está activo, asegurar que siempre usemos el currentUserId
        const finalResponsibleUserId = isMyContacts && currentUserId ? currentUserId : responsibleUserId;
        filters.responsible_user_id = finalResponsibleUserId;
        console.log('🔍 [CRMContactList] Aplicando filtro por responsable:', {
          responsible_user_id_from_state: responsibleUserId,
          currentUserId,
          isMyContacts,
          final_responsible_user_id: finalResponsibleUserId,
          willFilterBy: filters.responsible_user_id,
        });
      }
      
      // Búsqueda normal para todos los usuarios
      if (searchTerm) {
        filters.search = searchTerm;
      }
      
    if (gradingLlamada) filters.grading_llamada = gradingLlamada as 'A' | 'B+' | 'B-' | 'C' | 'D';
    if (gradingSituacion) filters.grading_situacion = gradingSituacion as 'A' | 'B+' | 'B-' | 'C' | 'D';
    // Aplicar filtro de nacionalidad: si es "nacionalidad", filtrar por contactos con nacionalidad
    // Si es una nacionalidad específica del select, usar esa
    if (nacionalidadFilter === 'nacionalidad') {
      // Para "Solo nacionalidad", no establecer nacionalidad en el filtro del backend
      // Se filtrará localmente después para mostrar solo los que tienen nacionalidad
    } else if (nacionalidad) {
      filters.nacionalidad = nacionalidad;
    }
      if (empadronado) filters.empadronado = empadronado === 'true';
      if (tieneIngresos) filters.tiene_ingresos = tieneIngresos === 'true';
      if (ultimaLlamadaDesde) filters.ultima_llamada_desde = ultimaLlamadaDesde;
      if (ultimaLlamadaHasta) filters.ultima_llamada_hasta = ultimaLlamadaHasta;
      if (proximaLlamadaDesde) filters.proxima_llamada_desde = proximaLlamadaDesde;
      if (proximaLlamadaHasta) filters.proxima_llamada_hasta = proximaLlamadaHasta;
      if (sortField) {
        filters.sort_by = sortField;
        filters.sort_order = sortOrder;
      }

      const response = await crmService.getContacts(filters);
      
      // Todos los usuarios ven todos los contactos sin filtrar
      let filteredContacts = response.items || [];
      
      // Aplicar filtro de nacionalidad "Solo nacionalidad" localmente
      if (nacionalidadFilter === 'nacionalidad') {
        filteredContacts = filteredContacts.filter(contact => {
          return contact.nacionalidad && contact.nacionalidad.trim() !== '';
        });
      }
      
      // Si el switch "Solo mis contactos" está activo, filtrar adicionalmente en el frontend
      // para excluir contactos sin asignación o asignados a otros usuarios
      if (isMyContacts && currentUserId) {
        const beforeFilter = filteredContacts.length;
        filteredContacts = filteredContacts.filter(contact => {
          // Solo incluir contactos que tienen responsible_user_id y coincide con currentUserId
          const hasMatchingResponsible = contact.responsible_user_id === currentUserId;
          
          if (!hasMatchingResponsible) {
            console.log('🚫 [CRMContactList] Excluyendo contacto:', {
              contact_id: contact.id,
              contact_name: contact.name || `${contact.first_name} ${contact.last_name || ''}`.trim(),
              contact_responsible_user_id: contact.responsible_user_id,
              currentUserId,
              reason: !contact.responsible_user_id ? 'sin asignación' : 'asignado a otro usuario',
            });
          }
          
          return hasMatchingResponsible;
        });
        
        console.log('🔍 [CRMContactList] Filtrado adicional "Solo mis contactos":', {
          antes: beforeFilter,
          despues: filteredContacts.length,
          excluidos: beforeFilter - filteredContacts.length,
          currentUserId,
        });
      }
      
      console.log('📋 [CRMContactList] Contactos cargados:', {
        totalCargados: response.items?.length || 0,
        totalFiltrados: filteredContacts.length,
        isMyContacts,
        currentUserId,
      });
      
      // Obtener el total real de contactos usando el endpoint de count (sin paginación)
      // Esto asegura que el total sea correcto independientemente de los filtros
      try {
        const totalCount = await crmService.getContactsCount({
          search: filters.search,
          grading_llamada: filters.grading_llamada,
          grading_situacion: filters.grading_situacion,
          nacionalidad: filters.nacionalidad,
          responsible_user_id: filters.responsible_user_id,
          empadronado: filters.empadronado,
          tiene_ingresos: filters.tiene_ingresos,
          ultima_llamada_desde: filters.ultima_llamada_desde,
          ultima_llamada_hasta: filters.ultima_llamada_hasta,
          proxima_llamada_desde: filters.proxima_llamada_desde,
          proxima_llamada_hasta: filters.proxima_llamada_hasta,
        });
        
        // Si el switch "Solo mis contactos" o "Solo nacionalidad" está activo y filtramos adicionalmente en el frontend,
        // usar la cantidad de contactos filtrados en lugar del total del API
        // (porque excluimos contactos sin asignación que el backend podría incluir, o filtramos por nacionalidad)
        const needsFrontendFilteredCount = isMyContacts || nacionalidadFilter === 'nacionalidad';
        const realTotal = needsFrontendFilteredCount ? filteredContacts.length : totalCount;
        
        console.log('📊 [CRMContactList] Total count:', {
          fromAPI: totalCount,
          filteredCount: filteredContacts.length,
          realTotal: realTotal,
          isAdmin: userIsAdmin,
          isAgent: userIsAgent,
          isMyContacts,
          nacionalidadFilter,
          usingFrontendFilteredCount: needsFrontendFilteredCount,
        });
        
        setTotalContacts(realTotal);
      } catch (countError) {
        console.warn('⚠️ [CRMContactList] Error getting total count, using response total:', countError);
        // Si el switch "Solo mis contactos" o "Solo nacionalidad" está activo, usar la cantidad de contactos filtrados
        // (porque excluimos contactos sin asignación que el backend podría incluir, o filtramos por nacionalidad)
        // Para otros casos, usar el total de la respuesta
        const needsFrontendFilteredCount = isMyContacts || nacionalidadFilter === 'nacionalidad';
        const fallbackTotal = needsFrontendFilteredCount ? filteredContacts.length : (response.total ?? response.items?.length ?? 0);
        console.log('📊 [CRMContactList] Using fallback total:', {
          fallbackTotal,
          filteredCount: filteredContacts.length,
          responseTotal: response.total,
          isMyContacts,
        });
        setTotalContacts(fallbackTotal);
      }
      
      // OPTIMIZACIÓN: Solo enriquecer contactos si realmente se necesitan las columnas de llamadas
      // Verificar si se están usando filtros o columnas que requieren información de llamadas
      const needsCallInfo = ultimaLlamadaDesde || ultimaLlamadaHasta || 
                           proximaLlamadaDesde || proximaLlamadaHasta ||
                           sortField === 'ultima_llamada' || sortField === 'proxima_llamada';
      
      if (needsCallInfo && filteredContacts.length > 0) {
        // Solo enriquecer si es necesario y hay contactos filtrados
        // Usar batches más pequeños para evitar sobrecarga
        const batchSize = 5; // Reducido de 10 a 5 para mejor rendimiento
        const enrichedContacts: Contact[] = [];
        
        for (let i = 0; i < filteredContacts.length; i += batchSize) {
          const batch = filteredContacts.slice(i, i + batchSize);
          const enrichedBatch = await Promise.all(
            batch.map(contact => enrichContactWithCallInfo(contact))
          );
          enrichedContacts.push(...enrichedBatch);
        }
        
        setContacts(enrichedContacts);
      } else {
        // Si no se necesita información de llamadas, usar contactos filtrados directamente
        // Esto evita 200+ llamadas API innecesarias
        setContacts(filteredContacts);
      }
    } catch (err) {
      console.error('❌ [CRMContactList] Error loading contacts:', err);
      setContacts([]);
      setTotalContacts(0);
    } finally {
      setLoading(false);
      isLoadingRef.current = false;
    }
  }, [pagination.skip, pagination.limit, responsibleUserId, searchTerm, gradingLlamada, gradingSituacion, nacionalidad, nacionalidadFilter, empadronado, tieneIngresos, ultimaLlamadaDesde, ultimaLlamadaHasta, proximaLlamadaDesde, proximaLlamadaHasta, sortField, sortOrder, userIsAdmin, userIsAgent, currentUserId, isMyContacts]);

  // Mantener la referencia actualizada
  useEffect(() => {
    loadContactsRef.current = loadContacts;
  }, [loadContacts]);

  useEffect(() => {
    if (!isAuthenticated) return;

    // Cancelar cualquier llamada pendiente
    if (loadContactsTimeoutRef.current) {
      clearTimeout(loadContactsTimeoutRef.current);
    }

    // Debounce para evitar múltiples llamadas rápidas
    loadContactsTimeoutRef.current = setTimeout(() => {
      loadContactsRef.current();
    }, 300); // Aumentado a 300ms para mejor debounce

    return () => {
      if (loadContactsTimeoutRef.current) {
        clearTimeout(loadContactsTimeoutRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, searchTerm, gradingLlamada, gradingSituacion, nacionalidad, nacionalidadFilter, responsibleUserId, empadronado, tieneIngresos, ultimaLlamadaDesde, ultimaLlamadaHasta, proximaLlamadaDesde, proximaLlamadaHasta, sortField, sortOrder, pagination.skip, pagination.limit]);

  const filteredAndSortedContacts = useMemo(() => {
    let filtered = [...contacts];

    // Nota: Los filtros de fecha se aplican localmente porque requieren enriquecer los contactos
    // con información de llamadas. El total mostrado es del servidor sin estos filtros.
    // Aplicar filtros de fecha de última llamada
    if (ultimaLlamadaDesde || ultimaLlamadaHasta) {
      filtered = filtered.filter(contact => {
        if (!contact.ultima_llamada_fecha) return false;
        const fecha = new Date(contact.ultima_llamada_fecha).getTime();
        if (ultimaLlamadaDesde && fecha < new Date(ultimaLlamadaDesde).getTime()) return false;
        if (ultimaLlamadaHasta && fecha > new Date(ultimaLlamadaHasta).getTime()) return false;
        return true;
      });
    }

    // Aplicar filtros de fecha de próxima llamada
    if (proximaLlamadaDesde || proximaLlamadaHasta) {
      filtered = filtered.filter(contact => {
        if (!contact.proxima_llamada_fecha) return false;
        const fecha = new Date(contact.proxima_llamada_fecha).getTime();
        if (proximaLlamadaDesde && fecha < new Date(proximaLlamadaDesde).getTime()) return false;
        if (proximaLlamadaHasta && fecha > new Date(proximaLlamadaHasta).getTime()) return false;
        return true;
      });
    }

    // Aplicar filtros de fecha de modificación
    if (fechaModificacionDesde || fechaModificacionHasta) {
      filtered = filtered.filter(contact => {
        if (!contact.updated_at) return false;
        const fecha = new Date(contact.updated_at).getTime();
        if (fechaModificacionDesde && fecha < new Date(fechaModificacionDesde).getTime()) return false;
        if (fechaModificacionHasta && fecha > new Date(fechaModificacionHasta).getTime()) return false;
        return true;
      });
    }

    filtered.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortField) {
        case 'name':
          aValue = (a.name || `${a.first_name} ${a.last_name || ''}`.trim() || '').toLowerCase();
          bValue = (b.name || `${b.first_name} ${b.last_name || ''}`.trim() || '').toLowerCase();
          break;
        case 'email':
          aValue = (a.email || '').toLowerCase();
          bValue = (b.email || '').toLowerCase();
          break;
        case 'phone':
          aValue = (a.phone || '').toLowerCase();
          bValue = (b.phone || '').toLowerCase();
          break;
        case 'created_at':
          aValue = new Date(a.created_at).getTime();
          bValue = new Date(b.created_at).getTime();
          break;
        case 'updated_at':
          aValue = new Date(a.updated_at).getTime();
          bValue = new Date(b.updated_at).getTime();
          break;
        case 'grading_llamada':
          const gradingOrder = { 'A': 5, 'B+': 4, 'B-': 3, 'C': 2, 'D': 1 };
          aValue = gradingOrder[a.grading_llamada as keyof typeof gradingOrder] || 0;
          bValue = gradingOrder[b.grading_llamada as keyof typeof gradingOrder] || 0;
          break;
        case 'grading_situacion':
          const situacionOrder = { 'A': 5, 'B+': 4, 'B-': 3, 'C': 2, 'D': 1 };
          aValue = situacionOrder[a.grading_situacion as keyof typeof situacionOrder] || 0;
          bValue = situacionOrder[b.grading_situacion as keyof typeof situacionOrder] || 0;
          break;
        case 'nacionalidad':
          aValue = (a.nacionalidad || '').toLowerCase();
          bValue = (b.nacionalidad || '').toLowerCase();
          break;
        case 'ultima_llamada':
          aValue = a.ultima_llamada_fecha ? new Date(a.ultima_llamada_fecha).getTime() : 0;
          bValue = b.ultima_llamada_fecha ? new Date(b.ultima_llamada_fecha).getTime() : 0;
          break;
        case 'proxima_llamada':
          aValue = a.proxima_llamada_fecha ? new Date(a.proxima_llamada_fecha).getTime() : Number.MAX_SAFE_INTEGER;
          bValue = b.proxima_llamada_fecha ? new Date(b.proxima_llamada_fecha).getTime() : Number.MAX_SAFE_INTEGER;
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [contacts, searchTerm, ultimaLlamadaDesde, ultimaLlamadaHasta, proximaLlamadaDesde, proximaLlamadaHasta, fechaModificacionDesde, fechaModificacionHasta, sortField, sortOrder]);

  // ===== Selección (solo admin/superuser) =====
  const visibleContactIdSet = useMemo(() => {
    return new Set(filteredAndSortedContacts.map(c => c.id));
  }, [filteredAndSortedContacts]);

  const selectedCount = selectedContactIds.size;
  const selectedInViewCount = useMemo(() => {
    let count = 0;
    for (const id of selectedContactIds) {
      if (visibleContactIdSet.has(id)) count++;
    }
    return count;
  }, [selectedContactIds, visibleContactIdSet]);

  const allInViewSelected = filteredAndSortedContacts.length > 0 && selectedInViewCount === filteredAndSortedContacts.length;
  const someInViewSelected = selectedInViewCount > 0 && !allInViewSelected;

  useEffect(() => {
    // Si no es admin, limpiar selección
    if (!userIsAdmin) {
      if (selectedContactIds.size > 0) setSelectedContactIds(new Set<string>());
      return;
    }

    // Mantener selección solo para los visibles en la página actual
    setSelectedContactIds(prev => {
      if (prev.size === 0) return prev;
      const next = new Set<string>();
      for (const id of prev) {
        if (visibleContactIdSet.has(id)) next.add(id);
      }
      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userIsAdmin, visibleContactIdSet]);

  useEffect(() => {
    if (!selectAllRef.current) return;
    selectAllRef.current.indeterminate = someInViewSelected;
  }, [someInViewSelected]);

  const toggleContactSelected = useCallback((contactId: string, checked: boolean) => {
    setSelectedContactIds(prev => {
      const next = new Set(prev);
      if (checked) next.add(contactId);
      else next.delete(contactId);
      return next;
    });
  }, []);

  const toggleSelectAllVisible = useCallback((checked: boolean) => {
    const ids = filteredAndSortedContacts.map(c => c.id);
    setSelectedContactIds(prev => {
      const next = new Set(prev);
      if (checked) {
        ids.forEach(id => next.add(id));
      } else {
        ids.forEach(id => next.delete(id));
      }
      return next;
    });
  }, [filteredAndSortedContacts]);

  const closeBulkModal = useCallback(() => {
    setBulkActionsOpen(false);
    setBulkError(null);
    setBulkBusy(false);
    setBulkResponsibleUserId('');
    setBulkDeleteConfirmStep(false);
    setBulkDeleteConfirmed(false);
  }, []);

  const runBatches = useCallback(async <T,>(items: T[], batchSize: number, worker: (item: T) => Promise<void>) => {
    const failed: T[] = [];
    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      // eslint-disable-next-line no-await-in-loop
      const results = await Promise.allSettled(batch.map(item => worker(item)));
      results.forEach((r, idx) => {
        if (r.status === 'rejected') failed.push(batch[idx]);
      });
    }
    return failed;
  }, []);

  const handleBulkReassign = useCallback(async () => {
    if (!userIsAdmin) return;
    const ids = Array.from(selectedContactIds);
    if (ids.length === 0) return;
    if (!bulkResponsibleUserId) {
      setBulkError('Selecciona un responsable para reasignar.');
      return;
    }

    setBulkBusy(true);
    setBulkError(null);
    try {
      const failed = await runBatches(ids, 5, async (id) => {
        await crmService.updateContact(id, { responsible_user_id: bulkResponsibleUserId });
      });
      await loadContactsRef.current();
      if (failed.length > 0) {
        setSelectedContactIds(new Set(failed));
        setBulkError(`Fallaron ${failed.length} de ${ids.length}. Reintenta o revisa permisos.`);
        setBulkBusy(false);
        return;
      }
      setSelectedContactIds(new Set<string>());
      closeBulkModal();
    } catch (err: any) {
      console.error('❌ [CRMContactList] Error en reasignación bulk:', err);
      setBulkError('Ocurrió un error reasignando responsables. Revisa consola para detalles.');
      setBulkBusy(false);
    }
  }, [userIsAdmin, selectedContactIds, bulkResponsibleUserId, runBatches, closeBulkModal]);

  const handleBulkDelete = useCallback(async () => {
    if (!userIsAdmin) return;
    const ids = Array.from(selectedContactIds);
    if (ids.length === 0) return;
    if (!bulkDeleteConfirmStep || !bulkDeleteConfirmed) {
      setBulkError('Confirma la eliminación antes de continuar.');
      return;
    }

    setBulkBusy(true);
    setBulkError(null);
    try {
      const failed = await runBatches(ids, 5, async (id) => {
        await crmService.deleteContact(id);
      });
      await loadContactsRef.current();
      if (failed.length > 0) {
        setSelectedContactIds(new Set(failed));
        setBulkError(`Fallaron ${failed.length} de ${ids.length}. Reintenta o revisa permisos.`);
        setBulkBusy(false);
        return;
      }
      setSelectedContactIds(new Set<string>());
      closeBulkModal();
    } catch (err: any) {
      console.error('❌ [CRMContactList] Error en eliminación bulk:', err);
      setBulkError('Ocurrió un error eliminando contactos. Revisa consola para detalles.');
      setBulkBusy(false);
    }
  }, [userIsAdmin, selectedContactIds, bulkDeleteConfirmStep, bulkDeleteConfirmed, runBatches, closeBulkModal]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setGradingLlamada('');
    setGradingSituacion('');
    setNacionalidad('');
    setNacionalidadFilter('todos');
    setResponsibleUserId(undefined);
    setEmpadronado('');
    setTieneIngresos('');
    setUltimaLlamadaDesde('');
    setUltimaLlamadaHasta('');
    setProximaLlamadaDesde('');
    setProximaLlamadaHasta('');
    setFechaModificacionDesde('');
    setFechaModificacionHasta('');
    setSortField('created_at');
    setSortOrder('desc');
    setPagination({ skip: 0, limit: pagination.limit });
  };

  const hasActiveFilters = searchTerm || gradingLlamada || gradingSituacion || nacionalidad || nacionalidadFilter !== 'todos' || responsibleUserId || empadronado || tieneIngresos || ultimaLlamadaDesde || ultimaLlamadaHasta || proximaLlamadaDesde || proximaLlamadaHasta || fechaModificacionDesde || fechaModificacionHasta;

  const getGradingVariant = (grading?: 'A' | 'B+' | 'B-' | 'C' | 'D'): "default" | "secondary" | "destructive" | "outline" | "success" | "warning" | "error" | "info" | "neutral" => {
    switch (grading) {
      case 'A': return 'success';
      case 'B+': return 'info';
      case 'B-': return 'warning';
      case 'C': return 'error';
      case 'D': return 'destructive';
      default: return 'neutral';
    }
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return <ArrowsUpDownIcon className="w-4 h-4 text-gray-400" />;
    }
    return sortOrder === 'asc' 
      ? <ArrowUpIcon className="w-4 h-4 text-primary" />
      : <ArrowDownIcon className="w-4 h-4 text-primary" />;
  };

  const uniqueNacionalidades = useMemo(() => {
    const nacionalidades = contacts
      .map(c => c.nacionalidad)
      .filter((n): n is string => Boolean(n));
    return Array.from(new Set(nacionalidades)).sort();
  }, [contacts]);

  // Estado para anchos de columnas redimensionables
  const [columnWidths, setColumnWidths] = useState<ColumnWidths>(() => {
    try {
      const saved = localStorage.getItem(COLUMN_WIDTHS_STORAGE_KEY);
      if (saved) {
        return { ...DEFAULT_COLUMN_WIDTHS, ...JSON.parse(saved) };
      }
    } catch (e) {
      console.warn('Error loading column widths from localStorage:', e);
    }
    return DEFAULT_COLUMN_WIDTHS;
  });
  
  // Estado para orden de columnas
  const defaultColumnOrder: ColumnKey[] = ['name', 'email', 'phone', 'nacionalidad', 'grading_llamada', 'grading_situacion', 'created_at', 'updated_at', 'ultima_llamada', 'proxima_llamada', 'acciones'];
  const [columnOrder, setColumnOrder] = useState<ColumnKey[]>(() => {
    try {
      const saved = localStorage.getItem(COLUMN_ORDER_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Validar que todos los campos estén presentes
        const allKeys = new Set(defaultColumnOrder);
        const savedKeys = new Set(parsed);
        if (allKeys.size === savedKeys.size && [...allKeys].every(k => savedKeys.has(k))) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Error loading column order from localStorage:', e);
    }
    return defaultColumnOrder;
  });
  
  // Estado para visibilidad de columnas
  const [columnVisibility, setColumnVisibility] = useState<Record<ColumnKey, boolean>>(() => {
    try {
      const saved = localStorage.getItem(COLUMN_VISIBILITY_STORAGE_KEY);
      if (saved) {
        return { ...Object.fromEntries(defaultColumnOrder.map(k => [k, true])) as Record<ColumnKey, boolean>, ...JSON.parse(saved) };
      }
    } catch (e) {
      console.warn('Error loading column visibility from localStorage:', e);
    }
    return Object.fromEntries(defaultColumnOrder.map(k => [k, true])) as Record<ColumnKey, boolean>;
  });
  
  const [showColumnSettings, setShowColumnSettings] = useState(false);
  
  // Nombres de las columnas para mostrar
  const columnLabels: Record<ColumnKey, string> = {
    name: 'Nombre',
    email: 'Email',
    phone: 'Teléfono',
    nacionalidad: 'Nacionalidad',
    grading_llamada: 'Grading Llamada',
    grading_situacion: 'Grading Situación',
    created_at: 'Fecha Creación',
    updated_at: 'Fecha Modificación',
    ultima_llamada: 'Última Llamada',
    proxima_llamada: 'Próxima Llamada',
    acciones: 'Acciones',
  };
  
  // Handler para cambiar visibilidad de columna
  const toggleColumnVisibility = (columnKey: ColumnKey) => {
    // No permitir ocultar todas las columnas
    const visibleCount = Object.values(columnVisibility).filter(v => v).length;
    if (visibleCount <= 1 && columnVisibility[columnKey]) {
      return;
    }
    setColumnVisibility(prev => ({ ...prev, [columnKey]: !prev[columnKey] }));
  };
  
  // Handler para mover columna arriba/abajo
  const moveColumn = (columnKey: ColumnKey, direction: 'up' | 'down') => {
    const currentIndex = columnOrder.indexOf(columnKey);
    if (currentIndex === -1) return;
    
    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= columnOrder.length) return;
    
    const newOrder = [...columnOrder];
    [newOrder[currentIndex], newOrder[newIndex]] = [newOrder[newIndex], newOrder[currentIndex]];
    setColumnOrder(newOrder);
  };
  
  // Resetear columnas a valores por defecto
  const resetColumns = () => {
    setColumnOrder(defaultColumnOrder);
    setColumnVisibility(Object.fromEntries(defaultColumnOrder.map(k => [k, true])) as Record<ColumnKey, boolean>);
    setColumnWidths(DEFAULT_COLUMN_WIDTHS);
  };
  
  // Guardar anchos de columnas en localStorage cuando cambian
  useEffect(() => {
    try {
      localStorage.setItem(COLUMN_WIDTHS_STORAGE_KEY, JSON.stringify(columnWidths));
    } catch (e) {
      console.warn('Error saving column widths to localStorage:', e);
    }
  }, [columnWidths]);
  
  // Guardar orden de columnas
  useEffect(() => {
    try {
      localStorage.setItem(COLUMN_ORDER_STORAGE_KEY, JSON.stringify(columnOrder));
    } catch (e) {
      console.warn('Error saving column order to localStorage:', e);
    }
  }, [columnOrder]);
  
  // Guardar visibilidad de columnas
  useEffect(() => {
    try {
      localStorage.setItem(COLUMN_VISIBILITY_STORAGE_KEY, JSON.stringify(columnVisibility));
    } catch (e) {
      console.warn('Error saving column visibility to localStorage:', e);
    }
  }, [columnVisibility]);

  // Calcular columnas visibles basándose en columnVisibility y columnOrder
  const visibleColumns = columnOrder.filter(col => columnVisibility[col] !== false);

  // Helper para renderizar header de columna
  const renderColumnHeader = (columnKey: ColumnKey) => {
    const labels: Record<ColumnKey, string> = {
      name: 'Nombre',
      email: 'Email',
      phone: 'Teléfono',
      nacionalidad: 'Nacionalidad',
      grading_llamada: 'Grading Llamada',
      grading_situacion: 'Grading Situación',
      created_at: 'Fecha Creación',
      updated_at: 'Fecha Modificación',
      ultima_llamada: 'Última Llamada',
      proxima_llamada: 'Próxima Llamada',
      acciones: 'Acciones',
    };

    const classNameMap: Record<ColumnKey, string> = {
      name: '',
      email: 'hidden lg:table-cell',
      phone: '',
      nacionalidad: 'hidden xl:table-cell',
      grading_llamada: 'hidden xl:table-cell',
      grading_situacion: 'hidden xl:table-cell',
      created_at: 'hidden lg:table-cell',
      updated_at: 'hidden lg:table-cell',
      ultima_llamada: 'hidden lg:table-cell',
      proxima_llamada: 'hidden lg:table-cell',
      acciones: 'text-right',
    };

    const sortableFields = ['name', 'email', 'phone', 'nacionalidad', 'grading_llamada', 'grading_situacion', 'created_at', 'updated_at', 'ultima_llamada', 'proxima_llamada'];
    const isSortable = sortableFields.includes(columnKey);

    if (columnKey === 'acciones') {
      return (
        <ResizableHeader key={columnKey} columnKey={columnKey} className={classNameMap[columnKey]}>
          {labels[columnKey]}
        </ResizableHeader>
      );
    }

    return (
      <ResizableHeader
        key={columnKey}
        columnKey={columnKey}
        onSort={isSortable ? () => handleSort(columnKey) : undefined}
        sortField={isSortable ? columnKey : undefined}
        className={classNameMap[columnKey]}
      >
        {labels[columnKey]}
      </ResizableHeader>
    );
  };

  // Helper para renderizar celda de columna (no usado actualmente - reservado para uso futuro)
  // @ts-expect-error - Función reservada para uso futuro
  const renderColumnCell = (contact: Contact, columnKey: ColumnKey) => {
    const classNameMap: Record<ColumnKey, string> = {
      name: 'px-3 sm:px-6 py-4 overflow-hidden',
      email: 'px-3 sm:px-6 py-4 hidden lg:table-cell overflow-hidden',
      phone: 'px-3 sm:px-6 py-4 overflow-hidden',
      nacionalidad: 'px-3 sm:px-6 py-4 hidden xl:table-cell overflow-hidden',
      grading_llamada: 'px-3 sm:px-6 py-4 hidden xl:table-cell',
      grading_situacion: 'px-3 sm:px-6 py-4 hidden xl:table-cell',
      created_at: 'px-3 sm:px-6 py-4 hidden lg:table-cell text-sm text-gray-600 overflow-hidden',
      updated_at: 'px-3 sm:px-6 py-4 hidden lg:table-cell text-sm text-gray-600 overflow-hidden',
      ultima_llamada: 'px-3 sm:px-6 py-4 hidden lg:table-cell text-sm text-gray-600 overflow-hidden',
      proxima_llamada: 'px-3 sm:px-6 py-4 hidden lg:table-cell text-sm text-gray-600 overflow-hidden',
      acciones: 'px-3 sm:px-6 py-4 text-right text-sm font-medium',
    };

    const style = { width: columnWidths[columnKey], maxWidth: columnWidths[columnKey] };

    switch (columnKey) {
      case 'name':
        return (
          <td key={columnKey} className={classNameMap[columnKey]} style={style}>
            <div className="flex items-center min-w-0">
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium text-gray-900 font-sans truncate" title={contact.name || `${contact.first_name} ${contact.last_name || ''}`.trim() || 'Sin nombre'}>
                  {contact.name || `${contact.first_name} ${contact.last_name || ''}`.trim() || 'Sin nombre'}
                </div>
              </div>
            </div>
          </td>
        );
      case 'email':
        return (
          <td key={columnKey} className={classNameMap[columnKey]} style={style}>
            <div className="flex items-center gap-2 text-sm text-gray-600 min-w-0">
              {contact.email ? (
                <>
                  <EnvelopeIcon className="w-4 h-4 flex-shrink-0" />
                  <span className="truncate min-w-0" title={contact.email}>{contact.email}</span>
                </>
              ) : (
                <span className="text-gray-400">—</span>
              )}
            </div>
          </td>
        );
      case 'phone':
        return (
          <td key={columnKey} className={classNameMap[columnKey]} style={style}>
            <div className="flex items-center gap-2 text-sm text-gray-600 min-w-0">
              {contact.phone ? (
                <>
                  <PhoneIcon className="w-4 h-4 flex-shrink-0" />
                  <span className="truncate min-w-0" title={contact.phone}>{contact.phone}</span>
                </>
              ) : (
                <span className="text-gray-400">—</span>
              )}
            </div>
          </td>
        );
      case 'nacionalidad':
        return (
          <td key={columnKey} className={classNameMap[columnKey]} style={style}>
            <div className="flex items-center gap-2 text-sm text-gray-600 min-w-0">
              {contact.nacionalidad ? (
                <>
                  <FlagIcon className="w-4 h-4 flex-shrink-0" />
                  <span className="truncate min-w-0" title={contact.nacionalidad}>{contact.nacionalidad}</span>
                </>
              ) : (
                <span className="text-gray-400">—</span>
              )}
            </div>
          </td>
        );
      case 'grading_llamada':
        return (
          <td key={columnKey} className={classNameMap[columnKey]} style={{ width: columnWidths[columnKey] }}>
            {contact.grading_llamada ? (
              <Badge variant={getGradingVariant(contact.grading_llamada)} className="text-xs">
                {contact.grading_llamada}
              </Badge>
            ) : (
              <span className="text-gray-400">—</span>
            )}
          </td>
        );
      case 'grading_situacion':
        return (
          <td key={columnKey} className={classNameMap[columnKey]} style={{ width: columnWidths[columnKey] }}>
            {contact.grading_situacion ? (
              <Badge variant={getGradingVariant(contact.grading_situacion)} className="text-xs">
                {contact.grading_situacion}
              </Badge>
            ) : (
              <span className="text-gray-400">—</span>
            )}
          </td>
        );
      case 'created_at':
        return (
          <td key={columnKey} className={classNameMap[columnKey]} style={style}>
            <div className="flex items-center gap-2 min-w-0">
              <CalendarIcon className="w-4 h-4 flex-shrink-0" />
              <span className="truncate min-w-0" title={formatDate(contact.created_at)}>{formatDate(contact.created_at)}</span>
            </div>
          </td>
        );
      case 'updated_at':
        return (
          <td key={columnKey} className={classNameMap[columnKey]} style={style}>
            <div className="flex items-center gap-2 min-w-0">
              <CalendarIcon className="w-4 h-4 text-blue-600 flex-shrink-0" />
              <span className="truncate min-w-0" title={formatDate(contact.updated_at)}>{formatDate(contact.updated_at)}</span>
            </div>
          </td>
        );
      case 'ultima_llamada':
        return (
          <td key={columnKey} className={classNameMap[columnKey]} style={style}>
            {contact.ultima_llamada_fecha ? (
              <div className="flex items-center gap-2 min-w-0">
                <PhoneIcon className="w-4 h-4 flex-shrink-0" />
                <span className="truncate min-w-0" title={formatDate(contact.ultima_llamada_fecha)}>{formatDate(contact.ultima_llamada_fecha)}</span>
              </div>
            ) : (
              <span className="text-gray-400">—</span>
            )}
          </td>
        );
      case 'proxima_llamada':
        return (
          <td key={columnKey} className={classNameMap[columnKey]} style={style}>
            {contact.proxima_llamada_fecha ? (
              <div className="flex items-center gap-2 min-w-0">
                <CalendarIcon className="w-4 h-4 text-blue-600 flex-shrink-0" />
                <span className={`truncate min-w-0 ${new Date(contact.proxima_llamada_fecha).getTime() < new Date().getTime() ? 'text-red-600 font-semibold' : ''}`} title={formatDate(contact.proxima_llamada_fecha)}>
                  {formatDate(contact.proxima_llamada_fecha)}
                </span>
              </div>
            ) : (
              <span className="text-gray-400">—</span>
            )}
          </td>
        );
      case 'acciones':
        return (
          <td key={columnKey} className={classNameMap[columnKey]} style={{ width: columnWidths[columnKey] }}>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/crm/contacts/${contact.id}`);
              }}
            >
              Ver
              <ChevronRightIcon className="w-4 h-4 ml-1" />
            </Button>
          </td>
        );
      default:
        return null;
    }
  };

  // Handlers para redimensionamiento de columnas
  const handleResizeStart = useRef<(columnKey: ColumnKey, startX: number, startWidth: number) => void>(() => {});
  
  useEffect(() => {
    handleResizeStart.current = (columnKey: ColumnKey, startX: number, startWidth: number) => {
      const handleMouseMove = (moveEvent: MouseEvent) => {
        const diff = moveEvent.clientX - startX;
        const newWidth = Math.max(80, startWidth + diff); // Mínimo 80px
        setColumnWidths(prev => ({ ...prev, [columnKey]: newWidth }));
      };
      
      const handleMouseUp = () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
      
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    };
  }, []);
  
  const onResizeStart = (columnKey: ColumnKey, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    handleResizeStart.current(columnKey, e.clientX, columnWidths[columnKey]);
  };

  // Componente para header de columna redimensionable
  const ResizableHeader = ({ 
    columnKey, 
    children, 
    onSort, 
    sortField, 
    className = '' 
  }: { 
    columnKey: ColumnKey; 
    children: React.ReactNode; 
    onSort?: () => void; 
    sortField?: SortField;
    className?: string;
  }) => (
    <th
      className={`px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-sans relative overflow-hidden ${onSort ? 'cursor-pointer hover:bg-gray-100' : ''} ${className}`}
      style={{ width: columnWidths[columnKey], maxWidth: columnWidths[columnKey], minWidth: 80 }}
      onClick={onSort}
    >
      <div className="flex items-center gap-2 min-w-0">
        <span className="truncate min-w-0 flex-1">{children}</span>
        {onSort && <SortIcon field={sortField!} />}
      </div>
      <div
        className="absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-blue-500 transition-colors bg-transparent"
        onMouseDown={(e) => onResizeStart(columnKey, e)}
        style={{ zIndex: 10 }}
        title="Arrastra para redimensionar"
      />
    </th>
  );

  return (
    <div className="w-full">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-display font-bold text-gray-900">Contactos</h1>
            {user?.role === 'agent' ? (
              <p className="text-gray-600 mt-1 text-xs sm:text-sm md:text-base font-sans">
                {filteredAndSortedContacts.length} {filteredAndSortedContacts.length === 1 ? 'contacto' : 'contactos'} mostrados
              </p>
            ) : (
              <p className="text-gray-600 mt-1 text-xs sm:text-sm md:text-base font-sans">
                {totalContacts} {totalContacts === 1 ? 'contacto' : 'contactos'} total{filteredAndSortedContacts.length < totalContacts ? ` (mostrando ${filteredAndSortedContacts.length} de ${totalContacts})` : ''}
              </p>
            )}
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            {viewMode === 'table' && (
              <Button
                variant="outline"
                onClick={() => setShowColumnSettings(true)}
                title="Configurar columnas"
                className="flex-1 sm:flex-initial text-sm sm:text-base h-9 sm:h-10"
              >
                <CogIcon className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-2" />
                <span className="sm:inline">Columnas</span>
              </Button>
            )}
            {userIsAdmin && viewMode === 'table' && (
              <Button
                variant="outline"
                onClick={() => setBulkActionsOpen(true)}
                disabled={selectedCount === 0}
                title={selectedCount === 0 ? 'Selecciona contactos para habilitar acciones' : 'Acciones masivas'}
                className="flex-1 sm:flex-initial text-sm sm:text-base h-9 sm:h-10"
              >
                <EllipsisVerticalIcon className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-2" />
                <span className="sm:inline">Acciones</span>
                {selectedCount > 0 && (
                  <span className="ml-2 bg-primary text-primary-foreground rounded-full px-2 py-0.5 text-[10px] sm:text-xs">
                    {selectedCount}
                  </span>
                )}
              </Button>
            )}
            <Button
              variant="outline"
              onClick={() => setViewMode(viewMode === 'table' ? 'cards' : 'table')}
              title={viewMode === 'table' ? 'Vista de tarjetas' : 'Vista de tabla'}
              className="flex-1 sm:flex-initial text-sm sm:text-base h-9 sm:h-10"
            >
              {viewMode === 'table' ? <Squares2X2Icon className="w-3 h-3 sm:w-4 sm:h-4" /> : <ListBulletIcon className="w-3 h-3 sm:w-4 sm:h-4" />}
              <span className="ml-1 sm:ml-2 sm:hidden">Vista</span>
            </Button>
            <Button
              onClick={() => navigate('/crm/contacts/new')}
              className="flex-1 sm:flex-initial text-sm sm:text-base h-9 sm:h-10"
            >
              <PlusIcon className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-2" />
              <span className="sm:inline">Nuevo Contacto</span>
            </Button>
          </div>
        </div>

        <Card className="mb-4 sm:mb-6">
          <CardContent className="pt-3 sm:pt-4 md:pt-6">
            <div className="flex flex-col gap-3 sm:gap-4">
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 md:gap-4">
                <div className="flex-1 relative">
                  <MagnifyingGlassIcon className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
                  <Input
                    ref={searchInputRef}
                    placeholder="Buscar por nombre, email, teléfono..."
                    className="pl-8 sm:pl-10 pr-3 sm:pr-4 text-xs sm:text-sm md:text-base h-9 sm:h-10"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowFilters(!showFilters)}
                    className="flex-1 sm:flex-initial text-sm sm:text-base h-9 sm:h-10"
                  >
                    <FunnelIcon className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-2" />
                    <span className="sm:inline">Filtros</span>
                    {hasActiveFilters && (
                      <span className="ml-1 sm:ml-2 bg-primary text-primary-foreground rounded-full w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center text-[10px] sm:text-xs">
                        {[searchTerm, gradingLlamada, gradingSituacion, nacionalidad, nacionalidadFilter !== 'todos' ? 'nacionalidad' : '', responsibleUserId, empadronado, tieneIngresos, ultimaLlamadaDesde, ultimaLlamadaHasta, proximaLlamadaDesde, proximaLlamadaHasta, fechaModificacionDesde, fechaModificacionHasta].filter(Boolean).length}
                      </span>
                    )}
                  </Button>
                  {hasActiveFilters && (
                    <Button
                      variant="outline"
                      onClick={clearFilters}
                      className="text-red-600 hover:text-red-700 text-sm sm:text-base h-9 sm:h-10 px-2 sm:px-3"
                    >
                      <XMarkIcon className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-2" />
                      <span className="hidden sm:inline">Limpiar</span>
                    </Button>
                  )}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
                  <Switch
                    id="crm-my-contacts-switch"
                    checked={isMyContacts}
                    onCheckedChange={handleMyContactsToggle}
                    disabled={!currentUserId}
                  />
                  <Label htmlFor="crm-my-contacts-switch" className="cursor-pointer">
                    Solo mis contactos
                  </Label>
                </div>
                <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
                  <Switch
                    id="crm-nacionalidad-filter-switch"
                    checked={nacionalidadFilter === 'nacionalidad'}
                    onCheckedChange={(checked) => {
                      setNacionalidadFilter(checked ? 'nacionalidad' : 'todos');
                      // Limpiar el select de nacionalidad cuando se activa el filtro de nacionalidad
                      if (checked) {
                        setNacionalidad('');
                      }
                    }}
                  />
                  <Label htmlFor="crm-nacionalidad-filter-switch" className="cursor-pointer">
                    Solo nacionalidad
                  </Label>
                </div>
              </div>

              {showFilters && (
                <div className="pt-3 sm:pt-4 border-t space-y-3 sm:space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                    {/* Filtros ... */}
                    {/* Los selects se pueden mejorar con componentes de Select de UI en el futuro */}
                    <div>
                      <Label className="text-sm font-medium text-gray-700 mb-2 block">
                        Grading Llamada
                      </Label>
                      <select
                        value={gradingLlamada}
                        onChange={(e) => setGradingLlamada(e.target.value as any)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary h-[44px]"
                      >
                        <option value="">Todos</option>
                        <option value="A">A</option>
                        <option value="B+">B+</option>
                        <option value="B-">B-</option>
                        <option value="C">C</option>
                        <option value="D">D (Descartar)</option>
                      </select>
                    </div>

                    <div>
                      <Label className="text-sm font-medium text-gray-700 mb-2 block">
                        Grading Situación
                      </Label>
                      <select
                        value={gradingSituacion}
                        onChange={(e) => setGradingSituacion(e.target.value as any)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary h-[44px]"
                      >
                        <option value="">Todos</option>
                        <option value="A">A</option>
                        <option value="B+">B+</option>
                        <option value="B-">B-</option>
                        <option value="C">C</option>
                        <option value="D">D (Descartar)</option>
                      </select>
                    </div>

                    <div>
                      <Label className="text-sm font-medium text-gray-700 mb-2 block">
                        Nacionalidad
                      </Label>
                      <select
                        value={nacionalidad}
                        onChange={(e) => {
                          setNacionalidad(e.target.value);
                          // Si se selecciona una nacionalidad específica, desactivar el filtro de nacionalidad
                          if (e.target.value) {
                            setNacionalidadFilter('todos');
                          }
                        }}
                        disabled={nacionalidadFilter === 'nacionalidad'}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary h-[44px] disabled:bg-gray-100 disabled:cursor-not-allowed"
                      >
                        <option value="">Todas</option>
                        {uniqueNacionalidades.map(nac => (
                          <option key={nac} value={nac}>{nac}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <Label className="text-sm font-medium text-gray-700 mb-2 block">
                        Responsable
                      </Label>
                      <select
                        value={responsibleUserId || ''}
                        onChange={(e) => setResponsibleUserId(e.target.value || undefined)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary h-[44px]"
                      >
                        <option value="">Todos</option>
                        {users.map(user => {
                          const displayName = user.name?.trim() || user.email || `Usuario ${user.id?.slice(0, 8)}`;
                          return (
                            <option key={user.id} value={user.id}>
                              {displayName}
                            </option>
                          );
                        })}
                      </select>
                    </div>

                    <div>
                      <Label className="text-sm font-medium text-gray-700 mb-2 block">
                        Empadronado
                      </Label>
                      <select
                        value={empadronado}
                        onChange={(e) => setEmpadronado(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary h-[44px]"
                      >
                        <option value="">Todos</option>
                        <option value="true">Sí</option>
                        <option value="false">No</option>
                      </select>
                    </div>

                    <div>
                      <Label className="text-sm font-medium text-gray-700 mb-2 block">
                        Tiene Ingresos
                      </Label>
                      <select
                        value={tieneIngresos}
                        onChange={(e) => setTieneIngresos(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary h-[44px]"
                      >
                        <option value="">Todos</option>
                        <option value="true">Sí</option>
                        <option value="false">No</option>
                      </select>
                    </div>

                    <div>
                      <Label className="text-sm font-medium text-gray-700 mb-2 block">
                        Última Llamada Desde
                      </Label>
                      <Input
                        type="date"
                        value={ultimaLlamadaDesde}
                        onChange={(e) => setUltimaLlamadaDesde(e.target.value)}
                        className="w-full h-[44px]"
                      />
                    </div>

                    <div>
                      <Label className="text-sm font-medium text-gray-700 mb-2 block">
                        Última Llamada Hasta
                      </Label>
                      <Input
                        type="date"
                        value={ultimaLlamadaHasta}
                        onChange={(e) => setUltimaLlamadaHasta(e.target.value)}
                        className="w-full h-[44px]"
                      />
                    </div>

                    <div>
                      <Label className="text-sm font-medium text-gray-700 mb-2 block">
                        Próxima Llamada Desde
                      </Label>
                      <Input
                        type="date"
                        value={proximaLlamadaDesde}
                        onChange={(e) => setProximaLlamadaDesde(e.target.value)}
                        className="w-full h-[44px]"
                      />
                    </div>

                    <div>
                      <Label className="text-sm font-medium text-gray-700 mb-2 block">
                        Próxima Llamada Hasta
                      </Label>
                      <Input
                        type="date"
                        value={proximaLlamadaHasta}
                        onChange={(e) => setProximaLlamadaHasta(e.target.value)}
                        className="w-full h-[44px]"
                      />
                    </div>

                    <div>
                      <Label className="text-sm font-medium text-gray-700 mb-2 block">
                        Fecha Modificación Desde
                      </Label>
                      <Input
                        type="date"
                        value={fechaModificacionDesde}
                        onChange={(e) => setFechaModificacionDesde(e.target.value)}
                        className="w-full h-[44px]"
                      />
                    </div>

                    <div>
                      <Label className="text-sm font-medium text-gray-700 mb-2 block">
                        Fecha Modificación Hasta
                      </Label>
                      <Input
                        type="date"
                        value={fechaModificacionHasta}
                        onChange={(e) => setFechaModificacionHasta(e.target.value)}
                        className="w-full h-[44px]"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Controles de Paginación Superior */}
        {!loading && (user?.role === 'agent' ? filteredAndSortedContacts.length > 0 : totalContacts > 0) && (
          <Card className="mb-4">
            <CardContent className="pt-4 pb-4">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  {user?.role === 'agent' ? (
                    <div className="text-sm text-gray-600">
                      Mostrando {pagination.skip + 1} - {Math.min(pagination.skip + pagination.limit, filteredAndSortedContacts.length)} de {filteredAndSortedContacts.length}
                    </div>
                  ) : (
                    <div className="text-sm text-gray-600">
                      Mostrando {pagination.skip + 1} - {Math.min(pagination.skip + pagination.limit, totalContacts)} de {totalContacts}
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Label htmlFor="items-per-page-top" className="text-sm text-gray-600 whitespace-nowrap">
                      Por página:
                    </Label>
                    <select
                      id="items-per-page-top"
                      value={pagination.limit}
                      onChange={(e) => {
                        const newLimit = parseInt(e.target.value);
                        setPagination({ skip: 0, limit: newLimit });
                      }}
                      className="px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="25">25</option>
                      <option value="50">50</option>
                      <option value="100">100</option>
                      <option value="200">200</option>
                    </select>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPagination({ ...pagination, skip: Math.max(0, pagination.skip - pagination.limit) })}
                    disabled={pagination.skip === 0}
                  >
                    <ChevronLeftIcon className="w-4 h-4 mr-1" />
                    <span className="hidden sm:inline">Anterior</span>
                  </Button>
                  {user?.role === 'agent' ? (
                    <span className="text-sm text-gray-600 px-3 min-w-[100px] text-center">
                      Página {Math.floor(pagination.skip / pagination.limit) + 1} de {Math.ceil(filteredAndSortedContacts.length / pagination.limit)}
                    </span>
                  ) : (
                    <span className="text-sm text-gray-600 px-3 min-w-[100px] text-center">
                      Página {Math.floor(pagination.skip / pagination.limit) + 1} de {Math.ceil(totalContacts / pagination.limit)}
                    </span>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const newSkip = pagination.skip + pagination.limit;
                      setPagination({ ...pagination, skip: newSkip });
                    }}
                    disabled={user?.role === 'agent' ? pagination.skip + pagination.limit >= filteredAndSortedContacts.length : pagination.skip + pagination.limit >= totalContacts}
                  >
                    <span className="hidden sm:inline">Siguiente</span>
                    <ChevronRightIcon className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-gray-600">Cargando contactos...</p>
          </div>
        ) : viewMode === 'table' ? (
          <>
            <div className="block md:hidden space-y-4">
              {filteredAndSortedContacts.map((contact) => (
                <ContactCard
                  key={contact.id}
                  contact={contact}
                />
              ))}
            </div>
            
            <Card className="hidden md:block">
              <CardContent className="p-0">
                <div className="overflow-x-auto -mx-4 sm:mx-0">
                  <div className="inline-block min-w-full align-middle">
                    <div className="overflow-hidden">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            {userIsAdmin && (
                              <th
                                className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-sans"
                                style={{ width: 56, minWidth: 56 }}
                              >
                                <input
                                  ref={selectAllRef}
                                  type="checkbox"
                                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                  checked={allInViewSelected}
                                  disabled={filteredAndSortedContacts.length === 0 || bulkBusy}
                                  onChange={(e) => toggleSelectAllVisible(e.target.checked)}
                                  aria-label={allInViewSelected ? 'Deseleccionar todos' : 'Seleccionar todos'}
                                />
                              </th>
                            )}
                            {visibleColumns.map(columnKey => renderColumnHeader(columnKey))}
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {filteredAndSortedContacts.map((contact) => (
                            <ContactTableRow
                              key={contact.id}
                              contact={contact}
                              visibleColumns={visibleColumns}
                              showSelection={userIsAdmin}
                              isSelected={selectedContactIds.has(contact.id)}
                              selectionDisabled={bulkBusy}
                              onToggleSelected={(checked) => toggleContactSelected(contact.id, checked)}
                            />
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredAndSortedContacts.map((contact) => (
              <Card
                key={contact.id}
                className="hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => navigate(`/crm/contacts/${contact.id}`)}
              >
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-1 font-display">
                        {contact.name || `${contact.first_name} ${contact.last_name || ''}`.trim()}
                      </h3>
                      {contact.email && (
                        <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                          <EnvelopeIcon className="w-4 h-4" />
                          <span className="truncate">{contact.email}</span>
                        </div>
                      )}
                      {contact.phone && (
                        <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                          <PhoneIcon className="w-4 h-4" />
                          <span>{contact.phone}</span>
                        </div>
                      )}
                    </div>
                    <ChevronRightIcon className="w-5 h-5 text-gray-400" />
                  </div>

                  <div className="space-y-2">
                    {contact.nacionalidad && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <FlagIcon className="w-4 h-4" />
                        <span>{contact.nacionalidad}</span>
                      </div>
                    )}

                    {contact.lugar_residencia && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <MapPinIcon className="w-4 h-4" />
                        <span>{contact.lugar_residencia}</span>
                      </div>
                    )}

                    <div className="flex items-center gap-2 pt-2">
                      {contact.grading_llamada && (
                        <Badge variant={getGradingVariant(contact.grading_llamada)} className="text-xs">
                          <StarIcon className="w-3 h-3 inline mr-1" />
                          Llamada: {contact.grading_llamada}
                        </Badge>
                      )}
                      {contact.grading_situacion && (
                        <Badge variant={getGradingVariant(contact.grading_situacion)} className="text-xs">
                          <StarIcon className="w-3 h-3 inline mr-1" />
                          Situación: {contact.grading_situacion}
                        </Badge>
                      )}
                    </div>

                    {contact.tiempo_espana && (
                      <p className="text-xs text-gray-500 mt-2 font-sans">
                        En España: {contact.tiempo_espana}
                      </p>
                    )}

                    <div className="pt-2 border-t space-y-1.5 mt-3">
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <CalendarIcon className="w-3 h-3" />
                        <span>Creación: {formatDate(contact.created_at)}</span>
                      </div>
                      {contact.ultima_llamada_fecha && (
                        <div className="flex items-center gap-2 text-xs text-gray-600">
                          <PhoneIcon className="w-3 h-3" />
                          <span>Última llamada: {formatDate(contact.ultima_llamada_fecha)}</span>
                        </div>
                      )}
                      {contact.proxima_llamada_fecha && (
                        <div className="flex items-center gap-2 text-xs text-gray-600">
                          <CalendarIcon className={`w-3 h-3 ${new Date(contact.proxima_llamada_fecha).getTime() < new Date().getTime() ? 'text-red-600' : 'text-blue-600'}`} />
                          <span className={new Date(contact.proxima_llamada_fecha).getTime() < new Date().getTime() ? 'text-red-600 font-semibold' : ''}>
                            Próxima llamada: {formatDate(contact.proxima_llamada_fecha)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {filteredAndSortedContacts.length === 0 && !loading && (
          <Card>
            <CardContent className="py-12 text-center">
              <UsersIcon className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p className="text-gray-500 mb-2">No se encontraron contactos</p>
              {userIsAgent && (
                <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg max-w-2xl mx-auto">
                  <p className="text-sm text-yellow-800 mb-2">
                    <strong>⚠️ Información para agentes:</strong>
                  </p>
                  <p className="text-sm text-yellow-700 mb-2">
                    Si eres un agente y no ves contactos, puede ser porque:
                  </p>
                  <ul className="text-sm text-yellow-700 text-left list-disc list-inside space-y-1 mb-2">
                    <li>No tienes oportunidades asignadas</li>
                    <li>El backend está filtrando contactos por oportunidades asignadas</li>
                    <li>Los contactos no tienen oportunidades asociadas</li>
                  </ul>
                  <p className="text-xs text-yellow-600 mt-3">
                    Revisa la consola del navegador (F12) para ver los logs de diagnóstico.
                  </p>
                </div>
              )}
              {hasActiveFilters && (
                <Button
                  variant="outline"
                  onClick={clearFilters}
                  className="mt-4"
                >
                  Limpiar filtros
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* Controles de Paginación */}
        {!loading && (user?.role === 'agent' ? filteredAndSortedContacts.length > 0 : totalContacts > 0) && (
          <Card className="mt-4">
            <CardContent className="pt-4 pb-4">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  {user?.role === 'agent' ? (
                    <div className="text-sm text-gray-600">
                      Mostrando {pagination.skip + 1} - {Math.min(pagination.skip + pagination.limit, filteredAndSortedContacts.length)} de {filteredAndSortedContacts.length}
                    </div>
                  ) : (
                    <div className="text-sm text-gray-600">
                      Mostrando {pagination.skip + 1} - {Math.min(pagination.skip + pagination.limit, totalContacts)} de {totalContacts}
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Label htmlFor="items-per-page" className="text-sm text-gray-600 whitespace-nowrap">
                      Por página:
                    </Label>
                    <select
                      id="items-per-page"
                      value={pagination.limit}
                      onChange={(e) => {
                        const newLimit = parseInt(e.target.value);
                        setPagination({ skip: 0, limit: newLimit });
                      }}
                      className="px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="25">25</option>
                      <option value="50">50</option>
                      <option value="100">100</option>
                      <option value="200">200</option>
                    </select>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPagination({ ...pagination, skip: Math.max(0, pagination.skip - pagination.limit) })}
                    disabled={pagination.skip === 0}
                  >
                    <ChevronLeftIcon className="w-4 h-4 mr-1" />
                    Anterior
                  </Button>
                  {user?.role === 'agent' ? (
                    <span className="text-sm text-gray-600 px-3 min-w-[100px] text-center">
                      Página {Math.floor(pagination.skip / pagination.limit) + 1} de {Math.ceil(filteredAndSortedContacts.length / pagination.limit)}
                    </span>
                  ) : (
                    <span className="text-sm text-gray-600 px-3 min-w-[100px] text-center">
                      Página {Math.floor(pagination.skip / pagination.limit) + 1} de {Math.ceil(totalContacts / pagination.limit)}
                    </span>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const newSkip = pagination.skip + pagination.limit;
                      setPagination({ ...pagination, skip: newSkip });
                    }}
                    disabled={user?.role === 'agent' ? pagination.skip + pagination.limit >= filteredAndSortedContacts.length : pagination.skip + pagination.limit >= totalContacts}
                  >
                    Siguiente
                    <ChevronRightIcon className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      
      {/* Modal de configuración de columnas */}
      <Modal
        open={showColumnSettings}
        onClose={() => setShowColumnSettings(false)}
        title="Configurar Columnas"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600 mb-4">
            Personaliza qué columnas mostrar y en qué orden. Arrastra las columnas para reordenarlas.
          </p>
          
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {columnOrder.map((columnKey, index) => (
              <div
                key={columnKey}
                className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                <div className="flex items-center gap-3 flex-1">
                  <div className="flex flex-col gap-1">
                    <button
                      type="button"
                      onClick={() => moveColumn(columnKey, 'up')}
                      disabled={index === 0}
                      className="disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <ArrowUpIcon className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveColumn(columnKey, 'down')}
                      disabled={index === columnOrder.length - 1}
                      className="disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <ArrowDownIcon className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                    </button>
                  </div>
                  <EllipsisVerticalIcon className="w-4 h-4 text-gray-400" />
                  <span className="flex-1 font-medium text-gray-900">{columnLabels[columnKey]}</span>
                </div>
                <Switch
                  checked={columnVisibility[columnKey]}
                  onCheckedChange={() => toggleColumnVisibility(columnKey)}
                  disabled={Object.values(columnVisibility).filter(v => v).length <= 1 && columnVisibility[columnKey]}
                />
              </div>
            ))}
          </div>
          
          <div className="flex justify-between pt-4 border-t">
            <Button
              variant="outline"
              onClick={resetColumns}
            >
              Restaurar valores por defecto
            </Button>
            <Button
              onClick={() => setShowColumnSettings(false)}
            >
              Aplicar
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal de acciones masivas (solo admin/superuser) */}
      <Modal
        open={bulkActionsOpen}
        onClose={() => {
          if (bulkBusy) return;
          closeBulkModal();
        }}
        title="Acciones masivas"
        size="md"
      >
        <div className="space-y-4">
          <div className="text-sm text-gray-600">
            Seleccionados: <span className="font-semibold text-gray-900">{selectedCount}</span>
          </div>

          {bulkError && (
            <div className="p-3 rounded-lg border border-red-200 bg-red-50 text-sm text-red-700">
              {bulkError}
            </div>
          )}

          <div className="p-4 rounded-lg border border-gray-200 space-y-3">
            <div className="text-sm font-semibold text-gray-900">Reasignar responsable</div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Nuevo responsable</Label>
              <select
                value={bulkResponsibleUserId}
                onChange={(e) => setBulkResponsibleUserId(e.target.value)}
                disabled={bulkBusy}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary h-[44px] disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                <option value="">Selecciona un usuario</option>
                {users.map(u => {
                  const displayName = u.name?.trim() || u.email || `Usuario ${u.id?.slice(0, 8)}`;
                  return (
                    <option key={u.id} value={u.id}>
                      {displayName}
                    </option>
                  );
                })}
              </select>
            </div>
            <Button
              onClick={handleBulkReassign}
              disabled={bulkBusy || selectedCount === 0 || !bulkResponsibleUserId}
              className="w-full"
            >
              Aplicar reasignación
            </Button>
          </div>

          <div className="p-4 rounded-lg border border-red-200 bg-red-50/40 space-y-3">
            <div className="text-sm font-semibold text-red-800">Eliminar contactos</div>
            {!bulkDeleteConfirmStep ? (
              <Button
                variant="destructive"
                onClick={() => {
                  setBulkError(null);
                  setBulkDeleteConfirmStep(true);
                }}
                disabled={bulkBusy || selectedCount === 0}
                className="w-full"
              >
                <TrashIcon className="w-4 h-4 mr-2" />
                Eliminar seleccionados
              </Button>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-red-800">
                  Esta acción intentará eliminar <span className="font-semibold">{selectedCount}</span> contactos. No se puede deshacer.
                </p>
                <label className="flex items-center gap-2 text-sm text-red-800">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-red-300 text-red-600 focus:ring-red-500"
                    checked={bulkDeleteConfirmed}
                    disabled={bulkBusy}
                    onChange={(e) => setBulkDeleteConfirmed(e.target.checked)}
                  />
                  Entiendo y quiero eliminar estos contactos.
                </label>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setBulkDeleteConfirmStep(false);
                      setBulkDeleteConfirmed(false);
                      setBulkError(null);
                    }}
                    disabled={bulkBusy}
                    className="flex-1"
                  >
                    Cancelar
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleBulkDelete}
                    disabled={bulkBusy || !bulkDeleteConfirmed}
                    className="flex-1"
                  >
                    Confirmar eliminación
                  </Button>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => setSelectedContactIds(new Set<string>())}
              disabled={bulkBusy || selectedCount === 0}
            >
              Limpiar selección
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                if (bulkBusy) return;
                closeBulkModal();
              }}
            >
              Cerrar
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
