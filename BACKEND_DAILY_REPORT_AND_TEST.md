# 📊 Reporte Diario y Test de Envío de Contratos

## 🎯 Objetivos

1. Implementar un sistema de **reporte diario de contratos** por email
2. Crear un **endpoint de test** para enviar contratos específicos a agustin@migro.es

---

## ✅ Implementación 1: Reporte Diario de Contratos

### **Endpoint para Generar Reporte Diario**

```python
@router.get("/admin/reports/daily")
async def get_daily_report(
    date: Optional[str] = None,  # Formato: YYYY-MM-DD
    admin_token: str = Depends(verify_admin_token)
):
    """
    Generar reporte diario de contratos completados
    
    Si no se especifica fecha, usa el día anterior.
    """
    
    from datetime import datetime, timedelta
    
    # Determinar fecha
    if date:
        report_date = datetime.strptime(date, "%Y-%m-%d").date()
    else:
        # Por defecto: día anterior
        report_date = (datetime.now() - timedelta(days=1)).date()
    
    # Obtener contratos del día
    start_datetime = datetime.combine(report_date, datetime.min.time())
    end_datetime = datetime.combine(report_date, datetime.max.time())
    
    contracts = db.query(Contract).filter(
        Contract.uploaded_at >= start_datetime,
        Contract.uploaded_at <= end_datetime
    ).all()
    
    # Estadísticas
    total_contracts = len(contracts)
    total_amount = sum(c.amount for c in contracts)
    
    # Agrupar por servicio
    by_service = {}
    for contract in contracts:
        service = contract.service_name or "Sin servicio"
        if service not in by_service:
            by_service[service] = {"count": 0, "amount": 0}
        by_service[service]["count"] += 1
        by_service[service]["amount"] += contract.amount
    
    # Formatear para email
    report_html = generate_daily_report_html(
        report_date=report_date,
        total_contracts=total_contracts,
        total_amount=total_amount,
        by_service=by_service,
        contracts=contracts
    )
    
    # Enviar email
    recipients = ["agustin@migro.es", "info@migro.es"]
    
    await send_daily_report_email(
        recipients=recipients,
        report_date=report_date,
        report_html=report_html,
        report_data={
            "total_contracts": total_contracts,
            "total_amount": total_amount,
            "contracts": [
                {
                    "hiring_code": c.hiring_code,
                    "client_name": c.client_name,
                    "client_email": c.client_email,
                    "service": c.service_name,
                    "amount": c.amount,
                    "uploaded_at": c.uploaded_at.isoformat()
                }
                for c in contracts
            ]
        }
    )
    
    return {
        "status": "success",
        "message": "Reporte diario enviado",
        "report_date": report_date.isoformat(),
        "total_contracts": total_contracts,
        "total_amount": total_amount,
        "sent_to": recipients
    }


def generate_daily_report_html(
    report_date,
    total_contracts,
    total_amount,
    by_service,
    contracts
):
    """Generar HTML del reporte"""
    
    html = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body {{ font-family: Arial, sans-serif; margin: 20px; }}
            h1 {{ color: #16a34a; }}
            table {{ border-collapse: collapse; width: 100%; margin: 20px 0; }}
            th, td {{ border: 1px solid #ddd; padding: 12px; text-align: left; }}
            th {{ background-color: #16a34a; color: white; }}
            .summary {{ background-color: #f9fafb; padding: 15px; border-radius: 5px; }}
            .amount {{ font-weight: bold; color: #16a34a; }}
        </style>
    </head>
    <body>
        <h1>📊 Reporte Diario de Contratos - Migro</h1>
        <div class="summary">
            <h2>Fecha del Reporte: {report_date.strftime('%d/%m/%Y')}</h2>
            <p><strong>Total de Contratos:</strong> {total_contracts}</p>
            <p><strong>Monto Total:</strong> <span class="amount">{total_amount / 100:.2f} €</span></p>
        </div>
        
        <h2>📋 Contratos por Servicio</h2>
        <table>
            <tr>
                <th>Servicio</th>
                <th>Cantidad</th>
                <th>Monto</th>
            </tr>
    """
    
    for service, data in by_service.items():
        html += f"""
            <tr>
                <td>{service}</td>
                <td>{data['count']}</td>
                <td class="amount">{data['amount'] / 100:.2f} €</td>
            </tr>
        """
    
    html += """
        </table>
        
        <h2>📄 Detalle de Contratos</h2>
        <table>
            <tr>
                <th>Código</th>
                <th>Cliente</th>
                <th>Email</th>
                <th>Servicio</th>
                <th>Monto</th>
                <th>Hora</th>
            </tr>
    """
    
    for contract in contracts:
        html += f"""
            <tr>
                <td>{contract.hiring_code}</td>
                <td>{contract.client_name}</td>
                <td>{contract.client_email}</td>
                <td>{contract.service_name or 'N/A'}</td>
                <td class="amount">{contract.amount / 100:.2f} €</td>
                <td>{contract.uploaded_at.strftime('%H:%M')}</td>
            </tr>
        """
    
    html += """
        </table>
        
        <hr>
        <p style="color: #6b7280; font-size: 12px;">
            Este es un reporte automático generado por el sistema Migro.
        </p>
    </body>
    </html>
    """
    
    return html


async def send_daily_report_email(
    recipients,
    report_date,
    report_html,
    report_data
):
    """Enviar email con reporte diario"""
    
    # Configuración SMTP
    smtp_server = os.getenv('SMTP_SERVER', 'smtp.gmail.com')
    smtp_port = int(os.getenv('SMTP_PORT', '587'))
    smtp_user = os.getenv('SMTP_USER', 'info@migro.es')
    smtp_password = os.getenv('SMTP_PASSWORD')
    
    if not smtp_password:
        raise Exception("SMTP_PASSWORD no configurado")
    
    # Crear mensaje
    msg = MIMEMultipart()
    msg['From'] = smtp_user
    msg['Subject'] = f"📊 Reporte Diario - {report_date.strftime('%d/%m/%Y')} - {report_data['total_contracts']} contratos"
    
    # Cuerpo del email
    body = f"""
    Hola,

    Aquí está el reporte diario de contratos para el {report_date.strftime('%d/%m/%Y')}.

    Resumen:
    - Total de contratos: {report_data['total_contracts']}
    - Monto total: {report_data['total_amount'] / 100:.2f} €

    Ver detalles completos abajo o en el archivo adjunto (JSON).

    Saludos,
    Sistema Migro
    """
    
    # Adjuntar HTML
    msg.attach(MIMEText(body + report_html, 'html', 'utf-8'))
    
    # Adjuntar JSON
    json_data = json.dumps(report_data, indent=2, default=str)
    json_attachment = MIMEBase('application', 'json')
    json_attachment.set_payload(json_data)
    encoders.encode_base64(json_attachment)
    json_attachment.add_header(
        'Content-Disposition',
        f'attachment; filename=reporte_{report_date.strftime("%Y%m%d")}.json'
    )
    msg.attach(json_attachment)
    
    # Enviar a todos los destinatarios
    for recipient in recipients:
        msg['To'] = recipient
        try:
            await send_email(msg, smtp_server, smtp_port, smtp_user, smtp_password)
            logger.info(f"✅ Reporte diario enviado a {recipient}")
        except Exception as e:
            logger.error(f"❌ Error enviando reporte a {recipient}: {str(e)}")
```

