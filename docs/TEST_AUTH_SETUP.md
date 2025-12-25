# Configuración de Autenticación para Tests

**Fecha:** 2025-01-28  
**Estado:** ✅ IMPLEMENTADO

---

## 📋 Resumen

Sistema para guardar y reutilizar tokens de autenticación en tests, evitando tener que hacer login en cada ejecución.

**Credenciales de test:**
- Email: `agusvc@gmail.com`
- Password: `pomelo2005`

---

## 🚀 Uso Rápido

### 1. Guardar Tokens (Primera vez o cuando expiren)

```bash
npm run test:tokens
```

Este comando:
- Hace login con las credenciales de test
- Guarda los tokens en `.test-tokens.json`
- Verifica que los tokens funcionen correctamente

### 2. Ejecutar Tests

```bash
npm run test
# o
npm run test:run
```

Los tokens se cargan automáticamente desde `.test-tokens.json` si están disponibles y válidos.

---

## 🔧 Cómo Funciona

### Archivos Involucrados

1. **`scripts/save-test-tokens.js`**
   - Script Node.js que hace login y guarda tokens
   - Guarda tokens en `.test-tokens.json` en la raíz del proyecto

2. **`src/test/load-test-tokens.ts`**
   - Se ejecuta antes de cada suite de tests
   - Carga tokens desde `.test-tokens.json` si existen
   - Verifica que los tokens no estén expirados

3. **`src/test/setup.ts`**
   - Carga tokens en localStorage para que estén disponibles en tests
   - Configura mocks necesarios

4. **`src/test/auth-helper.ts`**
   - Helper para obtener tokens en tests
   - Función `setupTestAuth()` para configurar autenticación
   - Función `getTestTokens()` para obtener tokens válidos

---

## 📝 Uso en Tests

### Opción 1: Usar Helper Automático

```typescript
import { setupTestAuth } from '@/test/auth-helper';

describe('Mi Test', () => {
  beforeAll(async () => {
    // Configurar autenticación automáticamente
    await setupTestAuth();
  });

  it('debe hacer algo con autenticación', async () => {
    // Los tokens ya están configurados en TokenStorage y localStorage
    const response = await api.get('/users/me');
    expect(response.status).toBe(200);
  });
});
```

### Opción 2: Obtener Tokens Manualmente

```typescript
import { getTestTokens } from '@/test/auth-helper';

describe('Mi Test', () => {
  it('debe usar tokens', async () => {
    const tokens = await getTestTokens();
    
    // Usar tokens directamente
    const response = await axios.get('/api/users/me', {
      headers: {
        'Authorization': `Bearer ${tokens.access_token}`
      }
    });
    
    expect(response.status).toBe(200);
  });
});
```

### Opción 3: Usar TokenStorage

```typescript
import TokenStorage from '@/utils/tokenStorage';

describe('Mi Test', () => {
  beforeAll(async () => {
    await setupTestAuth();
  });

  it('debe usar TokenStorage', () => {
    const token = TokenStorage.getAccessToken();
    expect(token).toBeTruthy();
  });
});
```

---

## 🔄 Renovación Automática

Los tokens se renuevan automáticamente si:

1. **Están expirados o próximos a expirar** (buffer de 5 minutos)
2. **No existen en el archivo** `.test-tokens.json`

El sistema:
- Verifica validez antes de usar tokens guardados
- Hace login automáticamente si los tokens no son válidos
- Guarda nuevos tokens para próximas ejecuciones

---

## 📁 Archivos Generados

### `.test-tokens.json`

```json
{
  "access_token": "eyJ...",
  "refresh_token": "eyJ...",
  "token_type": "bearer",
  "expires_in": 1209600,
  "refresh_expires_in": 2592000,
  "saved_at": 1738080000000,
  "expires_at": 1739289600000,
  "refresh_expires_at": 1740672000000,
  "user": {
    "id": 1,
    "email": "agusvc@gmail.com",
    ...
  }
}
```

**⚠️ IMPORTANTE:** Este archivo contiene credenciales y está en `.gitignore`.

---

## 🛠️ Comandos Disponibles

```bash
# Guardar tokens manualmente
npm run test:tokens

# Ejecutar tests (carga tokens automáticamente)
npm run test

# Ejecutar tests una vez
npm run test:run

# Tests con UI
npm run test:ui

# Tests con cobertura
npm run test:coverage
```

---

## 🔍 Verificación

### Verificar que los tokens están guardados

```bash
# Verificar que el archivo existe
ls -la .test-tokens.json

# Ver contenido (sin mostrar tokens completos)
cat .test-tokens.json | jq '{expires_at, user: .user.email}'
```

### Verificar que los tokens funcionan

```bash
# Ejecutar tests y ver logs
npm run test:run

# Deberías ver:
# ✅ Tokens de test cargados desde archivo (válidos hasta: ...)
```

---

## 🐛 Troubleshooting

### Error: "Archivo .test-tokens.json no encontrado"

**Solución:**
```bash
npm run test:tokens
```

### Error: "Tokens guardados expirados"

**Solución:**
```bash
npm run test:tokens
```

### Error: "Error al hacer login"

**Verificar:**
1. Credenciales correctas en `scripts/save-test-tokens.js`
2. API disponible en `https://api.migro.es/api`
3. Conexión a internet

### Los tests no usan los tokens

**Verificar:**
1. Que `setupTestAuth()` se llame en `beforeAll`
2. Que los tokens estén en localStorage (verificar en setup.ts)
3. Que TokenStorage tenga los tokens configurados

---

## 📚 Referencias

- `scripts/save-test-tokens.js` - Script para guardar tokens
- `src/test/auth-helper.ts` - Helper para usar tokens en tests
- `src/test/load-test-tokens.ts` - Carga automática de tokens
- `src/test/setup.ts` - Setup global de tests
- `src/utils/tokenStorage.ts` - Sistema de almacenamiento de tokens

---

**Última actualización:** 2025-01-28


