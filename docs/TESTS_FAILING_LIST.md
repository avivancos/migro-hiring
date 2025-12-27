# Lista de Tests que Fallan

**Fecha:** 2025-01-28  
**Total de tests:** 36  
**Tests que pasan:** 19 (52.78%)  
**Tests que fallan:** 17 (47.22%)

---

## ❌ Tests que Fallan (17 tests)

### 1. AdminLogin.test.tsx (4 tests fallando)

**Archivo:** `src/pages/__tests__/AdminLogin.test.tsx`

- ❌ `debe renderizar el formulario de login`
- ❌ `debe mostrar error si los campos están vacíos`
- ❌ `debe llamar a login con credenciales agusvc@gmail.com / pomelo2005`
- ❌ `debe mostrar error si las credenciales son incorrectas`

**Error principal:** `Cannot read properties of undefined (reading 'clipboard')`

---

### 2. ExpedienteForm.test.tsx (4 tests fallando)

**Archivo:** `src/components/expedientes/__tests__/ExpedienteForm.test.tsx`

- ❌ `renderiza el formulario para crear nuevo expediente`
- ❌ `valida que el título es requerido`
- ❌ `valida que el título tiene mínimo 10 caracteres`
- ❌ `envía el formulario con datos válidos`

**Error principal:** `Cannot read properties of undefined (reading 'clipboard')`

---

### 3. ContactForm.test.tsx (3 tests fallando)

**Archivo:** `src/components/CRM/__tests__/ContactForm.test.tsx`

- ❌ `debe renderizar el formulario`
- ❌ `debe validar que el nombre es requerido`
- ❌ `debe enviar el formulario con datos válidos`

**Error principal:** 
- `Cannot read properties of undefined (reading 'clipboard')`
- `Expected container to be an Element, a Document or a DocumentFragment but got undefined`

---

### 4. CompanyForm.test.tsx (3 tests fallando)

**Archivo:** `src/components/CRM/__tests__/CompanyForm.test.tsx`

- ❌ `debe renderizar el formulario`
- ❌ `debe validar que el nombre es requerido`
- ❌ `debe enviar el formulario con datos válidos`

**Error principal:**
- `Cannot read properties of undefined (reading 'clipboard')`
- `Expected container to be an Element, a Document or a DocumentFragment but got undefined`

---

### 5. TaskForm.test.tsx (3 tests fallando)

**Archivo:** `src/components/CRM/__tests__/TaskForm.test.tsx`

- ❌ `debe renderizar el formulario`
- ❌ `debe validar campos requeridos`
- ❌ `debe enviar el formulario con datos válidos`

**Error principal:** `defaultEntityId?.slice is not a function` (ya corregido, pero aún falla por clipboard)

---

## ✅ Tests que Pasan (19 tests)

### Servicios API (9 tests) ✅
- ✅ `expedienteApi.test.ts` - 5 tests
- ✅ `pipelineApi.test.ts` - 4 tests

### Hooks (6 tests) ✅
- ✅ `usePermissions.test.ts` - 6 tests

### Componentes (4 tests) ✅
- ✅ `ExpedienteCard.test.tsx` - 4 tests

---

## 🔍 Análisis de Errores

### Error Principal: Clipboard API

**Error:** `Cannot read properties of undefined (reading 'clipboard')`

**Ubicación:** `node_modules/@testing-library/user-event/dist/esm/utils/dataTransfer/Clipboard.js`

**Causa:** `@testing-library/user-event` intenta acceder a `view.clipboard` donde `view` es `undefined` en el entorno de jsdom.

**Tests afectados:** Todos los tests que usan `userEvent` (17 tests)

---

### Error Secundario: Renderizado

**Error:** `Expected container to be an Element, a Document or a DocumentFragment but got undefined`

**Ubicación:** `node_modules/@testing-library/dom/dist/wait-for.js`

**Causa:** El cleanup está eliminando el DOM antes de que `waitFor` pueda acceder a él, o el render no está funcionando correctamente debido al error de clipboard.

**Tests afectados:** Tests que usan `waitFor` después de interacciones con `userEvent`

---

## 📊 Resumen por Archivo

| Archivo | Tests Totales | Tests Pasando | Tests Fallando | % Éxito |
|---------|--------------|--------------|----------------|---------|
| `expedienteApi.test.ts` | 5 | 5 | 0 | 100% ✅ |
| `pipelineApi.test.ts` | 4 | 4 | 0 | 100% ✅ |
| `usePermissions.test.ts` | 6 | 6 | 0 | 100% ✅ |
| `ExpedienteCard.test.tsx` | 4 | 4 | 0 | 100% ✅ |
| `AdminLogin.test.tsx` | 4 | 0 | 4 | 0% ❌ |
| `ExpedienteForm.test.tsx` | 4 | 0 | 4 | 0% ❌ |
| `ContactForm.test.tsx` | 3 | 0 | 3 | 0% ❌ |
| `CompanyForm.test.tsx` | 3 | 0 | 3 | 0% ❌ |
| `TaskForm.test.tsx` | 3 | 0 | 3 | 0% ❌ |
| **TOTAL** | **36** | **19** | **17** | **52.78%** |

---

## 🎯 Conclusión

**Tests críticos funcionando:**
- ✅ Todos los tests de servicios API (9/9)
- ✅ Todos los tests de hooks (6/6)
- ✅ Tests de componentes básicos (4/4)

**Tests con problemas:**
- ❌ Tests de formularios que usan `userEvent` (17/17)
- ❌ Problema: Configuración de clipboard en jsdom, no código de negocio

**Recomendación:** Los tests críticos del sistema (servicios API, hooks, componentes básicos) están funcionando correctamente. Los tests que fallan son principalmente por problemas de configuración del entorno de testing con `user-event` y clipboard, no por errores en el código de negocio.

---

**Última actualización:** 2025-01-28






