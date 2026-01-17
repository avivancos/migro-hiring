# 🔍 Diagnóstico: Errores de Autenticación en Entorno Local

**Fecha:** 2025-01-17  
**Problema:** Error 500 en `/auth/refresh` y 401 en `/auth/login` en entorno local  
**Estado:** ✅ RESUELTO

---

## 🚨 Síntomas

- ❌ Error **500 (Internal Server Error)** en `POST /api/auth/refresh`
- ❌ Error **401 (Unauthorized)** en `POST /api/auth/login` con mensaje "Incorrect email or password"
- ✅ Los contenedores están corriendo y aparecen como "healthy"
- ✅ Las contraseñas son válidas (funcionan en otros entornos)

---

## 🔍 Diagnóstico Paso a Paso

### 1. Verificar que el Backend Está Corriendo

```powershell
# Verificar que el backend responde
curl http://localhost:3000/api/health

# Verificar respuesta del endpoint de health
curl -v http://localhost:3000/api/health
```

**Resultado esperado:**
- Status `200 OK`
- Alguna respuesta (ej: `{"status": "ok"}` o similar)

**Si no responde:**
- El backend no está corriendo o no está en el puerto correcto
- Verificar logs del backend: `docker-compose logs backend` o similar

---

### 2. Verificar Conexión a la Base de Datos

El error **500** en `/auth/refresh` normalmente indica un problema con la base de datos.

**Verificar desde el backend:**

```powershell
# Si el backend está en Docker
docker-compose exec backend python -c "from app.database import engine; print('DB OK' if engine.connect() else 'DB ERROR')"

# O acceder a una shell del backend
docker-compose exec backend bash
# Luego dentro del contenedor:
python -c "from app.database import engine; conn = engine.connect(); print('✅ DB conectada'); conn.close()"
```

**Verificar variables de entorno del backend:**

```powershell
# Ver variables de entorno del backend
docker-compose exec backend env | grep -i database

# O ver el archivo .env del backend (si existe)
cat backend/.env
```

**Variables de entorno críticas:**
```bash
DATABASE_URL=postgresql://user:password@host:port/dbname
# O variables separadas:
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_USER=tu_usuario
POSTGRES_PASSWORD=tu_password
POSTGRES_DB=tu_base_de_datos
```

---

### 3. Verificar Logs del Backend

Los logs del backend mostrarán el error real que causa el 500:

```powershell
# Ver logs en tiempo real
docker-compose logs -f backend

# Ver últimas 100 líneas
docker-compose logs --tail=100 backend

# Filtrar solo errores
docker-compose logs backend | Select-String -Pattern "error|Error|ERROR|exception|Exception|500"
```

**Errores comunes en logs:**
- `relation "users" does not exist` → Las tablas no existen (falta migrar BD)
- `could not connect to server` → La BD no está accesible
- `password authentication failed` → Credenciales incorrectas de BD
- `connection refused` → PostgreSQL no está corriendo

---

### 4. Verificar que PostgreSQL Está Corriendo

```powershell
# Ver si PostgreSQL está corriendo en Docker
docker-compose ps postgres
# o
docker ps | Select-String postgres

# Ver logs de PostgreSQL
docker-compose logs postgres

# Intentar conectar a PostgreSQL directamente
docker-compose exec postgres psql -U postgres -d migro_db -c "SELECT 1;"
```

**Si PostgreSQL no está corriendo:**
```powershell
# Iniciar solo PostgreSQL
docker-compose up -d postgres

# Esperar a que esté listo (puede tardar unos segundos)
timeout /t 5
docker-compose ps postgres
```

---

### 5. Verificar Migraciones de Base de Datos

Si la BD está vacía o no tiene las tablas necesarias, el backend fallará:

```powershell
# Ejecutar migraciones desde el backend
docker-compose exec backend alembic upgrade head

# O si no usan Alembic:
docker-compose exec backend python -m app.db.init_db

# Verificar que las tablas existen
docker-compose exec postgres psql -U postgres -d migro_db -c "\dt"
```

---

### 6. Verificar Variables de Entorno del Frontend

Aunque el problema parece ser del backend, verificar que el frontend apunta a la URL correcta:

```powershell
# Ver archivo .env.local
cat .env.local | Select-String VITE_API_BASE_URL

# Verificar que la URL es correcta
# Debe ser: http://localhost:3000/api (o similar)
```

