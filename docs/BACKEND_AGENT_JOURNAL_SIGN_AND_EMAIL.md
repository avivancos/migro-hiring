# 📧 Backend: Firma y Envío de Reporte Diario por Email

## 🎯 Endpoint Requerido

### **POST `/api/agent-journal/sign-and-send`**

Este endpoint permite que un agente firme su reporte de trabajo diario y lo envíe por email a los administradores.

---

## 📋 Parámetros del Request

### **Body (JSON)**

```json
{
  "target_date": "2025-01-29",  // Opcional, formato YYYY-MM-DD. Default: hoy
  "agent_signature": "Nombre Completo del Agente"  // Nombre completo usado como firma
}
```

### **Headers**

```
Authorization: Bearer {token}
Content-Type: application/json
```

---

## 📤 Response

### **200 OK**

```json
{
  "status": "success",
  "message": "Reporte diario firmado y enviado exitosamente",
  "journal_id": "uuid-del-journal",
  "signed_at": "2025-01-29T18:30:00Z",
  "sent_to": [
    "admin1@migro.es",
    "admin2@migro.es"
  ],
  "target_date": "2025-01-29"
}
```

### **400 Bad Request**

```json
{
  "detail": "La firma es requerida"
}
```

### **404 Not Found**

```json
{
  "detail": "No se encontró reporte para la fecha especificada"
}
```

---

## 🔧 Implementación Backend

### **1. Endpoint Principal**

```python
from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from datetime import datetime, date
from typing import Optional
from app.core.database import get_db
from app.core.auth import get_current_user
from app.models.user import User
from app.models.agent_daily_journal import AgentDailyJournal
from app.services.agent_daily_journal_service import AgentDailyJournalService
from app.services.email_service import EmailService
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/agent-journal", tags=["agent-journal"])

@router.post("/sign-and-send")
async def sign_and_send_daily_report(
    target_date: Optional[str] = Body(None),
    agent_signature: str = Body(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Firmar reporte diario y enviarlo por email a administradores
    """
    
    # Validar que el usuario es un agente
    if current_user.role not in ['agent', 'lawyer']:
        raise HTTPException(
            status_code=403,
            detail="Solo los agentes pueden firmar reportes diarios"
        )
    
    # Validar firma
    if not agent_signature or not agent_signature.strip():
        raise HTTPException(
            status_code=400,
            detail="La firma es requerida"
        )
    
    # Parsear fecha
    if target_date:
        try:
            report_date = datetime.strptime(target_date, "%Y-%m-%d").date()
        except ValueError:
            raise HTTPException(
                status_code=400,
                detail="Formato de fecha inválido. Use YYYY-MM-DD"
            )
    else:
        report_date = date.today()
    
    # Obtener o crear el journal del día
    journal_service = AgentDailyJournalService(db)
    journal = journal_service.get_or_create_journal(
        user_id=current_user.id,
        journal_date=report_date
    )
    
    if not journal:
        raise HTTPException(
            status_code=404,
            detail=f"No se encontró reporte para la fecha {report_date}"
        )
    
    # Guardar la firma en extra_data
    if journal.extra_data is None:
        journal.extra_data = {}
    
    journal.extra_data['signed'] = True
    journal.extra_data['signature'] = agent_signature.strip()
    journal.extra_data['signed_at'] = datetime.utcnow().isoformat()
    
    db.commit()
    db.refresh(journal)
    
    # Obtener lista de administradores
    admin_users = db.query(User).filter(
        User.role.in_(['admin', 'superuser']),
        User.is_active == True
    ).all()
    
    admin_emails = [admin.email for admin in admin_users if admin.email]
    
    # Si no hay admins en BD, usar emails por defecto
    if not admin_emails:
        admin_emails = ['info@migro.es', 'agustin@migro.es']
        logger.warning("No se encontraron administradores en BD, usando emails por defecto")
    
    # Generar y enviar reporte por email
    email_service = EmailService()
    
    try:
        await email_service.send_daily_journal_report(
            journal=journal,
            agent_user=current_user,
            admin_emails=admin_emails,
            agent_signature=agent_signature
        )
        
        logger.info(f"Reporte diario {journal.id} firmado y enviado a {len(admin_emails)} administradores")
        
        return {
            "status": "success",
            "message": "Reporte diario firmado y enviado exitosamente",
            "journal_id": str(journal.id),
            "signed_at": journal.extra_data['signed_at'],
            "sent_to": admin_emails,
            "target_date": report_date.isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error enviando reporte diario: {str(e)}")
        # Aún así retornar éxito porque la firma se guardó
        return {
            "status": "partial_success",
            "message": "Reporte firmado pero hubo un error al enviar el email",
            "journal_id": str(journal.id),
            "signed_at": journal.extra_data['signed_at'],
            "error": str(e),
            "target_date": report_date.isoformat()
        }
```

### **2. Servicio de Email**

Agregar método al `EmailService`:

