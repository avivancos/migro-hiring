# Debug: Problema de Roles de Administrador

## Problema

Un usuario que debería ser administrador está recibiendo el error "Acceso Denegado" porque el sistema lo identifica como `role: 'user'` con `is_superuser: false`.

## Causas Posibles

1. **Token JWT desactualizado**: El usuario hizo login antes de que se actualizaran sus permisos en el backend
2. **Backend devuelve datos incorrectos**: El endpoint `/users/me` está devolviendo roles incorrectos
3. **Problema de sincronización**: Los permisos del usuario fueron actualizados en el backend pero el token JWT no se actualizó

## Solución Implementada

### 1. Botón de Refresh en ProtectedRoute

Se agregó un botón "Refrescar permisos" en la pantalla de "Acceso Denegado" que:
- Llama a `refreshUser()` para forzar una nueva llamada a `/users/me`
- Actualiza el estado del usuario con los datos más recientes del backend
- Permite al usuario intentar nuevamente sin cerrar sesión

### 2. Mejora de Logging

Se agregó logging detallado en `AuthProvider.tsx` para ver:
- Qué datos devuelve el backend en `/users/me`
- Cómo se mapean esos datos al tipo `User`
- Si el usuario es reconocido como admin después del mapeo

### 3. Mensaje Mejorado

El mensaje de error ahora incluye:
- Email del usuario
- Rol actual
- Estado de `is_superuser`
- Instrucciones para resolver el problema

## Cómo Usar

### Si recibes "Acceso Denegado":

1. **Haz clic en "Refrescar permisos"**: Esto forzará una nueva llamada al backend para obtener los datos actualizados
2. **Si no funciona, haz clic en "Ir al login"**: Cierra sesión y vuelve a iniciar sesión para obtener un nuevo token JWT con los roles actualizados

### Para Desarrolladores

#### Ver logs en la consola:

1. Abre las herramientas de desarrollador (F12)
2. Ve a la pestaña "Console"
3. Busca los logs que empiezan con:
   - `🔍 [AuthProvider] Datos del backend /users/me:`
   - `✅ [AuthProvider] Usuario mapeado:`
   - `🚫 [ProtectedRoute] Acceso denegado - Detalles:`

#### Verificar datos del backend:

```javascript
// En la consola del navegador, ejecuta:
fetch('/api/users/me', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('access_token')}`
  }
})
.then(r => r.json())
.then(data => console.log('Backend data:', data));
```

## Backend - Requisitos

El backend debe:

1. **Devolver roles correctos en `/users/me`**:
   ```json
   {
     "id": 1,
     "email": "admin@example.com",
     "role": "admin",  // o "superuser"
     "is_superuser": true
   }
   ```

2. **Incluir roles en el JWT**: El token JWT debe incluir los roles del usuario para validación rápida

3. **Validar permisos en cada request**: Aunque el JWT incluya roles, el backend debe validar que el usuario todavía tiene esos permisos

## Verificación

### Verificar que el usuario es admin en el backend:

```sql
-- Verificar en la base de datos
SELECT id, email, role, is_superuser 
FROM users 
WHERE email = 'agusvc@gmail.com';
```

**Si el usuario NO es admin en la BD:**
```sql
-- Promover a admin
UPDATE users 
SET role = 'admin', is_superuser = true 
WHERE email = 'agusvc@gmail.com';
```

### Verificar el token JWT:

1. Abre la consola del navegador (F12)
2. Ejecuta: `localStorage.getItem('access_token')`
3. Copia el token
4. Decodifícalo en https://jwt.io
5. Verifica que el payload incluya `role: "admin"` o `is_superuser: true`

**Si el token NO incluye los roles correctos:**
- El usuario necesita hacer **logout y login nuevamente** para obtener un nuevo token con los roles actualizados

### Verificar qué devuelve el backend:

En la consola del navegador, ejecuta:

```javascript
fetch('http://localhost:3000/api/users/me', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('access_token')}`
  }
})
.then(r => r.json())
.then(data => {
  console.log('Backend devuelve:', data);
  console.log('Role:', data.role);
  console.log('is_superuser:', data.is_superuser);
});
```

**Si el backend devuelve `role: 'user'` cuando debería ser `admin`:**
- El problema está en el backend
- Verifica que el endpoint `/users/me` esté devolviendo los datos correctos de la base de datos
- Verifica que el usuario tenga `role = 'admin'` o `is_superuser = true` en la BD

## Notas

- Si el usuario fue promovido a admin después de hacer login, necesita hacer logout/login para obtener un nuevo token
- El botón "Refrescar permisos" solo actualiza los datos del usuario, no el token JWT
- Si el problema persiste después de refrescar, el backend puede estar devolviendo datos incorrectos
