// CRM Companies - Lista de empresas

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { adminService } from '@/services/adminService';
import { crmService } from '@/services/crmService';
import type { Company } from '@/types/crm';
import { ArrowLeftIcon, BuildingOffice2Icon, EnvelopeIcon, MagnifyingGlassIcon, MapPinIcon, PhoneIcon, PlusIcon } from '@heroicons/react/24/outline';

export function CRMCompanies() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!adminService.isAuthenticated()) {
      navigate('/admin/login');
      return;
    }

    loadCompanies();
  }, [navigate]);

  const loadCompanies = async () => {
    setLoading(true);
    try {
      const response = await crmService.getCompanies({ limit: 100 });
      setCompanies(response.items || []);
    } catch (err) {
      console.error('Error loading companies:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredCompanies = companies.filter(company =>
    company.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    company.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
              <ArrowLeftIcon width={20} height={20} />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Empresas</h1>
              <p className="text-gray-600 mt-1">
                {filteredCompanies.length} empresas
              </p>
            </div>
          </div>
          <Button
            onClick={() => navigate('/admin/crm/companies/new')}
            className="bg-green-600 hover:bg-green-700 flex items-center gap-2"
          >
            <PlusIcon width={18} height={18} />
            Nueva Empresa
          </Button>
        </div>

        {/* Search */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" width={20} height={20} />
              <Input
                placeholder="Buscar empresas por nombre o email..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Companies List */}
        {loading ? (
          <Card>
            <CardContent className="py-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Cargando empresas...</p>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCompanies.map((company) => (
                <Card
                  key={company.id}
                  className="hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => navigate(`/admin/crm/companies/${company.id}`)}
                >
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                      <div className="bg-purple-100 p-3 rounded-full text-purple-600">
                        <BuildingOffice2Icon width={24} height={24} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold text-gray-900 truncate">
                          {company.name}
                        </h3>
                        
                        <div className="mt-3 space-y-2">
                          {company.email && (
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <EnvelopeIcon width={14} height={14} />
                              <span className="truncate">{company.email}</span>
                            </div>
                          )}
                          
                          {company.phone && (
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <PhoneIcon width={14} height={14} />
                              <span>{company.phone}</span>
                            </div>
                          )}
                          
                          {(company.city || company.country) && (
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <MapPinIcon width={14} height={14} />
                              <span className="truncate">
                                {[company.city, company.country].filter(Boolean).join(', ')}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {filteredCompanies.length === 0 && (
                <div className="col-span-full">
                  <Card>
                    <CardContent className="py-12 text-center">
                      <p className="text-gray-500">
                        {searchQuery
                          ? 'No se encontraron empresas'
                          : 'No hay empresas registradas'}
                      </p>
                      {!searchQuery && (
                        <Button
                          onClick={() => navigate('/admin/crm/companies/new')}
                          className="mt-4"
                        >
                          Crear primera empresa
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

