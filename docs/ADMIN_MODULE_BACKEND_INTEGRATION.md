# 🔌 Integración del Módulo Admin con Backend

## 📋 Resumen

Este documento describe cómo el módulo admin del frontend se integra con los endpoints reales del backend según la documentación proporcionada.

---

## 🔗 Endpoints Utilizados

### Base Path: `/api/users`

Todos los endpoints utilizan el prefijo `/api/users` (no `/api/admin/users`).

---

## 📊 Lista de Usuarios

### Endpoint: `GET /api/users/`

**Uso en Frontend:**
```typescript
await adminService.getAllUsers({ skip: 0, limit: 100 });
```

**Query Parameters:**
- `skip` (opcional): Registros a saltar
- `limit` (opcional): Límite de registros (default: 100)

**Permisos:** Solo admin

**Respuesta:** Array de objetos `User`

---

## 👤 Obtener Usuario

### Endpoint: `GET /api/users/{user_id}`

**Uso en Frontend:**
```typescript
await adminService.getUser(userId);
```

**Permisos:**
- Admin: Puede ver cualquier usuario
- Usuario: Solo puede ver su propia información

**Respuesta:** Objeto `User`

---

## ✏️ Actualizar Usuario

### Endpoint: `PATCH /api/users/{user_id}`

**Uso en Frontend:**
```typescript
await adminService.updateUser(userId, {
  email: 'nuevo@email.com',
  full_name: 'Nuevo Nombre',
  phone_number: '+34612345678',
  bio: 'Biografía...',
  // ...
});
```

**Permisos:**
- Usuario: Solo puede actualizar su propia información
- Admin: Puede actualizar cualquier usuario

**Campos actualizables:**
- `email`, `full_name`, `phone_number`, `avatar_url`, `photo_avatar_url`, `bio`
- `is_active`, `is_verified`, `role` (solo admin)

---

## 🗑️ Eliminar Usuario

### Endpoint: `DELETE /api/users/{user_id}`

**Uso en Frontend:**
```typescript
await adminService.deleteUser(userId);
```

**Permisos:**
- Admin: Puede eliminar cualquier usuario (excepto a sí mismo)
- Usuario: Solo puede eliminar su propia cuenta

**Nota:** Hard delete (eliminación física)

---

## 🔄 Cambiar Rol

### Endpoint: `PATCH /api/users/{user_id}/role`

**Uso en Frontend:**
```typescript
await adminService.updateUserRole(userId, 'lawyer');
```

**Permisos:** Solo admin

**Request Body:**
```json
{
  "role": "lawyer" // "admin" | "lawyer" | "agent" | "user"
}
```

**Audit Log:** Se registra la acción `user_role_changed`

---

## ✅ Cambiar Estado

### Endpoint: `PATCH /api/users/{user_id}/status`

**Uso en Frontend:**
```typescript
await adminService.updateUserStatus(userId, true); // activar
await adminService.updateUserStatus(userId, false); // desactivar
```

**Permisos:** Solo admin

**Request Body:**
```json
{
  "is_active": true
}
```

**Audit Log:** Se registra la acción `user_status_changed`

---

## 🔑 Reset Password

### Endpoint: `POST /api/users/{user_id}/reset-password`

**Uso en Frontend:**
```typescript
await adminService.resetUserPassword(userId);
```

**Permisos:** Solo admin

**Respuesta:**
```json
{
  "message": "Password reset email sent successfully"
}
```

**Audit Log:** Se registra la acción `user_password_reset`

**Nota:** Se envía un email al usuario con un enlace para resetear su contraseña.

---

## 👁️ Impersonar Usuario

### Endpoint: `POST /api/users/{user_id}/impersonate`

**Uso en Frontend:**
```typescript
const response = await adminService.impersonateUser(userId);
// Guardar token de impersonación
localStorage.setItem('access_token', response.access_token);
```

**Permisos:** Solo superuser (role = "admin" y is_superuser = true)

**Respuesta:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "expires_in": 3600,
  "impersonated_user_id": "user-id",
  "original_user_id": "admin-id"
}
```

**Audit Log:** Se registra la acción `user_impersonated`

**Nota:** El token permite actuar como el usuario impersonado. El token contiene información del usuario original en `impersonated_by`.

---

## 📥 Exportar Usuarios

### Endpoint: `GET /api/users/export`

**Uso en Frontend:**
```typescript
// Exportar CSV
const csvBlob = await adminService.exportUsers({
  format: 'csv',
  role: 'lawyer',
  is_active: true,
  limit: 1000
});

