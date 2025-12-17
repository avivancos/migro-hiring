// CRM Contact List - Lista de contactos con filtros, ordenamiento y búsqueda avanzada (estilo ActiveCampaign)

import { useEffect, useState, useRef, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { crmService } from '@/services/crmService';
import type { KommoContact, ContactFilters, CRMUser } from '@/types/crm';
import {
  Search,
  Plus,
  Users,
  Phone,
  Mail,
  MapPin,
  Flag,
  Star,
  Filter,
  ChevronRight,
  ChevronLeft,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Grid3x3,
  List,
  X,
  Calendar,
  Settings2,
  GripVertical,
} from 'lucide-react';
import { useAuth } from '@/providers/AuthProvider';
import { Modal } from '@/components/common/Modal';
import { Switch } from '@/components/ui/switch';

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
  const { isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(true);
  const [contacts, setContacts] = useState<KommoContact[]>([]);
  const [users, setUsers] = useState<CRMUser[]>([]);
  const [totalContacts, setTotalContacts] = useState(0);
  
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
  const getGradingFromUrl = (param: string | null): 'A' | 'B+' | 'B-' | 'C' | '' => {
    if (param === 'A' || param === 'B+' || param === 'B-' || param === 'C') {
      return param;
    }
    return '';
  };
  
  const [gradingLlamada, setGradingLlamada] = useState<'A' | 'B+' | 'B-' | 'C' | ''>(getGradingFromUrl(searchParams.get('grading_llamada')));
  const [gradingSituacion, setGradingSituacion] = useState<'A' | 'B+' | 'B-' | 'C' | ''>(getGradingFromUrl(searchParams.get('grading_situacion')));
  const [nacionalidad, setNacionalidad] = useState(searchParams.get('nacionalidad') || '');
  const [responsibleUserId, setResponsibleUserId] = useState(searchParams.get('responsible_user_id') || '');
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
  
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    crmService.getUsers(true).then(setUsers).catch(() => setUsers([]));
  }, []);

  useEffect(() => {
    const params = new URLSearchParams();
    if (searchTerm) params.set('search', searchTerm);
    if (gradingLlamada) params.set('grading_llamada', gradingLlamada);
    if (gradingSituacion) params.set('grading_situacion', gradingSituacion);
    if (nacionalidad) params.set('nacionalidad', nacionalidad);
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
    
    setSearchParams(params, { replace: true });
  }, [searchTerm, gradingLlamada, gradingSituacion, nacionalidad, responsibleUserId, empadronado, tieneIngresos, ultimaLlamadaDesde, ultimaLlamadaHasta, proximaLlamadaDesde, proximaLlamadaHasta, fechaModificacionDesde, fechaModificacionHasta, sortField, sortOrder, viewMode, pagination.skip, pagination.limit]);

  // Resetear paginación cuando cambian los filtros (excepto cuando cambia explícitamente la paginación)
  const prevFiltersRef = useRef({ searchTerm, gradingLlamada, gradingSituacion, nacionalidad, responsibleUserId, empadronado, tieneIngresos, ultimaLlamadaDesde, ultimaLlamadaHasta, proximaLlamadaDesde, proximaLlamadaHasta, sortField, sortOrder });
  
  useEffect(() => {
    const currentFilters = { searchTerm, gradingLlamada, gradingSituacion, nacionalidad, responsibleUserId, empadronado, tieneIngresos, ultimaLlamadaDesde, ultimaLlamadaHasta, proximaLlamadaDesde, proximaLlamadaHasta, sortField, sortOrder };
    const filtersChanged = JSON.stringify(prevFiltersRef.current) !== JSON.stringify(currentFilters);
    
    if (filtersChanged && pagination.skip !== 0) {
      // Resetear a la primera página cuando cambian los filtros
      setPagination(prev => ({ ...prev, skip: 0 }));
    }
    
    prevFiltersRef.current = currentFilters;
  }, [searchTerm, gradingLlamada, gradingSituacion, nacionalidad, responsibleUserId, empadronado, tieneIngresos, ultimaLlamadaDesde, ultimaLlamadaHasta, proximaLlamadaDesde, proximaLlamadaHasta, sortField, sortOrder]);

  useEffect(() => {
    if (isAuthenticated) {
      loadContacts();
    }
  }, [isAuthenticated, searchTerm, gradingLlamada, gradingSituacion, nacionalidad, responsibleUserId, empadronado, tieneIngresos, ultimaLlamadaDesde, ultimaLlamadaHasta, proximaLlamadaDesde, proximaLlamadaHasta, sortField, sortOrder, pagination.skip, pagination.limit]);

  useEffect(() => {
    const searchFromUrl = searchParams.get('search');
    if (searchFromUrl) {
      const decoded = decodeURIComponent(searchFromUrl.replace(/\+/g, ' '));
      if (decoded !== searchTerm) {
        setSearchTerm(decoded);
        setTimeout(() => {
          searchInputRef.current?.focus();
          searchInputRef.current?.select();
        }, 300);
      }
    }
  }, [searchParams]);

  // Función helper para enriquecer un contacto con información de llamadas
  const enrichContactWithCallInfo = async (contact: KommoContact): Promise<KommoContact> => {
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

  const loadContacts = async () => {
    setLoading(true);
    try {
      const filters: ContactFilters = {
        skip: pagination.skip,
        limit: pagination.limit,
      };
      
      if (searchTerm) filters.search = searchTerm;
      if (gradingLlamada) filters.grading_llamada = gradingLlamada as 'A' | 'B+' | 'B-' | 'C';
      if (gradingSituacion) filters.grading_situacion = gradingSituacion as 'A' | 'B+' | 'B-' | 'C';
      if (nacionalidad) filters.nacionalidad = nacionalidad;
      if (responsibleUserId) filters.responsible_user_id = responsibleUserId;
      if (empadronado) filters.empadronado = empadronado === 'true';
      if (tieneIngresos) filters.tiene_ingresos = tieneIngresos === 'true';
      if (sortField) {
        filters.sort_by = sortField;
        filters.sort_order = sortOrder;
      }

      const response = await crmService.getContacts(filters);
      
      // Actualizar total
      setTotalContacts(response.total || 0);
      
      // Enriquecer contactos con información de llamadas para mostrar las columnas
      // Solo enriquecer los contactos de la página actual
      const batchSize = 10;
      const enrichedContacts: KommoContact[] = [];
      
      for (let i = 0; i < response.items.length; i += batchSize) {
        const batch = response.items.slice(i, i + batchSize);
        const enrichedBatch = await Promise.all(
          batch.map(contact => enrichContactWithCallInfo(contact))
        );
        enrichedContacts.push(...enrichedBatch);
      }
      
      setContacts(enrichedContacts);
    } catch (err) {
      console.error('❌ [CRMContactList] Error loading contacts:', err);
      setContacts([]);
      setTotalContacts(0);
    } finally {
      setLoading(false);
    }
  };

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
          const gradingOrder = { 'A': 4, 'B+': 3, 'B-': 2, 'C': 1 };
          aValue = gradingOrder[a.grading_llamada as keyof typeof gradingOrder] || 0;
          bValue = gradingOrder[b.grading_llamada as keyof typeof gradingOrder] || 0;
          break;
        case 'grading_situacion':
          const situacionOrder = { 'A': 4, 'B+': 3, 'B-': 2, 'C': 1 };
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
    setResponsibleUserId('');
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

  const hasActiveFilters = searchTerm || gradingLlamada || gradingSituacion || nacionalidad || responsibleUserId || empadronado || tieneIngresos || ultimaLlamadaDesde || ultimaLlamadaHasta || proximaLlamadaDesde || proximaLlamadaHasta || fechaModificacionDesde || fechaModificacionHasta;

  const getGradingVariant = (grading?: 'A' | 'B+' | 'B-' | 'C'): "default" | "secondary" | "destructive" | "outline" | "success" | "warning" | "error" | "info" | "neutral" => {
    switch (grading) {
      case 'A': return 'success';
      case 'B+': return 'info';
      case 'B-': return 'warning';
      case 'C': return 'error';
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
      return <ArrowUpDown className="w-4 h-4 text-gray-400" />;
    }
    return sortOrder === 'asc' 
      ? <ArrowUp className="w-4 h-4 text-primary" />
      : <ArrowDown className="w-4 h-4 text-primary" />;
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
            <p className="text-gray-600 mt-1 text-xs sm:text-sm md:text-base font-sans">
              {totalContacts} {totalContacts === 1 ? 'contacto' : 'contactos'} total{filteredAndSortedContacts.length < totalContacts ? ` (mostrando ${filteredAndSortedContacts.length} de ${totalContacts})` : ''}
            </p>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            {viewMode === 'table' && (
              <Button
                variant="outline"
                onClick={() => setShowColumnSettings(true)}
                title="Configurar columnas"
                className="flex-1 sm:flex-initial text-sm sm:text-base h-9 sm:h-10"
              >
                <Settings2 className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-2" />
                <span className="sm:inline">Columnas</span>
              </Button>
            )}
            <Button
              variant="outline"
              onClick={() => setViewMode(viewMode === 'table' ? 'cards' : 'table')}
              title={viewMode === 'table' ? 'Vista de tarjetas' : 'Vista de tabla'}
              className="flex-1 sm:flex-initial text-sm sm:text-base h-9 sm:h-10"
            >
              {viewMode === 'table' ? <Grid3x3 className="w-3 h-3 sm:w-4 sm:h-4" /> : <List className="w-3 h-3 sm:w-4 sm:h-4" />}
              <span className="ml-1 sm:ml-2 sm:hidden">Vista</span>
            </Button>
            <Button
              onClick={() => navigate('/crm/contacts/new')}
              className="flex-1 sm:flex-initial text-sm sm:text-base h-9 sm:h-10"
            >
              <Plus className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-2" />
              <span className="sm:inline">Nuevo Contacto</span>
            </Button>
          </div>
        </div>

        <Card className="mb-4 sm:mb-6">
          <CardContent className="pt-3 sm:pt-4 md:pt-6">
            <div className="flex flex-col gap-3 sm:gap-4">
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 md:gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
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
                    <Filter className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-2" />
                    <span className="sm:inline">Filtros</span>
                    {hasActiveFilters && (
                      <span className="ml-1 sm:ml-2 bg-primary text-primary-foreground rounded-full w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center text-[10px] sm:text-xs">
                        {[searchTerm, gradingLlamada, gradingSituacion, nacionalidad, responsibleUserId, empadronado, tieneIngresos, ultimaLlamadaDesde, ultimaLlamadaHasta, proximaLlamadaDesde, proximaLlamadaHasta, fechaModificacionDesde, fechaModificacionHasta].filter(Boolean).length}
                      </span>
                    )}
                  </Button>
                  {hasActiveFilters && (
                    <Button
                      variant="outline"
                      onClick={clearFilters}
                      className="text-red-600 hover:text-red-700 text-sm sm:text-base h-9 sm:h-10 px-2 sm:px-3"
                    >
                      <X className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-2" />
                      <span className="hidden sm:inline">Limpiar</span>
                    </Button>
                  )}
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
                      </select>
                    </div>

                    <div>
                      <Label className="text-sm font-medium text-gray-700 mb-2 block">
                        Nacionalidad
                      </Label>
                      <select
                        value={nacionalidad}
                        onChange={(e) => setNacionalidad(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary h-[44px]"
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
                        value={responsibleUserId}
                        onChange={(e) => setResponsibleUserId(e.target.value)}
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

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-gray-600">Cargando contactos...</p>
          </div>
        ) : viewMode === 'table' ? (
          <>
            <div className="block md:hidden space-y-4">
              {filteredAndSortedContacts.map((contact) => (
                <Card
                  key={contact.id}
                  className="hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => navigate(`/crm/contacts/${contact.id}`)}
                >
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base font-semibold text-gray-900 mb-1 font-display">
                          {contact.name || `${contact.first_name} ${contact.last_name || ''}`.trim() || 'Sin nombre'}
                        </h3>
                        {contact.email && (
                          <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                            <Mail className="w-4 h-4 flex-shrink-0" />
                            <span className="truncate">{contact.email}</span>
                          </div>
                        )}
                        {contact.phone && (
                          <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                            <Phone className="w-4 h-4 flex-shrink-0" />
                            <span>{contact.phone}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {contact.nacionalidad && (
                        <div className="flex items-center gap-1 text-xs text-gray-600">
                          <Flag className="w-3 h-3" />
                          <span>{contact.nacionalidad}</span>
                        </div>
                      )}
                      {contact.grading_llamada && (
                        <Badge variant={getGradingVariant(contact.grading_llamada)} className="text-xs">
                          Llamada: {contact.grading_llamada}
                        </Badge>
                      )}
                      {contact.grading_situacion && (
                        <Badge variant={getGradingVariant(contact.grading_situacion)} className="text-xs">
                          Situación: {contact.grading_situacion}
                        </Badge>
                      )}
                    </div>
                    <div className="space-y-2 pt-3 border-t">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <Calendar className="w-3 h-3" />
                          <span>Creación: {formatDate(contact.created_at)}</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/crm/contacts/${contact.id}`);
                          }}
                        >
                          Ver
                          <ChevronRight className="w-4 h-4 ml-1" />
                        </Button>
                      </div>
                      {contact.ultima_llamada_fecha && (
                        <div className="flex items-center gap-1 text-xs text-gray-600">
                          <Phone className="w-3 h-3" />
                          <span>Última llamada: {formatDate(contact.ultima_llamada_fecha)}</span>
                        </div>
                      )}
                      {contact.proxima_llamada_fecha && (
                        <div className="flex items-center gap-1 text-xs text-gray-600">
                          <Calendar className={`w-3 h-3 ${new Date(contact.proxima_llamada_fecha).getTime() < new Date().getTime() ? 'text-red-600' : 'text-blue-600'}`} />
                          <span className={new Date(contact.proxima_llamada_fecha).getTime() < new Date().getTime() ? 'text-red-600 font-semibold' : ''}>
                            Próxima llamada: {formatDate(contact.proxima_llamada_fecha)}
                          </span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
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
                            <ResizableHeader 
                              columnKey="name" 
                              onSort={() => handleSort('name')} 
                              sortField="name"
                            >
                              Nombre
                            </ResizableHeader>
                            <ResizableHeader 
                              columnKey="email" 
                              onSort={() => handleSort('email')} 
                              sortField="email"
                              className="hidden lg:table-cell"
                            >
                              Email
                            </ResizableHeader>
                            <ResizableHeader 
                              columnKey="phone" 
                              onSort={() => handleSort('phone')} 
                              sortField="phone"
                            >
                              Teléfono
                            </ResizableHeader>
                            <ResizableHeader 
                              columnKey="nacionalidad" 
                              onSort={() => handleSort('nacionalidad')} 
                              sortField="nacionalidad"
                              className="hidden xl:table-cell"
                            >
                              Nacionalidad
                            </ResizableHeader>
                            <ResizableHeader 
                              columnKey="grading_llamada" 
                              onSort={() => handleSort('grading_llamada')} 
                              sortField="grading_llamada"
                              className="hidden xl:table-cell"
                            >
                              Grading Llamada
                            </ResizableHeader>
                            <ResizableHeader 
                              columnKey="grading_situacion" 
                              onSort={() => handleSort('grading_situacion')} 
                              sortField="grading_situacion"
                              className="hidden xl:table-cell"
                            >
                              Grading Situación
                            </ResizableHeader>
                            <ResizableHeader 
                              columnKey="created_at" 
                              onSort={() => handleSort('created_at')} 
                              sortField="created_at"
                              className="hidden lg:table-cell"
                            >
                              Fecha Creación
                            </ResizableHeader>
                            <ResizableHeader 
                              columnKey="updated_at" 
                              onSort={() => handleSort('updated_at')} 
                              sortField="updated_at"
                              className="hidden lg:table-cell"
                            >
                              Fecha Modificación
                            </ResizableHeader>
                            <ResizableHeader 
                              columnKey="ultima_llamada" 
                              onSort={() => handleSort('ultima_llamada')} 
                              sortField="ultima_llamada"
                              className="hidden lg:table-cell"
                            >
                              Última Llamada
                            </ResizableHeader>
                            <ResizableHeader 
                              columnKey="proxima_llamada" 
                              onSort={() => handleSort('proxima_llamada')} 
                              sortField="proxima_llamada"
                              className="hidden lg:table-cell"
                            >
                              Próxima Llamada
                            </ResizableHeader>
                            <ResizableHeader 
                              columnKey="acciones"
                              className="text-right"
                            >
                              Acciones
                            </ResizableHeader>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {filteredAndSortedContacts.map((contact) => (
                            <tr
                              key={contact.id}
                              className="hover:bg-gray-50 cursor-pointer"
                              onClick={() => navigate(`/crm/contacts/${contact.id}`)}
                            >
                              <td className="px-3 sm:px-6 py-4 overflow-hidden" style={{ width: columnWidths.name, maxWidth: columnWidths.name }}>
                                <div className="flex items-center min-w-0">
                                  <div className="min-w-0 flex-1">
                                    <div className="text-sm font-medium text-gray-900 font-sans truncate" title={contact.name || `${contact.first_name} ${contact.last_name || ''}`.trim() || 'Sin nombre'}>
                                      {contact.name || `${contact.first_name} ${contact.last_name || ''}`.trim() || 'Sin nombre'}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-3 sm:px-6 py-4 hidden lg:table-cell overflow-hidden" style={{ width: columnWidths.email, maxWidth: columnWidths.email }}>
                                <div className="flex items-center gap-2 text-sm text-gray-600 min-w-0">
                                  {contact.email ? (
                                    <>
                                      <Mail className="w-4 h-4 flex-shrink-0" />
                                      <span className="truncate min-w-0" title={contact.email}>{contact.email}</span>
                                    </>
                                  ) : (
                                    <span className="text-gray-400">—</span>
                                  )}
                                </div>
                              </td>
                              <td className="px-3 sm:px-6 py-4 overflow-hidden" style={{ width: columnWidths.phone, maxWidth: columnWidths.phone }}>
                                <div className="flex items-center gap-2 text-sm text-gray-600 min-w-0">
                                  {contact.phone ? (
                                    <>
                                      <Phone className="w-4 h-4 flex-shrink-0" />
                                      <span className="truncate min-w-0" title={contact.phone}>{contact.phone}</span>
                                    </>
                                  ) : (
                                    <span className="text-gray-400">—</span>
                                  )}
                                </div>
                              </td>
                              <td className="px-3 sm:px-6 py-4 hidden xl:table-cell overflow-hidden" style={{ width: columnWidths.nacionalidad, maxWidth: columnWidths.nacionalidad }}>
                                <div className="flex items-center gap-2 text-sm text-gray-600 min-w-0">
                                  {contact.nacionalidad ? (
                                    <>
                                      <Flag className="w-4 h-4 flex-shrink-0" />
                                      <span className="truncate min-w-0" title={contact.nacionalidad}>{contact.nacionalidad}</span>
                                    </>
                                  ) : (
                                    <span className="text-gray-400">—</span>
                                  )}
                                </div>
                              </td>
                              <td className="px-3 sm:px-6 py-4 hidden xl:table-cell" style={{ width: columnWidths.grading_llamada }}>
                                {contact.grading_llamada ? (
                                  <Badge variant={getGradingVariant(contact.grading_llamada)} className="text-xs">
                                    {contact.grading_llamada}
                                  </Badge>
                                ) : (
                                  <span className="text-gray-400">—</span>
                                )}
                              </td>
                              <td className="px-3 sm:px-6 py-4 hidden xl:table-cell" style={{ width: columnWidths.grading_situacion }}>
                                {contact.grading_situacion ? (
                                  <Badge variant={getGradingVariant(contact.grading_situacion)} className="text-xs">
                                    {contact.grading_situacion}
                                  </Badge>
                                ) : (
                                  <span className="text-gray-400">—</span>
                                )}
                              </td>
                              <td className="px-3 sm:px-6 py-4 hidden lg:table-cell text-sm text-gray-600 overflow-hidden" style={{ width: columnWidths.created_at, maxWidth: columnWidths.created_at }}>
                                <div className="flex items-center gap-2 min-w-0">
                                  <Calendar className="w-4 h-4 flex-shrink-0" />
                                  <span className="truncate min-w-0" title={formatDate(contact.created_at)}>{formatDate(contact.created_at)}</span>
                                </div>
                              </td>
                              <td className="px-3 sm:px-6 py-4 hidden lg:table-cell text-sm text-gray-600 overflow-hidden" style={{ width: columnWidths.updated_at, maxWidth: columnWidths.updated_at }}>
                                <div className="flex items-center gap-2 min-w-0">
                                  <Calendar className="w-4 h-4 text-blue-600 flex-shrink-0" />
                                  <span className="truncate min-w-0" title={formatDate(contact.updated_at)}>{formatDate(contact.updated_at)}</span>
                                </div>
                              </td>
                              <td className="px-3 sm:px-6 py-4 hidden lg:table-cell text-sm text-gray-600 overflow-hidden" style={{ width: columnWidths.ultima_llamada, maxWidth: columnWidths.ultima_llamada }}>
                                {contact.ultima_llamada_fecha ? (
                                  <div className="flex items-center gap-2 min-w-0">
                                    <Phone className="w-4 h-4 flex-shrink-0" />
                                    <span className="truncate min-w-0" title={formatDate(contact.ultima_llamada_fecha)}>{formatDate(contact.ultima_llamada_fecha)}</span>
                                  </div>
                                ) : (
                                  <span className="text-gray-400">—</span>
                                )}
                              </td>
                              <td className="px-3 sm:px-6 py-4 hidden lg:table-cell text-sm text-gray-600 overflow-hidden" style={{ width: columnWidths.proxima_llamada, maxWidth: columnWidths.proxima_llamada }}>
                                {contact.proxima_llamada_fecha ? (
                                  <div className="flex items-center gap-2 min-w-0">
                                    <Calendar className="w-4 h-4 text-blue-600 flex-shrink-0" />
                                    <span className={`truncate min-w-0 ${new Date(contact.proxima_llamada_fecha).getTime() < new Date().getTime() ? 'text-red-600 font-semibold' : ''}`} title={formatDate(contact.proxima_llamada_fecha)}>
                                      {formatDate(contact.proxima_llamada_fecha)}
                                    </span>
                                  </div>
                                ) : (
                                  <span className="text-gray-400">—</span>
                                )}
                              </td>
                              <td className="px-3 sm:px-6 py-4 text-right text-sm font-medium" style={{ width: columnWidths.acciones }}>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigate(`/crm/contacts/${contact.id}`);
                                  }}
                                >
                                  Ver
                                  <ChevronRight className="w-4 h-4 ml-1" />
                                </Button>
                              </td>
                            </tr>
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
                          <Mail className="w-4 h-4" />
                          <span className="truncate">{contact.email}</span>
                        </div>
                      )}
                      {contact.phone && (
                        <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                          <Phone className="w-4 h-4" />
                          <span>{contact.phone}</span>
                        </div>
                      )}
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </div>

                  <div className="space-y-2">
                    {contact.nacionalidad && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Flag className="w-4 h-4" />
                        <span>{contact.nacionalidad}</span>
                      </div>
                    )}

                    {contact.lugar_residencia && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <MapPin className="w-4 h-4" />
                        <span>{contact.lugar_residencia}</span>
                      </div>
                    )}

                    <div className="flex items-center gap-2 pt-2">
                      {contact.grading_llamada && (
                        <Badge variant={getGradingVariant(contact.grading_llamada)} className="text-xs">
                          <Star className="w-3 h-3 inline mr-1" />
                          Llamada: {contact.grading_llamada}
                        </Badge>
                      )}
                      {contact.grading_situacion && (
                        <Badge variant={getGradingVariant(contact.grading_situacion)} className="text-xs">
                          <Star className="w-3 h-3 inline mr-1" />
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
                        <Calendar className="w-3 h-3" />
                        <span>Creación: {formatDate(contact.created_at)}</span>
                      </div>
                      {contact.ultima_llamada_fecha && (
                        <div className="flex items-center gap-2 text-xs text-gray-600">
                          <Phone className="w-3 h-3" />
                          <span>Última llamada: {formatDate(contact.ultima_llamada_fecha)}</span>
                        </div>
                      )}
                      {contact.proxima_llamada_fecha && (
                        <div className="flex items-center gap-2 text-xs text-gray-600">
                          <Calendar className={`w-3 h-3 ${new Date(contact.proxima_llamada_fecha).getTime() < new Date().getTime() ? 'text-red-600' : 'text-blue-600'}`} />
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
              <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p className="text-gray-500">No se encontraron contactos</p>
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
        {!loading && totalContacts > 0 && (
          <Card className="mt-4">
            <CardContent className="pt-4 pb-4">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="text-sm text-gray-600">
                    Mostrando {pagination.skip + 1} - {Math.min(pagination.skip + pagination.limit, totalContacts)} de {totalContacts}
                  </div>
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
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    Anterior
                  </Button>
                  <span className="text-sm text-gray-600 px-3 min-w-[100px] text-center">
                    Página {Math.floor(pagination.skip / pagination.limit) + 1} de {Math.ceil(totalContacts / pagination.limit)}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const newSkip = pagination.skip + pagination.limit;
                      setPagination({ ...pagination, skip: newSkip });
                    }}
                    disabled={pagination.skip + pagination.limit >= totalContacts}
                  >
                    Siguiente
                    <ChevronRight className="w-4 h-4 ml-1" />
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
                      <ArrowUp className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveColumn(columnKey, 'down')}
                      disabled={index === columnOrder.length - 1}
                      className="disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <ArrowDown className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                    </button>
                  </div>
                  <GripVertical className="w-4 h-4 text-gray-400" />
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
    </div>
  );
}
