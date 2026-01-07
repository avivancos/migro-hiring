# Frontend: Botón para Descartar Oportunidades

**Fecha**: 2026-01-06  
**Estado**: ✅ Implementado  
**Módulo**: CRM - Opportunities

---

## 📋 Resumen

Se añadió un flujo completo para descartar oportunidades desde la ficha de detalle, permitiendo elegir un motivo de descarte y marcando automáticamente la oportunidad como `lost`.

---

## 🎯 Funcionalidad

### Componente Principal

**Archivo**: `src/pages/CRMOpportunityDetail.tsx`

**Ubicación**: Botón "Descartar oportunidad" en la tarjeta de "Otras Acciones"

### Flujo de Usuario

1. Abrir ficha de oportunidad (`CRMOpportunityDetail`)
2. En la sección "Otras Acciones", pulsar el botón "Descartar oportunidad"
3. Se abre un modal con opciones de motivo de descarte
4. Seleccionar motivo predefinido o escribir motivo personalizado (si se selecciona "otros")
5. Confirmar el descarte

---

## 🔧 Detalles Técnicos

### Motivos Disponibles

- `trabaja con otro abogado`
- `ya regularizado`
- `no le interesa`
- `otros` (campo de texto libre)

### Persistencia

- Se envía `status: 'lost'` vía `opportunityApi.update()`
- Se guarda el motivo en `notes` con prefijo `[Descarte]`
- Si ya existen notas, el motivo se agrega debajo con un salto de línea
- Se invalidan las queries `['opportunity', id]` y `['opportunities']` para refrescar los datos

### Validación

- Se evita descartar sin motivo
- Se muestra alerta si falta completar el motivo (especialmente para "otros")
- El botón de confirmar se deshabilita mientras se procesa la solicitud

---

## 💻 Implementación

### Estado del Componente

```typescript
const [showDiscardModal, setShowDiscardModal] = useState(false);
const [discardReason, setDiscardReason] = useState('trabaja con otro abogado');
const [customDiscardReason, setCustomDiscardReason] = useState('');
const [isDiscarding, setIsDiscarding] = useState(false);
```

### Función de Descarte

```typescript
const handleDiscardOpportunity = async () => {
  if (!opportunity) return;

  const reason =
    discardReason === 'otros'
      ? customDiscardReason.trim()
      : discardReason;

  if (!reason) {
    alert('Selecciona o escribe un motivo para descartar.');
    return;
  }

  setIsDiscarding(true);
  try {
    const notes = opportunity.notes
      ? `${opportunity.notes}\n\n[Descarte] ${reason}`
      : `[Descarte] ${reason}`;

    await opportunityApi.update(opportunity.id, {
      status: 'lost',
      notes,
    });

    queryClient.invalidateQueries({ queryKey: ['opportunity', opportunity.id] });
    queryClient.invalidateQueries({ queryKey: ['opportunities'] });
    setShowDiscardModal(false);
  } catch (error) {
    console.error('Error descartando oportunidad:', error);
    alert('No se pudo descartar la oportunidad. Intenta nuevamente.');
  } finally {
    setIsDiscarding(false);
  }
};
```

### Modal de Descarte

El modal incluye:
- Lista de motivos predefinidos con radio buttons
- Campo de texto para motivo personalizado (cuando se selecciona "otros")
- Botones de acción: "Cancelar" y "Descartar"
- Estado de carga durante el procesamiento

---

## 🔗 Integración con Backend

El frontend utiliza el endpoint:

```http
PATCH /api/crm/opportunities/{opportunity_id}
```

**Request Body**:
```json
{
  "status": "lost",
  "notes": "[Descarte] {motivo}"
}
```

**Servicio API**: `src/services/opportunityApi.ts`
- Método: `update(id: string, updates: OpportunityUpdateRequest)`
- Implementación: `api.patch()` con el body de actualización

---

## 📝 Notas

- Si ya hay notas en la oportunidad, el motivo se agrega debajo con un salto de línea
- Se evita descartar sin motivo; se muestra alerta si falta completar
- El modal se puede cerrar con el botón "Cancelar" o haciendo clic fuera (si no está procesando)
- Durante el procesamiento, todos los botones se deshabilitan para evitar acciones duplicadas

---

## ✅ Verificación

- [x] Build TypeScript sin errores
- [x] No hay errores de lint
- [x] Modal funciona correctamente
- [x] Validación de motivo implementada
- [x] Integración con backend funcionando
- [x] Invalidación de queries implementada

---

## 🔍 Archivos Relacionados

- `src/pages/CRMOpportunityDetail.tsx` - Componente principal
- `src/services/opportunityApi.ts` - Servicio API
- `src/hooks/useOpportunityDetail.ts` - Hook con mutación update
- `docs/BACKEND_OPPORTUNITY_DISCARD_ENDPOINT.md` - Documentación del backend

---

**Reportado por**: Sistema de Desarrollo  
**Revisado por**: -  
**Aprobado por**: -
