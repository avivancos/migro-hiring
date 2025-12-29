// Servicio de base de datos SQLite local para privilegios, logging y tracing
import initSqlJs from 'sql.js';
import type { Database } from 'sql.js';

export interface RoutePermission {
  id: number;
  route_path: string;
  module: string;
  description: string;
  agent_allowed: boolean;
  lawyer_allowed: boolean;
  admin_allowed: boolean; // Siempre true, no modificable
  created_at: string;
  updated_at: string;
}

export interface LogEntry {
  id: number;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  context?: string;
  user_id?: string;
  user_role?: string;
  route_path?: string;
  metadata?: string; // JSON string
  created_at: string;
}

export interface TraceEntry {
  id: number;
  trace_id: string;
  span_id: string;
  operation: string;
  duration_ms: number;
  status: 'success' | 'error' | 'warning';
  user_id?: string;
  route_path?: string;
  metadata?: string; // JSON string
  created_at: string;
}

class LocalDatabaseService {
  private db: Database | null = null;
  private initPromise: Promise<void> | null = null;

  async initialize(): Promise<void> {
    if (this.db) {
      return;
    }

    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = this._initialize();
    return this.initPromise;
  }

  private async _initialize(): Promise<void> {
    try {
      const SQL = await initSqlJs({
        locateFile: (file: string) => `https://sql.js.org/dist/${file}`,
      });

      // Intentar cargar base de datos existente desde localStorage
      const savedDb = localStorage.getItem('migro_local_db');
      if (savedDb) {
        try {
          const uint8Array = new Uint8Array(JSON.parse(savedDb));
          this.db = new SQL.Database(uint8Array);
          console.log('✅ Base de datos SQLite cargada desde localStorage');
        } catch (error) {
          console.warn('⚠️ Error cargando BD desde localStorage, creando nueva:', error);
          this.db = new SQL.Database();
        }
      } else {
        this.db = new SQL.Database();
      }

      // Crear tablas si no existen
      this.createTables();

      // Guardar después de crear tablas
      this.saveDatabase();
    } catch (error) {
      console.error('❌ Error inicializando SQLite:', error);
      throw error;
    }
  }

  private createTables(): void {
    if (!this.db) return;

    // Tabla de permisos de rutas
    this.db.run(`
      CREATE TABLE IF NOT EXISTS route_permissions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        route_path TEXT NOT NULL UNIQUE,
        module TEXT NOT NULL,
        description TEXT,
        agent_allowed INTEGER DEFAULT 1,
        lawyer_allowed INTEGER DEFAULT 1,
        admin_allowed INTEGER DEFAULT 1,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now'))
      )
    `);

    // Tabla de logs
    this.db.run(`
      CREATE TABLE IF NOT EXISTS logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        level TEXT NOT NULL CHECK(level IN ('info', 'warn', 'error', 'debug')),
        message TEXT NOT NULL,
        context TEXT,
        user_id TEXT,
        user_role TEXT,
        route_path TEXT,
        metadata TEXT,
        created_at TEXT DEFAULT (datetime('now'))
      )
    `);

    // Tabla de tracing
    this.db.run(`
      CREATE TABLE IF NOT EXISTS traces (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        trace_id TEXT NOT NULL,
        span_id TEXT NOT NULL,
        operation TEXT NOT NULL,
        duration_ms REAL NOT NULL,
        status TEXT NOT NULL CHECK(status IN ('success', 'error', 'warning')),
        user_id TEXT,
        route_path TEXT,
        metadata TEXT,
        created_at TEXT DEFAULT (datetime('now'))
      )
    `);

    // Crear índices para mejor rendimiento
    this.db.run(`CREATE INDEX IF NOT EXISTS idx_route_permissions_path ON route_permissions(route_path)`);
    this.db.run(`CREATE INDEX IF NOT EXISTS idx_logs_level ON logs(level)`);
    this.db.run(`CREATE INDEX IF NOT EXISTS idx_logs_created_at ON logs(created_at)`);
    this.db.run(`CREATE INDEX IF NOT EXISTS idx_traces_trace_id ON traces(trace_id)`);
    this.db.run(`CREATE INDEX IF NOT EXISTS idx_traces_created_at ON traces(created_at)`);

    // Inicializar rutas por defecto si la tabla está vacía
    this.initializeDefaultRoutes();
  }