```python
# En app/services/email_service.py

from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.base import MIMEBase
from email import encoders
import smtplib
import os
from datetime import datetime
from typing import List
from app.models.agent_daily_journal import AgentDailyJournal
from app.models.user import User
import logging

logger = logging.getLogger(__name__)

class EmailService:
    
    async def send_daily_journal_report(
        self,
        journal: AgentDailyJournal,
        agent_user: User,
        admin_emails: List[str],
        agent_signature: str
    ):
        """
        Enviar reporte diario firmado por email a administradores
        """
        
        smtp_server = os.getenv('SMTP_SERVER', 'smtp.gmail.com')
        smtp_port = int(os.getenv('SMTP_PORT', '587'))
        smtp_user = os.getenv('SMTP_USER', 'info@migro.es')
        smtp_password = os.getenv('SMTP_PASSWORD')
        
        if not smtp_password:
            raise ValueError("SMTP_PASSWORD no configurada")
        
        # Generar contenido del email
        report_date = journal.journal_date.strftime("%d/%m/%Y")
        agent_name = agent_user.full_name or agent_user.email
        
        subject = f"Reporte Diario de Trabajo - {agent_name} ({report_date})"
        
        # Cuerpo del email en HTML
        html_body = f"""
        <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #16a34a;">Reporte Diario de Trabajo</h2>
                
                <div style="background-color: #f9fafb; padding: 15px; border-radius: 8px; margin: 20px 0;">
                    <h3 style="margin-top: 0;">Información del Agente</h3>
                    <p><strong>Agente:</strong> {agent_name}</p>
                    <p><strong>Email:</strong> {agent_user.email}</p>
                    <p><strong>Fecha del Reporte:</strong> {report_date}</p>
                    <p><strong>Firma Digital:</strong> {agent_signature}</p>
                    <p><strong>Fecha de Firma:</strong> {datetime.now().strftime("%d/%m/%Y %H:%M:%S")}</p>
                </div>
                
                <div style="background-color: #ffffff; padding: 15px; border: 1px solid #e5e7eb; border-radius: 8px; margin: 20px 0;">
                    <h3 style="margin-top: 0; color: #1f2937;">Métricas del Día</h3>
                    
                    <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
                        <tr>
                            <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><strong>Llamadas Totales:</strong></td>
                            <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">{journal.total_calls}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><strong>Llamadas Efectivas:</strong></td>
                            <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">{journal.effective_calls}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><strong>Tiempo Total de Llamadas:</strong></td>
                            <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">{self._format_time(journal.total_call_time_seconds)}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><strong>Tareas Completadas:</strong></td>
                            <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">{journal.tasks_completed}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><strong>Tareas Pendientes:</strong></td>
                            <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">{journal.tasks_pending}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><strong>Notas Creadas:</strong></td>
                            <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">{journal.notes_created}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><strong>Oportunidades Trabajadas:</strong></td>
                            <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">{journal.opportunities_worked}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px;"><strong>Intentos de Llamada:</strong></td>
                            <td style="padding: 8px;">{journal.call_attempts_count}</td>
                        </tr>
                    </table>
                </div>
                
                <div style="margin-top: 30px; padding-top: 20px; border-top: 2px solid #e5e7eb;">
                    <p style="color: #6b7280; font-size: 12px;">
                        Este es un reporte automático generado por el sistema Migro CRM.
                        <br>
                        Firma digital: {agent_signature}
                    </p>
                </div>
            </div>
        </body>
        </html>
        """
        
        # Crear mensaje
        msg = MIMEMultipart('alternative')
        msg['Subject'] = subject
        msg['From'] = smtp_user
        
        # Adjuntar HTML
        msg.attach(MIMEText(html_body, 'html', 'utf-8'))
        
        # Enviar a cada administrador
        for admin_email in admin_emails:
            try:
                msg['To'] = admin_email
                await self._send_email(
                    msg=msg,
                    smtp_server=smtp_server,
                    smtp_port=smtp_port,
                    smtp_user=smtp_user,
                    smtp_password=smtp_password
                )
                logger.info(f"✅ Email enviado a {admin_email}")
            except Exception as e:
                logger.error(f"❌ Error enviando email a {admin_email}: {str(e)}")
                # Continuar con los demás
                continue
    
    def _format_time(self, seconds: int) -> str:
        """Formatear tiempo de segundos a formato legible"""
        if seconds < 60:
            return f"{seconds}s"
        if seconds < 3600:
            minutes = seconds // 60
            return f"{minutes}min"
        hours = seconds // 3600
        minutes = (seconds % 3600) // 60
        return f"{hours}h {minutes}min"
    
    async def _send_email(
        self,
        msg: MIMEMultipart,
        smtp_server: str,
        smtp_port: int,
        smtp_user: str,
        smtp_password: str
    ):
        """Enviar email individual"""
        import aiosmtplib
        
        await aiosmtplib.send(
            msg,
            hostname=smtp_server,
            port=smtp_port,
            start_tls=True,
            username=smtp_user,
            password=smtp_password
        )
```

---

## 🔧 Variables de Entorno

```bash
# Configuración SMTP (ya debe existir)
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=info@migro.es
SMTP_PASSWORD=tu_password_de_aplicacion
```

---

## 📧 Ejemplo de Email Enviado

### **Asunto:**
```
Reporte Diario de Trabajo - Juan Pérez (29/01/2025)
```

### **Destinatarios:**
- Todos los usuarios con rol `admin` o `superuser` activos
- Si no hay admins en BD: `info@migro.es`, `agustin@migro.es`

### **Contenido:**
- Información del agente (nombre, email)
- Fecha del reporte
- Firma digital del agente
- Todas las métricas del día (llamadas, tiempo, tareas, notas, oportunidades)
- Formato HTML con estilos

---

## ✅ Checklist de Implementación

- [ ] Crear endpoint `/api/agent-journal/sign-and-send`
- [ ] Validar que el usuario es agente
- [ ] Validar que existe el journal para la fecha
- [ ] Guardar firma en `extra_data` del journal
- [ ] Obtener lista de administradores activos
- [ ] Generar email HTML con métricas
- [ ] Enviar email a todos los administradores
- [ ] Manejar errores de envío sin fallar la operación
- [ ] Logging apropiado

---

**Última actualización**: 2025-01-29  
**Versión del documento**: 1.0