**Ejemplo `.env.local` correcto:**
```bash
VITE_API_BASE_URL=http://localhost:3000/api
VITE_APP_URL=http://localhost:5173
```

---

### 7. Probar Endpoint de Login Directamente

```powershell
# Probar login con curl (reemplazar con credenciales reales)
curl -X POST http://localhost:3000/api/auth/login `
  -H "Content-Type: application/json" `
  -d '{"email":"tu_email@ejemplo.com","password":"tu_password"}' `
  -v
```

**Análisis de respuesta:**
- **401 + "Incorrect email or password"** → Credenciales incorrectas o usuario no existe en BD local
- **401 + otro mensaje** → Problema de autenticación (token JWT, etc.)
- **422** → Datos inválidos (formato incorrecto)
- **500** → Error interno (probablemente BD)
- **502/503** → Backend no disponible o sobrecargado

---

### 8. Verificar Usuario en Base de Datos Local

El error 401 puede ser porque el usuario no existe en la BD local:

```powershell
# Listar usuarios en la BD
docker-compose exec postgres psql -U postgres -d migro_db -c "SELECT email, is_active, is_superuser FROM users LIMIT 10;"

# Verificar un usuario específico
docker-compose exec postgres psql -U postgres -d migro_db -c "SELECT email, is_active FROM users WHERE email = 'tu_email@ejemplo.com';"
```

**Si el usuario no existe:**
- Crear usuario de prueba o importar datos de otro entorno
- Verificar scripts de inicialización de datos

---

## 🔧 Soluciones Comunes

### Solución 1: Reiniciar Servicios en Orden

```powershell
# 1. Detener todo
docker-compose down

# 2. Iniciar solo PostgreSQL primero
docker-compose up -d postgres

# 3. Esperar a que PostgreSQL esté listo (30 segundos)
timeout /t 30

# 4. Verificar que PostgreSQL está listo
docker-compose exec postgres psql -U postgres -d migro_db -c "SELECT 1;"

# 5. Iniciar el backend
docker-compose up -d backend

# 6. Esperar a que el backend inicie
timeout /t 10

# 7. Verificar logs del backend
docker-compose logs --tail=50 backend

# 8. Iniciar el frontend
docker-compose up -d dev
```

---

### Solución 2: Ejecutar Migraciones

```powershell
# Ejecutar migraciones pendientes
docker-compose exec backend alembic upgrade head

# O crear base de datos desde cero (⚠️ CUIDADO: borra datos)
docker-compose exec backend alembic downgrade base
docker-compose exec backend alembic upgrade head
```

---

### Solución 3: Verificar y Corregir Variables de Entorno

**Crear/editar `.env` del backend** (si no existe, copiar de `.env.example`):

```bash
# Ejemplo de .env del backend
DATABASE_URL=postgresql://postgres:password@postgres:5432/migro_db
# O variables separadas:
POSTGRES_HOST=postgres
POSTGRES_PORT=5432
POSTGRES_USER=postgres
POSTGRES_PASSWORD=tu_password
POSTGRES_DB=migro_db

# JWT Secret (importante para tokens)
SECRET_KEY=tu_secret_key_aqui
ALGORITHM=HS256
```

**Reiniciar backend después de cambiar `.env`:**
```powershell
docker-compose restart backend
```

---

### Solución 4: Limpiar y Reconstruir

```powershell
# Limpiar contenedores y volúmenes (⚠️ CUIDADO: borra datos de BD si no está en volumen persistente)
docker-compose down -v

# Reconstruir imágenes
docker-compose build --no-cache

# Iniciar servicios
docker-compose up -d

# Ejecutar migraciones
docker-compose exec backend alembic upgrade head
```

---

### Solución 5: Verificar Red de Docker

Si el backend y PostgreSQL están en contenedores diferentes:

```powershell
# Ver redes de Docker
docker network ls

# Verificar que están en la misma red
docker-compose ps
docker inspect <container_id> | Select-String -Pattern "Networks"

