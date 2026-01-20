# Sistema de Cobertura de Compañero con Notificaciones por Email

**Fecha**: 2026-01-20  
**Objetivo**: Implementar sistema de cobertura donde un compañero puede hacer seguimiento de próxima llamada/tarea, con notificaciones automáticas por email.

---

## 🎯 Objetivo

Permitir que al registrar una próxima acción, próxima llamada o próxima tarea, se pueda seleccionar un compañero que hará la cobertura. El sistema debe generar automáticamente tareas programadas para enviar notificaciones por email al compañero:
- **24 horas antes** del vencimiento
- **1 hora antes** del vencimiento
- **15 minutos antes** del vencimiento

---

## 📋 Cambios Requeridos

### 1. Agregar Campo `coverage_user_id` en Modelos y Endpoints

#### 1.1. Modelo `Call` (Llamadas)

**Archivo**: `app/models/crm.py` (o similar)

```python
class Call(Base):
    # ... campos existentes ...
    proxima_llamada_fecha: Optional[datetime] = None
    proxima_accion_fecha: Optional[datetime] = None
    coverage_user_id: Optional[UUID] = None  # ✅ NUEVO: Usuario que hará cobertura
    coverage_user: Optional[relationship] = relationship("User", foreign_keys=[coverage_user_id])
```

**Schema de actualización** (`app/schemas/crm.py`):

```python
class CallCreate(BaseModel):
    # ... campos existentes ...
    proxima_llamada_fecha: Optional[datetime] = None
    proxima_accion_fecha: Optional[datetime] = None
    coverage_user_id: Optional[UUID] = None  # ✅ NUEVO

class CallUpdate(BaseModel):
    # ... campos existentes ...
    proxima_llamada_fecha: Optional[datetime] = None
    proxima_accion_fecha: Optional[datetime] = None
    coverage_user_id: Optional[UUID] = None  # ✅ NUEVO
```

#### 1.2. Modelo `Task` (Tareas)

**Archivo**: `app/models/crm.py` (o similar)

```python
class Task(Base):
    # ... campos existentes ...
    complete_till: Optional[datetime] = None
    coverage_user_id: Optional[UUID] = None  # ✅ NUEVO: Usuario que hará cobertura
    coverage_user: Optional[relationship] = relationship("User", foreign_keys=[coverage_user_id])
```

**Schema de actualización** (`app/schemas/crm.py`):

```python
class TaskCreate(BaseModel):
    # ... campos existentes ...
    complete_till: Optional[datetime] = None
    coverage_user_id: Optional[UUID] = None  # ✅ NUEVO

class TaskUpdate(BaseModel):
    # ... campos existentes ...
    complete_till: Optional[datetime] = None
    coverage_user_id: Optional[UUID] = None  # ✅ NUEVO
```

#### 1.3. Modelo `PipelineStage` (Próxima Acción en Pipeline)

**Archivo**: `app/models/pipeline.py` (o similar)

```python
class PipelineStage(Base):
    # ... campos existentes ...
    next_action_responsible_id: Optional[UUID] = None  # Usuario responsable principal
    next_action_due_date: Optional[datetime] = None
    next_action_coverage_user_id: Optional[UUID] = None  # ✅ NUEVO: Usuario de cobertura
    next_action_coverage_user: Optional[relationship] = relationship("User", foreign_keys=[next_action_coverage_user_id])
```

**Schema de actualización** (`app/schemas/pipeline.py`):

```python
class NextActionUpdate(BaseModel):
    next_action_type: Optional[str] = None
    next_action_responsible_id: Optional[UUID] = None
    next_action_due_date: Optional[datetime] = None
    next_action_description: Optional[str] = None
    next_action_coverage_user_id: Optional[UUID] = None  # ✅ NUEVO

class PipelineStageCreate(BaseModel):
    # ... campos existentes ...
    next_action_coverage_user_id: Optional[UUID] = None  # ✅ NUEVO
```

#### 1.4. Modelo `LeadOpportunity` (Oportunidades)