---

## ✅ Implementación 2: Cron Job Diario Automático

### **Usando APScheduler (Instalar: `pip install apscheduler`)**

```python
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger

# Al iniciar la aplicación
scheduler = AsyncIOScheduler()

@scheduler.scheduled_job(
    CronTrigger(hour=9, minute=0),  # Todos los días a las 9:00 AM
    id='daily_report'
)
async def send_daily_report_automatically():
    """Enviar reporte diario automáticamente"""
    try:
        logger.info("🔄 Generando reporte diario automático...")
        
        from datetime import datetime, timedelta
        yesterday = (datetime.now() - timedelta(days=1)).date()
        
        # Llamar al endpoint de reporte
        response = await get_daily_report(date=yesterday.isoformat())
        
        logger.info(f"✅ Reporte diario enviado: {response}")
    except Exception as e:
        logger.error(f"❌ Error en reporte automático: {str(e)}")


# Iniciar scheduler
scheduler.start()
```

---

## 🧪 Implementación 3: Endpoint de Test para Enviar Contratos Específicos

### **Endpoint para Test**

```python
@router.post("/admin/test/send-contracts")
async def test_send_specific_contracts(
    target_email: str = "agustin@migro.es",
    hiring_codes: List[str] = None,
    media_token: str = Depends(verify_media_token)  # Token especial para test
):
    """
    Test: Enviar contratos específicos a un email
    
    Parámetros:
    - target_email: Email destino (default: agustin@migro.es)
    - hiring_codes: Lista de códigos de contratación a enviar
                    Si es None, busca automáticamente por nombre
    """
    
    # Si no se especifican códigos, buscar por nombre
    if not hiring_codes:
        # Buscar contratos de "antonio alaejos" o similares
        antonio_contracts = db.query(Contract).filter(
            or_(
                Contract.client_name.ilike("%antonio%alaejos%"),
                Contract.client_name.ilike("%aalaejos%")
            )
        ).all()
        
        # Buscar contratos de "ebert"
        ebert_contracts = db.query(Contract).filter(
            Contract.client_name.ilike("%ebert%")
        ).all()
        
        contracts_to_send = antonio_contracts + ebert_contracts
    else:
        # Buscar por códigos específicos
        contracts_to_send = db.query(Contract).filter(
            Contract.hiring_code.in_(hiring_codes)
        ).all()
    
    if not contracts_to_send:
        raise HTTPException(
            status_code=404,
            detail="No se encontraron contratos para enviar"
        )
    
    # Descargar PDFs desde Cloudinary
    contract_files = []
    for contract in contracts_to_send:
        try:
            # Descargar desde Cloudinary
            pdf_content = download_from_cloudinary(contract.contract_url)
            
            contract_files.append({
                "name": contract.client_name,
                "code": contract.hiring_code,
                "filename": f"contrato_{contract.hiring_code}.pdf",
                "content": pdf_content
            })
            
            logger.info(f"✅ Descargado: {contract.hiring_code}")
        except Exception as e:
            logger.error(f"❌ Error descargando {contract.hiring_code}: {str(e)}")
    
    # Enviar email con los contratos
    await send_test_contracts_email(
        target_email=target_email,
        contracts=contract_files
    )
    
    return {
        "status": "success",
        "message": f"Enviados {len(contract_files)} contratos",
        "sent_to": target_email,
        "contracts": [
            {
                "code": c["code"],
                "name": c["name"],
                "filename": c["filename"]
            }
            for c in contract_files
        ]
    }


async def send_test_contracts_email(target_email, contracts):
    """Enviar email de test con contratos"""
    
    # Configuración SMTP
    smtp_server = os.getenv('SMTP_SERVER', 'smtp.gmail.com')
    smtp_port = int(os.getenv('SMTP_PORT', '587'))
    smtp_user = os.getenv('SMTP_USER', 'info@migro.es')
    smtp_password = os.getenv('SMTP_PASSWORD')
    
    if not smtp_password:
        raise Exception("SMTP_PASSWORD no configurado")
    
    # Crear mensaje
    msg = MIMEMultipart()
    msg['From'] = smtp_user
    msg['To'] = target_email
    msg['Subject'] = f"🧪 TEST - {len(contracts)} Contratos Migro"
    
    # Cuerpo del email
    body = f"""Contratos:
    
"""
    
    for contract in contracts:
        body += f"""
    - {contract['filename']} ({contract['name']})
        """
    
    body += """

Este es un email de prueba del sistema.
Los archivos adjuntos son contratos solicitados para test.
    
Saludos,
Sistema Migro (TEST)
    """
    
    msg.attach(MIMEText(body, 'plain', 'utf-8'))
    
    # Adjuntar cada PDF
    for contract in contracts:
        pdf_attachment = MIMEBase('application', 'octet-stream')
        pdf_attachment.set_payload(contract['content'])
        encoders.encode_base64(pdf_attachment)
        pdf_attachment.add_header(
            'Content-Disposition',
            f'attachment; filename={contract["filename"]}'
        )
        msg.attach(pdf_attachment)
    
    # Enviar email
    await send_email(msg, smtp_server, smtp_port, smtp_user, smtp_password)
    logger.info(f"✅ Test email enviado a {target_email} con {len(contracts)} contratos")
```

