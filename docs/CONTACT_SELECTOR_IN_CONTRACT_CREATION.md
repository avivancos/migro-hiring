# Implementación: Selector de Contacto en Creación de Contratos

## 📋 Resumen

Se ha implementado un selector de contacto con buscador en el formulario de creación de contratos del panel de administración. Cuando se selecciona un contacto, se pre-rellenan los datos del formulario y se envía el `contact_id` al backend para asociar automáticamente el contrato con el historial del contacto.

## ✅ Cambios Realizados

### 1. Frontend - Componente AdminContractCreate

**Archivo**: `src/pages/admin/AdminContractCreate.tsx`

#### Funcionalidades Implementadas

1. **Buscador de Contactos con Autocompletado**
   - Campo de búsqueda con debounce de 300ms
   - Búsqueda automática después de escribir 2 caracteres
   - Resultados limitados a 10 contactos
   - Dropdown con resultados de búsqueda
   - Indicador de carga durante la búsqueda

2. **Pre-rellenado de Formulario**
   - Al seleccionar un contacto, se pre-rellenan automáticamente:
     - Nombre completo (`client_name`)
     - Email (`client_email`)
     - Nacionalidad (`client_nationality`)
     - Dirección (`client_address`)
     - Ciudad (`client_city`)
     - Provincia (`client_province`)
     - Código postal (`client_postal_code`)
   - Todos los campos pre-rellenados pueden editarse manualmente

3. **Envío de `contact_id` al Backend**
   - Cuando se selecciona un contacto, se incluye su ID en el request
   - El backend usa este ID para asociar automáticamente el contrato con el historial del contacto
   - Si no se selecciona un contacto, el backend intentará buscar el contacto por email

4. **UI/UX**
   - Indicador visual cuando un contacto está seleccionado (badge verde)
   - Botón para limpiar la selección de contacto
   - El dropdown se cierra automáticamente al hacer click fuera
   - Información clara de qué contacto está seleccionado

#### Código Clave

```typescript
// Búsqueda de contactos con debounce
useEffect(() => {
  if (contactSearch.trim().length < 2) {
    setContactSearchResults([]);
    return;
  }

  contactSearchTimeoutRef.current = setTimeout(async () => {
    const response = await crmService.getContacts({
      search: contactSearch.trim(),
      limit: 10,
      skip: 0,
    });
    setContactSearchResults(response.items || []);
  }, 300);
}, [contactSearch]);

// Selección de contacto y pre-rellenado
const handleSelectContact = (contact: KommoContact) => {
  setSelectedContact(contact);
  setUserName(contact.name || `${contact.first_name} ${contact.last_name || ''}`.trim());
  setUserEmail(contact.email || '');
  setUserNationality(contact.nacionalidad || '');
  // ... más campos
};

// Envío de contact_id al backend
const requestBody = {
  // ... otros campos
  contact_id: selectedContact?.id || undefined,
  // ... otros campos
};
```

### 2. Tipos TypeScript Actualizados

**Archivo**: `src/types/admin.ts`

#### Cambios en `CreateHiringRequest`

Se agregaron los siguientes campos opcionales:

```typescript
export interface CreateHiringRequest {
  // ... campos existentes
  contact_id?: string; // ⭐ NUEVO: ID del contacto en el CRM (UUID)
  client_nationality?: string; // ⭐ NUEVO: Nacionalidad del cliente
  manual_payment_confirmed?: boolean; // ⭐ NUEVO: Pago manual confirmado
  manual_payment_note?: string; // ⭐ NUEVO: Nota de pago manual
  manual_payment_method?: string; // ⭐ NUEVO: Método de pago manual
}
```

## 🔄 Flujo de Funcionamiento

### Creación de Contrato con Contacto Seleccionado

1. **Usuario busca contacto** en el campo de búsqueda
2. **Sistema muestra resultados** en un dropdown (máximo 10 contactos)
3. **Usuario selecciona un contacto** del dropdown
4. **Sistema pre-rellena el formulario** con los datos del contacto
5. **Usuario puede editar** cualquier campo pre-rellenado si es necesario
6. **Usuario completa el resto del formulario** (servicio, grado, tipo de pago, etc.)
7. **Usuario envía el formulario**
8. **Frontend envía request** incluyendo `contact_id` al backend
9. **Backend crea el contrato** y automáticamente:
   - Usa el `contact_id` para asociar el contrato con el contacto
   - Crea una nota en el historial del contacto con los detalles del contrato
   - Si no encuentra el contacto por ID, intenta buscarlo por email

### Creación de Contrato sin Contacto Seleccionado

1. **Usuario completa el formulario** sin seleccionar un contacto
2. **Usuario envía el formulario** (sin `contact_id`)
3. **Backend crea el contrato** y automáticamente:
   - Busca el contacto por `client_email`
   - Si encuentra el contacto, crea una nota en su historial
   - Si no encuentra el contacto, solo loggea un warning (no falla la creación)

## 📝 Endpoint de Búsqueda

El frontend utiliza el endpoint existente del CRM para buscar contactos:

```
GET /api/crm/contacts?search={query}&limit=10&skip=0
```

**Parámetros**:
- `search`: Término de búsqueda (nombre, email, teléfono)
- `limit`: Número máximo de resultados (10)
- `skip`: Offset para paginación (0)

**Respuesta**:
```typescript
{
  items: KommoContact[],
  total: number,
  skip: number,
  limit: number
}
```

## 🎨 Componentes Visuales

### Campo de Búsqueda

- **Icono de búsqueda** a la izquierda
- **Placeholder**: "Buscar contacto por nombre o email..."
- **Dropdown** que aparece automáticamente cuando hay resultados
- **Indicador de carga** durante la búsqueda
- **Botón X** para limpiar cuando hay un contacto seleccionado

### Dropdown de Resultados

- **Lista de contactos** con información relevante:
  - Nombre completo
  - Email (si está disponible)
  - Teléfono (si está disponible)
- **Hover effect** en cada resultado
- **Click para seleccionar** un contacto

### Indicador de Contacto Seleccionado

- **Badge verde** que muestra:
  - Nombre del contacto seleccionado
  - Mensaje informativo sobre el pre-rellenado
  - Botón para deseleccionar el contacto

## 🔗 Integración con Backend

El backend ya está preparado para recibir el campo `contact_id` (ver `docs/CONTACT_HISTORY_ACTIONS.md`). El servicio de hiring payment:

1. Recibe el `contact_id` en el request
2. Busca el contacto asociado (por ID, email o user_id)
3. Crea automáticamente una nota en el historial del contacto
4. La nota incluye:
   - Código de contratación
   - Servicio y descripción
   - Importe y tipo de pago
   - Grado del cliente
   - Estado y fechas
   - Metadata para referencia futura

## 🚀 Próximos Pasos

1. ✅ Selector de contacto implementado
2. ✅ Pre-rellenado de formulario implementado
3. ✅ Envío de `contact_id` al backend implementado
4. ⏳ Backend ya implementado (ver documentación del backend)
5. ⏳ Probar flujo completo de creación de contrato con contacto seleccionado
6. ⏳ Verificar que las notas se crean correctamente en el historial del contacto

## 📚 Referencias

- Backend: `app/services/hiring_payment_service.py`
- Schema: `app/schemas/hiring_payment.py`
- Frontend Component: `src/pages/admin/AdminContractCreate.tsx`
- Tipo: `src/types/admin.ts` - `CreateHiringRequest`
- Servicio CRM: `src/services/crmService.ts` - `getContacts()`
- Documentación Backend: `docs/CONTACT_HISTORY_ACTIONS.md`