// Exportar JSON
const jsonData = await adminService.exportUsers({
  format: 'json',
  role: 'lawyer',
  is_active: true,
  limit: 1000
});
```

**Permisos:** Solo admin

**Query Parameters:**
- `format` (opcional): `"json"` o `"csv"` (default: "json")
- `role` (opcional): Filtrar por rol
- `is_active` (opcional): Filtrar por estado activo
- `is_verified` (opcional): Filtrar por estado verificado
- `from_date` (opcional): Fecha desde (ISO 8601)
- `to_date` (opcional): Fecha hasta (ISO 8601)
- `q` (opcional): Búsqueda de texto (email, nombre)
- `skip` (opcional): Registros a saltar
- `limit` (opcional): Límite de registros (default: 1000)

**Respuesta JSON:**
```json
{
  "users": [...],
  "total": 100,
  "exported_at": "2025-01-15T12:00:00Z",
  "filters": {...}
}
```

**Respuesta CSV:**
- Content-Type: `text/csv`
- Content-Disposition: `attachment; filename=users_export.csv`

**Audit Log:** Se registra la acción `users_exported`

---

## 📜 Logs de Auditoría

### Endpoint: `GET /api/users/audit-logs`

**Uso en Frontend:**
```typescript
const logs = await adminService.getAuditLogs({
  user_id: userId,
  limit: 50
});
```

**Permisos:** Solo admin

**Query Parameters:**
- `user_id` (opcional): ID del usuario (UUID)
- `from_date` (opcional): Fecha desde (ISO 8601)
- `to_date` (opcional): Fecha hasta (ISO 8601)
- `q` (opcional): Búsqueda de texto
- `skip` (opcional): Registros a saltar (default: 0)
- `limit` (opcional): Límite de registros (default: 100)

**Respuesta:**
```json
{
  "items": [
    {
      "id": "log-id",
      "actor_id": "admin-id",
      "actor_email": "admin@migro.es",
      "action": "user_role_changed",
      "entity_type": "user",
      "entity_id": "user-id",
      "details": {
        "old_role": "user",
        "new_role": "lawyer"
      },
      "ip_address": "192.168.1.1",
      "user_agent": "Mozilla/5.0...",
      "created_at": "2025-01-15T10:30:00Z"
    }
  ],
  "total": 1,
  "skip": 0,
  "limit": 100
}
```

**Nota:** Filtra automáticamente por `entity_type = "user"`.

---

## 📸 Subir Foto de Perfil

### Endpoint: `POST /api/users/me/photo-avatar`

**Uso en Frontend:**
```typescript
await adminService.uploadPhotoAvatar(file);
```

**Permisos:** Cualquier usuario autenticado

**Content-Type:** `multipart/form-data`

**Request Body:**
- `photo`: Archivo de imagen (JPEG, PNG, GIF, WEBP)
  - Tamaño máximo: 5MB

**Validaciones:**
- Tamaño máximo: 5MB
- Formatos permitidos: image/jpeg, image/png, image/jpg, image/gif, image/webp

**Respuesta:** Objeto `User` actualizado

**Nota:** La imagen se sube a Cloudinary. Si existe una foto anterior, se elimina automáticamente.

---

## 🔐 Autenticación

Todos los endpoints requieren autenticación mediante Bearer Token:

```typescript
Authorization: Bearer {access_token}
```

El token se obtiene del `localStorage` después del login y se añade automáticamente mediante el interceptor de Axios.

---

## ⚠️ Manejo de Errores

### Códigos de Error Comunes

- `400`: Bad Request - Datos inválidos
- `401`: Unauthorized - Token inválido o expirado
- `403`: Forbidden - No tiene permisos
- `404`: Not Found - Usuario no encontrado
- `413`: Payload Too Large - Archivo demasiado grande (foto)
- `415`: Unsupported Media Type - Tipo de archivo no soportado
- `500`: Internal Server Error - Error del servidor

### Ejemplo de Manejo

```typescript
try {
  await adminService.updateUserRole(userId, 'lawyer');
} catch (error: any) {
  if (error.response?.status === 403) {
    alert('No tienes permisos para cambiar roles');
  } else if (error.response?.status === 404) {
    alert('Usuario no encontrado');
  } else {
    alert(error.response?.data?.detail || 'Error al actualizar rol');
  }
}
```

---

## 📝 Notas Importantes

1. **Creación de Usuarios:** Los usuarios se crean mediante `/api/auth/register`, no directamente desde el módulo admin.

2. **Hard Delete:** La eliminación de usuarios es física (hard delete). Considerar implementar soft delete en el futuro.

3. **Impersonación:** Solo los superusuarios pueden impersonar. El token de impersonación contiene información del usuario original.

4. **Audit Logs:** Todas las acciones administrativas se registran automáticamente en los logs de auditoría.

5. **Exportación:** El límite máximo de registros en exportación es 1000 por defecto.

6. **Paginación:** Los endpoints de listado soportan `skip` y `limit` para paginación.

---

**Última actualización:** 15 de Diciembre de 2025  
**Versión:** 1.0.0



