// CRMSettings - Página principal de configuración del CRM

import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Settings, FileText, Users, BarChart3, List, Clock } from 'lucide-react';

export function CRMSettings() {
  const navigate = useNavigate();

  const settingsSections = [
    {
      title: 'Plantillas de Tareas',
      description: 'Gestiona las plantillas de tareas que se crean automáticamente',
      icon: FileText,
      path: '/crm/settings/task-templates',
      color: 'bg-blue-500',
    },
    {
      title: 'Campos Personalizados',
      description: 'Crea y gestiona campos personalizados para Contactos, Leads y Empresas',
      icon: List,
      path: '/crm/settings/custom-fields',
      color: 'bg-orange-500',
    },
    {
      title: 'Pipelines',
      description: 'Configura los pipelines y estados de ventas',
      icon: BarChart3,
      path: '/crm/settings/pipelines',
      color: 'bg-green-500',
    },
    {
      title: 'Usuarios',
      description: 'Gestiona los usuarios del CRM y sus permisos',
      icon: Users,
      path: '/crm/settings/users',
      color: 'bg-purple-500',
    },
    {
      title: 'Zona Horaria',
      description: 'Configura tu zona horaria preferida para visualizar fechas y horas',
      icon: Clock,
      path: '/crm/settings/timezone',
      color: 'bg-indigo-500',
    },
  ];

  return (
    <div className="w-full">
        <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Configuración del CRM</h1>
        <p className="text-gray-600 mt-1">Gestiona la configuración del sistema CRM</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {settingsSections.map((section) => {
          const Icon = section.icon;
          return (
            <Card
              key={section.path}
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => navigate(section.path)}
            >
              <CardHeader>
                <div className="flex items-center gap-4">
                  <div className={`${section.color} p-3 rounded-lg text-white`}>
                    <Icon size={24} />
                  </div>
                  <CardTitle className="text-lg">{section.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 text-sm">{section.description}</p>
                <Button
                  variant="outline"
                  className="mt-4 w-full"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(section.path);
                  }}
                >
                  Configurar
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Información adicional */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings size={20} />
            Información del Sistema
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-gray-600">
          <p>• Las plantillas de tareas requeridas se crean automáticamente al crear contactos o leads</p>
          <p>• Los pipelines definen los estados del embudo de ventas</p>
          <p>• Los usuarios pueden tener diferentes roles y permisos</p>
        </CardContent>
      </Card>
      </div>
    </div>
  );
}


