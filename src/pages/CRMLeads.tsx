// CRM Leads - Lista básica de leads (sin API)

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { adminService } from '@/services/adminService';
import type { KommoLead } from '@/types/crm';
import {
  Search,
  ArrowLeft,
  Phone,
  Calendar,
  Building2,
} from 'lucide-react';

// Datos mock de leads (temporal - sin API)
const mockLeads: KommoLead[] = [
  {
    id: 1,
    name: 'Residencia Legal - Juan Pérez',
    price: 400,
    currency: 'EUR',
    responsible_user_id: 1,
    status_id: 1,
    pipeline_id: 1,
    created_by: 1,
    updated_by: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    is_deleted: false,
    service_type: 'Residencia Legal',
    priority: 'high',
    source: 'Web',
    description: 'Cliente interesado en residencia legal',
  },
  {
    id: 2,
    name: 'Nacionalidad Española - María García',
    price: 600,
    currency: 'EUR',
    responsible_user_id: 1,
    status_id: 2,
    pipeline_id: 1,
    created_by: 1,
    updated_by: 1,
    created_at: new Date(Date.now() - 86400000).toISOString(),
    updated_at: new Date(Date.now() - 86400000).toISOString(),
    is_deleted: false,
    service_type: 'Nacionalidad',
    priority: 'medium',
    source: 'Referido',
    description: 'Proceso de nacionalidad en curso',
  },
  {
    id: 3,
    name: 'Visado de Trabajo - Carlos López',
    price: 350,
    currency: 'EUR',
    responsible_user_id: 1,
    status_id: 1,
    pipeline_id: 1,
    created_by: 1,
    updated_by: 1,
    created_at: new Date(Date.now() - 172800000).toISOString(),
    updated_at: new Date(Date.now() - 172800000).toISOString(),
    is_deleted: false,
    service_type: 'Visado',
    priority: 'urgent',
    source: 'Llamada Fría',
    description: 'Urgente - necesita visado para trabajo',
  },
];

export function CRMLeads() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [leads] = useState<KommoLead[]>(mockLeads);

  // Verificar autenticación
  if (!adminService.isAuthenticated()) {
    navigate('/admin/login');
    return null;
  }

  // Filtrar leads por búsqueda
  const filteredLeads = leads.filter(lead =>
    lead.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    lead.service_type?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    lead.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
    });
  };

  const getPriorityColor = (priority?: string): string => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
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
              <h1 className="text-3xl font-bold text-gray-900">Leads</h1>
              <p className="text-gray-600 mt-1">
                {filteredLeads.length} leads encontrados
              </p>
            </div>
          </div>
        </div>

        {/* Search */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <Input
                  placeholder="Buscar leads por nombre..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Leads List */}
        <div className="space-y-4">
          {filteredLeads.map((lead) => (
            <Card
              key={lead.id}
              className="hover:shadow-lg transition-shadow cursor-pointer"
            >
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {lead.name}
                      </h3>
                      {lead.priority && (
                        <span className={`text-xs px-2 py-1 rounded-full ${getPriorityColor(lead.priority)}`}>
                          {lead.priority}
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                      {lead.service_type && (
                        <div className="flex items-center gap-2">
                          <Building2 size={16} />
                          <span>{lead.service_type}</span>
                        </div>
                      )}
                      
                      {lead.source && (
                        <div className="flex items-center gap-2">
                          <Phone size={16} />
                          <span>{lead.source}</span>
                        </div>
                      )}
                      
                      <div className="flex items-center gap-2">
                        <Calendar size={16} />
                        <span>{formatDate(lead.created_at)}</span>
                      </div>
                    </div>

                    {lead.description && (
                      <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                        {lead.description}
                      </p>
                    )}
                  </div>

                  <div className="text-right ml-6">
                    <p className="text-2xl font-bold text-green-600">
                      {formatCurrency(lead.price)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {filteredLeads.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-gray-500">No se encontraron leads</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
