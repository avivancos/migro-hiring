# Restricciones de Acceso para Agentes en el CRM

**Fecha**: 2025-01-16  
**Estado**: ✅ Completado  
**Versión**: 1.0.0

---

## 📋 Resumen Ejecutivo

Se han implementado restricciones de acceso específicas para agentes en el CRM para prevenir fugas de información. Los agentes solo pueden ver sus propios contactos y oportunidades asignadas, con excepciones controladas para búsquedas exactas por teléfono o email.

---

## 🎯 Objetivos

1. **Prevenir Fugas de Información**: Los agentes no pueden ver la lista completa de contactos u oportunidades
2. **Acceso Restringido**: Los agentes solo ven sus contactos asignados y oportunidades asignadas
3. **Búsqueda Controlada**: Solo se permite búsqueda exacta por teléfono o email cuando se tiene el dato concreto
4. **Dashboard Personalizado**: El dashboard muestra solo información relevante para cada agente

---

## 🔐 Restricciones Implementadas

### 1. Dashboard (`CRMDashboardPage.tsx`)

#### Para Agentes:
- ❌ **Oculto**: Card de "Contactos Totales"
- ✅ **Visible**: Card de "Mis Oportunidades" (solo oportunidades asignadas)
- ✅ **Visible**: Cards de "Contratos Totales" y "Últimos Contratos"
- ✅ **Visible**: Calendario y otras secciones

#### Para Admins/Abogados:
- ✅ **Visible**: Todos los cards incluyendo "Contactos Totales"
- ✅ **Visible**: Todas las oportunidades sin restricciones

**Implementación:**
- Se verifica el rol del usuario con `isAgent(user.role)`
- Se carga solo el conteo de oportunidades asignadas para agentes
- Se oculta el card de contactos totales para agentes

---

### 2. Lista de Contactos (`CRMContactList.tsx`)

#### Filtrado Automático:
- ✅ **Agentes**: Filtro automático por `responsible_user_id = user.id`
- ✅ **Admins/Abogados**: Sin filtro automático, pueden ver todos los contactos

#### Búsqueda Restringida:
- ✅ **Agentes**: Solo búsqueda exacta por teléfono o email
  - Si la búsqueda es un email válido → usar `filters.email`
  - Si la búsqueda es un teléfono válido → usar `filters.phone`
  - Si no es exacta → ignorar la búsqueda (no mostrar resultados)
- ✅ **Admins/Abogados**: Búsqueda normal en todos los campos

**Validación de Búsqueda Exacta:**
- Email: Regex `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`
- Teléfono: 7-15 dígitos después de limpiar espacios, guiones, etc.

**Caso Especial:**
- Si un agente busca con teléfono/email exacto, puede ver esa ficha aunque no sea su contacto asignado
- Esto permite que alguien dentro de Migro le haya dado el dato para que ayude

---

### 3. Lista de Oportunidades (`CRMOpportunities.tsx`)

#### Filtrado Automático:
- ✅ **Agentes**: Filtro automático por `assigned_to = user.id`
- ✅ **Admins/Abogados**: Sin filtro automático, pueden ver todas las oportunidades

**Implementación:**
- Se pasa `filters={{ assigned_to: user.id }}` al componente `OpportunityList`
- El componente `OpportunityList` aplica estos filtros automáticamente

---

## 🛠️ Utilidades Creadas

### `src/utils/searchValidation.ts`

Funciones utilitarias para validar búsquedas:

```typescript
// Validar email
isValidEmail(email: string): boolean

// Validar teléfono
isValidPhone(phone: string): boolean

// Determinar si es búsqueda exacta
isExactSearch(searchTerm: string): {
  isExact: boolean;
  type: 'email' | 'phone' | 'none';
}

// Verificar si es agente
isAgent(userRole: string | undefined): boolean

// Verificar si es admin o superuser
isAdminOrSuperuser(userRole: string | undefined, isSuperuser?: boolean): boolean
```

---

## 📊 Flujo de Acceso

### Para Agentes:

```
Agente accede a Dashboard
    ↓
Solo ve "Mis Oportunidades" (asignadas)
    ↓
No ve "Contactos Totales"
    ↓
Agente accede a Contactos
    ↓
Filtro automático: responsible_user_id = user.id
    ↓
Búsqueda:
    ├─ Email exacto → Permitir ver ficha
    ├─ Teléfono exacto → Permitir ver ficha
    └─ Otro → No permitir búsqueda
    ↓
Agente accede a Oportunidades
    ↓
Filtro automático: assigned_to = user.id
    ↓
Solo ve sus oportunidades asignadas
```

### Para Admins/Abogados:

```
Admin/Abogado accede a Dashboard
    ↓
Ve todos los cards (sin restricciones)
    ↓
Admin/Abogado accede a Contactos
    ↓
Sin filtro automático
    ↓
Búsqueda normal en todos los campos
    ↓
Admin/Abogado accede a Oportunidades
    ↓
Sin filtro automático
    ↓
Ve todas las oportunidades
```

---

## 🔍 Validación de Búsqueda Exacta

### Email Válido:
- Formato: `usuario@dominio.com`
- Ejemplos válidos:
  - `juan@example.com`
  - `maria.garcia@empresa.es`
- Ejemplos inválidos:
  - `juan@` (dominio incompleto)
  - `@example.com` (sin usuario)
  - `juan example.com` (con espacio)

### Teléfono Válido:
- Formato: 7-15 dígitos
- Se limpian espacios, guiones, paréntesis, signos +
- Ejemplos válidos:
  - `+34612345678`
  - `612 345 678`
  - `612-345-678`
  - `(612) 345-678`
- Ejemplos inválidos:
  - `123` (muy corto)
  - `1234567890123456` (muy largo)
  - `abc123` (contiene letras)

---

## 🚨 Seguridad

### Medidas Implementadas:

1. **Filtrado en Frontend**: Los filtros se aplican automáticamente según el rol
2. **Validación de Búsqueda**: Solo se permiten búsquedas exactas para agentes
3. **Sin Override Manual**: Los agentes no pueden modificar los filtros para ver más datos
4. **Backend Recomendado**: Se recomienda implementar las mismas restricciones en el backend

### Recomendaciones Futuras:

- [ ] Implementar validación en el backend para asegurar que los filtros no se puedan bypassear
- [ ] Agregar logs de auditoría cuando un agente accede a una ficha mediante búsqueda exacta
- [ ] Considerar límites de tiempo para búsquedas exactas (ej: solo permitir X búsquedas por día)

---

## 📝 Archivos Modificados

1. **`src/pages/CRMDashboardPage.tsx`**
   - Agregado filtrado por rol
   - Ocultar card de contactos para agentes
   - Mostrar solo oportunidades asignadas para agentes

2. **`src/pages/CRMContactList.tsx`**
   - Filtro automático por responsable para agentes
   - Validación de búsqueda exacta
   - Restricción de búsqueda para agentes

3. **`src/pages/CRMOpportunities.tsx`**
   - Filtro automático por asignado para agentes

4. **`src/components/opportunities/OpportunityList.tsx`**
   - Soporte para filtros iniciales
   - Aplicación automática de filtros

5. **`src/utils/searchValidation.ts`** (NUEVO)
   - Funciones de validación de email y teléfono
   - Funciones de verificación de rol

---

## ✅ Checklist de Implementación

- [x] Crear utilidades de validación de búsqueda
- [x] Modificar dashboard para ocultar contactos totales a agentes
- [x] Modificar dashboard para mostrar solo oportunidades asignadas a agentes
- [x] Modificar lista de contactos para filtrar por responsable automáticamente
- [x] Implementar validación de búsqueda exacta por teléfono/email
- [x] Modificar lista de oportunidades para filtrar por asignado automáticamente
- [x] Documentar cambios

---

## 🎉 Conclusión

El sistema de restricciones para agentes está completamente implementado. Los agentes ahora solo pueden ver sus propios contactos y oportunidades asignadas, con la excepción controlada de búsquedas exactas por teléfono o email cuando tienen el dato concreto.

Esto previene fugas de información mientras permite flexibilidad cuando alguien dentro de Migro proporciona datos específicos para que el agente pueda ayudar.