**Archivo**: `app/models/opportunity.py` (o similar)

```python
class LeadOpportunity(Base):
    # ... campos existentes ...
    assigned_to_id: Optional[UUID] = None  # Usuario asignado principal
    coverage_user_id: Optional[UUID] = None  # ✅ NUEVO: Usuario de cobertura
    coverage_user: Optional[relationship] = relationship("User", foreign_keys=[coverage_user_id])
```

**Schema de actualización** (`app/schemas/opportunity.py`):

```python
class OpportunityUpdateRequest(BaseModel):
    # ... campos existentes ...
    coverage_user_id: Optional[UUID] = None  # ✅ NUEVO
```

---

### 2. Crear Modelo de Tareas Programadas de Notificación

**Archivo**: `app/models/notification_schedule.py` (nuevo)

```python
from sqlalchemy import Column, String, DateTime, Boolean, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID
from datetime import datetime
import uuid

class NotificationSchedule(Base):
    """
    Tareas programadas para enviar notificaciones por email
    sobre coberturas de llamadas/tareas próximas.
    """
    __tablename__ = "notification_schedules"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Relación con la entidad que genera la notificación
    entity_type = Column(String, nullable=False)  # 'call', 'task', 'pipeline_action', 'opportunity'
    entity_id = Column(UUID(as_uuid=True), nullable=False)  # ID de la llamada, tarea, etc.
    
    # Usuario que recibirá la notificación (el compañero de cobertura)
    coverage_user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    
    # Fecha y hora del evento que se está cubriendo
    event_due_date = Column(DateTime(timezone=True), nullable=False)
    
    # Tipo de notificación (24h, 1h, 15min antes)
    notification_type = Column(String, nullable=False)  # '24h_before', '1h_before', '15min_before'
    
    # Estado de la notificación
    sent = Column(Boolean, default=False, nullable=False)
    sent_at = Column(DateTime(timezone=True), nullable=True)
    
    # Fecha programada para enviar la notificación
    scheduled_send_at = Column(DateTime(timezone=True), nullable=False)
    
    # Información adicional para el email
    subject = Column(String, nullable=True)
    message_body = Column(Text, nullable=True)
    
    # Metadata
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Relaciones
    coverage_user = relationship("User", foreign_keys=[coverage_user_id])
```

**Migración SQL**:

```sql
CREATE TABLE notification_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type VARCHAR NOT NULL,
    entity_id UUID NOT NULL,
    coverage_user_id UUID NOT NULL REFERENCES users(id),
    event_due_date TIMESTAMP WITH TIME ZONE NOT NULL,
    notification_type VARCHAR NOT NULL,  -- '24h_before', '1h_before', '15min_before'
    sent BOOLEAN DEFAULT FALSE NOT NULL,
    sent_at TIMESTAMP WITH TIME ZONE,
    scheduled_send_at TIMESTAMP WITH TIME ZONE NOT NULL,
    subject VARCHAR,
    message_body TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_notification_schedules_scheduled_send_at ON notification_schedules(scheduled_send_at) WHERE sent = FALSE;
CREATE INDEX idx_notification_schedules_coverage_user_id ON notification_schedules(coverage_user_id);
CREATE INDEX idx_notification_schedules_entity ON notification_schedules(entity_type, entity_id);
```

---

### 3. Función para Crear Tareas Programadas de Notificación

**Archivo**: `app/services/notification_scheduler.py` (nuevo)

