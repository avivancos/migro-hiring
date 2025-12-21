# Frontend: Pili LLM Deshabilitado

## 📋 Resumen

Se han eliminado/deshabilitado todas las referencias a Pili LLM en el frontend, ya que el servicio ha sido movido a un repositorio externo.

**Fecha:** 2025-01-27

---

## ✅ Cambios Realizados

### 1. Rutas Eliminadas

**Archivo:** `src/App.tsx`
- ❌ Eliminada ruta `/admin/pili`
- ❌ Comentada importación de `AdminPili`

### 2. Navegación Actualizada

**Archivo:** `src/components/admin/Sidebar.tsx`
- ❌ Eliminado link "Pili AI" del sidebar de admin
- ❌ Comentada importación del icono `Bot`

### 3. Componentes de UI Eliminados

**Archivo:** `src/components/CRM/CRMHeader.tsx`
- ❌ Eliminado botón de chat con Pili del header del CRM
- ❌ Comentada importación de `PiliChatModal`

### 4. Servicio Deshabilitado

**Archivo:** `src/services/piliService.ts`
- ⚠️ Servicio deshabilitado - ahora retorna errores apropiados
- ✅ Métodos `chat()` y `checkHealth()` lanzan excepciones con mensaje claro

### 5. Configuración de API Actualizada

**Archivo:** `src/services/api.ts`
- ❌ Eliminado `/ai/pili-openai/health` de endpoints públicos
- ✅ Actualizada lista de endpoints públicos

---

## 📁 Archivos que Permanecen (No Eliminados)

Los siguientes archivos **NO se eliminaron** pero están deshabilitados:

1. `src/pages/admin/AdminPili.tsx` - Página de admin (no accesible)
2. `src/components/CRM/PiliChat.tsx` - Componente de chat (no usado)
3. `src/components/CRM/PiliChatModal.tsx` - Modal de chat (no usado)
4. `src/hooks/usePiliChat.ts` - Hook de chat (no usado)
5. `src/types/pili.ts` - Tipos TypeScript (mantenidos por si se necesita en el futuro)

**Razón:** Se mantienen para referencia futura o en caso de que se necesite restaurar la funcionalidad.

---

## 🔄 Comportamiento Actual

### Si algún código intenta usar Pili:

1. **piliService.chat()**: Lanza error con mensaje claro
2. **piliService.checkHealth()**: Lanza error con mensaje claro
3. **Rutas**: `/admin/pili` ya no existe (404)
4. **UI**: No hay botones o links visibles a Pili

### Manejo de Errores

Si algún componente todavía intenta usar Pili (aunque no debería), recibirá:

```typescript
Error: "Pili AI service is now managed in an external repository and is not available"
```

---

## ✅ Checklist Completado

- [x] Eliminada ruta `/admin/pili` de App.tsx
- [x] Eliminado link "Pili AI" del Sidebar
- [x] Eliminado botón de Pili del CRMHeader
- [x] Deshabilitado piliService (retorna errores)
- [x] Actualizado api.ts (eliminadas referencias a pili-openai/health)
- [x] Documentación creada

---

## 🔮 Migración Futura

Si en el futuro se necesita restaurar la funcionalidad de Pili:

1. **Usar API del repositorio externo de Pili**
2. **Actualizar `piliService.ts`** para llamar al servicio externo
3. **Restaurar componentes y rutas** si es necesario
4. **Actualizar tipos** si la API externa tiene diferencias

---

## 📚 Referencias

- Documentación del backend: Ver información sobre Pili LLM deshabilitado
- Archivos relacionados:
  - `src/services/piliService.ts` - Servicio deshabilitado
  - `src/pages/admin/AdminPili.tsx` - Página (no accesible)
  - `src/components/CRM/PiliChat*.tsx` - Componentes (no usados)

---

**Última actualización:** 2025-01-27