  private initializeDefaultRoutes(): void {
    if (!this.db) return;

    const countResult = this.db.exec('SELECT COUNT(*) as count FROM route_permissions');
    const count = countResult.length > 0 && countResult[0].values.length > 0 
      ? countResult[0].values[0][0] as number 
      : 0;

    if (count === 0) {
      const defaultRoutes = [
        { path: '/crm', module: 'CRM', description: 'Dashboard principal del CRM', agent: true, lawyer: true },
        { path: '/crm/contacts', module: 'CRM', description: 'Lista de contactos', agent: true, lawyer: true },
        { path: '/crm/contacts/:id', module: 'CRM', description: 'Detalle de contacto', agent: true, lawyer: true },
        { path: '/crm/contacts/:id/edit', module: 'CRM', description: 'Editar contacto', agent: true, lawyer: true },
        { path: '/crm/contacts/new', module: 'CRM', description: 'Crear contacto', agent: true, lawyer: true },
        { path: '/crm/leads', module: 'CRM', description: 'Lista de leads', agent: true, lawyer: true },
        { path: '/crm/leads/:id', module: 'CRM', description: 'Detalle de lead', agent: true, lawyer: true },
        { path: '/crm/opportunities', module: 'CRM', description: 'Lista de oportunidades', agent: true, lawyer: true },
        { path: '/crm/opportunities/:id', module: 'CRM', description: 'Detalle de oportunidad', agent: true, lawyer: true },
        { path: '/crm/calendar', module: 'CRM', description: 'Calendario de tareas', agent: true, lawyer: true },
        { path: '/crm/tasks/:id', module: 'CRM', description: 'Detalle de tarea', agent: true, lawyer: true },
        { path: '/crm/actions', module: 'CRM', description: 'Acciones', agent: true, lawyer: true },
        { path: '/crm/expedientes', module: 'CRM', description: 'Lista de expedientes', agent: true, lawyer: true },
        { path: '/crm/expedientes/:id', module: 'CRM', description: 'Detalle de expediente', agent: true, lawyer: true },
        { path: '/crm/call', module: 'CRM', description: 'Manejador de llamadas', agent: true, lawyer: true },
        { path: '/crm/settings', module: 'CRM', description: 'Configuración del CRM', agent: false, lawyer: true },
        { path: '/crm/settings/task-templates', module: 'CRM', description: 'Plantillas de tareas', agent: false, lawyer: true },
        { path: '/crm/settings/custom-fields', module: 'CRM', description: 'Campos personalizados', agent: false, lawyer: true },
        { path: '/crm/contracts', module: 'CRM', description: 'Contratos', agent: true, lawyer: true },
      ];

      const stmt = this.db.prepare(`
        INSERT INTO route_permissions (route_path, module, description, agent_allowed, lawyer_allowed, admin_allowed)
        VALUES (?, ?, ?, ?, ?, 1)
      `);

      for (const route of defaultRoutes) {
        stmt.run([
          route.path,
          route.module,
          route.description,
          route.agent ? 1 : 0,
          route.lawyer ? 1 : 0,
        ]);
      }

      stmt.free();
      this.saveDatabase();
    }
  }

  private saveDatabase(): void {
    if (!this.db) return;

    try {
      const data = this.db.export();
      const buffer = Array.from(data);
      localStorage.setItem('migro_local_db', JSON.stringify(buffer));
    } catch (error) {
      console.error('❌ Error guardando base de datos:', error);
    }
  }

