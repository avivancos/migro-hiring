// CRM Contacts - Lista y gestión de contactos

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { adminService } from '@/services/adminService';
import { crmService } from '@/services/crmService';
import type { KommoContact, ContactFilters } from '@/types/crm';
import {
  Search,
  Filter,
  Plus,
  ArrowLeft,
  Phone,
  Mail,
  Building2,
  User,
} from 'lucide-react';

export function CRMContacts() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [contacts, setContacts] = useState<KommoContact[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState<ContactFilters>({
    page: 1,
    limit: 20,
  });
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    if (!adminService.isAuthenticated()) {
      navigate('/admin/login');
      return;
    }

    loadContacts();
  }, [navigate, filters]);

  const loadContacts = async () => {
    setLoading(true);
    try {
      const response = await crmService.getContacts(filters);
      setContacts(response._embedded.contacts);
      setPage(response._page.page);
      setTotalPages(Math.ceil(response._page.total / response._page.limit));
    } catch (err) {
      console.error('Error loading contacts:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (query: string) => {
    setFilters({ ...filters, query, page: 1 });
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-4">
            <Button
              onClick={() => navigate('/admin/crm')}
              variant="ghost"
              size="icon"
            >
              <ArrowLeft size={20} />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Contactos</h1>
              <p className="text-gray-600 mt-1">
                {contacts.length} contactos encontrados
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={() => setShowFilters(!showFilters)}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Filter size={18} />
              Filtros
            </Button>
            <Button
              onClick={() => navigate('/admin/crm/contacts/new')}
              className="bg-green-600 hover:bg-green-700 flex items-center gap-2"
            >
              <Plus size={18} />
              Nuevo Contacto
            </Button>
          </div>
        </div>

        {/* Search */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <Input
                  placeholder="Buscar contactos por nombre o email..."
                  className="pl-10"
                  onChange={(e) => handleSearch(e.target.value)}
                />
              </div>
            </div>

            {showFilters && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pt-4 border-t">
                <div>
                  <Label>Empresa</Label>
                  <Input
                    placeholder="Filtrar por empresa..."
                    onChange={(e) => setFilters({ ...filters, company_id: parseInt(e.target.value) || undefined })}
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Contacts List */}
        {loading ? (
          <Card>
            <CardContent className="py-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Cargando contactos...</p>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {contacts.map((contact) => (
                <Card
                  key={contact.id}
                  className="hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => navigate(`/admin/crm/contacts/${contact.id}`)}
                >
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                      <div className="bg-blue-100 p-3 rounded-full text-blue-600">
                        <User size={24} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold text-gray-900 truncate">
                          {contact.first_name} {contact.last_name}
                        </h3>
                        {contact.position && (
                          <p className="text-sm text-gray-500 truncate">
                            {contact.position}
                          </p>
                        )}
                        
                        <div className="mt-3 space-y-2">
                          {contact.email && (
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Mail size={14} />
                              <span className="truncate">{contact.email}</span>
                            </div>
                          )}
                          
                          {contact.phone && (
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Phone size={14} />
                              <span>{contact.phone}</span>
                            </div>
                          )}
                          
                          {contact.company && (
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Building2 size={14} />
                              <span className="truncate">{contact.company.name}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {contacts.length === 0 && (
                <div className="col-span-full">
                  <Card>
                    <CardContent className="py-12 text-center">
                      <p className="text-gray-500">No se encontraron contactos</p>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-6">
                <Button
                  onClick={() => setFilters({ ...filters, page: page - 1 })}
                  disabled={page === 1}
                  variant="outline"
                >
                  Anterior
                </Button>
                <span className="flex items-center px-4 text-sm text-gray-600">
                  Página {page} de {totalPages}
                </span>
                <Button
                  onClick={() => setFilters({ ...filters, page: page + 1 })}
                  disabled={page === totalPages}
                  variant="outline"
                >
                  Siguiente
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

