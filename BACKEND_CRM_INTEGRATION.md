# 🎯 Documentación Técnica: Integración CRM en api.migro.es

## 📋 Índice
1. [Contexto General](#contexto-general)
2. [Arquitectura de Base de Datos](#arquitectura-de-base-de-datos)
3. [Modelos SQLAlchemy](#modelos-sqlalchemy)
4. [Modelos Pydantic (Schemas)](#modelos-pydantic-schemas)
5. [Endpoints API](#endpoints-api)
6. [Lógica de Negocio](#lógica-de-negocio)
7. [Integraciones Externas](#integraciones-externas)
8. [Testing](#testing)

---

## 🎯 Contexto General

### Objetivo
Transformar el panel `/admin` en un CRM completo siguiendo los esquemas de datos de **Kommo API**, manteniendo compatibilidad con las tablas existentes de `users` (administradores) y `hirings` (códigos de contratación).

### Tecnologías
- **Backend:** FastAPI + SQLAlchemy + PostgreSQL
- **Frontend:** React + TypeScript
- **Integraciones:** CloudTalk (llamadas), Kommo (opcional, futuro)

### Principios de Diseño
1. **Base de datos propia como fuente principal** (no depender de Kommo)
2. **Esquemas compatibles con Kommo API** para facilitar sincronización futura
3. **Relaciones claras** entre CRM y sistema de contratación existente
4. **Soft deletes** para mantener histórico

---

## 🗄️ Arquitectura de Base de Datos

### Integración con Tablas Existentes

#### Tablas Actuales (mantener)
```sql
-- users: Usuarios administradores del sistema
-- hirings: Códigos de contratación generados
```

#### Nueva Estrategia de Relaciones

```
┌──────────────┐
│   users      │ (existente - admins del sistema)
└──────┬───────┘
       │
       │ 1:N (created_by, updated_by, responsible)
       ↓
┌──────────────┐      ┌──────────────┐      ┌──────────────┐
│ crm_users    │      │   pipelines  │      │  companies   │
│ (agentes CRM)│      │              │      │              │
└──────┬───────┘      └──────┬───────┘      └──────┬───────┘
       │                     │                      │
       │ N:1                 │ 1:N                  │ 1:N
       │                     ↓                      ↓
       │              ┌──────────────┐       ┌──────────────┐
       │              │pipeline_stages│      │   contacts   │
       │              └──────┬───────┘       └──────┬───────┘
       │                     │                      │
       │                     │ N:1                  │ N:M
       │                     ↓                      ↓
       └─────────────→ ┌──────────────┐ ←──────────┘
                       │    leads     │
                       │ (clientes    │
                       │  potenciales)│
                       └──────┬───────┘
                              │
                              │ 1:1 (opcional)
                              ↓
                       ┌──────────────┐
                       │   hirings    │ (existente)
                       │ (si lead se  │
                       │  convierte)  │
                       └──────────────┘
                              │
                ┌─────────────┼─────────────┐
                ↓             ↓             ↓
         ┌──────────┐  ┌──────────┐  ┌──────────┐
         │  tasks   │  │  notes   │  │  calls   │
         └──────────┘  └──────────┘  └──────────┘
```

### Esquema SQL Completo

```sql
-- =============================================================================
-- TABLA: crm_users (Agentes CRM - diferente de users que son admins)
-- =============================================================================
CREATE TABLE crm_users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(50),
    role_name VARCHAR(100), -- 'Comercial', 'Abogado', 'Manager', etc.
    is_active BOOLEAN DEFAULT TRUE,
    avatar_url TEXT,
    
    -- Relación con users (admin que creó este agente)
    created_by_admin_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    
    -- Metadatos
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    -- Índices
    CONSTRAINT crm_users_email_key UNIQUE (email)
);

CREATE INDEX idx_crm_users_active ON crm_users(is_active);
CREATE INDEX idx_crm_users_email ON crm_users(email);

-- =============================================================================
-- TABLA: pipelines (Embudos de ventas)
-- =============================================================================
CREATE TABLE pipelines (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    sort INTEGER DEFAULT 0,
    is_main BOOLEAN DEFAULT FALSE,
    is_archive BOOLEAN DEFAULT FALSE,
    
    -- Metadatos
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_pipelines_main ON pipelines(is_main);
CREATE INDEX idx_pipelines_archive ON pipelines(is_archive);

-- Insertar pipeline por defecto
INSERT INTO pipelines (name, description, is_main, sort) VALUES
('Pipeline Principal', 'Embudo de ventas por defecto', TRUE, 1);

-- =============================================================================
-- TABLA: pipeline_statuses (Etapas/Estados del pipeline)
-- =============================================================================
CREATE TABLE pipeline_statuses (
    id SERIAL PRIMARY KEY,
    pipeline_id INTEGER NOT NULL REFERENCES pipelines(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    sort INTEGER DEFAULT 0,
    color VARCHAR(20) DEFAULT '#3B82F6', -- Color hex
    is_editable BOOLEAN DEFAULT TRUE,
    
    -- Tipos de estado (0=intermedio, 1=éxito, 2=fracaso)
    type INTEGER DEFAULT 0,
    
    -- Metadatos
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_pipeline_statuses_pipeline ON pipeline_statuses(pipeline_id);
CREATE INDEX idx_pipeline_statuses_sort ON pipeline_statuses(pipeline_id, sort);

-- Insertar estados por defecto para pipeline principal
INSERT INTO pipeline_statuses (pipeline_id, name, sort, color, type) VALUES
(1, 'Nuevo Lead', 1, '#94A3B8', 0),
(1, 'Contactado', 2, '#3B82F6', 0),
(1, 'Calificado', 3, '#8B5CF6', 0),
(1, 'Propuesta Enviada', 4, '#F59E0B', 0),
(1, 'Negociación', 5, '#EC4899', 0),
(1, 'Contrato Enviado', 6, '#10B981', 0),
(1, 'Cliente', 7, '#16A34A', 1),
(1, 'Perdido', 8, '#EF4444', 2);

-- =============================================================================
-- TABLA: companies (Empresas/Organizaciones)
-- =============================================================================
CREATE TABLE companies (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    website VARCHAR(255),
    industry VARCHAR(100),
    
    -- Información de contacto
    phone VARCHAR(50),
    email VARCHAR(255),
    address TEXT,
    city VARCHAR(100),
    country VARCHAR(100) DEFAULT 'España',
    
    -- Responsable
    responsible_user_id INTEGER REFERENCES crm_users(id) ON DELETE SET NULL,
    
    -- Custom fields (JSON flexible para campos personalizados)
    custom_fields JSONB,
    
    -- Soft delete
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMP,
    
    -- Metadatos
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    updated_by INTEGER REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_companies_name ON companies(name) WHERE is_deleted = FALSE;
CREATE INDEX idx_companies_responsible ON companies(responsible_user_id);
CREATE INDEX idx_companies_deleted ON companies(is_deleted);

-- =============================================================================
-- TABLA: contacts (Contactos individuales)
-- =============================================================================
CREATE TABLE contacts (
    id SERIAL PRIMARY KEY,
    
    -- Información personal
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100),
    full_name VARCHAR(255) GENERATED ALWAYS AS (first_name || ' ' || COALESCE(last_name, '')) STORED,
    
    -- Información de contacto
    email VARCHAR(255),
    phone VARCHAR(50),
    mobile VARCHAR(50),
    
    -- Ubicación
    address TEXT,
    city VARCHAR(100),
    country VARCHAR(100) DEFAULT 'España',
    
    -- Relaciones
    company_id INTEGER REFERENCES companies(id) ON DELETE SET NULL,
    responsible_user_id INTEGER REFERENCES crm_users(id) ON DELETE SET NULL,
    
    -- Información adicional
    position VARCHAR(100), -- Cargo en la empresa
    notes TEXT,
    
    -- Custom fields
    custom_fields JSONB,
    
    -- Soft delete
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMP,
    
    -- Metadatos
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    updated_by INTEGER REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_contacts_email ON contacts(email) WHERE is_deleted = FALSE;
CREATE INDEX idx_contacts_phone ON contacts(phone) WHERE is_deleted = FALSE;
CREATE INDEX idx_contacts_company ON contacts(company_id);
CREATE INDEX idx_contacts_responsible ON contacts(responsible_user_id);
CREATE INDEX idx_contacts_name ON contacts(first_name, last_name) WHERE is_deleted = FALSE;

-- =============================================================================
-- TABLA: leads (Oportunidades de negocio - CENTRAL del CRM)
-- =============================================================================
CREATE TABLE leads (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL, -- Ej: "Residencia Legal - Juan Pérez"
    
    -- Valor económico
    price DECIMAL(10,2), -- Valor estimado del lead
    currency VARCHAR(3) DEFAULT 'EUR',
    
    -- Pipeline y estado
    pipeline_id INTEGER NOT NULL REFERENCES pipelines(id) ON DELETE RESTRICT,
    status_id INTEGER NOT NULL REFERENCES pipeline_statuses(id) ON DELETE RESTRICT,
    
    -- Responsable del lead
    responsible_user_id INTEGER NOT NULL REFERENCES crm_users(id) ON DELETE RESTRICT,
    
    -- Relaciones
    contact_id INTEGER REFERENCES contacts(id) ON DELETE SET NULL,
    company_id INTEGER REFERENCES companies(id) ON DELETE SET NULL,
    
    -- **INTEGRACIÓN CON SISTEMA EXISTENTE**
    -- Si el lead se convierte en cliente, se genera un hiring_code
    hiring_id INTEGER REFERENCES hirings(id) ON DELETE SET NULL,
    
    -- Prioridad y scoring
    priority VARCHAR(20) DEFAULT 'medium', -- 'low', 'medium', 'high', 'urgent'
    score INTEGER DEFAULT 0, -- Puntuación del lead (0-100)
    
    -- Información del servicio
    service_type VARCHAR(100), -- 'Residencia Legal', 'Reagrupación Familiar', etc.
    service_description TEXT,
    
    -- Origen del lead
    source VARCHAR(100), -- 'Web', 'Referido', 'Llamada Fría', 'Evento', etc.
    
    -- Fechas importantes
    closest_task_at TIMESTAMP, -- Próxima tarea programada
    expected_close_date DATE, -- Fecha esperada de cierre
    closed_at TIMESTAMP, -- Fecha de cierre (si se ganó o perdió)
    
    -- Notas y observaciones
    description TEXT,
    
    -- Custom fields (JSON flexible)
    custom_fields JSONB,
    
    -- Soft delete
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMP,
    
    -- Metadatos
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    updated_by INTEGER REFERENCES users(id) ON DELETE SET NULL
);

-- Índices para performance
CREATE INDEX idx_leads_pipeline_status ON leads(pipeline_id, status_id) WHERE is_deleted = FALSE;
CREATE INDEX idx_leads_responsible ON leads(responsible_user_id) WHERE is_deleted = FALSE;
CREATE INDEX idx_leads_contact ON leads(contact_id);
CREATE INDEX idx_leads_company ON leads(company_id);
CREATE INDEX idx_leads_hiring ON leads(hiring_id);
CREATE INDEX idx_leads_created_at ON leads(created_at DESC);
CREATE INDEX idx_leads_priority ON leads(priority) WHERE is_deleted = FALSE;
CREATE INDEX idx_leads_source ON leads(source);

-- Índice para búsqueda full-text
CREATE INDEX idx_leads_name_trgm ON leads USING gin(name gin_trgm_ops);

-- =============================================================================
-- TABLA: tasks (Tareas/Recordatorios)
-- =============================================================================
CREATE TABLE tasks (
    id SERIAL PRIMARY KEY,
    
    -- Descripción de la tarea
    text TEXT NOT NULL,
    task_type VARCHAR(50) DEFAULT 'call', -- 'call', 'meeting', 'email', 'deadline', 'follow_up'
    
    -- Entidad relacionada (polimórfica)
    entity_type VARCHAR(50) NOT NULL, -- 'lead', 'contact', 'company'
    entity_id INTEGER NOT NULL,
    
    -- Responsable
    responsible_user_id INTEGER NOT NULL REFERENCES crm_users(id) ON DELETE CASCADE,
    
    -- Fechas
    due_date TIMESTAMP NOT NULL,
    completed_at TIMESTAMP,
    is_completed BOOLEAN DEFAULT FALSE,
    
    -- Resultado de la tarea
    result_text TEXT,
    
    -- Metadatos
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_tasks_entity ON tasks(entity_type, entity_id);
CREATE INDEX idx_tasks_responsible ON tasks(responsible_user_id, is_completed);
CREATE INDEX idx_tasks_due_date ON tasks(due_date) WHERE is_completed = FALSE;
CREATE INDEX idx_tasks_completed ON tasks(is_completed, completed_at);

-- =============================================================================
-- TABLA: notes (Notas/Comentarios)
-- =============================================================================
CREATE TABLE notes (
    id SERIAL PRIMARY KEY,
    
    -- Entidad relacionada (polimórfica)
    entity_type VARCHAR(50) NOT NULL, -- 'lead', 'contact', 'company'
    entity_id INTEGER NOT NULL,
    
    -- Tipo de nota
    note_type VARCHAR(50) DEFAULT 'comment', -- 'comment', 'call', 'meeting', 'email', 'system'
    
    -- Contenido
    content TEXT NOT NULL,
    
    -- Parámetros adicionales (JSON)
    -- Para llamadas: {duration: 120, phone: "+34..."}
    -- Para emails: {subject: "...", to: "..."}
    params JSONB,
    
    -- Autor
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    
    -- Metadatos
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_notes_entity ON notes(entity_type, entity_id);
CREATE INDEX idx_notes_created_at ON notes(created_at DESC);
CREATE INDEX idx_notes_type ON notes(note_type);

-- =============================================================================
-- TABLA: calls (Registro de llamadas - Integración CloudTalk)
-- =============================================================================
CREATE TABLE calls (
    id SERIAL PRIMARY KEY,
    
    -- ID de CloudTalk (si aplica)
    cloudtalk_id VARCHAR(255) UNIQUE,
    
    -- Entidad relacionada
    entity_type VARCHAR(50) NOT NULL, -- 'lead', 'contact'
    entity_id INTEGER NOT NULL,
    
    -- Información de la llamada
    direction VARCHAR(20) NOT NULL, -- 'inbound', 'outbound'
    phone_number VARCHAR(50) NOT NULL,
    
    -- Duración y estado
    duration INTEGER DEFAULT 0, -- segundos
    status VARCHAR(50) NOT NULL, -- 'answered', 'missed', 'busy', 'no-answer', 'failed'
    
    -- Grabación
    recording_url TEXT,
    
    -- Responsable
    responsible_user_id INTEGER REFERENCES crm_users(id) ON DELETE SET NULL,
    
    -- Fechas
    started_at TIMESTAMP NOT NULL,
    ended_at TIMESTAMP,
    
    -- Notas post-llamada
    notes TEXT,
    
    -- Metadatos
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_calls_entity ON calls(entity_type, entity_id);
CREATE INDEX idx_calls_cloudtalk ON calls(cloudtalk_id);
CREATE INDEX idx_calls_phone ON calls(phone_number);
CREATE INDEX idx_calls_started ON calls(started_at DESC);
CREATE INDEX idx_calls_responsible ON calls(responsible_user_id);

-- =============================================================================
-- TABLA: tags (Etiquetas para cualquier entidad)
-- =============================================================================
CREATE TABLE tags (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    color VARCHAR(20) DEFAULT '#3B82F6',
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_tags_name ON tags(name);

-- =============================================================================
-- TABLA: entity_tags (Relación muchos a muchos con entidades)
-- =============================================================================
CREATE TABLE entity_tags (
    id SERIAL PRIMARY KEY,
    entity_type VARCHAR(50) NOT NULL, -- 'lead', 'contact', 'company'
    entity_id INTEGER NOT NULL,
    tag_id INTEGER NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW(),
    
    UNIQUE(entity_type, entity_id, tag_id)
);

CREATE INDEX idx_entity_tags_entity ON entity_tags(entity_type, entity_id);
CREATE INDEX idx_entity_tags_tag ON entity_tags(tag_id);

-- =============================================================================
-- TABLA: crm_settings (Configuración general del CRM)
-- =============================================================================
CREATE TABLE crm_settings (
    id SERIAL PRIMARY KEY,
    key VARCHAR(100) NOT NULL UNIQUE,
    value JSONB NOT NULL,
    description TEXT,
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Configuraciones iniciales
INSERT INTO crm_settings (key, value, description) VALUES
('default_pipeline_id', '1', 'Pipeline por defecto para nuevos leads'),
('default_status_id', '1', 'Estado por defecto para nuevos leads'),
('lead_sources', '["Web", "Referido", "Llamada Fría", "Evento", "Red Social", "Publicidad", "Colaborador"]', 'Fuentes de leads disponibles'),
('service_types', '["Residencia Legal", "Reagrupación Familiar", "Nacionalidad Española", "NIE", "TIE", "Autorización de Trabajo", "Arraigo", "Otros Trámites"]', 'Tipos de servicios ofrecidos');

-- =============================================================================
-- FUNCIÓN: Actualizar updated_at automáticamente
-- =============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Aplicar trigger a todas las tablas relevantes
CREATE TRIGGER update_crm_users_updated_at BEFORE UPDATE ON crm_users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pipelines_updated_at BEFORE UPDATE ON pipelines
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON companies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_contacts_updated_at BEFORE UPDATE ON contacts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_leads_updated_at BEFORE UPDATE ON leads
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- MODIFICACIÓN: Tabla hirings (agregar relación inversa opcional)
-- =============================================================================
-- Si quieres tracking bidireccional:
ALTER TABLE hirings ADD COLUMN IF NOT EXISTS lead_id INTEGER REFERENCES leads(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_hirings_lead ON hirings(lead_id);

COMMENT ON COLUMN hirings.lead_id IS 'Lead del CRM que generó este código de contratación';
```

---

## 🔷 Modelos SQLAlchemy

**Archivo:** `app/models/crm.py`

```python
from sqlalchemy import Column, Integer, String, Text, Boolean, DECIMAL, ForeignKey, TIMESTAMP, JSON, CheckConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.base_class import Base

class CRMUser(Base):
    """Agentes CRM (comerciales, abogados, managers)"""
    __tablename__ = "crm_users"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, nullable=False, index=True)
    phone = Column(String(50))
    role_name = Column(String(100))
    is_active = Column(Boolean, default=True, index=True)
    avatar_url = Column(Text)
    
    # Relación con admin que lo creó
    created_by_admin_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"))
    
    # Timestamps
    created_at = Column(TIMESTAMP, server_default=func.now())
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())
    
    # Relationships
    leads = relationship("Lead", back_populates="responsible_user", foreign_keys="[Lead.responsible_user_id]")
    tasks = relationship("Task", back_populates="responsible_user")


class Pipeline(Base):
    """Embudos de ventas"""
    __tablename__ = "pipelines"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text)
    sort = Column(Integer, default=0)
    is_main = Column(Boolean, default=False, index=True)
    is_archive = Column(Boolean, default=False, index=True)
    
    created_at = Column(TIMESTAMP, server_default=func.now())
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())
    created_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"))
    
    # Relationships
    statuses = relationship("PipelineStatus", back_populates="pipeline", cascade="all, delete-orphan")
    leads = relationship("Lead", back_populates="pipeline")


class PipelineStatus(Base):
    """Estados/Etapas de un pipeline"""
    __tablename__ = "pipeline_statuses"
    
    id = Column(Integer, primary_key=True, index=True)
    pipeline_id = Column(Integer, ForeignKey("pipelines.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text)
    sort = Column(Integer, default=0, index=True)
    color = Column(String(20), default="#3B82F6")
    is_editable = Column(Boolean, default=True)
    type = Column(Integer, default=0)  # 0=intermedio, 1=éxito, 2=fracaso
    
    created_at = Column(TIMESTAMP, server_default=func.now())
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())
    
    # Relationships
    pipeline = relationship("Pipeline", back_populates="statuses")
    leads = relationship("Lead", back_populates="status")


class Company(Base):
    """Empresas/Organizaciones"""
    __tablename__ = "companies"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False, index=True)
    description = Column(Text)
    website = Column(String(255))
    industry = Column(String(100))
    
    # Contacto
    phone = Column(String(50))
    email = Column(String(255))
    address = Column(Text)
    city = Column(String(100))
    country = Column(String(100), default="España")
    
    # Responsable
    responsible_user_id = Column(Integer, ForeignKey("crm_users.id", ondelete="SET NULL"), index=True)
    
    # Custom fields
    custom_fields = Column(JSON)
    
    # Soft delete
    is_deleted = Column(Boolean, default=False, index=True)
    deleted_at = Column(TIMESTAMP)
    
    # Timestamps
    created_at = Column(TIMESTAMP, server_default=func.now())
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())
    created_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"))
    updated_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"))
    
    # Relationships
    contacts = relationship("Contact", back_populates="company")
    leads = relationship("Lead", back_populates="company")


class Contact(Base):
    """Contactos individuales"""
    __tablename__ = "contacts"
    
    id = Column(Integer, primary_key=True, index=True)
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100))
    
    # Contacto
    email = Column(String(255), index=True)
    phone = Column(String(50), index=True)
    mobile = Column(String(50))
    address = Column(Text)
    city = Column(String(100))
    country = Column(String(100), default="España")
    
    # Relaciones
    company_id = Column(Integer, ForeignKey("companies.id", ondelete="SET NULL"), index=True)
    responsible_user_id = Column(Integer, ForeignKey("crm_users.id", ondelete="SET NULL"), index=True)
    
    position = Column(String(100))
    notes = Column(Text)
    custom_fields = Column(JSON)
    
    # Soft delete
    is_deleted = Column(Boolean, default=False, index=True)
    deleted_at = Column(TIMESTAMP)
    
    # Timestamps
    created_at = Column(TIMESTAMP, server_default=func.now())
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())
    created_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"))
    updated_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"))
    
    # Relationships
    company = relationship("Company", back_populates="contacts")
    leads = relationship("Lead", back_populates="contact")


class Lead(Base):
    """Oportunidades de negocio - CENTRAL del CRM"""
    __tablename__ = "leads"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    
    # Valor
    price = Column(DECIMAL(10, 2))
    currency = Column(String(3), default="EUR")
    
    # Pipeline
    pipeline_id = Column(Integer, ForeignKey("pipelines.id", ondelete="RESTRICT"), nullable=False, index=True)
    status_id = Column(Integer, ForeignKey("pipeline_statuses.id", ondelete="RESTRICT"), nullable=False, index=True)
    
    # Responsable
    responsible_user_id = Column(Integer, ForeignKey("crm_users.id", ondelete="RESTRICT"), nullable=False, index=True)
    
    # Relaciones
    contact_id = Column(Integer, ForeignKey("contacts.id", ondelete="SET NULL"), index=True)
    company_id = Column(Integer, ForeignKey("companies.id", ondelete="SET NULL"), index=True)
    
    # **INTEGRACIÓN CON HIRING**
    hiring_id = Column(Integer, ForeignKey("hirings.id", ondelete="SET NULL"), index=True)
    
    # Prioridad
    priority = Column(String(20), default="medium", index=True)
    score = Column(Integer, default=0)
    
    # Servicio
    service_type = Column(String(100), index=True)
    service_description = Column(Text)
    source = Column(String(100), index=True)
    
    # Fechas
    closest_task_at = Column(TIMESTAMP)
    expected_close_date = Column(TIMESTAMP)
    closed_at = Column(TIMESTAMP)
    
    description = Column(Text)
    custom_fields = Column(JSON)
    
    # Soft delete
    is_deleted = Column(Boolean, default=False, index=True)
    deleted_at = Column(TIMESTAMP)
    
    # Timestamps
    created_at = Column(TIMESTAMP, server_default=func.now(), index=True)
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())
    created_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"))
    updated_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"))
    
    # Relationships
    pipeline = relationship("Pipeline", back_populates="leads")
    status = relationship("PipelineStatus", back_populates="leads")
    responsible_user = relationship("CRMUser", back_populates="leads", foreign_keys=[responsible_user_id])
    contact = relationship("Contact", back_populates="leads")
    company = relationship("Company", back_populates="leads")
    hiring = relationship("Hiring", foreign_keys=[hiring_id])
    tasks = relationship("Task", primaryjoin="and_(Task.entity_type=='lead', foreign(Task.entity_id)==Lead.id)")
    notes = relationship("Note", primaryjoin="and_(Note.entity_type=='lead', foreign(Note.entity_id)==Lead.id)")


class Task(Base):
    """Tareas/Recordatorios"""
    __tablename__ = "tasks"
    
    id = Column(Integer, primary_key=True, index=True)
    text = Column(Text, nullable=False)
    task_type = Column(String(50), default="call")
    
    # Polimórfica
    entity_type = Column(String(50), nullable=False, index=True)
    entity_id = Column(Integer, nullable=False, index=True)
    
    responsible_user_id = Column(Integer, ForeignKey("crm_users.id", ondelete="CASCADE"), nullable=False, index=True)
    
    due_date = Column(TIMESTAMP, nullable=False, index=True)
    completed_at = Column(TIMESTAMP)
    is_completed = Column(Boolean, default=False, index=True)
    result_text = Column(Text)
    
    created_at = Column(TIMESTAMP, server_default=func.now())
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())
    created_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"))
    
    # Relationships
    responsible_user = relationship("CRMUser", back_populates="tasks")


class Note(Base):
    """Notas/Comentarios"""
    __tablename__ = "notes"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # Polimórfica
    entity_type = Column(String(50), nullable=False, index=True)
    entity_id = Column(Integer, nullable=False, index=True)
    
    note_type = Column(String(50), default="comment", index=True)
    content = Column(Text, nullable=False)
    params = Column(JSON)
    
    created_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"))
    created_at = Column(TIMESTAMP, server_default=func.now(), index=True)
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())


class Call(Base):
    """Registro de llamadas"""
    __tablename__ = "calls"
    
    id = Column(Integer, primary_key=True, index=True)
    cloudtalk_id = Column(String(255), unique=True, index=True)
    
    # Polimórfica
    entity_type = Column(String(50), nullable=False, index=True)
    entity_id = Column(Integer, nullable=False, index=True)
    
    direction = Column(String(20), nullable=False)
    phone_number = Column(String(50), nullable=False, index=True)
    duration = Column(Integer, default=0)
    status = Column(String(50), nullable=False)
    recording_url = Column(Text)
    
    responsible_user_id = Column(Integer, ForeignKey("crm_users.id", ondelete="SET NULL"), index=True)
    
    started_at = Column(TIMESTAMP, nullable=False, index=True)
    ended_at = Column(TIMESTAMP)
    notes = Column(Text)
    
    created_at = Column(TIMESTAMP, server_default=func.now())
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())
```

---

## 📝 Modelos Pydantic (Schemas)

**Archivo:** `app/schemas/crm.py`

```python
from pydantic import BaseModel, EmailStr, Field, validator
from typing import Optional, List, Dict, Any
from datetime import datetime
from decimal import Decimal

# ===== CRM USER =====
class CRMUserBase(BaseModel):
    name: str
    email: EmailStr
    phone: Optional[str] = None
    role_name: Optional[str] = None
    is_active: bool = True
    avatar_url: Optional[str] = None

class CRMUserCreate(CRMUserBase):
    pass

class CRMUserUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    role_name: Optional[str] = None
    is_active: Optional[bool] = None
    avatar_url: Optional[str] = None

class CRMUser(CRMUserBase):
    id: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


# ===== PIPELINE =====
class PipelineStatusBase(BaseModel):
    name: str
    description: Optional[str] = None
    sort: int = 0
    color: str = "#3B82F6"
    is_editable: bool = True
    type: int = 0

class PipelineStatusCreate(PipelineStatusBase):
    pipeline_id: int

class PipelineStatus(PipelineStatusBase):
    id: int
    pipeline_id: int
    created_at: datetime
    
    class Config:
        from_attributes = True


class PipelineBase(BaseModel):
    name: str
    description: Optional[str] = None
    sort: int = 0
    is_main: bool = False
    is_archive: bool = False

class PipelineCreate(PipelineBase):
    pass

class Pipeline(PipelineBase):
    id: int
    created_at: datetime
    updated_at: datetime
    statuses: Optional[List[PipelineStatus]] = []
    
    class Config:
        from_attributes = True


# ===== COMPANY =====
class CompanyBase(BaseModel):
    name: str
    description: Optional[str] = None
    website: Optional[str] = None
    industry: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    country: str = "España"
    responsible_user_id: Optional[int] = None
    custom_fields: Optional[Dict[str, Any]] = None

class CompanyCreate(CompanyBase):
    pass

class CompanyUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    website: Optional[str] = None
    industry: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    country: Optional[str] = None
    responsible_user_id: Optional[int] = None
    custom_fields: Optional[Dict[str, Any]] = None

class Company(CompanyBase):
    id: int
    is_deleted: bool
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


# ===== CONTACT =====
class ContactBase(BaseModel):
    first_name: str
    last_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    mobile: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    country: str = "España"
    company_id: Optional[int] = None
    responsible_user_id: Optional[int] = None
    position: Optional[str] = None
    notes: Optional[str] = None
    custom_fields: Optional[Dict[str, Any]] = None

class ContactCreate(ContactBase):
    pass

class ContactUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    mobile: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    country: Optional[str] = None
    company_id: Optional[int] = None
    responsible_user_id: Optional[int] = None
    position: Optional[str] = None
    notes: Optional[str] = None
    custom_fields: Optional[Dict[str, Any]] = None

class Contact(ContactBase):
    id: int
    is_deleted: bool
    created_at: datetime
    updated_at: datetime
    company: Optional[Company] = None
    
    class Config:
        from_attributes = True


# ===== LEAD (PRINCIPAL) =====
class LeadBase(BaseModel):
    name: str
    price: Optional[Decimal] = None
    currency: str = "EUR"
    pipeline_id: int
    status_id: int
    responsible_user_id: int
    contact_id: Optional[int] = None
    company_id: Optional[int] = None
    hiring_id: Optional[int] = None
    priority: str = "medium"
    score: int = 0
    service_type: Optional[str] = None
    service_description: Optional[str] = None
    source: Optional[str] = None
    expected_close_date: Optional[datetime] = None
    description: Optional[str] = None
    custom_fields: Optional[Dict[str, Any]] = None

class LeadCreate(LeadBase):
    pass

class LeadUpdate(BaseModel):
    name: Optional[str] = None
    price: Optional[Decimal] = None
    pipeline_id: Optional[int] = None
    status_id: Optional[int] = None
    responsible_user_id: Optional[int] = None
    contact_id: Optional[int] = None
    company_id: Optional[int] = None
    hiring_id: Optional[int] = None
    priority: Optional[str] = None
    score: Optional[int] = None
    service_type: Optional[str] = None
    service_description: Optional[str] = None
    source: Optional[str] = None
    expected_close_date: Optional[datetime] = None
    description: Optional[str] = None
    custom_fields: Optional[Dict[str, Any]] = None

class Lead(LeadBase):
    id: int
    is_deleted: bool
    closest_task_at: Optional[datetime]
    closed_at: Optional[datetime]
    created_at: datetime
    updated_at: datetime
    
    # Relaciones embebidas (opcional)
    contact: Optional[Contact] = None
    company: Optional[Company] = None
    status: Optional[PipelineStatus] = None
    responsible_user: Optional[CRMUser] = None
    
    class Config:
        from_attributes = True


# ===== TASK =====
class TaskBase(BaseModel):
    text: str
    task_type: str = "call"
    entity_type: str  # 'lead', 'contact', 'company'
    entity_id: int
    responsible_user_id: int
    due_date: datetime
    result_text: Optional[str] = None

class TaskCreate(TaskBase):
    pass

class TaskUpdate(BaseModel):
    text: Optional[str] = None
    task_type: Optional[str] = None
    due_date: Optional[datetime] = None
    is_completed: Optional[bool] = None
    result_text: Optional[str] = None

class Task(TaskBase):
    id: int
    is_completed: bool
    completed_at: Optional[datetime]
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


# ===== NOTE =====
class NoteBase(BaseModel):
    entity_type: str
    entity_id: int
    note_type: str = "comment"
    content: str
    params: Optional[Dict[str, Any]] = None

class NoteCreate(NoteBase):
    pass

class Note(NoteBase):
    id: int
    created_at: datetime
    updated_at: datetime
    created_by: Optional[int]
    
    class Config:
        from_attributes = True


# ===== CALL =====
class CallBase(BaseModel):
    entity_type: str
    entity_id: int
    direction: str  # 'inbound', 'outbound'
    phone_number: str
    duration: int = 0
    status: str
    recording_url: Optional[str] = None
    started_at: datetime
    ended_at: Optional[datetime] = None
    responsible_user_id: Optional[int] = None
    notes: Optional[str] = None

class CallCreate(CallBase):
    cloudtalk_id: Optional[str] = None

class Call(CallBase):
    id: int
    cloudtalk_id: Optional[str]
    created_at: datetime
    
    class Config:
        from_attributes = True


# ===== RESPONSE WRAPPERS (Kommo-style) =====
class LeadsListResponse(BaseModel):
    """Respuesta estilo Kommo API"""
    _embedded: Dict[str, List[Lead]]
    _page: Dict[str, Any]

class ContactsListResponse(BaseModel):
    _embedded: Dict[str, List[Contact]]
    _page: Dict[str, Any]

class TasksListResponse(BaseModel):
    _embedded: Dict[str, List[Task]]
    _page: Dict[str, Any]
```

---

## 🔌 Endpoints API

**Archivo:** `app/routers/crm.py`

### Router Principal CRM

```python
from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from app.db.session import get_db
from app.schemas import crm as schemas
from app.models import crm as models
from app.core.deps import get_current_admin_user

router = APIRouter(prefix="/crm", tags=["CRM"])

# ===== LEADS =====
@router.get("/leads", response_model=schemas.LeadsListResponse)
async def get_leads(
    db: Session = Depends(get_db),
    pipeline_id: Optional[int] = None,
    status_id: Optional[int] = None,
    responsible_user_id: Optional[int] = None,
    query: Optional[str] = None,
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=100),
    current_user = Depends(get_current_admin_user)
):
    """
    Obtener lista de leads con filtros
    
    Filtros:
    - pipeline_id: Filtrar por pipeline
    - status_id: Filtrar por estado
    - responsible_user_id: Filtrar por responsable
    - query: Búsqueda por nombre
    - page, limit: Paginación
    """
    # Query base
    query_db = db.query(models.Lead).filter(models.Lead.is_deleted == False)
    
    # Aplicar filtros
    if pipeline_id:
        query_db = query_db.filter(models.Lead.pipeline_id == pipeline_id)
    if status_id:
        query_db = query_db.filter(models.Lead.status_id == status_id)
    if responsible_user_id:
        query_db = query_db.filter(models.Lead.responsible_user_id == responsible_user_id)
    if query:
        query_db = query_db.filter(models.Lead.name.ilike(f"%{query}%"))
    
    # Total count
    total = query_db.count()
    
    # Paginación
    offset = (page - 1) * limit
    leads = query_db.offset(offset).limit(limit).all()
    
    return {
        "_embedded": {"leads": leads},
        "_page": {
            "page": page,
            "limit": limit,
            "total": total,
            "pages": (total + limit - 1) // limit
        }
    }


@router.get("/leads/{lead_id}", response_model=schemas.Lead)
async def get_lead(
    lead_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_admin_user)
):
    """Obtener un lead por ID"""
    lead = db.query(models.Lead).filter(
        models.Lead.id == lead_id,
        models.Lead.is_deleted == False
    ).first()
    
    if not lead:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lead no encontrado"
        )
    
    return lead


@router.post("/leads", response_model=schemas.Lead, status_code=status.HTTP_201_CREATED)
async def create_lead(
    lead_data: schemas.LeadCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_admin_user)
):
    """Crear un nuevo lead"""
    # Validar que existan pipeline y status
    pipeline = db.query(models.Pipeline).filter(models.Pipeline.id == lead_data.pipeline_id).first()
    if not pipeline:
        raise HTTPException(status_code=404, detail="Pipeline no encontrado")
    
    status_obj = db.query(models.PipelineStatus).filter(models.PipelineStatus.id == lead_data.status_id).first()
    if not status_obj:
        raise HTTPException(status_code=404, detail="Estado no encontrado")
    
    # Crear lead
    lead = models.Lead(**lead_data.dict(), created_by=current_user.id, updated_by=current_user.id)
    db.add(lead)
    db.commit()
    db.refresh(lead)
    
    return lead


@router.patch("/leads/{lead_id}", response_model=schemas.Lead)
async def update_lead(
    lead_id: int,
    lead_data: schemas.LeadUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_admin_user)
):
    """Actualizar un lead"""
    lead = db.query(models.Lead).filter(
        models.Lead.id == lead_id,
        models.Lead.is_deleted == False
    ).first()
    
    if not lead:
        raise HTTPException(status_code=404, detail="Lead no encontrado")
    
    # Actualizar campos
    update_data = lead_data.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(lead, field, value)
    
    lead.updated_by = current_user.id
    db.commit()
    db.refresh(lead)
    
    return lead


@router.delete("/leads/{lead_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_lead(
    lead_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_admin_user)
):
    """Soft delete de un lead"""
    lead = db.query(models.Lead).filter(models.Lead.id == lead_id).first()
    
    if not lead:
        raise HTTPException(status_code=404, detail="Lead no encontrado")
    
    lead.is_deleted = True
    lead.deleted_at = func.now()
    db.commit()


# ===== CONTACTS =====
@router.get("/contacts", response_model=schemas.ContactsListResponse)
async def get_contacts(
    db: Session = Depends(get_db),
    company_id: Optional[int] = None,
    query: Optional[str] = None,
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=100),
    current_user = Depends(get_current_admin_user)
):
    """Obtener lista de contactos"""
    query_db = db.query(models.Contact).filter(models.Contact.is_deleted == False)
    
    if company_id:
        query_db = query_db.filter(models.Contact.company_id == company_id)
    if query:
        query_db = query_db.filter(
            (models.Contact.first_name.ilike(f"%{query}%")) |
            (models.Contact.last_name.ilike(f"%{query}%")) |
            (models.Contact.email.ilike(f"%{query}%"))
        )
    
    total = query_db.count()
    offset = (page - 1) * limit
    contacts = query_db.offset(offset).limit(limit).all()
    
    return {
        "_embedded": {"contacts": contacts},
        "_page": {"page": page, "limit": limit, "total": total}
    }


@router.post("/contacts", response_model=schemas.Contact, status_code=status.HTTP_201_CREATED)
async def create_contact(
    contact_data: schemas.ContactCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_admin_user)
):
    """Crear un nuevo contacto"""
    contact = models.Contact(**contact_data.dict(), created_by=current_user.id)
    db.add(contact)
    db.commit()
    db.refresh(contact)
    return contact


# ===== PIPELINES =====
@router.get("/pipelines", response_model=List[schemas.Pipeline])
async def get_pipelines(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_admin_user)
):
    """Obtener lista de pipelines con sus estados"""
    pipelines = db.query(models.Pipeline).filter(models.Pipeline.is_archive == False).all()
    return pipelines


@router.get("/pipelines/{pipeline_id}/stages", response_model=List[schemas.PipelineStatus])
async def get_pipeline_stages(
    pipeline_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_admin_user)
):
    """Obtener estados de un pipeline"""
    stages = db.query(models.PipelineStatus).filter(
        models.PipelineStatus.pipeline_id == pipeline_id
    ).order_by(models.PipelineStatus.sort).all()
    
    if not stages:
        raise HTTPException(status_code=404, detail="Pipeline no encontrado o sin estados")
    
    return stages


# ===== TASKS =====
@router.get("/tasks", response_model=schemas.TasksListResponse)
async def get_tasks(
    db: Session = Depends(get_db),
    entity_type: Optional[str] = None,
    entity_id: Optional[int] = None,
    responsible_user_id: Optional[int] = None,
    is_completed: Optional[bool] = None,
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=100),
    current_user = Depends(get_current_admin_user)
):
    """Obtener lista de tareas"""
    query_db = db.query(models.Task)
    
    if entity_type and entity_id:
        query_db = query_db.filter(
            models.Task.entity_type == entity_type,
            models.Task.entity_id == entity_id
        )
    if responsible_user_id:
        query_db = query_db.filter(models.Task.responsible_user_id == responsible_user_id)
    if is_completed is not None:
        query_db = query_db.filter(models.Task.is_completed == is_completed)
    
    total = query_db.count()
    offset = (page - 1) * limit
    tasks = query_db.order_by(models.Task.due_date).offset(offset).limit(limit).all()
    
    return {
        "_embedded": {"tasks": tasks},
        "_page": {"page": page, "limit": limit, "total": total}
    }


@router.post("/tasks", response_model=schemas.Task, status_code=status.HTTP_201_CREATED)
async def create_task(
    task_data: schemas.TaskCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_admin_user)
):
    """Crear una nueva tarea"""
    task = models.Task(**task_data.dict(), created_by=current_user.id)
    db.add(task)
    db.commit()
    db.refresh(task)
    return task


@router.patch("/tasks/{task_id}", response_model=schemas.Task)
async def update_task(
    task_id: int,
    task_data: schemas.TaskUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_admin_user)
):
    """Actualizar una tarea"""
    task = db.query(models.Task).filter(models.Task.id == task_id).first()
    
    if not task:
        raise HTTPException(status_code=404, detail="Tarea no encontrada")
    
    update_data = task_data.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(task, field, value)
    
    # Si se marca como completada, registrar fecha
    if update_data.get('is_completed') and not task.completed_at:
        task.completed_at = func.now()
    
    db.commit()
    db.refresh(task)
    return task


# ===== NOTES =====
@router.get("/notes", response_model=List[schemas.Note])
async def get_notes(
    entity_type: str,
    entity_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_admin_user)
):
    """Obtener notas de una entidad"""
    notes = db.query(models.Note).filter(
        models.Note.entity_type == entity_type,
        models.Note.entity_id == entity_id
    ).order_by(models.Note.created_at.desc()).all()
    
    return notes


@router.post("/notes", response_model=schemas.Note, status_code=status.HTTP_201_CREATED)
async def create_note(
    note_data: schemas.NoteCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_admin_user)
):
    """Crear una nota"""
    note = models.Note(**note_data.dict(), created_by=current_user.id)
    db.add(note)
    db.commit()
    db.refresh(note)
    return note


# ===== CALLS =====
@router.get("/calls", response_model=List[schemas.Call])
async def get_calls(
    entity_type: Optional[str] = None,
    entity_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_admin_user)
):
    """Obtener llamadas"""
    query_db = db.query(models.Call)
    
    if entity_type and entity_id:
        query_db = query_db.filter(
            models.Call.entity_type == entity_type,
            models.Call.entity_id == entity_id
        )
    
    calls = query_db.order_by(models.Call.started_at.desc()).all()
    return calls


@router.post("/calls", response_model=schemas.Call, status_code=status.HTTP_201_CREATED)
async def create_call(
    call_data: schemas.CallCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_admin_user)
):
    """Registrar una llamada"""
    call = models.Call(**call_data.dict())
    db.add(call)
    db.commit()
    db.refresh(call)
    
    # Crear nota automática en el lead/contacto
    note = models.Note(
        entity_type=call.entity_type,
        entity_id=call.entity_id,
        note_type="call_in" if call.direction == "inbound" else "call_out",
        content=f"Llamada {call.direction}: {call.duration}s - {call.status}",
        params={"call_id": call.id, "phone": call.phone_number, "duration": call.duration},
        created_by=current_user.id
    )
    db.add(note)
    db.commit()
    
    return call


# ===== USERS CRM =====
@router.get("/users", response_model=List[schemas.CRMUser])
async def get_crm_users(
    db: Session = Depends(get_db),
    is_active: Optional[bool] = True,
    current_user = Depends(get_current_admin_user)
):
    """Obtener lista de usuarios CRM"""
    query_db = db.query(models.CRMUser)
    
    if is_active is not None:
        query_db = query_db.filter(models.CRMUser.is_active == is_active)
    
    users = query_db.all()
    return users


@router.post("/users", response_model=schemas.CRMUser, status_code=status.HTTP_201_CREATED)
async def create_crm_user(
    user_data: schemas.CRMUserCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_admin_user)
):
    """Crear un usuario CRM"""
    user = models.CRMUser(**user_data.dict(), created_by_admin_id=current_user.id)
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


# ===== DASHBOARD STATS =====
@router.get("/dashboard/stats")
async def get_dashboard_stats(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_admin_user)
):
    """Obtener estadísticas del dashboard"""
    from sqlalchemy import func
    
    # Total de leads activos
    total_leads = db.query(models.Lead).filter(models.Lead.is_deleted == False).count()
    
    # Leads por pipeline/estado
    leads_by_status = db.query(
        models.PipelineStatus.name,
        func.count(models.Lead.id).label('count')
    ).join(models.Lead).filter(
        models.Lead.is_deleted == False
    ).group_by(models.PipelineStatus.name).all()
    
    # Tareas pendientes
    pending_tasks = db.query(models.Task).filter(
        models.Task.is_completed == False,
        models.Task.due_date < func.now()
    ).count()
    
    # Valor total del pipeline
    total_value = db.query(func.sum(models.Lead.price)).filter(
        models.Lead.is_deleted == False
    ).scalar() or 0
    
    return {
        "total_leads": total_leads,
        "leads_by_status": [{"name": name, "count": count} for name, count in leads_by_status],
        "pending_tasks": pending_tasks,
        "total_pipeline_value": float(total_value)
    }
```

---

## 🔧 Lógica de Negocio

### Conversión de Lead a Cliente (Hiring)

**Archivo:** `app/services/crm_service.py`

```python
from sqlalchemy.orm import Session
from app.models import crm as crm_models
from app.models.hiring import Hiring
from app.schemas.admin import CreateHiringRequest

async def convert_lead_to_client(
    lead_id: int,
    db: Session,
    admin_user_id: int
) -> Hiring:
    """
    Convierte un lead en cliente generando un código de contratación
    
    Proceso:
    1. Obtener lead y contacto asociado
    2. Generar hiring code
    3. Vincular lead con hiring
    4. Mover lead al estado "Cliente"
    5. Crear nota de conversión
    """
    # Obtener lead
    lead = db.query(crm_models.Lead).filter(crm_models.Lead.id == lead_id).first()
    if not lead:
        raise ValueError("Lead no encontrado")
    
    # Obtener contacto
    contact = lead.contact
    if not contact:
        raise ValueError("Lead debe tener un contacto asociado")
    
    # Crear hiring code
    hiring_data = CreateHiringRequest(
        contract_template="standard",
        service_name=lead.service_type or "Servicio Legal",
        service_description=lead.service_description or "",
        amount=int(lead.price * 100) if lead.price else 40000,  # Convertir a centavos
        currency="EUR",
        grade="B",  # Por defecto, se puede calcular basado en lead.score
        client_name=f"{contact.first_name} {contact.last_name or ''}".strip(),
        client_email=contact.email,
        client_phone=contact.phone,
        client_passport=contact.custom_fields.get("passport") if contact.custom_fields else None,
        client_nie=contact.custom_fields.get("nie") if contact.custom_fields else None,
        client_address=contact.address,
        client_city=contact.city,
    )
    
    # Aquí llamarías a tu servicio de hiring existente
    # hiring = await create_hiring_code(hiring_data, db)
    
    # Vincular lead con hiring
    # lead.hiring_id = hiring.id
    
    # Obtener estado "Cliente" (type=1 indica éxito)
    client_status = db.query(crm_models.PipelineStatus).filter(
        crm_models.PipelineStatus.pipeline_id == lead.pipeline_id,
        crm_models.PipelineStatus.type == 1
    ).first()
    
    if client_status:
        lead.status_id = client_status.id
        lead.closed_at = func.now()
    
    # Crear nota
    note = crm_models.Note(
        entity_type="lead",
        entity_id=lead.id,
        note_type="system",
        content=f"Lead convertido a cliente. Código de contratación generado.",
        created_by=admin_user_id
    )
    db.add(note)
    
    db.commit()
    db.refresh(lead)
    
    # return hiring
    return lead


async def find_or_create_lead_from_phone(
    phone_number: str,
    db: Session
) -> Optional[crm_models.Lead]:
    """
    Busca un lead por número de teléfono (a través de contacto)
    Útil para integración con CloudTalk
    """
    # Buscar contacto por teléfono
    contact = db.query(crm_models.Contact).filter(
        (crm_models.Contact.phone == phone_number) |
        (crm_models.Contact.mobile == phone_number)
    ).first()
    
    if not contact:
        return None
    
    # Buscar lead asociado al contacto
    lead = db.query(crm_models.Lead).filter(
        crm_models.Lead.contact_id == contact.id,
        crm_models.Lead.is_deleted == False
    ).first()
    
    return lead
```

---

## 🌐 Integraciones Externas

### CloudTalk Webhook

**Archivo:** `app/routers/webhooks.py`

```python
from fastapi import APIRouter, Depends, Request, HTTPException
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models import crm as models
from app.services.crm_service import find_or_create_lead_from_phone
import hmac
import hashlib

router = APIRouter(prefix="/webhooks", tags=["Webhooks"])

@router.post("/cloudtalk")
async def cloudtalk_webhook(
    request: Request,
    db: Session = Depends(get_db)
):
    """
    Webhook para recibir eventos de CloudTalk
    
    CloudTalk envía:
    {
        "call_id": "uuid",
        "direction": "inbound|outbound",
        "from": "+34123456789",
        "to": "+34987654321",
        "duration": 120,
        "status": "answered",
        "recording_url": "https://...",
        "started_at": "2025-11-05T10:00:00Z",
        "ended_at": "2025-11-05T10:02:00Z",
        "user_id": "123"
    }
    """
    # Validar webhook signature (si CloudTalk lo envía)
    # signature = request.headers.get("X-CloudTalk-Signature")
    # body = await request.body()
    # expected = hmac.new(
    #     CLOUDTALK_WEBHOOK_SECRET.encode(),
    #     body,
    #     hashlib.sha256
    # ).hexdigest()
    # if signature != expected:
    #     raise HTTPException(status_code=401, detail="Invalid signature")
    
    payload = await request.json()
    
    # Determinar número del cliente
    client_phone = payload.get("from") if payload.get("direction") == "inbound" else payload.get("to")
    
    # Buscar lead por teléfono
    lead = await find_or_create_lead_from_phone(client_phone, db)
    
    if not lead:
        # Si no hay lead, buscar solo contacto
        contact = db.query(models.Contact).filter(
            (models.Contact.phone == client_phone) |
            (models.Contact.mobile == client_phone)
        ).first()
        
        if contact:
            entity_type = "contact"
            entity_id = contact.id
        else:
            # Crear contacto automático desde llamada
            contact = models.Contact(
                first_name="Cliente",
                last_name=f"desde {client_phone}",
                phone=client_phone,
                notes=f"Contacto creado automáticamente desde llamada {payload.get('call_id')}"
            )
            db.add(contact)
            db.commit()
            db.refresh(contact)
            entity_type = "contact"
            entity_id = contact.id
    else:
        entity_type = "lead"
        entity_id = lead.id
    
    # Crear registro de llamada
    call = models.Call(
        cloudtalk_id=payload.get("call_id"),
        entity_type=entity_type,
        entity_id=entity_id,
        direction=payload.get("direction"),
        phone_number=client_phone,
        duration=payload.get("duration", 0),
        status=payload.get("status"),
        recording_url=payload.get("recording_url"),
        started_at=payload.get("started_at"),
        ended_at=payload.get("ended_at"),
        responsible_user_id=payload.get("user_id")  # Mapear user_id de CloudTalk a CRM
    )
    db.add(call)
    
    # Crear nota automática
    note = models.Note(
        entity_type=entity_type,
        entity_id=entity_id,
        note_type="call_in" if payload.get("direction") == "inbound" else "call_out",
        content=f"Llamada {payload.get('direction')} - {payload.get('duration')}s - {payload.get('status')}",
        params={
            "call_id": payload.get("call_id"),
            "phone": client_phone,
            "duration": payload.get("duration"),
            "recording_url": payload.get("recording_url")
        }
    )
    db.add(note)
    
    db.commit()
    
    return {"status": "ok", "message": "Llamada registrada"}
```

---

## 🧪 Testing

### Tests Unitarios

**Archivo:** `tests/test_crm.py`

```python
import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_create_lead():
    """Test crear lead"""
    response = client.post(
        "/api/crm/leads",
        json={
            "name": "Juan Pérez - Residencia",
            "price": 400.00,
            "pipeline_id": 1,
            "status_id": 1,
            "responsible_user_id": 1,
            "service_type": "Residencia Legal",
            "source": "Web"
        },
        headers={"X-Admin-Password": "Pomelo2005.1@"}
    )
    
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Juan Pérez - Residencia"
    assert data["price"] == 400.00


def test_get_leads_with_filters():
    """Test obtener leads con filtros"""
    response = client.get(
        "/api/crm/leads?pipeline_id=1&status_id=1",
        headers={"X-Admin-Password": "Pomelo2005.1@"}
    )
    
    assert response.status_code == 200
    data = response.json()
    assert "_embedded" in data
    assert "leads" in data["_embedded"]


def test_update_lead_status():
    """Test mover lead a otro estado"""
    # Primero crear lead
    create_response = client.post("/api/crm/leads", json={...})
    lead_id = create_response.json()["id"]
    
    # Actualizar estado
    response = client.patch(
        f"/api/crm/leads/{lead_id}",
        json={"status_id": 2},
        headers={"X-Admin-Password": "Pomelo2005.1@"}
    )
    
    assert response.status_code == 200
    assert response.json()["status_id"] == 2
```

---

## 📦 Migración de Datos

### Script de Migración desde Hirings

Si tienes códigos de contratación existentes que quieres convertir en leads:

**Archivo:** `scripts/migrate_hirings_to_leads.py`

```python
from app.db.session import SessionLocal
from app.models.hiring import Hiring
from app.models import crm as crm_models

def migrate_hirings_to_leads():
    """
    Migrar hirings existentes a leads del CRM
    Solo para hirings con status='pending' o 'paid'
    """
    db = SessionLocal()
    
    try:
        # Obtener pipeline y estado por defecto
        pipeline = db.query(crm_models.Pipeline).filter(crm_models.Pipeline.is_main == True).first()
        default_status = db.query(crm_models.PipelineStatus).filter(
            crm_models.PipelineStatus.pipeline_id == pipeline.id
        ).order_by(crm_models.PipelineStatus.sort).first()
        
        # Obtener usuario CRM por defecto
        default_user = db.query(crm_models.CRMUser).filter(crm_models.CRMUser.is_active == True).first()
        
        # Obtener hirings pendientes
        hirings = db.query(Hiring).filter(
            Hiring.status.in_(['pending', 'paid'])
        ).all()
        
        for hiring in hirings:
            # Crear/buscar contacto
            contact = db.query(crm_models.Contact).filter(
                crm_models.Contact.email == hiring.client_email
            ).first()
            
            if not contact:
                contact = crm_models.Contact(
                    first_name=hiring.client_name.split()[0] if hiring.client_name else "Cliente",
                    last_name=" ".join(hiring.client_name.split()[1:]) if hiring.client_name else "",
                    email=hiring.client_email,
                    phone=hiring.client_phone if hasattr(hiring, 'client_phone') else None,
                    address=hiring.client_address if hasattr(hiring, 'client_address') else None,
                    city=hiring.client_city if hasattr(hiring, 'client_city') else None
                )
                db.add(contact)
                db.flush()
            
            # Crear lead
            lead = crm_models.Lead(
                name=f"{hiring.service_name} - {hiring.client_name}",
                price=hiring.amount / 100,  # Convertir de centavos
                currency="EUR",
                pipeline_id=pipeline.id,
                status_id=default_status.id,
                responsible_user_id=default_user.id,
                contact_id=contact.id,
                hiring_id=hiring.id,
                service_type=hiring.service_name,
                service_description=hiring.service_description,
                source="Sistema Legacy",
                created_at=hiring.created_at
            )
            db.add(lead)
            
            # Vincular hiring con lead
            hiring.lead_id = lead.id
        
        db.commit()
        print(f"✅ Migrados {len(hirings)} hirings a leads")
        
    except Exception as e:
        db.rollback()
        print(f"❌ Error en migración: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    migrate_hirings_to_leads()
```

---

## 🚀 Deployment

### Variables de Entorno Backend

Agregar a `.env` del backend:

```bash
# CloudTalk
CLOUDTALK_API_KEY=your_api_key_here
CLOUDTALK_WEBHOOK_SECRET=your_webhook_secret

# Kommo (opcional, futuro)
KOMMO_CLIENT_ID=optional
KOMMO_CLIENT_SECRET=optional
KOMMO_ACCESS_TOKEN=optional
```

### Aplicar Migraciones

```bash
# Con Alembic
alembic revision --autogenerate -m "Add CRM tables"
alembic upgrade head

# Insertar datos iniciales
python scripts/insert_default_pipeline.py
```

---

## ✅ Checklist de Implementación Backend

- [ ] Crear modelos SQLAlchemy en `app/models/crm.py`
- [ ] Crear schemas Pydantic en `app/schemas/crm.py`
- [ ] Crear router en `app/routers/crm.py`
- [ ] Crear servicios en `app/services/crm_service.py`
- [ ] Implementar webhook CloudTalk en `app/routers/webhooks.py`
- [ ] Agregar migrations con Alembic
- [ ] Insertar datos iniciales (pipeline, estados)
- [ ] Crear tests unitarios
- [ ] Documentar endpoints en Swagger/OpenAPI
- [ ] Configurar variables de entorno
- [ ] Script de migración de hirings existentes
- [ ] Deploy y testing en staging

---

## 📞 Soporte

Para cualquier duda sobre la implementación, contactar al equipo de desarrollo.

**Documentación Kommo API:** https://www.kommo.com/developers/
**Documentación CloudTalk API:** https://www.cloudtalk.io/developers/

---

*Última actualización: 2025-11-05*