  // ========== MÉTODOS DE PERMISOS DE RUTAS ==========

  async getAllRoutePermissions(): Promise<RoutePermission[]> {
    await this.initialize();
    if (!this.db) throw new Error('Base de datos no inicializada');

    const result = this.db.exec('SELECT * FROM route_permissions ORDER BY module, route_path');
    if (result.length === 0) return [];

    const columns = result[0].columns;
    const values = result[0].values;

    return values.map((row: any[]) => {
      const obj: any = {};
      columns.forEach((col: string, idx: number) => {
        obj[col] = row[idx];
      });
      return {
        id: obj.id,
        route_path: obj.route_path,
        module: obj.module,
        description: obj.description,
        agent_allowed: Boolean(obj.agent_allowed),
        lawyer_allowed: Boolean(obj.lawyer_allowed),
        admin_allowed: Boolean(obj.admin_allowed),
        created_at: obj.created_at,
        updated_at: obj.updated_at,
      } as RoutePermission;
    });
  }

  async getRoutePermission(routePath: string): Promise<RoutePermission | null> {
    await this.initialize();
    if (!this.db) throw new Error('Base de datos no inicializada');

    // Buscar ruta exacta primero
    let result = this.db.exec(
      'SELECT * FROM route_permissions WHERE route_path = ?',
      [routePath]
    );

    if (result.length > 0 && result[0].values.length > 0) {
      const row = result[0].values[0];
      const columns = result[0].columns;
      const obj: any = {};
      columns.forEach((col: string, idx: number) => {
        obj[col] = row[idx];
      });
      return {
        id: obj.id,
        route_path: obj.route_path,
        module: obj.module,
        description: obj.description,
        agent_allowed: Boolean(obj.agent_allowed),
        lawyer_allowed: Boolean(obj.lawyer_allowed),
        admin_allowed: Boolean(obj.admin_allowed),
        created_at: obj.created_at,
        updated_at: obj.updated_at,
      } as RoutePermission;
    }

    // Si no se encuentra, buscar por patrón (para rutas con parámetros como :id)
    const allRoutes = await this.getAllRoutePermissions();
    for (const route of allRoutes) {
      const pattern = route.route_path.replace(/:[^/]+/g, '[^/]+');
      const regex = new RegExp(`^${pattern}$`);
      if (regex.test(routePath)) {
        return route;
      }
    }

    return null;
  }

  async checkRoutePermission(routePath: string, userRole: 'admin' | 'lawyer' | 'agent' | 'superuser'): Promise<boolean> {
    // Los admins y superusers siempre tienen acceso
    if (userRole === 'admin' || userRole === 'superuser') {
      return true;
    }

    const permission = await this.getRoutePermission(routePath);
    if (!permission) {
      // Si no hay permiso definido, permitir acceso por defecto (comportamiento actual)
      return true;
    }

    if (userRole === 'agent') {
      return permission.agent_allowed;
    }

    if (userRole === 'lawyer') {
      return permission.lawyer_allowed;
    }

    return false;
  }

  async updateRoutePermission(
    routePath: string,
    updates: {
      agent_allowed?: boolean;
      lawyer_allowed?: boolean;
      description?: string;
    }
  ): Promise<void> {
    await this.initialize();
    if (!this.db) throw new Error('Base de datos no inicializada');

    const fields: string[] = [];
    const values: any[] = [];

    if (updates.agent_allowed !== undefined) {
      fields.push('agent_allowed = ?');
      values.push(updates.agent_allowed ? 1 : 0);
    }

    if (updates.lawyer_allowed !== undefined) {
      fields.push('lawyer_allowed = ?');
      values.push(updates.lawyer_allowed ? 1 : 0);
    }

    if (updates.description !== undefined) {
      fields.push('description = ?');
      values.push(updates.description);
    }

    fields.push('updated_at = datetime("now")');
    values.push(routePath);

    const sql = `UPDATE route_permissions SET ${fields.join(', ')} WHERE route_path = ?`;
    this.db.run(sql, values);
    this.saveDatabase();
  }

