# 🗑️ Botón de Eliminar Contacto (Solo Administradores)

## 📋 Cambio Implementado

**Fecha**: 20 de Diciembre, 2025

Se agregó un botón para eliminar contactos en la ficha de contacto, visible solo para administradores.

---

## ✅ Cambios Realizados

### 1. Botón de Eliminar en `CRMContactDetail.tsx`

**Ubicación**: Junto al botón "Editar" en el header de la página

**Características:**
- ✅ Solo visible para administradores (`isAdmin`)
- ✅ Estilo distintivo (rojo) para indicar acción destructiva
- ✅ Confirmación doble antes de eliminar
- ✅ Estado de carga durante la eliminación
- ✅ Navegación automática a la lista de contactos después de eliminar

### 2. Función de Eliminación

```typescript
const handleDeleteContact = async () => {
  if (!id || !contact) return;
  
  // Confirmación doble para evitar eliminaciones accidentales
  const confirmMessage = `¿Estás seguro de que deseas eliminar el contacto "${contact.name}"?\n\nEsta acción no se puede deshacer.`;
  
  if (!window.confirm(confirmMessage)) {
    return;
  }
  
  // Segunda confirmación
  if (!window.confirm('Esta acción es permanente. ¿Continuar con la eliminación?')) {
    return;
  }
  
  setDeleting(true);
  try {
    await crmService.deleteContact(id);
    navigate('/crm/contacts');
  } catch (err: any) {
    console.error('Error deleting contact:', err);
    const errorMessage = err?.response?.data?.detail || err?.message || 'Error al eliminar el contacto';
    alert(`Error al eliminar el contacto: ${errorMessage}`);
  } finally {
    setDeleting(false);
  }
};
```

### 3. Verificación de Permisos

Se usa el hook `useAuth()` para verificar si el usuario es administrador:

```typescript
import { useAuth } from '@/providers/AuthProvider';

const { isAdmin } = useAuth();
```

**Condiciones para ser admin:**
- `user.is_superuser === true`
- `user.role === 'admin'`
- `user.role === 'superuser'`

---

## 🎨 Diseño Visual

### Botón de Eliminar

- **Color**: Rojo (`border-red-300 text-red-700`)
- **Hover**: Fondo rojo claro (`hover:bg-red-50 hover:border-red-400`)
- **Icono**: `Trash2` de lucide-react
- **Estado de carga**: Muestra "Eliminando..." cuando está procesando

### Ubicación

```
┌─────────────────────────────────────────┐
│ [← Volver]  Nombre del Contacto        │
│              [Editar] [🗑️ Eliminar]     │
└─────────────────────────────────────────┘
```

---

## 🔒 Seguridad

### Verificación de Permisos

1. **Frontend**: El botón solo se muestra si `isAdmin === true`
2. **Backend**: El endpoint `/api/crm/contacts/{id}` debe validar permisos de administrador

### Confirmación Doble

Para evitar eliminaciones accidentales:
1. Primera confirmación: Muestra el nombre del contacto
2. Segunda confirmación: Reafirma que la acción es permanente

---

## 📝 Flujo de Eliminación

1. Usuario admin hace clic en "Eliminar"
2. Primera confirmación: "¿Estás seguro de eliminar [nombre]?"
3. Segunda confirmación: "Esta acción es permanente. ¿Continuar?"
4. Si confirma ambas:
   - Se muestra "Eliminando..." en el botón
   - Se llama a `crmService.deleteContact(id)`
   - Si tiene éxito: Navega a `/crm/contacts`
   - Si hay error: Muestra mensaje de error

---

## 📚 Archivos Modificados

1. **`src/pages/CRMContactDetail.tsx`**
   - Importado `useAuth` de `@/providers/AuthProvider`
   - Importado `Trash2` de `lucide-react`
   - Agregado estado `deleting`
   - Agregada función `handleDeleteContact()`
   - Agregado botón de eliminar condicionalmente visible

---

## ✅ Resultado

Ahora en la ficha de contacto:

- ✅ **Administradores** ven el botón "Eliminar" junto a "Editar"
- ✅ **Usuarios no admin** no ven el botón
- ✅ **Confirmación doble** antes de eliminar
- ✅ **Feedback visual** durante la eliminación
- ✅ **Navegación automática** después de eliminar

---

**Última Actualización**: 20 de Diciembre, 2025  
**Estado**: ✅ **COMPLETADO**