```python
from datetime import datetime, timedelta
from typing import Optional
from sqlalchemy.orm import Session
from app.models.notification_schedule import NotificationSchedule
from app.models.crm import Call, Task
from app.models.pipeline import PipelineStage
from app.models.opportunity import LeadOpportunity
from uuid import UUID

def create_coverage_notifications(
    db: Session,
    entity_type: str,  # 'call', 'task', 'pipeline_action', 'opportunity'
    entity_id: UUID,
    coverage_user_id: UUID,
    event_due_date: datetime,
    entity_name: str = "Evento",  # Nombre descriptivo para el email
    contact_name: Optional[str] = None,  # Nombre del contacto relacionado
) -> list[NotificationSchedule]:
    """
    Crea tareas programadas para enviar notificaciones por email al compañero de cobertura.
    
    Genera 3 notificaciones:
    - 24 horas antes del evento
    - 1 hora antes del evento
    - 15 minutos antes del evento
    """
    
    if not coverage_user_id or not event_due_date:
        return []
    
    notifications = []
    
    # Calcular fechas de envío
    send_times = [
        ('24h_before', event_due_date - timedelta(hours=24)),
        ('1h_before', event_due_date - timedelta(hours=1)),
        ('15min_before', event_due_date - timedelta(minutes=15)),
    ]
    
    for notification_type, scheduled_send_at in send_times:
        # Solo crear notificación si la fecha de envío es en el futuro
        if scheduled_send_at <= datetime.utcnow():
            continue
        
        # Generar subject y body del email
        subject, message_body = _generate_email_content(
            notification_type=notification_type,
            entity_type=entity_type,
            entity_name=entity_name,
            contact_name=contact_name,
            event_due_date=event_due_date,
        )
        
        notification = NotificationSchedule(
            entity_type=entity_type,
            entity_id=entity_id,
            coverage_user_id=coverage_user_id,
            event_due_date=event_due_date,
            notification_type=notification_type,
            scheduled_send_at=scheduled_send_at,
            subject=subject,
            message_body=message_body,
        )
        
        db.add(notification)
        notifications.append(notification)
    
    db.commit()
    return notifications


def _generate_email_content(
    notification_type: str,
    entity_type: str,
    entity_name: str,
    contact_name: Optional[str],
    event_due_date: datetime,
) -> tuple[str, str]:
    """Genera el subject y body del email de notificación."""
    
    time_labels = {
        '24h_before': '24 horas',
        '1h_before': '1 hora',
        '15min_before': '15 minutos',
    }
    
    time_label = time_labels.get(notification_type, 'próximamente')
    
    # Subject
    if contact_name:
        subject = f"Recordatorio: {entity_name} - {contact_name} en {time_label}"
    else:
        subject = f"Recordatorio: {entity_name} en {time_label}"
    
    # Body
    event_date_str = event_due_date.strftime("%d/%m/%Y a las %H:%M")
    
    body = f"""
Hola,

Este es un recordatorio automático de que tienes una cobertura programada:

**{entity_name}**
{f'**Contacto:** {contact_name}' if contact_name else ''}
**Fecha y hora:** {event_date_str}

Este recordatorio se envía con {time_label} de anticipación.

Por favor, asegúrate de estar disponible para realizar el seguimiento.

Saludos,
Sistema Migro
    """.strip()
    
    return subject, body


def delete_coverage_notifications(
    db: Session,
    entity_type: str,
    entity_id: UUID,
) -> int:
    """
    Elimina todas las notificaciones programadas asociadas a una entidad.
    Útil cuando se cancela o modifica una llamada/tarea.
    """
    deleted = db.query(NotificationSchedule).filter(
        NotificationSchedule.entity_type == entity_type,
        NotificationSchedule.entity_id == entity_id,
        NotificationSchedule.sent == False,  # Solo eliminar las no enviadas
    ).delete()
    
    db.commit()
    return deleted
```

---

### 4. Integración en Endpoints de Creación/Actualización

#### 4.1. Endpoint `POST /api/crm/calls` (Crear Llamada)

**Archivo**: `app/api/endpoints/crm.py`