  async addRoutePermission(
    routePath: string,
    module: string,
    description: string,
    agentAllowed: boolean = true,
    lawyerAllowed: boolean = true
  ): Promise<void> {
    await this.initialize();
    if (!this.db) throw new Error('Base de datos no inicializada');

    this.db.run(
      `INSERT INTO route_permissions (route_path, module, description, agent_allowed, lawyer_allowed, admin_allowed)
       VALUES (?, ?, ?, ?, ?, 1)
       ON CONFLICT(route_path) DO UPDATE SET
         module = excluded.module,
         description = excluded.description,
         agent_allowed = excluded.agent_allowed,
         lawyer_allowed = excluded.lawyer_allowed,
         updated_at = datetime('now')`,
      [routePath, module, description, agentAllowed ? 1 : 0, lawyerAllowed ? 1 : 0]
    );
    this.saveDatabase();
  }

  // ========== MÉTODOS DE LOGGING ==========

  async log(
    level: 'info' | 'warn' | 'error' | 'debug',
    message: string,
    options?: {
      context?: string;
      user_id?: string;
      user_role?: string;
      route_path?: string;
      metadata?: Record<string, any>;
    }
  ): Promise<void> {
    await this.initialize();
    if (!this.db) {
      console.error('No se puede guardar log: base de datos no inicializada');
      return;
    }

    try {
      this.db.run(
        `INSERT INTO logs (level, message, context, user_id, user_role, route_path, metadata, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
        [
          level,
          message,
          options?.context || null,
          options?.user_id || null,
          options?.user_role || null,
          options?.route_path || null,
          options?.metadata ? JSON.stringify(options.metadata) : null,
        ]
      );
      this.saveDatabase();
    } catch (error) {
      console.error('Error guardando log:', error);
    }
  }

  async getLogs(options?: {
    level?: 'info' | 'warn' | 'error' | 'debug';
    limit?: number;
    offset?: number;
    route_path?: string;
    user_id?: string;
  }): Promise<LogEntry[]> {
    await this.initialize();
    if (!this.db) throw new Error('Base de datos no inicializada');

    let sql = 'SELECT * FROM logs WHERE 1=1';
    const params: any[] = [];

    if (options?.level) {
      sql += ' AND level = ?';
      params.push(options.level);
    }

    if (options?.route_path) {
      sql += ' AND route_path = ?';
      params.push(options.route_path);
    }

    if (options?.user_id) {
      sql += ' AND user_id = ?';
      params.push(options.user_id);
    }

    sql += ' ORDER BY created_at DESC';

    if (options?.limit) {
      sql += ' LIMIT ?';
      params.push(options.limit);
    }

    if (options?.offset) {
      sql += ' OFFSET ?';
      params.push(options.offset);
    }

    const result = this.db.exec(sql, params);
    if (result.length === 0) return [];

    const columns = result[0].columns;
    const values = result[0].values;

    return values.map((row: any[]) => {
      const obj: any = {};
      columns.forEach((col: string, idx: number) => {
        obj[col] = row[idx];
      });
      return {
        id: obj.id,
        level: obj.level,
        message: obj.message,
        context: obj.context,
        user_id: obj.user_id,
        user_role: obj.user_role,
        route_path: obj.route_path,
        metadata: obj.metadata ? JSON.parse(obj.metadata) : undefined,
        created_at: obj.created_at,
      } as LogEntry;
    });
  }

  // ========== MÉTODOS DE TRACING ==========

  async trace(
    traceId: string,
    spanId: string,
    operation: string,
    durationMs: number,
    status: 'success' | 'error' | 'warning',
    options?: {
      user_id?: string;
      route_path?: string;
      metadata?: Record<string, any>;
    }
  ): Promise<void> {
    await this.initialize();
    if (!this.db) {
      console.error('No se puede guardar trace: base de datos no inicializada');
      return;
    }

    try {
      this.db.run(
        `INSERT INTO traces (trace_id, span_id, operation, duration_ms, status, user_id, route_path, metadata, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
        [
          traceId,
          spanId,
          operation,
          durationMs,
          status,
          options?.user_id || null,
          options?.route_path || null,
          options?.metadata ? JSON.stringify(options.metadata) : null,
        ]
      );
      this.saveDatabase();
    } catch (error) {
      console.error('Error guardando trace:', error);
    }
  }

  async getTraces(options?: {
    trace_id?: string;
    limit?: number;
    offset?: number;
    route_path?: string;
    user_id?: string;
    status?: 'success' | 'error' | 'warning';
  }): Promise<TraceEntry[]> {
    await this.initialize();
    if (!this.db) throw new Error('Base de datos no inicializada');

    let sql = 'SELECT * FROM traces WHERE 1=1';
    const params: any[] = [];

    if (options?.trace_id) {
      sql += ' AND trace_id = ?';
      params.push(options.trace_id);
    }

    if (options?.route_path) {
      sql += ' AND route_path = ?';
      params.push(options.route_path);
    }

    if (options?.user_id) {
      sql += ' AND user_id = ?';
      params.push(options.user_id);
    }

    if (options?.status) {
      sql += ' AND status = ?';
      params.push(options.status);
    }

    sql += ' ORDER BY created_at DESC';

    if (options?.limit) {
      sql += ' LIMIT ?';
      params.push(options.limit);
    }

    if (options?.offset) {
      sql += ' OFFSET ?';
      params.push(options.offset);
    }

    const result = this.db.exec(sql, params);
    if (result.length === 0) return [];

    const columns = result[0].columns;
    const values = result[0].values;

    return values.map((row: any[]) => {
      const obj: any = {};
      columns.forEach((col: string, idx: number) => {
        obj[col] = row[idx];
      });
      return {
        id: obj.id,
        trace_id: obj.trace_id,
        span_id: obj.span_id,
        operation: obj.operation,
        duration_ms: obj.duration_ms,
        status: obj.status,
        user_id: obj.user_id,
        route_path: obj.route_path,
        metadata: obj.metadata ? JSON.parse(obj.metadata) : undefined,
        created_at: obj.created_at,
      } as TraceEntry;
    });
  }

  // ========== MÉTODOS DE LIMPIEZA ==========

  async clearOldLogs(daysToKeep: number = 30): Promise<void> {
    await this.initialize();
    if (!this.db) throw new Error('Base de datos no inicializada');

    this.db.run(
      `DELETE FROM logs WHERE created_at < datetime('now', '-' || ? || ' days')`,
      [daysToKeep]
    );
    this.saveDatabase();
  }

  async clearOldTraces(daysToKeep: number = 30): Promise<void> {
    await this.initialize();
    if (!this.db) throw new Error('Base de datos no inicializada');

    this.db.run(
      `DELETE FROM traces WHERE created_at < datetime('now', '-' || ? || ' days')`,
      [daysToKeep]
    );
    this.saveDatabase();
  }

  // ========== MÉTODOS DE EXPORTACIÓN ==========

  async exportDatabase(): Promise<Uint8Array> {
    await this.initialize();
    if (!this.db) throw new Error('Base de datos no inicializada');
    return this.db.export();
  }

  async importDatabase(data: Uint8Array): Promise<void> {
    await this.initialize();
    if (!this.db) throw new Error('Base de datos no inicializada');
    
    this.db.close();
    const SQL = await initSqlJs({
      locateFile: (file: string) => `https://sql.js.org/dist/${file}`,
    });
    this.db = new SQL.Database(data);
    this.saveDatabase();
  }
}

export const localDatabase = new LocalDatabaseService();

