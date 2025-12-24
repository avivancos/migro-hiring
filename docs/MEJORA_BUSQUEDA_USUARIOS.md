# Mejora del Sistema de Búsqueda y Filtrado de Usuarios

**Fecha:** 15 de Diciembre de 2025  
**Objetivo:** Mejorar el sistema de búsqueda de usuarios usando como referencia el potente sistema de contactos del CRM

---

## 📋 Situación Actual

### Problemas Identificados:
1. ❌ Búsqueda básica solo en email y nombre
2. ❌ Filtros visibles siempre (ocupan mucho espacio)
3. ❌ No hay ordenamiento
4. ❌ No hay URL params (no se pueden compartir búsquedas)
5. ❌ No hay contador de filtros activos
6. ❌ No hay botón "limpiar filtros"
7. ❌ UX poco intuitiva comparada con contactos

### Sistema Actual:
- Búsqueda: Campo simple con `q` que busca en email y nombre
- Filtros: Botones siempre visibles para rol, estado, verificación
- Sin ordenamiento
- Sin URL params

---

## 🎯 Sistema Propuesto (Basado en Contactos)

### Características a Implementar:

#### 1. **Búsqueda Avanzada**
- Campo de búsqueda que busca en múltiples campos:
  - `email`
  - `full_name` / `first_name` / `last_name`
  - `phone_number`
  - `nationality`
  - `profession`
  - `city`
  - `passport_number`

#### 2. **Panel de Filtros Colapsable**
- Botón "Filtros" con contador de filtros activos
- Panel que se expande/colapsa
- Filtros organizados en grid responsive
- Botón "Limpiar filtros" visible cuando hay filtros activos

#### 3. **Filtros Avanzados**
- **Rol:** Admin, Lawyer, Agent, User (ya existe)
- **Estado:** Activo, Inactivo (ya existe)
- **Verificación:** Verificado, No verificado (ya existe)
- **Nacionalidad:** Select con nacionalidades únicas
- **Profesión:** Input de texto
- **Ciudad:** Input de texto
- **Es Abogado:** Sí/No/Todos
- **Especialidad Abogado:** Select con especialidades
- **Último Login:** Rango de fechas (desde/hasta)
- **Fecha Creación:** Rango de fechas (desde/hasta)

#### 4. **Ordenamiento**
- Click en headers de columna para ordenar
- Indicadores visuales (↑ ↓) del orden actual
- Campos ordenables:
  - Nombre
  - Email
  - Teléfono
  - Rol
  - Estado
  - Último Login
  - Fecha Creación

#### 5. **URL Params**
- Todos los filtros y búsqueda se reflejan en la URL
- Permite compartir búsquedas
- Permite bookmarking
- Se inicializan desde URL al cargar

#### 6. **Mejoras UX**
- Contador de filtros activos en botón "Filtros"
- Botón "Limpiar filtros" visible cuando hay filtros
- Loading states mejorados
- Mensajes cuando no hay resultados

---

## 🔌 Requisitos del Backend

### Endpoint Actual: `GET /api/users/`

#### Parámetros Actuales Soportados:
```typescript
{
  skip?: number;
  limit?: number;
  role?: string;        // 'admin' | 'lawyer' | 'agent' | 'user'
  is_active?: boolean;
  is_verified?: boolean;
  q?: string;          // Búsqueda en email y nombre
}
```

### Parámetros Necesarios para Mejora:

#### 1. **Búsqueda Mejorada**
```typescript
// Opción A: Usar 'search' en lugar de 'q' (más semántico)
search?: string;  // Busca en: email, full_name, first_name, last_name, phone_number, nationality, profession, city, passport_number

// Opción B: Mantener 'q' pero mejorar su alcance
q?: string;  // Mismo comportamiento que 'search'
```

**Recomendación:** Usar `search` para consistencia con el sistema de contactos.

#### 2. **Filtros Adicionales**
```typescript
nationality?: string;           // Filtro exacto por nacionalidad
profession?: string;            // Búsqueda parcial en profesión
city?: string;                  // Búsqueda parcial en ciudad
is_lawyer?: boolean;            // Es abogado (true/false)
lawyer_specialty?: string;      // Especialidad del abogado
last_login_from?: string;       // ISO 8601 date - Último login desde
last_login_to?: string;         // ISO 8601 date - Último login hasta
created_from?: string;          // ISO 8601 date - Creado desde
created_to?: string;            // ISO 8601 date - Creado hasta
```

#### 3. **Ordenamiento**
```typescript
sort_by?: string;    // 'name' | 'email' | 'phone_number' | 'role' | 'is_active' | 'last_login' | 'created_at'
sort_order?: 'asc' | 'desc';  // Orden ascendente o descendente
```

#### 4. **Respuesta Paginada**
```typescript
// La respuesta ya debería ser paginada (verificar)
{
  items: User[];
  total: number;
  skip: number;
  limit: number;
}
```

---

## 📝 Especificación Técnica para Backend

### Endpoint: `GET /api/users/`

#### Query Parameters Completos:

```typescript
interface GetUsersParams {
  // Paginación
  skip?: number;
  limit?: number;
  
  // Búsqueda
  search?: string;  // Busca en múltiples campos
  
  // Filtros básicos (ya existen)
  role?: 'admin' | 'lawyer' | 'agent' | 'user';
  is_active?: boolean;
  is_verified?: boolean;
  
  // Filtros adicionales (nuevos)
  nationality?: string;
  profession?: string;
  city?: string;
  is_lawyer?: boolean;
  lawyer_specialty?: string;
  last_login_from?: string;  // ISO 8601
  last_login_to?: string;    // ISO 8601
  created_from?: string;      // ISO 8601
  created_to?: string;       // ISO 8601
  
  // Ordenamiento (nuevo)
  sort_by?: 'name' | 'email' | 'phone_number' | 'role' | 'is_active' | 'last_login' | 'created_at';
  sort_order?: 'asc' | 'desc';
}
```

#### Comportamiento de `search`:

El parámetro `search` debe buscar en los siguientes campos:
- `email` (búsqueda parcial, case-insensitive)
- `full_name` (búsqueda parcial, case-insensitive)
- `first_name` (búsqueda parcial, case-insensitive)
- `last_name` (búsqueda parcial, case-insensitive)
- `phone_number` (búsqueda parcial)
- `nationality` (búsqueda parcial, case-insensitive)
- `profession` (búsqueda parcial, case-insensitive)
- `city` (búsqueda parcial, case-insensitive)
- `passport_number` (búsqueda exacta o parcial)

**Ejemplo SQL (PostgreSQL):**
```sql
WHERE (
  email ILIKE '%search_term%' OR
  full_name ILIKE '%search_term%' OR
  first_name ILIKE '%search_term%' OR
  last_name ILIKE '%search_term%' OR
  phone_number LIKE '%search_term%' OR
  nationality ILIKE '%search_term%' OR
  profession ILIKE '%search_term%' OR
  city ILIKE '%search_term%' OR
  passport_number LIKE '%search_term%'
)
```

#### Respuesta:

```typescript
interface GetUsersResponse {
  items: User[];
  total: number;    // Total de usuarios que cumplen los filtros
  skip: number;
  limit: number;
}
```

---

## ✅ Implementación Frontend (Sin Cambios Backend)

### Lo que SÍ podemos hacer ahora:

1. ✅ **Panel de filtros colapsable**
   - Mejorar UX con panel que se expande/colapsa
   - Contador de filtros activos
   - Botón limpiar filtros

2. ✅ **URL params**
   - Sincronizar filtros con URL
   - Permitir compartir búsquedas

3. ✅ **Ordenamiento local**
   - Ordenar resultados en el frontend
   - Indicadores visuales

4. ✅ **Mejoras visuales**
   - Mejor layout
   - Mejor responsive
   - Mejor feedback visual

### Lo que NO podemos hacer sin backend:

1. ❌ **Búsqueda en múltiples campos**
   - Actualmente `q` solo busca en email y nombre
   - Necesitamos `search` que busque en más campos

2. ❌ **Filtros adicionales**
   - Nacionalidad, profesión, ciudad, etc.
   - Necesitan soporte en backend

3. ❌ **Ordenamiento del servidor**
   - Actualmente no hay `sort_by` y `sort_order`
   - Podemos ordenar localmente, pero no es eficiente con paginación

---

## 🎯 Plan de Implementación

### Fase 1: Mejoras Frontend (Sin Backend)
- [x] Panel de filtros colapsable
- [x] URL params para filtros
- [x] Contador de filtros activos
- [x] Botón limpiar filtros
- [x] Ordenamiento local
- [x] Mejoras visuales

### Fase 2: Mejoras Backend (Requeridas)
- [ ] Implementar parámetro `search` (o mejorar `q`)
- [ ] Agregar filtros adicionales
- [ ] Implementar ordenamiento del servidor
- [ ] Optimizar queries para búsqueda multi-campo

---

## 📋 Checklist para Backend

### Prioridad Alta:
- [ ] **Parámetro `search`** que busque en múltiples campos
- [ ] **Ordenamiento** con `sort_by` y `sort_order`
- [ ] **Filtro por nacionalidad** (`nationality`)

### Prioridad Media:
- [ ] **Filtro por profesión** (`profession`)
- [ ] **Filtro por ciudad** (`city`)
- [ ] **Filtro por es abogado** (`is_lawyer`)
- [ ] **Filtro por especialidad** (`lawyer_specialty`)

### Prioridad Baja:
- [ ] **Filtro por rango de fechas** (último login, creación)
- [ ] **Búsqueda en passport_number**

---

## 🔍 Ejemplo de Uso

### Request:
```
GET /api/users/?search=juan&role=lawyer&is_active=true&nationality=Española&sort_by=last_login&sort_order=desc&skip=0&limit=20
```

### Response:
```json
{
  "items": [
    {
      "id": "uuid",
      "email": "juan@example.com",
      "full_name": "Juan Pérez",
      "role": "lawyer",
      "is_active": true,
      "nationality": "Española",
      "last_login": "2025-12-10T10:00:00Z",
      ...
    }
  ],
  "total": 15,
  "skip": 0,
  "limit": 20
}
```

---

## 📚 Referencias

- Sistema de contactos: `src/pages/CRMContactList.tsx`
- Tipos de usuario: `src/types/user.ts`
- Servicio admin: `src/services/adminService.ts`
- Documentación backend: `docs/ADMIN_MODULE_BACKEND_INTEGRATION.md`

---

**Última actualización:** 15 de Diciembre de 2025














