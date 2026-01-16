// CRM Contacts - Lista y gestión de contactos

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { adminService } from '@/services/adminService';
import { crmService } from '@/services/crmService';
import type { Contact, ContactFilters } from '@/types/crm';
import { ArrowLeftIcon, BuildingOffice2Icon, EnvelopeIcon, FunnelIcon, MagnifyingGlassIcon, PhoneIcon, PlusIcon, UserIcon } from '@heroicons/react/24/outline';
import { Paginator } from '@/components/common/Paginator';

export function CRMContacts() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState<ContactFilters>({
    skip: 0,
    limit: 25,
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
      setContacts(response.items || []);
      setTotal(response.total || 0);
    } catch (err) {
      console.error('Error loading contacts:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (query: string) => {
      setFilters({ ...filters, name: query, skip: 0 });
  };

  return (
    <div className="min-h-screen bg-gray-50 py-4 sm:py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 sm:mb-8">
          <div className="flex items-center gap-2 sm:gap-4">
            <Button
              onClick={() => navigate('/admin/crm')}
              variant="ghost"
              size="icon"
              className="flex-shrink-0"
            >
              <ArrowLeftIcon width={20} height={20} />
            </Button>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Contactos</h1>
              <p className="text-gray-600 mt-1 text-sm sm:text-base">
                {contacts.length} contactos encontrados
              </p>
            </div>
          </div>
          <div className="flex gap-2 sm:gap-3 w-full sm:w-auto">
            <Button
              onClick={() => setShowFilters(!showFilters)}
              variant="outline"
              className="flex items-center gap-2 flex-1 sm:flex-initial"
            >
              <FunnelIcon width={18} height={18} />
              <span className="sm:inline">Filtros</span>
            </Button>
            <Button
              onClick={() => navigate('/admin/crm/contacts/new')}
              className="bg-green-600 hover:bg-green-700 flex items-center gap-2 flex-1 sm:flex-initial"
            >
              <PlusIcon width={18} height={18} />
              <span className="sm:inline">Nuevo Contacto</span>
            </Button>
          </div>
        </div>

        {/* Search */}
        <Card className="mb-6">
          <CardContent className="pt-4 sm:pt-6">
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" width={20} height={20} />
                <Input
                  placeholder="Buscar contactos por nombre o email..."
                  className="pl-10 text-sm sm:text-base"
                  onChange={(e) => handleSearch(e.target.value)}
                />
              </div>
            </div>

            {showFilters && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 pt-4 border-t">
                <div>
                  <Label className="text-sm">Empresa</Label>
                  <Input
                    placeholder="Filtrar por empresa..."
                    className="text-sm sm:text-base"
                    onChange={(e) => setFilters({ ...filters, company_id: e.target.value || undefined })}
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {contacts.map((contact) => (
                <Card
                  key={contact.id}
                  className="hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => navigate(`/admin/crm/contacts/${contact.id}`)}
                >
                  <CardContent className="pt-4 sm:pt-6">
                    <div className="flex items-start gap-3 sm:gap-4">
                      <div className="bg-blue-100 p-2 sm:p-3 rounded-full text-blue-600 flex-shrink-0">
                        <UserIcon width={20} height={20} className="sm:w-6 sm:h-6" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base sm:text-lg font-semibold text-gray-900 truncate">
                          {contact.first_name} {contact.last_name}
                        </h3>
                        {contact.position && (
                          <p className="text-xs sm:text-sm text-gray-500 truncate">
                            {contact.position}
                          </p>
                        )}
                        
                        <div className="mt-2 sm:mt-3 space-y-1.5 sm:space-y-2">
                          {contact.email && (
                            <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
                              <EnvelopeIcon width={12} height={12} className="sm:w-3.5 sm:h-3.5 flex-shrink-0" />
                              <span className="truncate">{contact.email}</span>
                            </div>
                          )}
                          
                          {contact.phone && (
                            <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
                              <PhoneIcon width={12} height={12} className="sm:w-3.5 sm:h-3.5 flex-shrink-0" />
                              <span>{contact.phone}</span>
                            </div>
                          )}
                          
                          {contact.company && (
                            <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
                              <BuildingOffice2Icon width={12} height={12} className="sm:w-3.5 sm:h-3.5 flex-shrink-0" />
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
            {!loading && total > 0 && (
              <>
                {/* Paginador Superior */}
                <Paginator
                  total={total}
                  page={Math.floor((filters.skip || 0) / (filters.limit || 25)) + 1}
                  limit={filters.limit || 25}
                  totalPages={Math.ceil(total / (filters.limit || 25))}
                  onPageChange={(newPage) => {
                    setFilters({ ...filters, skip: (newPage - 1) * (filters.limit || 25) });
                  }}
                  onLimitChange={(newLimit) => {
                    setFilters({ ...filters, skip: 0, limit: newLimit });
                  }}
                  itemName="contacto"
                  itemNamePlural="contactos"
                  className="mb-4"
                />
                
                {/* Paginador Inferior */}
                {Math.ceil(total / (filters.limit || 25)) > 1 && (
                  <Paginator
                    total={total}
                    page={Math.floor((filters.skip || 0) / (filters.limit || 25)) + 1}
                    limit={filters.limit || 25}
                    totalPages={Math.ceil(total / (filters.limit || 25))}
                    onPageChange={(newPage) => {
                      setFilters({ ...filters, skip: (newPage - 1) * (filters.limit || 25) });
                    }}
                    onLimitChange={(newLimit) => {
                      setFilters({ ...filters, skip: 0, limit: newLimit });
                    }}
                    itemName="contacto"
                    itemNamePlural="contactos"
                    className="mt-6"
                  />
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}

