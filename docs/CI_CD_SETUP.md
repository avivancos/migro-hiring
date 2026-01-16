# Configuración CI/CD - Migro Hiring

**Fecha:** 2025-01-15  
**Estado:** ✅ CONFIGURADO

---

## 📋 Resumen

Se ha configurado un sistema completo de CI/CD con GitHub Actions que incluye:
- ✅ Tests unitarios automatizados
- ✅ Build de producción
- ✅ Verificación de Docker
- ✅ Tests de endpoints HTTP
- ✅ Almacenamiento de logs

---

## 🔧 Configuración de GitHub Actions

### Workflows Configurados

#### 1. **`.github/workflows/ci.yml`** - CI Principal

Ejecuta en cada push y pull request:

**Jobs:**
- **test**: Ejecuta tests unitarios con Vitest
- **build**: Build de producción con todas las variables de entorno
- **docker**: Build y test de imagen Docker
- **summary**: Resumen de todos los jobs

**Variables de Entorno para Tests:**
```yaml
VITE_API_BASE_URL: http://localhost:3000/api
VITE_STRIPE_PUBLISHABLE_KEY: pk_test_placeholder
VITE_APP_URL: http://localhost:5173
VITE_SHORT_URL_BASE: http://localhost:5173
VITE_PUBLIC_DOMAIN: localhost:5173
VITE_PILI_API_URL: http://localhost:8001/api
```

**Variables de Entorno para Build:**
```yaml
VITE_API_BASE_URL: https://api.migro.es/api
VITE_STRIPE_PUBLISHABLE_KEY: ${{ secrets.VITE_STRIPE_PUBLISHABLE_KEY }}
VITE_APP_URL: https://contratacion.migro.es
VITE_SHORT_URL_BASE: https://migro.es
VITE_PUBLIC_DOMAIN: contratacion.migro.es
VITE_PILI_API_URL: https://pili.migro.es/api
```

#### 2. **`.github/workflows/docker-test.yml`** - Test Docker Completo

Ejecuta cuando cambian archivos Docker o manualmente:

**Verificaciones:**
- ✅ Build de imagen Docker
- ✅ Verificación de estructura de archivos
- ✅ Test de contenedor con variables de entorno
- ✅ Test de endpoints HTTP (/healthz, /)
- ✅ Verificación de configuración nginx
- ✅ Captura de logs completos

---

## 🧪 Tests Locales

### Ejecutar Tests

```bash
# Tests en modo watch
npm run test

# Tests una vez (CI)
npm run test:ci

# Tests con cobertura
npm run test:coverage
```

### Tests Disponibles

| Archivo | Tests | Estado |
|---------|-------|--------|
| `src/services/__tests__/expedienteApi.test.ts` | 5 | ✅ Pasando |
| `src/services/__tests__/pipelineApi.test.ts` | 4 | ✅ Pasando |
| `src/hooks/__tests__/usePermissions.test.ts` | 6 | ✅ Pasando |
| `src/components/expedientes/__tests__/ExpedienteCard.test.tsx` | 4 | ✅ Pasando |
| `src/components/expedientes/__tests__/ExpedienteForm.test.tsx` | 4 | ✅ Pasando |
| `src/components/CRM/__tests__/CompanyForm.test.tsx` | 3 | ✅ Pasando |
| `src/components/CRM/__tests__/TaskForm.test.tsx` | 3 | ✅ Pasando |
| `src/pages/__tests__/AdminLogin.test.tsx` | 4 | ✅ Pasando |

**Total: 33 tests automatizados**

---

## 🐳 Verificación Docker Local

### Script de Verificación

```powershell
# Windows
.\scripts\test-docker.ps1

# O manualmente
docker-compose ps prod
docker-compose logs prod --tail 50
docker exec migro-hiring-prod nginx -t
```

### Endpoints a Verificar

- `http://localhost:80/healthz` - Health check (debe retornar 200)
- `http://localhost:80/` - Aplicación principal (debe retornar 200)
- `http://localhost:80/crm` - CRM (debe retornar 200)

### Verificaciones Docker

1. **Estado del contenedor:**
   ```bash
   docker ps --filter "name=migro-hiring-prod"
   ```

2. **Logs de nginx:**
   ```bash
   docker-compose logs prod --tail 50
   ```

3. **Configuración nginx:**
   ```bash
   docker exec migro-hiring-prod nginx -t
   ```

4. **Procesos nginx:**
   ```bash
   docker exec migro-hiring-prod ps aux | grep nginx
   ```

5. **Archivos estáticos:**
   ```bash
   docker exec migro-hiring-prod ls -la /usr/share/nginx/html/
   ```

---

## 📊 Logs Almacenados

Los siguientes archivos de log se generan durante las pruebas:

### Logs Locales

- `test-results.log` - Resultados completos de tests
- `docker-logs.log` - Logs del contenedor Docker
- `docker-full-logs.log` - Logs completos de Docker
- `docker-endpoints-test.log` - Resultados de tests de endpoints
- `docker-verification-*.log` - Logs de verificación completa
- `docker-status.log` - Estado del contenedor
- `docker-nginx-test.log` - Test de configuración nginx
- `docker-processes.log` - Procesos dentro del contenedor
- `docker-inspect.log` - Inspección del contenedor

### Logs en CI/CD

Los logs se almacenan como artefactos en GitHub Actions:
- `test-results` - Resultados de tests
- `build-artifacts` - Archivos de build
- `docker-logs` - Logs de Docker
- `docker-ci-logs` - Logs completos de CI Docker

---

## ✅ Checklist de Verificación

### Pre-Deploy

- [ ] Todos los tests pasan: `npm run test:ci`
- [ ] Build de producción exitoso: `npm run build`
- [ ] Docker build exitoso: `docker-compose build prod`
- [ ] Contenedor Docker funciona: `docker-compose up -d prod`
- [ ] Health check responde: `curl http://localhost:80/healthz`
- [ ] Aplicación carga: `curl http://localhost:80/`
- [ ] Nginx config válida: `docker exec migro-hiring-prod nginx -t`
- [ ] No hay hardcodes en el código
- [ ] Variables de entorno configuradas

### Post-Deploy

- [ ] Aplicación accesible en producción
- [ ] CRM funciona: `https://contratacion.migro.es/crm`
- [ ] API se conecta correctamente
- [ ] No hay errores en consola del navegador
- [ ] Logs de producción sin errores críticos

---

## 🔍 Troubleshooting

### Tests Fallan

1. **Tokens expirados:**
   ```bash
   npm run test:tokens
   ```

2. **Dependencias faltantes:**
   ```bash
   npm install --legacy-peer-deps
   ```

3. **Problemas de módulos:**
   ```bash
   rm -rf node_modules package-lock.json
   npm install --legacy-peer-deps
   ```

### Docker No Funciona

1. **Verificar contenedor:**
   ```bash
   docker-compose ps prod
   docker-compose logs prod
   ```

2. **Reconstruir:**
   ```bash
   docker-compose down prod
   docker-compose --profile production build --no-cache prod
   .\docker\start-docker.ps1
   ```

3. **Verificar puerto:**
   ```bash
   netstat -ano | findstr :80
   ```

### Build Falla en CI

1. Verificar que todas las variables de entorno estén definidas
2. Verificar que los secrets estén configurados en GitHub
3. Revisar logs de GitHub Actions
4. Probar build localmente con las mismas variables

---

## 📚 Referencias

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Vitest Documentation](https://vitest.dev/)
- [Docker Documentation](https://docs.docker.com/)