```python
@router.post("/calls", response_model=CallResponse)
async def create_call(
    call_data: CallCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # ... código existente para crear la llamada ...
    
    call = Call(**call_data.dict())
    db.add(call)
    db.commit()
    db.refresh(call)
    
    # ✅ NUEVO: Si hay coverage_user_id y fecha próxima, crear notificaciones
    if call_data.coverage_user_id:
        if call_data.proxima_llamada_fecha:
            create_coverage_notifications(
                db=db,
                entity_type='call',
                entity_id=call.id,
                coverage_user_id=call_data.coverage_user_id,
                event_due_date=call_data.proxima_llamada_fecha,
                entity_name="Próxima llamada",
                contact_name=call.contact.name if hasattr(call, 'contact') and call.contact else None,
            )
        
        if call_data.proxima_accion_fecha:
            create_coverage_notifications(
                db=db,
                entity_type='call',
                entity_id=call.id,
                coverage_user_id=call_data.coverage_user_id,
                event_due_date=call_data.proxima_accion_fecha,
                entity_name="Próxima acción",
                contact_name=call.contact.name if hasattr(call, 'contact') and call.contact else None,
            )
    
    return call
```

#### 4.2. Endpoint `PATCH /api/crm/calls/{call_id}` (Actualizar Llamada)

```python
@router.patch("/calls/{call_id}", response_model=CallResponse)
async def update_call(
    call_id: UUID,
    call_data: CallUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    call = db.query(Call).filter(Call.id == call_id).first()
    if not call:
        raise HTTPException(status_code=404, detail="Call not found")
    
    # Actualizar campos
    for key, value in call_data.dict(exclude_unset=True).items():
        setattr(call, key, value)
    
    # ✅ NUEVO: Si se cambia coverage_user_id o fecha, actualizar notificaciones
    if 'coverage_user_id' in call_data.dict(exclude_unset=True) or \
       'proxima_llamada_fecha' in call_data.dict(exclude_unset=True) or \
       'proxima_accion_fecha' in call_data.dict(exclude_unset=True):
        
        # Eliminar notificaciones anteriores
        delete_coverage_notifications(db, 'call', call.id)
        
        # Crear nuevas notificaciones si hay coverage_user_id y fecha
        if call.coverage_user_id:
            if call.proxima_llamada_fecha:
                create_coverage_notifications(
                    db=db,
                    entity_type='call',
                    entity_id=call.id,
                    coverage_user_id=call.coverage_user_id,
                    event_due_date=call.proxima_llamada_fecha,
                    entity_name="Próxima llamada",
                    contact_name=call.contact.name if hasattr(call, 'contact') and call.contact else None,
                )
            
            if call.proxima_accion_fecha:
                create_coverage_notifications(
                    db=db,
                    entity_type='call',
                    entity_id=call.id,
                    coverage_user_id=call.coverage_user_id,
                    event_due_date=call.proxima_accion_fecha,
                    entity_name="Próxima acción",
                    contact_name=call.contact.name if hasattr(call, 'contact') and call.contact else None,
                )
    
    db.commit()
    db.refresh(call)
    return call
```

#### 4.3. Endpoint `POST /api/crm/tasks` (Crear Tarea)

```python
@router.post("/tasks", response_model=TaskResponse)
async def create_task(
    task_data: TaskCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # ... código existente ...
    
    task = Task(**task_data.dict())
    db.add(task)
    db.commit()
    db.refresh(task)
    
    # ✅ NUEVO: Si hay coverage_user_id y complete_till, crear notificaciones
    if task_data.coverage_user_id and task_data.complete_till:
        create_coverage_notifications(
            db=db,
            entity_type='task',
            entity_id=task.id,
            coverage_user_id=task_data.coverage_user_id,
            event_due_date=task_data.complete_till,
            entity_name=f"Tarea: {task_data.text[:50]}",
            contact_name=task.contact.name if hasattr(task, 'contact') and task.contact else None,
        )
    
    return task
```

#### 4.4. Endpoint `PATCH /api/pipeline/stages/{stage_id}/next-action` (Actualizar Próxima Acción en Pipeline)

