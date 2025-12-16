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
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Grid3x3,
  List,
  X,
  Calendar,
} from 'lucide-react';
import { CRMHeader } from '@/components/CRM/CRMHeader';
import { useAuth } from '@/providers/AuthProvider';

type SortField = 'name' | 'email' | 'phone' | 'created_at' | 'grading_llamada' | 'grading_situacion' | 'nacionalidad';
type SortOrder = 'asc' | 'desc';
type ViewMode = 'cards' | 'table';

export function CRMContactList() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(true);
  const [contacts, setContacts] = useState<KommoContact[]>([]);
  const [users, setUsers] = useState<CRMUser[]>([]);
  
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
    if (sortField) params.set('sort_by', sortField);
    if (sortOrder) params.set('sort_order', sortOrder);
    if (viewMode) params.set('view', viewMode);
    
    setSearchParams(params, { replace: true });
  }, [searchTerm, gradingLlamada, gradingSituacion, nacionalidad, responsibleUserId, empadronado, tieneIngresos, sortField, sortOrder, viewMode]);

  useEffect(() => {
    if (isAuthenticated) {
      loadContacts();
    }
  }, [isAuthenticated, searchTerm, gradingLlamada, gradingSituacion, nacionalidad, responsibleUserId, empadronado, tieneIngresos, sortField, sortOrder]);

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

  const loadContacts = async () => {
    setLoading(true);
    try {
      const filters: Omit<ContactFilters, 'limit' | 'skip' | 'page'> = {};
      
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

      const allContacts = await crmService.getAllContacts(filters);
      setContacts(allContacts);
    } catch (err) {
      console.error('❌ [CRMContactList] Error loading contacts:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredAndSortedContacts = useMemo(() => {
    let filtered = [...contacts];

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
        default:
          return 0;
      }

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [contacts, searchTerm, sortField, sortOrder]);

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
    setSortField('created_at');
    setSortOrder('desc');
  };

  const hasActiveFilters = searchTerm || gradingLlamada || gradingSituacion || nacionalidad || responsibleUserId || empadronado || tieneIngresos;

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

  return (
    <div className="min-h-screen bg-gray-50">
      <CRMHeader />
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-3 sm:py-4 md:py-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-display font-bold text-gray-900">Contactos</h1>
            <p className="text-gray-600 mt-1 text-xs sm:text-sm md:text-base font-sans">
              {filteredAndSortedContacts.length} {filteredAndSortedContacts.length === 1 ? 'contacto' : 'contactos'}
            </p>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
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
                        {[searchTerm, gradingLlamada, gradingSituacion, nacionalidad, responsibleUserId, empadronado, tieneIngresos].filter(Boolean).length}
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
                    <div className="flex items-center justify-between pt-3 border-t">
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Calendar className="w-3 h-3" />
                        <span>{formatDate(contact.created_at)}</span>
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
                            <th
                              className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 font-sans"
                              onClick={() => handleSort('name')}
                            >
                              <div className="flex items-center gap-2">
                                Nombre
                                <SortIcon field="name" />
                              </div>
                            </th>
                            <th
                              className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 hidden lg:table-cell font-sans"
                              onClick={() => handleSort('email')}
                            >
                              <div className="flex items-center gap-2">
                                Email
                                <SortIcon field="email" />
                              </div>
                            </th>
                            <th
                              className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 font-sans"
                              onClick={() => handleSort('phone')}
                            >
                              <div className="flex items-center gap-2">
                                Teléfono
                                <SortIcon field="phone" />
                              </div>
                            </th>
                            <th
                              className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 hidden xl:table-cell font-sans"
                              onClick={() => handleSort('nacionalidad')}
                            >
                              <div className="flex items-center gap-2">
                                Nacionalidad
                                <SortIcon field="nacionalidad" />
                              </div>
                            </th>
                            <th
                              className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 hidden xl:table-cell font-sans"
                              onClick={() => handleSort('grading_llamada')}
                            >
                              <div className="flex items-center gap-2">
                                Grading Llamada
                                <SortIcon field="grading_llamada" />
                              </div>
                            </th>
                            <th
                              className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 hidden xl:table-cell font-sans"
                              onClick={() => handleSort('grading_situacion')}
                            >
                              <div className="flex items-center gap-2">
                                Grading Situación
                                <SortIcon field="grading_situacion" />
                              </div>
                            </th>
                            <th
                              className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 hidden lg:table-cell font-sans"
                              onClick={() => handleSort('created_at')}
                            >
                              <div className="flex items-center gap-2">
                                Fecha Creación
                                <SortIcon field="created_at" />
                              </div>
                            </th>
                            <th className="px-3 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider font-sans">
                              Acciones
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {filteredAndSortedContacts.map((contact) => (
                            <tr
                              key={contact.id}
                              className="hover:bg-gray-50 cursor-pointer"
                              onClick={() => navigate(`/crm/contacts/${contact.id}`)}
                            >
                              <td className="px-3 sm:px-6 py-4">
                                <div className="flex items-center">
                                  <div>
                                    <div className="text-sm font-medium text-gray-900 font-sans">
                                      {contact.name || `${contact.first_name} ${contact.last_name || ''}`.trim() || 'Sin nombre'}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-3 sm:px-6 py-4 hidden lg:table-cell">
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                  {contact.email ? (
                                    <>
                                      <Mail className="w-4 h-4" />
                                      <span className="truncate max-w-xs">{contact.email}</span>
                                    </>
                                  ) : (
                                    <span className="text-gray-400">—</span>
                                  )}
                                </div>
                              </td>
                              <td className="px-3 sm:px-6 py-4">
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                  {contact.phone ? (
                                    <>
                                      <Phone className="w-4 h-4" />
                                      <span>{contact.phone}</span>
                                    </>
                                  ) : (
                                    <span className="text-gray-400">—</span>
                                  )}
                                </div>
                              </td>
                              <td className="px-3 sm:px-6 py-4 hidden xl:table-cell">
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                  {contact.nacionalidad ? (
                                    <>
                                      <Flag className="w-4 h-4" />
                                      <span>{contact.nacionalidad}</span>
                                    </>
                                  ) : (
                                    <span className="text-gray-400">—</span>
                                  )}
                                </div>
                              </td>
                              <td className="px-3 sm:px-6 py-4 hidden xl:table-cell">
                                {contact.grading_llamada ? (
                                  <Badge variant={getGradingVariant(contact.grading_llamada)} className="text-xs">
                                    {contact.grading_llamada}
                                  </Badge>
                                ) : (
                                  <span className="text-gray-400">—</span>
                                )}
                              </td>
                              <td className="px-3 sm:px-6 py-4 hidden xl:table-cell">
                                {contact.grading_situacion ? (
                                  <Badge variant={getGradingVariant(contact.grading_situacion)} className="text-xs">
                                    {contact.grading_situacion}
                                  </Badge>
                                ) : (
                                  <span className="text-gray-400">—</span>
                                )}
                              </td>
                              <td className="px-3 sm:px-6 py-4 hidden lg:table-cell text-sm text-gray-600">
                                <div className="flex items-center gap-2">
                                  <Calendar className="w-4 h-4" />
                                  {formatDate(contact.created_at)}
                                </div>
                              </td>
                              <td className="px-3 sm:px-6 py-4 text-right text-sm font-medium">
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
      </div>
    </div>
  );
}
