# 📱 Guía Completa de Integración Frontend - API Migro

**Fecha:** 2025-01-28  
**Prioridad:** 🔴 CRÍTICA  
**Estado:** ✅ IMPLEMENTADO

---

## 🎯 Información Esencial para el Desarrollador Frontend React

Esta guía proporciona toda la información necesaria para implementar la autenticación de usuarios y administradores en tu aplicación React/React Native, así como el acceso a todos los endpoints de la API.

---

## 📋 Tabla de Contenidos

1. [Configuración Base](#configuración-base)
2. [Autenticación: Login](#autenticación-login)
3. [Almacenamiento de Tokens](#almacenamiento-de-tokens)
4. [Configuración de Axios](#configuración-de-axios)
5. [Obtener Información del Usuario](#obtener-información-del-usuario)
6. [Diferenciación de Roles](#diferenciación-de-roles)
7. [Refresh Token Automático](#refresh-token-automático)
8. [Protección de Rutas](#protección-de-rutas)
9. [Todos los Endpoints de la API](#todos-los-endpoints-de-la-api)
10. [Ejemplos de Uso Completos](#ejemplos-de-uso-completos)

---

## 🔧 Configuración Base

### URLs de la API

**Archivo:** `src/config/constants.ts`

```typescript
// SIEMPRE USA API DE PRODUCCIÓN
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://api.migro.es/api';
export const API_TIMEOUT = 30000; // 30 segundos
```

**Configuración:**
- **Producción**: `https://api.migro.es/api`
- **Desarrollo**: Puede configurarse con `VITE_API_BASE_URL` en `.env`
- **Variable de entorno**: `VITE_API_BASE_URL` (opcional, sobrescribe default)

### Documentación Swagger

- **Swagger UI**: https://api.migro.es/docs
- **ReDoc**: https://api.migro.es/redoc

---

## 1️⃣ AUTENTICACIÓN: LOGIN

### 🔗 Endpoint de Login

**⚠️ IMPORTANTE**: El mismo endpoint se usa para **usuarios normales** y **administradores**. No hay endpoints separados.

**URL:**
```
POST https://api.migro.es/api/auth/login
```

**Headers:**
```
Content-Type: application/json
```

**Request Body:**
```json
{
  "email": "usuario@ejemplo.com",
  "password": "tuPassword123"
}
```

**Response Success (200):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "expires_in": 1209600,          // 14 días en segundos
  "refresh_expires_in": 2592000   // 30 días en segundos
}
```

**Response Error (401 - Credenciales incorrectas):**
```json
{
  "detail": "Incorrect email or password"
}
```

**Response Error (400 - Usuario inactivo):**
```json
{
  "detail": "Inactive user"
}
```

### Ejemplo de Implementación

```typescript
// services/authService.ts
import { api } from './api';
import TokenStorage from '@/utils/tokenStorage';

interface LoginCredentials {
  email: string;
  password: string;
}

interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  refresh_expires_in: number;
}

export const login = async (credentials: LoginCredentials): Promise<TokenResponse> => {
  try {
    const response = await api.post('/auth/login', credentials);
    
    // Guardar tokens usando TokenStorage (almacenamiento triple)
    TokenStorage.saveTokens(response.data);
    
    return response.data;
  } catch (error: any) {
    if (error.response?.status === 401) {
      throw new Error('Credenciales incorrectas');
    } else if (error.response?.status === 400) {
      throw new Error('Usuario inactivo');
    }
    throw new Error('Error al iniciar sesión');
  }
};
```

---

## 2️⃣ ALMACENAMIENTO DE TOKENS

### ⚠️ CRÍTICO: Almacenamiento Triple

**IMPORTANTE**: Los tokens se guardan en **MÚLTIPLES lugares** para máxima persistencia:

1. **localStorage** (principal): Para acceso rápido desde JavaScript
2. **Cookies** (persistencia): Para persistencia y envío automático (15 días)
3. **sessionStorage** (backup): Como backup adicional

### Implementación Actual

**Archivo:** `src/utils/tokenStorage.ts`

La implementación actual ya incluye almacenamiento triple con:

- ✅ Prefijo `migro_` para evitar conflictos
- ✅ Fallback automático: localStorage → cookies → sessionStorage
- ✅ Restauración automática en localStorage si se encuentra en otra fuente
- ✅ Buffer de expiración de 1 minuto (mínimo necesario)
- ✅ Método `hasValidTokens()` mejorado

**Ver:** [Guía de Persistencia de Autenticación](./FRONTEND_AUTH_PERSISTENCE_GUIDE.md) para detalles completos.

### Uso Básico

```typescript
import TokenStorage from '@/utils/tokenStorage';

// Guardar tokens después del login
TokenStorage.saveTokens({
  access_token: '...',
  refresh_token: '...',
  token_type: 'bearer',
  expires_in: 1209600,
  refresh_expires_in: 2592000,
});

// Obtener access token (lee de múltiples fuentes)
const token = TokenStorage.getAccessToken();

// Obtener refresh token (lee de múltiples fuentes)
const refreshToken = TokenStorage.getRefreshToken();

// Verificar si hay tokens válidos
const hasValid = TokenStorage.hasValidTokens();

// Verificar si el token está expirado
const isExpired = TokenStorage.isTokenExpired();

// Limpiar tokens (solo cuando sea necesario)
TokenStorage.clearTokens();
```

---

## 3️⃣ CONFIGURACIÓN DE AXIOS

### Cliente API con Interceptors

**Archivo:** `src/services/api.ts`

El cliente API ya está configurado con:

- ✅ Interceptores de request (agregar token automáticamente)
- ✅ Interceptores de response (manejo de errores y refresh token)
- ✅ Refresh token automático
- ✅ **NO limpia tokens en errores temporales** (500, 502, 503, 504, etc.)
- ✅ Solo limpia tokens cuando el refresh token está realmente expirado

### Uso del Cliente API

```typescript
import { api } from '@/services/api';

// Las peticiones automáticamente incluyen el token
const response = await api.get('/users/me');
const user = response.data;

// El refresh token se maneja automáticamente
// Si el access token expira, se refresca automáticamente
```

### Manejo de Errores

**⚠️ CRÍTICO**: Los errores NO invalidan la sesión automáticamente.

```typescript
try {
  const response = await api.get('/some-endpoint');
  // ...
} catch (error: any) {
  // Errores 500, 502, 503, 504, timeout, etc. NO limpian tokens
  // Solo errores 401 después de intentar refresh limpian tokens
  
  if (error.response?.status === 401) {
    // Token expirado y refresh falló
    // Los tokens ya fueron limpiados por el interceptor
    // Redirigir a login si es necesario
  } else if (error.response?.status === 403) {
    // Error de permisos, NO de autenticación
    // Tokens se mantienen
  } else if (error.response?.status >= 500) {
    // Error del servidor
    // Tokens se mantienen
  }
}
```

---

## 4️⃣ OBTENER INFORMACIÓN DEL USUARIO

### Endpoint: Obtener Usuario Actual

```
GET https://api.migro.es/api/users/me
```

**Headers:**
```
Authorization: Bearer {access_token}
```

**Response (200):**
```json
{
  "id": "507f1f77bcf86cd799439011",
  "email": "usuario@ejemplo.com",
  "full_name": "Juan Pérez",
  "phone_number": "+34612345678",
  "avatar_url": "https://cloudinary.com/...",
  "bio": "Descripción del usuario",
  "is_active": true,
  "is_verified": true,
  "role": "user",  // o "admin", "lawyer", "agent"
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-15T10:30:00Z"
}
```

### Implementación

```typescript
// services/authService.ts
import { api } from './api';
import TokenStorage from '@/utils/tokenStorage';

export interface User {
  id: string;
  email: string;
  full_name?: string;
  phone_number?: string;
  avatar_url?: string;
  bio?: string;
  is_active: boolean;
  is_verified: boolean;
  role: 'user' | 'admin' | 'lawyer' | 'agent';
  created_at: string;
  updated_at: string;
}

export const getCurrentUser = async (): Promise<User> => {
  const response = await api.get('/users/me');
  
  // Guardar usuario en storage para uso offline
  TokenStorage.saveUserData(response.data);
  
  return response.data;
};

export const updateCurrentUser = async (userData: Partial<User>): Promise<User> => {
  const response = await api.patch('/users/me', userData);
  return response.data;
};
```

---

## 5️⃣ DIFERENCIACIÓN DE ROLES

### Roles Disponibles

```typescript
export enum UserRole {
  ADMIN = 'admin',      // Administrador del sistema
  AGENT = 'agent',      // Agente de soporte
  LAWYER = 'lawyer',    // Abogado
  USER = 'user',        // Usuario normal
}
```

### Verificación de Roles

```typescript
// utils/roleChecker.ts
import { User, UserRole } from '@/types/user';

export class RoleChecker {
  /**
   * Verificar si el usuario es administrador
   */
  static isAdmin(user: User | null): boolean {
    return user?.role === UserRole.ADMIN;
  }

  /**
   * Verificar si el usuario es abogado
   */
  static isLawyer(user: User | null): boolean {
    return user?.role === UserRole.LAWYER;
  }

  /**
   * Verificar si el usuario es agente
   */
  static isAgent(user: User | null): boolean {
    return user?.role === UserRole.AGENT;
  }

  /**
   * Verificar si el usuario es usuario normal
   */
  static isRegularUser(user: User | null): boolean {
    return user?.role === UserRole.USER;
  }

  /**
   * Verificar si el usuario tiene permisos de staff (admin, lawyer, agent)
   */
  static isStaff(user: User | null): boolean {
    return user?.role === UserRole.ADMIN || 
           user?.role === UserRole.LAWYER || 
           user?.role === UserRole.AGENT;
  }

  /**
   * Verificar si el usuario tiene uno de los roles especificados
   */
  static hasRole(user: User | null, roles: UserRole[]): boolean {
    if (!user) return false;
    return roles.includes(user.role as UserRole);
  }
}
```

---

## 6️⃣ REFRESH TOKEN AUTOMÁTICO

El refresh token ya está implementado en los interceptors de Axios (ver `src/services/api.ts`). El proceso es:

1. **Detección automática**: Cuando una petición devuelve 401
2. **Refresh automático**: Se llama a `/api/auth/refresh` con el refresh token
3. **Actualización**: Se guardan los nuevos tokens (almacenamiento triple)
4. **Reintento**: Se reintenta la petición original con el nuevo token
5. **Logout**: Si el refresh falla Y el refresh token está expirado, se cierra sesión automáticamente

### Endpoint de Refresh

```
POST https://api.migro.es/api/auth/refresh
```

**Request Body:**
```json
{
  "refresh_token": "eyJhbGc..."
}
```

**Response:**
```json
{
  "access_token": "nuevo_access_token...",
  "refresh_token": "nuevo_refresh_token...",
  "token_type": "bearer",
  "expires_in": 1209600,
  "refresh_expires_in": 2592000
}
```

### Refresh Proactivo

**Archivo:** `src/hooks/useTokenRefresh.ts`

El hook `useTokenRefresh` verifica cada 5 minutos si el token necesita refresh:

```typescript
import { useTokenRefresh } from '@/hooks/useTokenRefresh';

function App() {
  // Activar refresh automático para mantener sesión 15 días
  useTokenRefresh();
  
  return (
    // Tu aplicación
  );
}
```

---

## 7️⃣ PROTECCIÓN DE RUTAS

### Componente ProtectedRoute

```typescript
// components/ProtectedRoute.tsx
import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import TokenStorage from '@/utils/tokenStorage';
import { getCurrentUser } from '@/services/authService';
import { RoleChecker } from '@/utils/roleChecker';
import { User, UserRole } from '@/types/user';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  requireAdmin?: boolean;
  requireStaff?: boolean;
  allowedRoles?: UserRole[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requireAuth = true,
  requireAdmin = false,
  requireStaff = false,
  allowedRoles = [],
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    const checkAuth = async () => {
      // ⚠️ CRÍTICO: Verificar si hay tokens válidos en cualquier fuente
      if (!TokenStorage.hasValidTokens()) {
        setLoading(false);
        return;
      }

      // Si el access token está expirado pero hay refresh token válido
      if (TokenStorage.isTokenExpired() && !TokenStorage.isRefreshTokenExpired()) {
        // El interceptor de axios manejará el refresh automáticamente
        // Solo esperar un momento para que se complete
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      try {
        // Intentar obtener usuario actual
        const currentUser = await getCurrentUser();
        setUser(currentUser);
        TokenStorage.saveUserData(currentUser);
      } catch (err: any) {
        // ⚠️ CRÍTICO: NO limpiar tokens en error
        // Puede ser error temporal de red o servidor
        console.error('Error al verificar autenticación:', err);
        
        // Solo redirigir a login si es 401 Y el refresh token está expirado
        if (err.response?.status === 401 && TokenStorage.isRefreshTokenExpired()) {
          TokenStorage.clearTokens();
        } else {
          // Para otros errores, mantener tokens y continuar
          // El usuario puede estar offline o el servidor puede estar temporalmente caído
        }
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Mostrar loading
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // ⚠️ CRÍTICO: Solo redirigir a login si NO hay tokens válidos
  // NO redirigir solo por errores de red o servidor
  if (requireAuth && !user && !TokenStorage.hasValidTokens()) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Verificar si requiere admin
  if (requireAdmin && !RoleChecker.isAdmin(user)) {
    return <Navigate to="/unauthorized" replace />;
  }

  // Verificar si requiere staff
  if (requireStaff && !RoleChecker.isStaff(user)) {
    return <Navigate to="/unauthorized" replace />;
  }

  // Verificar roles permitidos
  if (allowedRoles.length > 0 && !RoleChecker.hasRole(user, allowedRoles)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
};
```

### Uso en Rutas

```typescript
// App.tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ProtectedRoute } from './components/ProtectedRoute';
import { UserRole } from './types/user';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Rutas públicas */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        
        {/* Rutas protegidas - Usuario normal */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        
        {/* Rutas protegidas - Solo Admin */}
        <Route
          path="/admin/*"
          element={
            <ProtectedRoute requireAdmin>
              <AdminLayout />
            </ProtectedRoute>
          }
        />
        
        {/* Rutas protegidas - Staff (Admin, Lawyer, Agent) */}
        <Route
          path="/staff/*"
          element={
            <ProtectedRoute requireStaff>
              <StaffLayout />
            </ProtectedRoute>
          }
        />
        
        {/* Rutas protegidas - Roles específicos */}
        <Route
          path="/lawyer-portal"
          element={
            <ProtectedRoute allowedRoles={[UserRole.LAWYER, UserRole.ADMIN]}>
              <LawyerPortal />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
```

---

## 8️⃣ TODOS LOS ENDPOINTS DE LA API

### 🔐 Authentication (`/api/auth`)

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| POST | `/api/auth/login` | Login usuario/admin | ❌ |
| POST | `/api/auth/register` | Registro de usuario | ❌ |
| POST | `/api/auth/refresh` | Renovar access token | ❌ |
| POST | `/api/auth/logout` | Logout actual | ✅ |
| POST | `/api/auth/logout/all` | Logout todos los dispositivos | ✅ |
| DELETE | `/api/auth/delete-account` | Eliminar cuenta | ✅ |
| POST | `/api/auth/oauth/login` | Login OAuth genérico | ❌ |
| POST | `/api/auth/google/login` | Login con Google | ❌ |
| POST | `/api/auth/facebook/login` | Login con Facebook | ❌ |
| POST | `/api/auth/apple/login` | Login con Apple | ❌ |
| GET | `/api/auth/google/callback` | Callback Google | ❌ |
| GET | `/api/auth/facebook/callback` | Callback Facebook | ❌ |
| GET | `/api/auth/apple/callback` | Callback Apple | ❌ |

### 👤 Users (`/api/users`)

| Método | Endpoint | Descripción | Permisos |
|--------|----------|-------------|----------|
| GET | `/api/users/me` | Usuario actual | Usuario |
| PATCH | `/api/users/me` | Actualizar usuario actual | Usuario |
| GET | `/api/users/me/with-tokens` | Usuario actual con tokens push | Usuario |
| GET | `/api/users/{user_id}` | Obtener usuario por ID | Admin/Self |
| DELETE | `/api/users/{user_id}` | Eliminar usuario | Admin/Self |
| GET | `/api/users/agents` | Listar agentes (público) | Público |
| GET | `/api/users/` | Listar usuarios | Admin |
| PATCH | `/api/users/{user_id}/role` | Cambiar rol | Admin |
| PATCH | `/api/users/{user_id}/status` | Cambiar estado | Admin |
| POST | `/api/users/{user_id}/reset-password` | Reset password | Admin |
| POST | `/api/users/{user_id}/impersonate` | Suplantar usuario | Superuser |
| GET | `/api/users/export` | Exportar usuarios | Admin |
| GET | `/api/users/audit-logs` | Logs de auditoría | Admin |

### 🔧 Account (`/api/account`)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/account/change-password` | Cambiar contraseña |
| POST | `/api/account/change-email` | Cambiar email |
| POST | `/api/account/deactivate` | Desactivar cuenta |
| POST | `/api/account/reactivate` | Reactivar cuenta |
| DELETE | `/api/account/delete` | Eliminar cuenta |
| GET | `/api/account/settings` | Obtener configuración |
| POST | `/api/account/settings` | Actualizar configuración |

### 📧 Email (`/api/email`)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/email/send-verification` | Enviar verificación |
| GET | `/api/email/verify-email` | Verificar email (GET) |
| POST | `/api/email/verify` | Verificar email (POST) |
| POST | `/api/email/resend-verification` | Reenviar verificación |
| POST | `/api/email/request-password-reset` | Solicitar reset |
| POST | `/api/email/verify-reset-token` | Verificar token |
| POST | `/api/email/confirm-password-reset` | Confirmar reset |

### 💬 Conversations (`/api/conversations`)

| Método | Endpoint | Descripción | Permisos |
|--------|----------|-------------|----------|
| GET | `/api/conversations/` | Listar conversaciones | Usuario |
| POST | `/api/conversations/` | Crear conversación | Usuario |
| GET | `/api/conversations/{conversation_id}` | Obtener conversación | Participante |
| PUT | `/api/conversations/{conversation_id}` | Actualizar conversación | Participante |
| DELETE | `/api/conversations/{conversation_id}` | Eliminar conversación | Propietario |
| POST | `/api/conversations/{conversation_id}/messages` | Agregar mensaje | Participante |
| GET | `/api/conversations/{conversation_id}/messages` | Obtener mensajes (admin) | Admin |
| PATCH | `/api/conversations/{conversation_id}/recipient` | Actualizar destinatario | Participante |
| PATCH | `/api/conversations/{conversation_id}/participants` | Reemplazar participantes | Participante |
| POST | `/api/conversations/{conversation_id}/read` | Marcar como leído | Participante |
| GET | `/api/conversations/admin/all` | Ver todas (admin) | Admin |
| DELETE | `/api/conversations/{conversation_id}/messages/{message_id}` | Eliminar mensaje (admin) | Admin |
| POST | `/api/conversations/{conversation_id}/export` | Exportar conversación (admin) | Admin |
| PATCH | `/api/conversations/{conversation_id}/assign-lawyer` | Asignar abogado (admin) | Admin |
| GET | `/api/conversations/admin/fix-null-recipients` | Diagnosticar conversaciones sin destinatario | Admin |

### 📝 Qualification Test (`/api/qualification-test`)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/qualification-test/start` | Iniciar test |
| GET | `/api/qualification-test/current` | Test actual |
| POST | `/api/qualification-test/{test_id}/answer` | Guardar respuesta |
| GET | `/api/qualification-test/{test_id}/progress` | Ver progreso |
| GET | `/api/qualification-test/{test_id}/questions` | Obtener preguntas |
| GET | `/api/qualification-test/{test_id}/status` | Ver estado |
| POST | `/api/qualification-test/{test_id}/grade` | Calificar test |
| GET | `/api/qualification-test/initial-questions` | Preguntas iniciales |
| GET | `/api/qualification-test/user/qualification-status` | Estado calificación |
| GET | `/api/qualification-test/analytics/overview` | Analytics |
| GET | `/api/qualification-test/analytics/questions` | Efectividad |

### 🔔 Push Notifications (`/api/push-notifications`)

| Método | Endpoint | Descripción | Permisos |
|--------|----------|-------------|----------|
| POST | `/api/push-notifications/register-token` | Registrar token | Usuario |
| POST | `/api/push-notifications/check-token` | Verificar token | Usuario |
| DELETE | `/api/push-notifications/deactivate-token/{device_id}` | Desactivar token | Usuario |
| POST | `/api/push-notifications/deactivate-token` | Desactivar token | Usuario |
| GET | `/api/push-notifications/my-tokens` | Mis tokens | Usuario |
| POST | `/api/push-notifications/topics/subscribe` | Suscribirse a tema | Usuario |
| POST | `/api/push-notifications/topics/unsubscribe` | Desuscribirse de tema | Usuario |
| GET | `/api/push-notifications/topics/my-subscriptions` | Mis suscripciones | Usuario |
| GET | `/api/push-notifications/status` | Estado de notificaciones | Usuario |
| GET | `/api/push-notifications/preferences` | Preferencias | Usuario |
| PUT | `/api/push-notifications/preferences` | Actualizar preferencias | Usuario |
| PATCH | `/api/push-notifications/preferences` | Actualizar preferencias | Usuario |
| POST | `/api/push-notifications/enable` | Habilitar notificaciones | Usuario |
| POST | `/api/push-notifications/preferences/push-toggle` | Toggle notificaciones | Usuario |
| POST | `/api/push-notifications/test/{device_token}` | Test notificación | Admin |
| POST | `/api/push-notifications/test/send-to-user` | Test enviar a usuario | Admin |
| POST | `/api/push-notifications/test/chat-message` | Test mensaje chat | Admin |
| POST | `/api/push-notifications/test/payment-pending` | Test pago pendiente | Admin |
| POST | `/api/push-notifications/scheduled-tasks/check-appointments` | Trigger check citas | Admin |
| POST | `/api/push-notifications/scheduled-tasks/check-pending-tests` | Trigger check tests | Admin |
| POST | `/api/push-notifications/scheduled-tasks/check-pending-documents` | Trigger check documentos | Admin |
| POST | `/api/push-notifications/scheduled-tasks/check-all` | Trigger check todos | Admin |

### 📁 Files (`/api/files`)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/files/upload` | Subir archivo |
| GET | `/api/files/info/{file_id}` | Info del archivo |
| GET | `/api/files/signed-url/{file_id}` | URL firmada |
| DELETE | `/api/files/{file_id}` | Eliminar archivo |

### 📄 Documents (`/api/documents`)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/documents/upload` | Subir documento |
| GET | `/api/documents/` | Listar documentos |
| GET | `/api/documents/{document_id}` | Obtener documento |

### 📚 Catalog (`/api/catalog`)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/catalog/categories` | Categorías |
| GET | `/api/catalog/by-slug/{slug}` | Por slug |
| GET | `/api/catalog/` | Listar items |
| POST | `/api/catalog/` | Crear item |
| GET | `/api/catalog/{catalog_id}` | Obtener item |
| PUT | `/api/catalog/{catalog_id}` | Actualizar item |
| DELETE | `/api/catalog/{catalog_id}` | Eliminar item |
| POST | `/api/catalog/{catalog_id}/like` | Like item |

### 💰 Payments (`/api/payments`)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/payments/` | Crear pago |
| GET | `/api/payments/` | Mis pagos |
| GET | `/api/payments/me` | Mis pagos (alias) |
| GET | `/api/payments/{payment_id}/status` | Estado pago |
| GET | `/api/payments/{payment_id}/status-detailed` | Estado pago detallado |
| POST | `/api/payments/check-duplicate` | Verificar duplicado |

### 📰 News (`/api/news`)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/news/` | Listar noticias |
| POST | `/api/news/` | Crear noticia |
| GET | `/api/news/{news_id}` | Obtener noticia |
| PATCH | `/api/news/{news_id}` | Actualizar noticia |
| DELETE | `/api/news/{news_id}` | Eliminar noticia |
| GET | `/api/news/{news_id}/like-status` | Estado like |
| POST | `/api/news/{news_id}/like` | Like |
| DELETE | `/api/news/{news_id}/like` | Unlike |
| GET | `/api/news/articles/` | Listar artículos de abogados |
| POST | `/api/news/articles/` | Crear artículo de abogado |
| GET | `/api/news/articles/{article_id}` | Obtener artículo |
| PATCH | `/api/news/articles/{article_id}` | Actualizar artículo |
| DELETE | `/api/news/articles/{article_id}` | Eliminar artículo |
| GET | `/api/news/articles/{article_id}/like-status` | Estado like artículo |
| POST | `/api/news/articles/{article_id}/like` | Like artículo |
| DELETE | `/api/news/articles/{article_id}/like` | Unlike artículo |
| GET | `/api/news/feed/` | Feed |

### ⚖️ Legal Q&A (`/api/legal-questions`)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/legal-questions/` | Listar preguntas |
| POST | `/api/legal-questions/` | Crear pregunta |
| GET | `/api/legal-questions/featured` | Destacadas |
| GET | `/api/legal-questions/stats` | Estadísticas |
| GET | `/api/legal-questions/{question_id}` | Obtener pregunta |
| PATCH | `/api/legal-questions/{question_id}` | Actualizar pregunta |
| DELETE | `/api/legal-questions/{question_id}` | Eliminar pregunta |
| POST | `/api/legal-questions/{question_id}/answers` | Crear respuesta |
| PATCH | `/api/legal-questions/{question_id}/answers/{answer_id}` | Actualizar respuesta |
| DELETE | `/api/legal-questions/{question_id}/answers/{answer_id}` | Eliminar respuesta |
| POST | `/api/legal-questions/{question_id}/vote` | Votar pregunta |
| POST | `/api/legal-questions/{question_id}/answers/{answer_id}/vote` | Votar respuesta |
| POST | `/api/legal-questions/{question_id}/assign/{lawyer_id}` | Asignar abogado |
| POST | `/api/legal-questions/{question_id}/answers/{answer_id}/verify` | Verificar respuesta |
| GET | `/api/legal-questions/{question_id}/complexity` | Analizar complejidad |
| POST | `/api/legal-questions/{question_id}/request-human-review` | Solicitar revisión humana |
| GET | `/api/legal-questions/pili-stats` | Estadísticas Pili |

### 📅 Appointments (`/api/appointments`)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/appointments/` | Mis citas |
| POST | `/api/appointments/` | Crear cita |
| GET | `/api/appointments/{appointment_id}` | Obtener cita |
| PUT | `/api/appointments/{appointment_id}` | Actualizar cita |
| DELETE | `/api/appointments/{appointment_id}` | Eliminar cita |

### 🔔 Notifications (`/api/notifications`)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/notifications/` | Listar notificaciones |
| PUT | `/api/notifications/{notification_id}/read` | Marcar como leída |

### 👨‍💼 Profile (`/api/profile`)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/profile/` | Obtener perfil |
| PATCH | `/api/profile/update` | Actualizar perfil |
| POST | `/api/profile/avatar` | Actualizar avatar |

### 🏥 Health Check

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/health` | Health básico |
| GET | `/api/health` | Health con prefijo |
| GET | `/api/health/` | Health |
| GET | `/api/health/detailed` | Health detallado |
| GET | `/api/health/system-status` | Estado del sistema |
| GET | `/api/health/metrics` | Métricas de salud |
| GET | `/` | Root endpoint |

### 📚 Compendio (`/api/compendio`)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/compendio` | Obtener compendio completo |

### 🎯 Question Selection (`/api/question-selection`)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/question-selection/intelligent` | Selección inteligente de preguntas |

### 🧪 Test (`/api/test`)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/test/hello` | Hello World |

### 📝 Migration Tests (`/api/tests`)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/tests/start` | Iniciar test |
| POST | `/api/tests/{test_id}/answer` | Guardar respuesta |
| GET | `/api/tests/{test_id}/progress` | Progreso del test |
| POST | `/api/tests/{test_id}/grade` | Calificar test |

### ❓ Preguntas (`/api/preguntas`)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/preguntas/` | Crear nueva pregunta |
| GET | `/api/preguntas/similares` | Buscar preguntas similares |
| GET | `/api/preguntas/mis-preguntas` | Mis preguntas |
| GET | `/api/preguntas/todas` | Todas las preguntas |
| POST | `/api/preguntas/{pregunta_id}/like` | Dar/quitar like |
| POST | `/api/preguntas/{pregunta_id}/comentarios` | Agregar comentario |
| GET | `/api/preguntas/{pregunta_id}/comentarios` | Obtener comentarios |

### 📋 Questions (`/api/questions`)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/questions/` | Crear pregunta |
| GET | `/api/questions/` | Listar preguntas |
| GET | `/api/questions/{question_id}` | Obtener pregunta |
| PATCH | `/api/questions/{question_id}` | Actualizar pregunta |
| DELETE | `/api/questions/{question_id}` | Eliminar pregunta |
| GET | `/api/questions/block/{block_id}` | Preguntas por bloque |
| POST | `/api/questions/select-intelligent` | Selección inteligente |
| POST | `/api/questions/answer` | Enviar respuesta |
| POST | `/api/questions/answers/bulk` | Enviar múltiples respuestas |
| GET | `/api/questions/answer/{answer_id}` | Obtener respuesta |
| PATCH | `/api/questions/answer/{answer_id}` | Actualizar respuesta |
| DELETE | `/api/questions/answer/{answer_id}` | Eliminar respuesta |
| GET | `/api/questions/answers/user/{user_id}` | Respuestas del usuario |
| GET | `/api/questions/answers/block/{block_id}/user/{user_id}` | Respuestas por bloque |
| GET | `/api/questions/qualification/progress/{user_id}` | Progreso de calificación |

### 📦 Importer (`/api/importer`)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/importer/catalog` | Importar items del catálogo |
| POST | `/api/importer/questions` | Importar preguntas |

### 📁 Expedientes (`/api/expedientes`)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/expedientes/` | Crear nuevo expediente |
| GET | `/api/expedientes/user/{user_id}` | Obtener expediente del usuario |
| GET | `/api/expedientes/{expediente_id}` | Obtener expediente por ID |

### 📂 Expediente Completo (`/api/expediente`)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/expediente/{user_id}` | Obtener expediente completo |
| POST | `/api/expediente/archivo` | Subir archivo al expediente |
| POST | `/api/expediente/archivo/from-url` | Agregar archivo desde URL |
| GET | `/api/expediente/archivos/{user_id}` | Listar archivos del expediente |
| PUT | `/api/expediente/archivo/{archivo_id}/estado` | Cambiar estado de archivo |
| GET | `/api/expediente/estadisticas/{user_id}` | Estadísticas del expediente |
| GET | `/api/expediente/archivo/{archivo_id}/download` | Descargar archivo |

### 💰 Quotes - Presupuestos (`/api/quotes`)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/quotes/` | Crear presupuesto |
| GET | `/api/quotes/by-expediente/{expediente_id}` | Presupuestos por expediente |
| GET | `/api/quotes/{quote_id}` | Obtener presupuesto |
| PUT | `/api/quotes/{quote_id}` | Actualizar presupuesto |
| DELETE | `/api/quotes/{quote_id}` | Eliminar presupuesto |

### 🔔 Reminders - Recordatorios (`/api/reminders`)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/reminders/` | Crear recordatorio |
| GET | `/api/reminders/by-expediente/{expediente_id}` | Recordatorios por expediente |
| GET | `/api/reminders/my-reminders` | Mis recordatorios |
| PUT | `/api/reminders/{reminder_id}/complete` | Marcar como completado |
| PUT | `/api/reminders/{reminder_id}` | Actualizar recordatorio |
| DELETE | `/api/reminders/{reminder_id}` | Eliminar recordatorio |

### 💼 Hiring (`/api/hiring`)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/hiring/{code}` | Obtener detalles de contratación |
| POST | `/api/hiring/{code}/confirm-data` | Confirmar datos de usuario |
| POST | `/api/hiring/{code}/contract/accept` | Aceptar contrato |
| POST | `/api/hiring/{code}/kyc/start` | Iniciar verificación KYC |
| POST | `/api/hiring/{code}/kyc/complete` | Completar verificación KYC |
| POST | `/api/hiring/{code}/payment` | Crear intención de pago |
| POST | `/api/hiring/{code}/checkout` | Crear sesión de checkout |
| POST | `/api/hiring/{code}/confirm` | Confirmar pago y generar contrato |
| GET | `/api/hiring/contract/{payment_id}/download` | Descargar contrato PDF |
| POST | `/api/hiring/final-contract/upload` | Subir contrato final |

### 👨‍💼 Admin (`/api/admin`)

| Método | Endpoint | Descripción | Permisos |
|--------|----------|-------------|----------|
| POST | `/api/admin/contracts/` | Crear contrato de contratación | Admin |
| GET | `/api/admin/contracts/` | Listar contratos | Admin |
| GET | `/api/admin/contracts/{code}` | Obtener contrato por código | Admin |
| DELETE | `/api/admin/contracts/{code}` | Eliminar contrato | Admin |
| POST | `/api/admin/contracts/{code}/expire` | Expirar código | Admin |
| POST | `/api/admin/contracts/process-email-queue` | Procesar cola de emails | Admin |
| POST | `/api/admin/hiring/create` | Crear contrato (compatibilidad) | Admin |

### 🔗 Webhooks (`/api/webhooks`)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/webhooks/stripe/hiring` | Webhook de Stripe para contratación |

### 📊 Latency Report (`/api/latency-report`)

| Método | Endpoint | Descripción | Permisos |
|--------|----------|-------------|----------|
| GET | `/api/latency-report/generate` | Generar y enviar reporte de latencia | Admin |

---

## 9️⃣ EJEMPLOS DE USO COMPLETOS

### Ejemplo 1: Login Completo con Context API

```typescript
// contexts/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { login as apiLogin, getCurrentUser } from '@/services/authService';
import TokenStorage from '@/utils/tokenStorage';
import { User } from '@/types/user';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isStaff: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Cargar usuario al iniciar
  useEffect(() => {
    const loadUser = async () => {
      // ⚠️ CRÍTICO: Usar hasValidTokens() para verificar sesión
      if (TokenStorage.hasValidTokens()) {
        try {
          const currentUser = await getCurrentUser();
          setUser(currentUser);
          TokenStorage.saveUserData(currentUser);
        } catch (error) {
          console.error('Error al cargar usuario:', error);
          // ⚠️ CRÍTICO: NO limpiar tokens en error
          // Puede ser error temporal de red o servidor
        }
      }
      setLoading(false);
    };

    loadUser();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      // Realizar login
      const tokens = await apiLogin({ email, password });
      
      // Los tokens ya se guardaron en apiLogin usando TokenStorage
      // (almacenamiento triple: localStorage + cookies + sessionStorage)
      
      // Obtener datos del usuario
      const currentUser = await getCurrentUser();
      setUser(currentUser);
      TokenStorage.saveUserData(currentUser);
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    const refreshToken = TokenStorage.getRefreshToken();
    
    if (refreshToken) {
      try {
        await api.post('/auth/logout', { refresh_token: refreshToken });
      } catch (error) {
        console.error('Error al hacer logout:', error);
      }
    }
    
    TokenStorage.clearTokens();
    setUser(null);
  };

  const value = {
    user,
    loading,
    login,
    logout,
    isAuthenticated: !!user || TokenStorage.hasValidTokens(),
    isAdmin: user?.role === 'admin',
    isStaff: ['admin', 'lawyer', 'agent'].includes(user?.role || ''),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider');
  }
  return context;
};
```

### Ejemplo 2: Componente de Login

```typescript
// pages/LoginPage.tsx
import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { login } from '@/services/authService';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as any)?.from?.pathname || '/dashboard';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      
      // Redirigir según el rol del usuario
      setTimeout(() => {
        if (user?.role === 'admin') {
          navigate('/admin/dashboard');
        } else if (user?.role === 'lawyer') {
          navigate('/lawyer/dashboard');
        } else {
          navigate(from, { replace: true });
        }
      }, 100);
    } catch (err: any) {
      setError(err.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow">
        <div>
          <h2 className="text-center text-3xl font-extrabold text-gray-900">
            Iniciar Sesión
          </h2>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}
          
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Contraseña
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400"
            >
              {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
```

---

## 🔟 MEJORES PRÁCTICAS

### ⚠️ CRÍTICO: Persistencia de Autenticación

**IMPORTANTE**: Consulta la [Guía de Persistencia de Autenticación](./FRONTEND_AUTH_PERSISTENCE_GUIDE.md) para detalles completos sobre:

- **NO desechar tokens en errores**: Los errores HTTP NO invalidan la sesión
- **Almacenamiento TRIPLE**: Usar localStorage + cookies + sessionStorage
- **Sesión de 15 días**: Mantener sesión activa sin pedir login
- **Manejo inteligente de errores**: Solo limpiar tokens cuando el refresh token esté expirado

### 1. Seguridad

✅ **HACER:**
- Usar HTTPS en producción
- Almacenar tokens en MÚLTIPLES lugares (localStorage + cookies + sessionStorage)
- Implementar refresh token automático
- Limpiar tokens SOLO al cerrar sesión explícitamente o cuando refresh token esté expirado
- Validar permisos en el frontend Y backend
- Implementar timeout en las peticiones
- NO desechar tokens en errores temporales (500, 502, 503, 504, errores de red)

❌ **NO HACER:**
- Almacenar contraseñas en el cliente
- Exponer tokens en URLs
- Confiar solo en validaciones frontend
- Limpiar tokens en errores que NO sean de autenticación
- Pedir login si hay tokens válidos guardados

### 2. Manejo de Errores

```typescript
// utils/errorHandler.ts
import { AxiosError } from 'axios';

export const handleApiError = (error: unknown): string => {
  if (error instanceof AxiosError && error.response) {
    // Error de respuesta del servidor
    switch (error.response.status) {
      case 400:
        return error.response.data?.detail || 'Petición incorrecta';
      case 401:
        // ⚠️ CRÍTICO: NO limpiar tokens aquí
        // El interceptor de axios ya maneja el refresh
        return 'No autorizado. Por favor, inicia sesión';
      case 403:
        return 'No tienes permisos para realizar esta acción';
      case 404:
        return 'Recurso no encontrado';
      case 422:
        return 'Datos de validación incorrectos';
      case 500:
        // ⚠️ CRÍTICO: NO limpiar tokens en error 500
        return 'Error del servidor. Inténtalo más tarde';
      default:
        return 'Error desconocido';
    }
  } else if (error instanceof AxiosError && error.request) {
    // La petición se hizo pero no hubo respuesta
    // ⚠️ CRÍTICO: NO limpiar tokens en error de red
    return 'Sin respuesta del servidor. Verifica tu conexión';
  } else {
    // Error al configurar la petición
    return (error as Error).message || 'Error al procesar la petición';
  }
};
```

---

## 📚 RECURSOS ADICIONALES

### Documentación de la API
- **Swagger UI**: https://api.migro.es/docs
- **ReDoc**: https://api.migro.es/redoc

### Health Checks
- **Basic**: https://api.migro.es/health
- **Detailed**: https://api.migro.es/api/health/detailed

### Documentación Relacionada
- [Guía de Persistencia de Autenticación](./FRONTEND_AUTH_PERSISTENCE_GUIDE.md) - **LEER PRIMERO**: Reglas críticas sobre persistencia y manejo de errores
- [Implementación de TokenStorage](./FRONTEND_TOKEN_PERSISTENCE_COOKIES.md) - Detalles técnicos sobre almacenamiento triple

---

## 🆘 SOPORTE

Si tienes dudas o problemas:
1. Revisa la documentación Swagger en `/docs`
2. Consulta los ejemplos en este documento
3. Verifica los logs de errores en el navegador
4. Consulta la [Guía de Persistencia de Autenticación](./FRONTEND_AUTH_PERSISTENCE_GUIDE.md)
5. Contacta al equipo de backend

---

**Última actualización**: 2025-01-28  
**Versión de la API**: v1  
**Base URL Producción**: https://api.migro.es/api

