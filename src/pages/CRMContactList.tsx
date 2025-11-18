// CRM Contact List - Lista de contactos con filtros y búsqueda

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { adminService } from '@/services/adminService';
import { crmService } from '@/services/crmService';
import type { KommoContact, ContactFilters } from '@/types/crm';
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
} from 'lucide-react';

export function CRMContactList() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [contacts, setContacts] = useState<KommoContact[]>([]);
  const [filteredContacts, setFilteredContacts] = useState<KommoContact[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedGrading, setSelectedGrading] = useState<'A' | 'B+' | 'B-' | 'C' | null>(null);

  useEffect(() => {
    if (!adminService.isAuthenticated()) {
      navigate('/admin/login');
      return;
    }
    loadContacts();
  }, [navigate]);

  useEffect(() => {
    filterContacts();
  }, [searchTerm, selectedGrading, contacts]);

  const loadContacts = async () => {
    setLoading(true);
    try {
      const filters: ContactFilters = {
        limit: 100,
      };
      
      if (searchTerm) {
        filters.search = searchTerm;
      }
      if (selectedGrading) {
        filters.grading_llamada = selectedGrading;
      }

      const response = await crmService.getContacts(filters);
      setContacts(response.items || []);
    } catch (err) {
      console.error('Error loading contacts:', err);
    } finally {
      setLoading(false);
    }
  };

  const filterContacts = () => {
    let filtered = contacts;

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(contact =>
        contact.name?.toLowerCase().includes(term) ||
        contact.first_name?.toLowerCase().includes(term) ||
        contact.last_name?.toLowerCase().includes(term) ||
        contact.email?.toLowerCase().includes(term) ||
        contact.phone?.toLowerCase().includes(term)
      );
    }

    if (selectedGrading) {
      filtered = filtered.filter(contact => contact.grading_llamada === selectedGrading);
    }

    setFilteredContacts(filtered);
  };

  const getGradingColor = (grading?: 'A' | 'B+' | 'B-' | 'C'): string => {
    switch (grading) {
      case 'A':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'B+':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'B-':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'C':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/crm')}
              >
                <ChevronRight className="w-5 h-5 rotate-180" />
              </Button>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Contactos</h1>
                <p className="text-sm text-gray-500">{filteredContacts.length} contactos</p>
              </div>
            </div>
            <Button
              onClick={() => navigate('/crm/contacts/new')}
              className="bg-green-600 hover:bg-green-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Contacto
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Búsqueda y Filtros */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col gap-4">
              <div className="flex gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <Input
                    placeholder="Buscar por nombre, email, teléfono o nacionalidad..."
                    className="pl-10"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <Button
                  variant="outline"
                  onClick={() => setShowFilters(!showFilters)}
                >
                  <Filter className="w-4 h-4 mr-2" />
                  Filtros
                </Button>
              </div>

              {showFilters && (
                <div className="flex flex-wrap gap-2 pt-4 border-t">
                  <span className="text-sm font-medium text-gray-700">Grading Llamada:</span>
                  {(['A', 'B+', 'B-', 'C'] as const).map((grade) => (
                    <Button
                      key={grade}
                      variant={selectedGrading === grade ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSelectedGrading(selectedGrading === grade ? null : grade)}
                      className={selectedGrading === grade ? getGradingColor(grade) : ''}
                    >
                      <Star className="w-3 h-3 mr-1" />
                      {grade}
                    </Button>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Lista de Contactos */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Cargando contactos...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredContacts.map((contact) => (
              <Card
                key={contact.id}
                className="hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => navigate(`/crm/contacts/${contact.id}`)}
              >
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">
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
                        <span
                          className={`text-xs px-2 py-1 rounded-full border ${getGradingColor(
                            contact.grading_llamada
                          )}`}
                        >
                          <Star className="w-3 h-3 inline mr-1" />
                          Llamada: {contact.grading_llamada}
                        </span>
                      )}
                      {contact.grading_situacion && (
                        <span
                          className={`text-xs px-2 py-1 rounded-full border ${getGradingColor(
                            contact.grading_situacion
                          )}`}
                        >
                          <Star className="w-3 h-3 inline mr-1" />
                          Situación: {contact.grading_situacion}
                        </span>
                      )}
                    </div>

                    {contact.tiempo_espana && (
                      <p className="text-xs text-gray-500 mt-2">
                        En España: {contact.tiempo_espana}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {filteredContacts.length === 0 && !loading && (
          <Card>
            <CardContent className="py-12 text-center">
              <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p className="text-gray-500">No se encontraron contactos</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
