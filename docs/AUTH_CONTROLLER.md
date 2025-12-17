# 🔐 Controlador de Autenticación - Frontend

**Fecha**: 2025-01-16  
**Ubicación**: `src/controllers/authController.ts`

---

## 📋 Descripción

Controlador de autenticación que maneja la conexión con la API externa (`api.migro.es`) para gestionar sesiones de usuario. Este controlador actúa como intermediario entre los componentes React y la API externa.

---

## 🎯 Funcionalidades

### 1. **Gestión de Sesiones**
- Mantiene el estado de la sesión actual
- Sincroniza con localStorage
- Verifica sesión contra la API externa

### 2. **Login**
- Conecta con `POST /auth/login` de la API externa
- Obtiene tokens de acceso y refresh
- Obtiene información del usuario desde `/users/me`
- Actualiza el estado de sesión

### 3. **Logout**
- Notifica a la API externa (`POST /auth/logout`)
- Limpia sesión local y localStorage

### 4. **Verificación de Sesión**
- Verifica token contra la API (`GET /users/me`)
- Actualiza información del usuario
- Detecta sesiones expiradas

### 5. **Refresh Token**
- Refresca token de acceso automáticamente
- Maneja errores de refresh

---

## 🔌 Conexión con API Externa

### Endpoints Utilizados

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `POST` | `/auth/login` | Autenticar usuario |
| `POST` | `/auth/logout` | Cerrar sesión |
| `POST` | `/auth/refresh` | Refrescar token |
| `GET` | `/users/me` | Obtener usuario actual |

### Base URL

La base URL se configura en `src/config/constants.ts`:
```typescript
export const API_BASE_URL = 'https://api.migro.es/api';
```

---

## 📦 Uso

### Importar

```typescript
import { authController } from '@/controllers/authController';
```

### Inicializar Sesión

```typescript
// Al iniciar la aplicación
const session = authController.initializeSession();
```

### Login

```typescript
try {
  const session = await authController.login('admin@migro.es', 'password123');
  console.log('Sesión iniciada:', session);
} catch (error) {
  console.error('Error en login:', error);
}
```

### Verificar Sesión

```typescript
const session = await authController.verifySession();
if (session.isAuthenticated) {
  console.log('Usuario autenticado:', session.user);
}
```

### Logout

```typescript
await authController.logout();
```

### Obtener Estado Actual

```typescript
const session = authController.getSession();
const user = authController.getCurrentUser();
const isAuth = authController.isAuthenticated();
const isAdmin = authController.isAdmin();
```

---

## 🔄 Flujo de Autenticación

```
1. Usuario ingresa credenciales
   ↓
2. authController.login(email, password)
   ↓
3. authService.login() → POST /auth/login
   ↓
4. API retorna tokens (access_token, refresh_token)
   ↓
5. api.get('/users/me') → Obtener información del usuario
   ↓
6. Actualizar sesión local
   ↓
7. Guardar en localStorage
   ↓
8. Retornar sesión completa
```

---

## 💾 Almacenamiento

### localStorage

El controlador guarda:
- `access_token` - Token JWT de acceso
- `refresh_token` - Token JWT de refresh
- `admin_token` - Token de admin (compatibilidad)
- `admin_user` - Información del usuario (compatibilidad)

---

## 🔐 Seguridad

### Tokens
- Los tokens se almacenan en localStorage
- El refresh token se usa automáticamente cuando el access token expira
- Los tokens se limpian al hacer logout

### Verificación
- La sesión se verifica contra la API en cada verificación
- Si el token es inválido (401), se limpia la sesión automáticamente

---

## 🔗 Integración con AuthProvider

El `AuthProvider` (`src/providers/AuthProvider.tsx`) usa este controlador internamente:

```typescript
// En AuthProvider
const login = async (email: string, password: string) => {
  const session = await authController.login(email, password);
  setUser(session.user);
  // ...
};
```

---

## 📝 Notas

- El controlador es un **singleton** - solo hay una instancia
- La sesión se mantiene en memoria durante la ejecución de la app
- Los cambios en localStorage se sincronizan automáticamente
- El interceptor de Axios (`src/services/api.ts`) maneja el refresh automático de tokens

---

## 🚀 Próximos Pasos

- [ ] Agregar eventos para notificar cambios de sesión
- [ ] Implementar caché de sesión con TTL
- [ ] Agregar métricas de autenticación
- [ ] Implementar sesiones múltiples (si es necesario)

---

**Última actualización**: 2025-01-16  
**Versión**: 1.0.0