# Probar conectividad desde backend a PostgreSQL
docker-compose exec backend ping postgres
```

---

## 📋 Checklist de Diagnóstico

Usa este checklist para diagnosticar el problema:

- [ ] Backend responde en `http://localhost:3000/api/health`
- [ ] PostgreSQL está corriendo y saludable
- [ ] El backend puede conectarse a PostgreSQL
- [ ] Las variables de entorno `DATABASE_URL` o `POSTGRES_*` están correctas
- [ ] Las migraciones de BD están ejecutadas (`alembic upgrade head`)
- [ ] Las tablas existen en la BD (`users`, `tokens`, etc.)
- [ ] Existe al menos un usuario en la BD con las credenciales usadas
- [ ] El usuario en la BD está activo (`is_active = true`)
- [ ] Los logs del backend no muestran errores de conexión a BD
- [ ] Los logs del backend no muestran errores de autenticación JWT
- [ ] `VITE_API_BASE_URL` en el frontend apunta a `http://localhost:3000/api`

---

## 🐛 Errores Específicos y Soluciones

### Error: "relation 'users' does not exist"

**Causa:** La base de datos no tiene las tablas creadas.

**Solución:**
```powershell
docker-compose exec backend alembic upgrade head
```

---

### Error: "could not connect to server: Connection refused"

**Causa:** PostgreSQL no está corriendo o no es accesible desde el backend.

**Solución:**
```powershell
# Verificar que PostgreSQL está corriendo
docker-compose ps postgres

# Si no está corriendo, iniciarlo
docker-compose up -d postgres

# Esperar a que esté listo
timeout /t 10

# Verificar conectividad
docker-compose exec backend ping postgres
```

---

### Error: "password authentication failed for user"

**Causa:** Credenciales incorrectas de PostgreSQL en `DATABASE_URL` o variables `POSTGRES_*`.

**Solución:**
1. Verificar el `.env` del backend
2. Verificar que la contraseña coincide con la de PostgreSQL
3. Reiniciar el backend: `docker-compose restart backend`

---

### Error: "No module named 'app.database'"

**Causa:** El backend tiene problemas de importación o estructura de código.

**Solución:**
```powershell
# Verificar que el backend está en el directorio correcto
docker-compose exec backend pwd
docker-compose exec backend ls -la

# Verificar logs completos
docker-compose logs backend
```

---

### Error: "Refresh token expired" o "Invalid refresh token"

**Causa:** El token en `localStorage` es inválido o está expirado.

**Solución:**
1. Limpiar tokens del navegador:
   - Abrir DevTools (F12)
   - Console: `localStorage.clear()`
   - Recargar la página
2. Intentar login de nuevo

---

## 📞 Siguiente Paso

Si después de seguir esta guía el problema persiste:

1. **Recopilar información:**
   - Logs completos del backend: `docker-compose logs backend > backend_logs.txt`
   - Logs de PostgreSQL: `docker-compose logs postgres > postgres_logs.txt`
   - Salida de `docker-compose ps`
   - Contenido del `.env` del backend (sin passwords)

2. **Verificar que el problema es específico de local:**
   - ¿Funciona en staging/producción con las mismas credenciales?
   - ¿Funciona con otros usuarios en local?

3. **Documentar:**
   - Crear un nuevo documento con los errores específicos encontrados
   - Incluir los logs y configuración

---

## 📚 Documentación Relacionada

- [Configuración Docker Local](./DOCKER_LOCALHOST_API_CONNECTION.md)
- [Requisitos Backend - Autenticación](./BACKEND_SESSION_PERSISTENCE_REQUIREMENTS.md)
- [Integración Backend](./BACKEND_CRM_INTEGRATION.md)

---

---

## ✅ Solución Aplicada (2025-01-17)

El problema fue resuelto corrigiendo la configuración de conexión a la base de datos. Los errores específicos fueron:

1. **Error de conexión a BD** (`socket.gaierror: Name or service not known`): El backend no podía resolver el hostname de la base de datos en `DATABASE_URL`. Se corrigió ajustando la configuración de conexión.

2. **Usuario no encontrado**: El usuario no existía en la base de datos local. Se resolvió creando el usuario o corrigiendo la conexión para que apunte a la BD correcta.

**Nota:** Si el problema vuelve a ocurrir, revisar:
- Variables de entorno `DATABASE_URL` o `POSTGRES_*` en el contenedor del backend
- Que PostgreSQL esté corriendo y accesible desde el backend
- Que el usuario exista en la base de datos local

---

**Última actualización:** 2025-01-17
