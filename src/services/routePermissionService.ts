// Servicio de gestión de permisos de rutas dinámicas
import { localDatabase } from './localDatabase';
import type { RoutePermission } from './localDatabase';
import type { UserRole } from '@/types/user';

class RoutePermissionService {
  private routeCache: Map<string, RoutePermission | null> = new Map();
  private cacheExpiry: number = 5 * 60 * 1000; // 5 minutos
  private lastCacheUpdate: number = 0;

  /**
   * Verifica si un usuario tiene permiso para acceder a una ruta
   */
  async checkPermission(routePath: string, userRole: UserRole): Promise<boolean> {
    // Los admins y superusers siempre tienen acceso completo
    if (userRole === 'admin' || userRole === 'superuser') {
      return true;
    }

    // Solo verificar permisos para agentes y abogados
    if (userRole !== 'agent' && userRole !== 'lawyer') {
      return false;
    }

    try {
      return await localDatabase.checkRoutePermission(routePath, userRole);
    } catch (error) {
      console.error('Error verificando permiso de ruta:', error);
      // En caso de error, permitir acceso por defecto para no bloquear la aplicación
      return true;
    }
  }

  /**
   * Obtiene todos los permisos de rutas
   */
  async getAllPermissions(): Promise<RoutePermission[]> {
    try {
      const now = Date.now();
      // Invalidar caché si ha pasado el tiempo de expiración
      if (now - this.lastCacheUpdate > this.cacheExpiry) {
        this.routeCache.clear();
      }

      if (this.routeCache.size === 0 || now - this.lastCacheUpdate > this.cacheExpiry) {
        const permissions = await localDatabase.getAllRoutePermissions();
        this.lastCacheUpdate = now;
        // Actualizar caché
        permissions.forEach(perm => {
          this.routeCache.set(perm.route_path, perm);
        });
        return permissions;
      }

      // Devolver desde caché
      return Array.from(this.routeCache.values()).filter(p => p !== null) as RoutePermission[];
    } catch (error) {
      console.error('Error obteniendo permisos:', error);
      return [];
    }
  }

  /**
   * Obtiene el permiso de una ruta específica
   */
  async getRoutePermission(routePath: string): Promise<RoutePermission | null> {
    try {
      // Verificar caché primero
      if (this.routeCache.has(routePath)) {
        return this.routeCache.get(routePath) || null;
      }

      const permission = await localDatabase.getRoutePermission(routePath);
      this.routeCache.set(routePath, permission);
      return permission;
    } catch (error) {
      console.error('Error obteniendo permiso de ruta:', error);
      return null;
    }
  }

  /**
   * Actualiza el permiso de una ruta
   * Solo permite actualizar permisos de agentes y abogados
   */
  async updateRoutePermission(
    routePath: string,
    updates: {
      agent_allowed?: boolean;
      lawyer_allowed?: boolean;
      description?: string;
    }
  ): Promise<void> {
    try {
      await localDatabase.updateRoutePermission(routePath, updates);
      // Invalidar caché para esta ruta
      this.routeCache.delete(routePath);
      this.lastCacheUpdate = 0; // Forzar recarga completa
    } catch (error) {
      console.error('Error actualizando permiso:', error);
      throw error;
    }
  }

  /**
   * Agrega una nueva ruta al sistema de permisos
   */
  async addRoutePermission(
    routePath: string,
    module: string,
    description: string,
    agentAllowed: boolean = true,
    lawyerAllowed: boolean = true
  ): Promise<void> {
    try {
      await localDatabase.addRoutePermission(
        routePath,
        module,
        description,
        agentAllowed,
        lawyerAllowed
      );
      // Invalidar caché
      this.routeCache.delete(routePath);
      this.lastCacheUpdate = 0;
    } catch (error) {
      console.error('Error agregando permiso:', error);
      throw error;
    }
  }

  /**
   * Sincroniza las rutas desde App.tsx con la base de datos
   * Esto asegura que todas las rutas estén registradas
   */
  async syncRoutesFromApp(routes: Array<{
    path: string;
    module: string;
    description: string;
    defaultAgentAllowed?: boolean;
    defaultLawyerAllowed?: boolean;
  }>): Promise<void> {
    try {
      for (const route of routes) {
        await this.addRoutePermission(
          route.path,
          route.module,
          route.description,
          route.defaultAgentAllowed ?? true,
          route.defaultLawyerAllowed ?? true
        );
      }
      // Invalidar caché completo
      this.routeCache.clear();
      this.lastCacheUpdate = 0;
    } catch (error) {
      console.error('Error sincronizando rutas:', error);
      throw error;
    }
  }

  /**
   * Limpia la caché de permisos
   */
  clearCache(): void {
    this.routeCache.clear();
    this.lastCacheUpdate = 0;
  }
}

export const routePermissionService = new RoutePermissionService();