```python
@router.patch("/pipeline/stages/{stage_id}/next-action", response_model=PipelineStageResponse)
async def update_next_action(
    stage_id: UUID,
    next_action: NextActionUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    stage = db.query(PipelineStage).filter(PipelineStage.id == stage_id).first()
    if not stage:
        raise HTTPException(status_code=404, detail="Pipeline stage not found")
    
    # Actualizar campos
    if next_action.next_action_type:
        stage.next_action_type = next_action.next_action_type
    if next_action.next_action_responsible_id:
        stage.next_action_responsible_id = next_action.next_action_responsible_id
    if next_action.next_action_due_date:
        stage.next_action_due_date = next_action.next_action_due_date
    if next_action.next_action_description:
        stage.next_action_description = next_action.next_action_description
    if next_action.next_action_coverage_user_id is not None:
        stage.next_action_coverage_user_id = next_action.next_action_coverage_user_id
    
    # ✅ NUEVO: Si hay coverage_user_id y fecha, crear notificaciones
    if next_action.next_action_coverage_user_id and next_action.next_action_due_date:
        # Eliminar notificaciones anteriores
        delete_coverage_notifications(db, 'pipeline_action', stage.id)
        
        create_coverage_notifications(
            db=db,
            entity_type='pipeline_action',
            entity_id=stage.id,
            coverage_user_id=next_action.next_action_coverage_user_id,
            event_due_date=next_action.next_action_due_date,
            entity_name=f"Próxima acción: {next_action.next_action_type or 'Acción'}",
            contact_name=stage.contact.name if hasattr(stage, 'contact') and stage.contact else None,
        )
    
    db.commit()
    db.refresh(stage)
    return stage
```

---

### 5. Job Programado para Enviar Notificaciones

**Archivo**: `app/core/scheduler.py` (o crear nuevo `app/core/notification_sender.py`)

```python
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.interval import IntervalTrigger
from sqlalchemy.orm import Session
from app.db.session import SessionLocal
from app.models.notification_schedule import NotificationSchedule
from app.services.email_service import send_email
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

scheduler = AsyncIOScheduler()

@scheduler.scheduled_job(
    IntervalTrigger(minutes=5),  # Ejecutar cada 5 minutos
    id='send_coverage_notifications'
)
async def send_coverage_notifications():
    """
    Job que se ejecuta cada 5 minutos para enviar notificaciones programadas
    que ya alcanzaron su fecha de envío.
    """
    db: Session = SessionLocal()
    
    try:
        now = datetime.utcnow()
        
        # Buscar notificaciones pendientes que deben enviarse ahora
        notifications = db.query(NotificationSchedule).filter(
            NotificationSchedule.sent == False,
            NotificationSchedule.scheduled_send_at <= now,
        ).all()
        
        logger.info(f"📧 Enviando {len(notifications)} notificaciones de cobertura...")
        
        for notification in notifications:
            try:
                # Obtener usuario destinatario
                user = notification.coverage_user
                if not user or not user.email:
                    logger.warning(f"⚠️ Usuario sin email para notificación {notification.id}")
                    notification.sent = True
                    notification.sent_at = now
                    continue
                
                # Enviar email
                await send_email(
                    to_email=user.email,
                    subject=notification.subject or "Recordatorio de cobertura",
                    body=notification.message_body or "",
                )
                
                # Marcar como enviada
                notification.sent = True
                notification.sent_at = now
                
                logger.info(f"✅ Notificación {notification.id} enviada a {user.email}")
                
            except Exception as e:
                logger.error(f"❌ Error enviando notificación {notification.id}: {str(e)}")
                # No marcar como enviada si falló, para reintentar en el próximo ciclo
        
        db.commit()
        
    except Exception as e:
        logger.error(f"❌ Error en job de notificaciones: {str(e)}")
        db.rollback()
    finally:
        db.close()
```

**Integración en `main.py`**:

```python
from app.core.notification_sender import scheduler

@app.on_event("startup")
async def startup_event():
    scheduler.start()
    logger.info("✅ Scheduler de notificaciones iniciado")

@app.on_event("shutdown")
async def shutdown_event():
    scheduler.shutdown()
    logger.info("✅ Scheduler de notificaciones detenido")
```

---

### 6. Servicio de Email

**Archivo**: `app/services/email_service.py` (verificar si existe o crear)

