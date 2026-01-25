// Configuración de títulos SEO-friendly para cada ruta de la aplicación
// Formato: "Título de la página | Migro.es"

export const PAGE_TITLES: Record<string, string> = {
  // Páginas públicas
  '/': 'Inicio - Contratación y Pago de Servicios Legales | Migro.es',
  '/clientes': 'Portal de Clientes | Migro.es',
  '/expirado': 'Enlace Expirado | Migro.es',
  '/404': 'Página No Encontrada | Migro.es',
  '/privacidad': 'Política de Privacidad | Migro.es',
  '/privacy': 'Privacy Policy | Migro.es',
  '/borrador': 'Borrador PDF | Migro.es',
  '/colaboradores': 'Colaboradores | Migro.es',
  '/colaboradores-agentes': 'Convenio de Colaboración - Agentes de Ventas | Migro.es',
  '/closer': 'Closer | Migro.es',
  '/pili': 'Pili - Asistente IA | Migro.es',
  
  // Rutas de contratación
  '/contratacion': 'Contratación de Servicios | Migro.es',
  '/hiring': 'Hiring Services | Migro.es',
  
  // Rutas de autenticación
  '/login': 'Iniciar Sesión | Migro.es',
  '/auth/login': 'Iniciar Sesión - Administración | Migro.es',
  '/contrato-old/login': 'Iniciar Sesión - Contrato | Migro.es',
  
  // Dashboard de contratación
  '/contrato/dashboard': 'Dashboard - Gestión de Contratos | Migro.es',
  '/contrato-old/dashboard': 'Dashboard - Gestión de Contratos | Migro.es',
  
  // Módulo Admin
  '/admin': 'Panel de Administración | Migro.es',
  '/admin/dashboard': 'Dashboard - Panel de Administración | Migro.es',
  '/admin/users': 'Gestión de Usuarios | Migro.es',
  '/admin/users/create': 'Crear Usuario | Migro.es',
  '/admin/audit-logs': 'Logs de Auditoría | Migro.es',
  '/admin/conversations': 'Conversaciones | Migro.es',
  '/admin/contracts': 'Contratos - Administración | Migro.es',
  '/admin/contracts/create': 'Crear Contrato | Migro.es',
  '/admin/call-types': 'Tipos de Llamada | Migro.es',
  '/admin/tracing': 'Dashboard de Tracing - Rendimiento | Migro.es',
  '/admin/approve-hiring-code': 'Aprobar Código de Contratación | Migro.es',
  
  // Módulo CRM
  '/crm': 'CRM - Gestión de Clientes | Migro.es',
  '/crm/contacts': 'Contactos - CRM | Migro.es',
  '/crm/contacts/new': 'Nuevo Contacto | Migro.es',
  '/crm/contracts': 'Contratos - CRM | Migro.es',
  '/crm/leads': 'Leads - CRM | Migro.es',
  '/crm/opportunities': 'Oportunidades - CRM | Migro.es',
  '/crm/calendar': 'Calendario - CRM | Migro.es',
  '/crm/actions': 'Acciones - CRM | Migro.es',
  '/crm/expedientes': 'Expedientes - CRM | Migro.es',
  '/crm/expedientes/new': 'Nuevo Expediente | Migro.es',
  '/crm/call': 'Manejo de Llamadas - CRM | Migro.es',
  '/crm/journal': 'Diario de Trabajo Diario - CRM | Migro.es',
  '/crm/settings': 'Configuración - CRM | Migro.es',
  '/crm/settings/task-templates': 'Plantillas de Tareas | Migro.es',
  '/crm/settings/custom-fields': 'Campos Personalizados | Migro.es',
};

/**
 * Obtiene el título de la página basado en la ruta actual
 * @param pathname - La ruta actual (ej: '/crm/contacts/123')
 * @returns El título correspondiente o un título por defecto
 */
export function getPageTitle(pathname: string): string {
  // Buscar coincidencia exacta primero
  if (PAGE_TITLES[pathname]) {
    return PAGE_TITLES[pathname];
  }
  
  // Buscar coincidencia parcial para rutas dinámicas (con parámetros)
  // Ordenar por longitud descendente para priorizar rutas más específicas
  const sortedRoutes = Object.keys(PAGE_TITLES).sort((a, b) => b.length - a.length);
  
  for (const route of sortedRoutes) {
    // Convertir ruta a patrón regex
    // Ej: '/crm/contacts/:id' -> '/crm/contacts/.*'
    const routePattern = route.replace(/:[^/]+/g, '[^/]+');
    const regex = new RegExp(`^${routePattern}$`);
    
    if (regex.test(pathname)) {
      return PAGE_TITLES[route];
    }
  }
  
  // Para rutas dinámicas específicas, usar patrones conocidos
  if (pathname.startsWith('/contratacion/') || pathname.startsWith('/hiring/')) {
    return 'Contratación de Servicios | Migro.es';
  }
  
  if (pathname.startsWith('/crm/contacts/') && pathname.includes('/edit')) {
    return 'Editar Contacto | Migro.es';
  }
  
  if (pathname.startsWith('/crm/contacts/')) {
    return 'Detalle de Contacto | Migro.es';
  }
  
  if (pathname.startsWith('/crm/leads/')) {
    return 'Detalle de Lead | Migro.es';
  }
  
  if (pathname.startsWith('/crm/opportunities/')) {
    return 'Detalle de Oportunidad | Migro.es';
  }
  
  if (pathname.startsWith('/crm/tasks/')) {
    return 'Detalle de Tarea | Migro.es';
  }
  
  if (pathname.startsWith('/crm/expedientes/')) {
    return 'Detalle de Expediente | Migro.es';
  }
  
  if (pathname.startsWith('/admin/users/') && pathname !== '/admin/users/create') {
    return 'Detalle de Usuario | Migro.es';
  }
  
  if (pathname.startsWith('/admin/contracts/') && !pathname.endsWith('/create')) {
    return 'Detalle de Contrato | Migro.es';
  }
  
  if (pathname.startsWith('/admin/conversations/')) {
    return 'Detalle de Conversación | Migro.es';
  }
  
  // Título por defecto
  return 'Migro.es - Contratación y Pago de Servicios Legales';
}