---

## 🧪 Testing

### **1. Test Reporte Diario Manual**

```bash
curl -X GET "https://api.migro.es/api/admin/reports/daily?date=2025-01-27" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

### **2. Test Envío de Contratos Específicos**

```bash
# Opción 1: Buscar automáticamente por nombre
curl -X POST "https://api.migro.es/api/admin/test/send-contracts" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer MEDIA_TOKEN" \
  -d '{
    "target_email": "agustin@migro.es"
  }'

# Opción 2: Especificar códigos concretos
curl -X POST "https://api.migro.es/api/admin/test/send-contracts" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer MEDIA_TOKEN" \
  -d '{
    "target_email": "agustin@migro.es",
    "hiring_codes": ["TEST1", "TEST2"]
  }'
```

---

## 📋 Checklist de Implementación

### Reporte Diario:
- [ ] Crear endpoint `/admin/reports/daily`
- [ ] Implementar generación de HTML del reporte
- [ ] Configurar envío de email con HTML y JSON
- [ ] Agregar destinatarios: agustin@migro.es, info@migro.es
- [ ] Instalar APScheduler
- [ ] Configurar cron job diario (9:00 AM)
- [ ] Testing con fechas específicas

### Test de Contratos:
- [ ] Crear endpoint `/admin/test/send-contracts`
- [ ] Implementar búsqueda por nombre (antonio alaejos, ebert)
- [ ] Implementar descarga desde Cloudinary
- [ ] Configurar envío de múltiples PDFs
- [ ] Testing con contratos reales

---

## ⚠️ Notas Importantes

1. **Token de Test**: Usar un token especial para el endpoint de test
2. **Descarga Cloudinary**: Implementar función `download_from_cloudinary()`
3. **Cron Job**: El reporte se enviará automáticamente todos los días a las 9:00 AM
4. **Destinatarios**: Pueden ser configurables desde variables de entorno

---

**Prioridad:** ALTA  
**Fecha objetivo:** Implementación inmediata

