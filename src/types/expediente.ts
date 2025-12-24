// Tipos TypeScript para el módulo de Expedientes
// Basado en la documentación del backend: expedientes_super_mega_prompt_modulo_completo.md

export type ExpedienteStatus = 
  | 'new' 
  | 'in_progress' 
  | 'pending_info' 
  | 'completed' 
  | 'archived';

export type ExpedienteSource = 
  | 'app' 
  | 'email' 
  | 'phone' 
  | 'manual';

export interface ExpedienteArchivoRead {
  id: string;
  expediente_id: string;
  nombre: string;
  tipo: string;
  url: string;
  tamaño: number;
  estado: 'pendiente' | 'aprobado' | 'rechazado';
  uploaded_by_id?: string;
  uploaded_at: string;
  validated_by_id?: string;
  validated_at?: string;
  validation_notes?: string;
}

export interface ExpedienteRead {
  id: string;
  user_id: string;
  title: string;
  status: ExpedienteStatus;
  source: ExpedienteSource;
  contact_method?: string;
  referred_by?: string;
  legal_situation?: string;
  income_source?: string;
  tags?: Record<string, any>;
  lists?: Record<string, any>;
  summary?: string;
  structured_data?: Record<string, any>;
  next_steps?: Record<string, any>;
  formulario_oficial_id?: string;
  numero_expediente_oficial?: string;
  fecha_presentacion?: string;
  fecha_resolucion?: string;
  resultado?: string;
  oficina_extranjeria?: string;
  created_at: string;
  updated_at: string;
}

export interface ExpedienteReadWithFiles extends ExpedienteRead {
  archivos: ExpedienteArchivoRead[];
}

export interface ExpedienteCreate {
  title: string;
  status?: ExpedienteStatus;
  source?: ExpedienteSource;
  contact_method?: string;
  referred_by?: string;
  legal_situation?: string;
  income_source?: string;
  tags?: Record<string, any>;
  lists?: Record<string, any>;
  summary?: string;
  structured_data?: Record<string, any>;
  next_steps?: Record<string, any>;
}

export interface ExpedienteUpdate {
  title?: string;
  status?: ExpedienteStatus;
  summary?: string;
  structured_data?: Record<string, any>;
  next_steps?: Record<string, any>;
  legal_situation?: string;
  numero_expediente_oficial?: string;
  fecha_presentacion?: string;
  fecha_resolucion?: string;
  resultado?: string;
  oficina_extranjeria?: string;
}

export interface ExpedienteListResponse {
  items: ExpedienteRead[];
  total: number;
  skip: number;
  limit: number;
}

export interface ExpedienteSearchResponse {
  items: ExpedienteRead[];
  total: number;
  page: number;
  limit: number;
  highlighted_fields?: Record<string, string[]>;
}

export interface FormularioSeleccionResponse {
  expediente_id: string;
  formulario_oficial: {
    id: string;
    codigo: string;
    nombre: string;
    descripcion?: string;
  };
  checklist: ChecklistResponse;
  mensaje: string;
}

export interface ChecklistResponse {
  formulario: string;
  documentos_requeridos: DocumentoRequisito[];
  progreso: {
    obligatorios: { total: number; presentados: number };
    opcionales: { total: number; presentados: number };
  };
}

export interface DocumentoRequisito {
  id: string;
  codigo: string;
  nombre: string;
  descripcion?: string;
  obligatorio: boolean;
  presentado: boolean;
  archivo_id?: string;
  categoria?: string;
}

export interface CompletitudResponse {
  completo: boolean;
  porcentaje: number;
  requisitos: {
    obligatorios: RequisitoDocumento[];
    opcionales: RequisitoDocumento[];
  };
  faltantes: RequisitoDocumento[];
}

export interface RequisitoDocumento {
  codigo: string;
  nombre: string;
  descripcion?: string;
  categoria?: string;
}

export interface ExpedienteHistorialRead {
  id: string;
  expediente_id: string;
  campo_modificado: string;
  valor_anterior?: any;
  valor_nuevo?: any;
  usuario_id: string;
  usuario_nombre?: string;
  accion: string;
  comentario?: string;
  created_at: string;
}

export interface ExpedienteHistorialResponse {
  items: ExpedienteHistorialRead[];
  total: number;
  skip: number;
  limit: number;
}

export interface CambiarEstadoRequest {
  nuevo_status: ExpedienteStatus;
  comentario?: string;
}

export interface ExpedienteEstadisticas {
  progreso_documentacion: {
    porcentaje: number;
    obligatorios_presentados: number;
    obligatorios_total: number;
    opcionales_presentados: number;
    opcionales_total: number;
  };
  tiempo_estados: {
    new?: number;
    in_progress?: number;
    pending_info?: number;
    completed?: number;
    archived?: number;
  };
  archivos_por_estado: {
    pendiente: number;
    aprobado: number;
    rechazado: number;
  };
  proximas_acciones: AccionSiguiente[];
}

export interface AccionSiguiente {
  tipo: string;
  descripcion: string;
  fecha_limite?: string;
  prioridad: 'baja' | 'media' | 'alta' | 'urgente';
}

export interface ExpedienteFilters {
  user_id?: string;
  status?: ExpedienteStatus;
  formulario_id?: string;
  search?: string;
  date_from?: string;
  date_to?: string;
  skip?: number;
  limit?: number;
  order_by?: string;
  order_desc?: boolean;
}