```python
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import os
import logging

logger = logging.getLogger(__name__)

async def send_email(
    to_email: str,
    subject: str,
    body: str,
    html_body: Optional[str] = None,
) -> bool:
    """
    Envía un email usando SMTP.
    
    Variables de entorno requeridas:
    - SMTP_SERVER (ej: smtp.gmail.com)
    - SMTP_PORT (ej: 587)
    - SMTP_USER (ej: info@migro.es)
    - SMTP_PASSWORD
    """
    try:
        smtp_server = os.getenv("SMTP_SERVER")
        smtp_port = int(os.getenv("SMTP_PORT", "587"))
        smtp_user = os.getenv("SMTP_USER")
        smtp_password = os.getenv("SMTP_PASSWORD")
        
        if not all([smtp_server, smtp_user, smtp_password]):
            logger.error("❌ Configuración SMTP incompleta")
            return False
        
        # Crear mensaje
        msg = MIMEMultipart('alternative')
        msg['From'] = smtp_user
        msg['To'] = to_email
        msg['Subject'] = subject
        
        # Agregar cuerpo
        if html_body:
            msg.attach(MIMEText(html_body, 'html'))
        else:
            msg.attach(MIMEText(body, 'plain'))
        
        # Enviar
        with smtplib.SMTP(smtp_server, smtp_port) as server:
            server.starttls()
            server.login(smtp_user, smtp_password)
            server.send_message(msg)
        
        logger.info(f"✅ Email enviado a {to_email}")
        return True
        
    except Exception as e:
        logger.error(f"❌ Error enviando email a {to_email}: {str(e)}")
        return False
```

---

## 📝 Resumen de Cambios

### Modelos de Base de Datos
- ✅ Agregar `coverage_user_id` a `Call`
- ✅ Agregar `coverage_user_id` a `Task`
- ✅ Agregar `next_action_coverage_user_id` a `PipelineStage`
- ✅ Agregar `coverage_user_id` a `LeadOpportunity`
- ✅ Crear tabla `notification_schedules`

### Schemas/Endpoints
- ✅ Agregar `coverage_user_id` en schemas de creación/actualización
- ✅ Integrar creación de notificaciones en endpoints de llamadas
- ✅ Integrar creación de notificaciones en endpoints de tareas
- ✅ Integrar creación de notificaciones en endpoints de pipeline

### Servicios
- ✅ Crear `notification_scheduler.py` con funciones de creación/eliminación
- ✅ Crear job programado para enviar notificaciones cada 5 minutos
- ✅ Verificar/crear servicio de email SMTP

### Variables de Entorno
```bash
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=info@migro.es
SMTP_PASSWORD=tu_password
```

---

## ✅ Verificación

1. **Crear llamada con cobertura:**
   ```bash
   POST /api/crm/calls
   {
     "entity_id": "...",
     "proxima_llamada_fecha": "2026-01-21T10:00:00Z",
     "coverage_user_id": "uuid-del-compañero"
   }
   ```
   - Debe crear 3 registros en `notification_schedules`
   - Debe programar envíos a: 24h antes, 1h antes, 15min antes

2. **Verificar job de notificaciones:**
   - El job debe ejecutarse cada 5 minutos
   - Debe enviar emails a los usuarios de cobertura
   - Debe marcar notificaciones como `sent = true`

3. **Actualizar llamada:**
   - Cambiar `coverage_user_id` o fecha debe eliminar notificaciones anteriores y crear nuevas

---

## 📧 Notas Adicionales

- Las notificaciones solo se crean si `coverage_user_id` y la fecha (`proxima_llamada_fecha`, `proxima_accion_fecha`, `complete_till`, `next_action_due_date`) están presentes.
- Si la fecha de envío ya pasó (ej: se programa una llamada para mañana pero se crea hoy), solo se crearán las notificaciones futuras posibles.
- El job de notificaciones debe ejecutarse frecuentemente (cada 5 minutos) para garantizar envíos puntuales.
- Se recomienda agregar logs detallados para debugging del sistema de notificaciones.
