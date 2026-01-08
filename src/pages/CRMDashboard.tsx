// CRM Dashboard - Vista principal del CRM (simplificado - solo leads)

import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { adminService } from '@/services/adminService';
import { ArrowRightOnRectangleIcon, UsersIcon } from '@heroicons/react/24/outline';

export function CRMDashboard() {
  const navigate = useNavigate();

  useEffect(() => {
    // Check authentication
    if (!adminService.isAuthenticated()) {
      navigate('/admin/login');
      return;
    }
  }, [navigate]);

  const handleLogout = () => {
    adminService.logout();
    navigate('/admin/login');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Panel CRM</h1>
            <p className="text-gray-600 mt-1">Gestión de leads</p>
          </div>
          <Button
            onClick={handleLogout}
            variant="outline"
            className="flex items-center gap-2"
          >
            <ArrowRightOnRectangleIcon width={18} height={18} />
            Cerrar Sesión
          </Button>
        </div>

        {/* Quick Access Navigation */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <Card
            className="hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => navigate('/admin/crm/leads')}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <UsersIcon className="text-blue-600" width={28} height={28} />
                <span>Leads</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Ver y gestionar todos los leads
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Info Card */}
        <Card>
          <CardHeader>
            <CardTitle>Información</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">
              Panel CRM simplificado. Actualmente solo está disponible la gestión de leads.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
