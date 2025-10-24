# 🐳 Docker - Migro Hiring Frontend

Guía completa para trabajar con Docker en el proyecto.

---

## 📋 Requisitos Previos

- Docker Desktop 20.10+ instalado
- Docker Compose 2.0+ instalado
- 4GB RAM disponible mínimo
- Puertos disponibles: 5173 (dev), 80 (prod), 8000 (mock-api)

---

## 🚀 Comandos Rápidos

### **Desarrollo (Recomendado)**

```bash
# Iniciar entorno de desarrollo
docker-compose up dev

# Iniciar en segundo plano
docker-compose up -d dev

# Ver logs en tiempo real
docker-compose logs -f dev

# Detener
docker-compose down
```

La aplicación estará disponible en: `http://localhost:5173`

### **Producción**

```bash
# Build y ejecutar producción
docker-compose --profile production up prod

# Build separado
docker-compose --profile production build prod

# Ejecutar en segundo plano
docker-compose --profile production up -d prod
```

La aplicación estará disponible en: `http://localhost`

### **Con Mock API (Desarrollo sin backend)**

```bash
# Iniciar dev + mock API
docker-compose --profile mock up dev mock-api

# Solo mock API
docker-compose --profile mock up mock-api
```

Mock API estará en: `http://localhost:8000`

---

## 🔧 Comandos Útiles

### **Gestión de Contenedores**

```bash
# Ver contenedores activos
docker-compose ps

# Ver logs
docker-compose logs dev
docker-compose logs -f dev  # follow mode

# Reiniciar servicio
docker-compose restart dev

# Detener todos los servicios
docker-compose down

# Detener y eliminar volúmenes
docker-compose down -v
```

### **Acceso al Contenedor**

```bash
# Entrar al contenedor en modo interactivo
docker-compose exec dev sh

# Ejecutar comandos dentro del contenedor
docker-compose exec dev npm install nueva-libreria
docker-compose exec dev npm run lint
docker-compose exec dev npm run build
```

### **Limpieza**

```bash
# Eliminar contenedor, volúmenes e imágenes
docker-compose down -v --rmi all

# Limpiar todo Docker (¡CUIDADO!)
docker system prune -a --volumes
```

---

## 📦 Estructura de Docker

### **Dockerfile**

Multi-stage build con 4 stages:

1. **deps**: Instalación de dependencias
2. **builder**: Compilación de producción
3. **runner**: Servidor nginx para producción
4. **development**: Entorno de desarrollo con hot reload

### **docker-compose.yml**

3 servicios disponibles:

1. **dev**: Desarrollo con Vite (puerto 5173)
2. **prod**: Producción con Nginx (puerto 80)
3. **mock-api**: Mock API opcional (puerto 8000)

---

## ⚙️ Configuración

### **Variables de Entorno**

Crear archivo `.env` en la raíz del proyecto:

```bash
# .env
VITE_API_BASE_URL=http://localhost:8000/api/v1
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx
VITE_APP_URL=http://localhost:5173
```

O exportar directamente:

```bash
export VITE_API_BASE_URL=https://api.migro.es/api/v1
docker-compose up dev
```

### **Puertos Personalizados**

Editar `docker-compose.yml`:

```yaml
services:
  dev:
    ports:
      - "3000:5173"  # Cambiar puerto host
```

---

## 🔥 Hot Reload

El hot reload está habilitado en modo desarrollo mediante volúmenes:

```yaml
volumes:
  - .:/app  # Código fuente
  - node_modules:/app/node_modules  # Volumen para node_modules
```

Los cambios en el código se reflejarán automáticamente en `http://localhost:5173`.

---

## 🐛 Troubleshooting

### **Error: Puerto ya en uso**

```bash
# Encontrar proceso usando el puerto
netstat -ano | findstr :5173
# O en Linux/Mac
lsof -i :5173

# Matar proceso o cambiar puerto en docker-compose.yml
```

### **Error: node_modules no se actualiza**

```bash
# Eliminar volumen y recrear
docker-compose down -v
docker-compose up dev
```

### **Build lento**

```bash
# Usar BuildKit para builds más rápidos
export DOCKER_BUILDKIT=1
docker-compose build dev
```

### **Contenedor no inicia**

```bash
# Ver logs detallados
docker-compose logs dev

# Verificar estado
docker-compose ps

# Forzar recreación
docker-compose up --force-recreate dev
```

### **Hot reload no funciona en Windows**

En `vite.config.ts`, añadir:

```typescript
export default defineConfig({
  server: {
    watch: {
      usePolling: true,  // Para Windows con Docker
    }
  }
})
```

---

## 🚀 Despliegue

### **Build de Producción**

```bash
# Build de imagen de producción
docker build -t migro-hiring:latest --target runner .

# Ejecutar
docker run -p 80:80 migro-hiring:latest
```

### **Docker Hub**

```bash
# Tag
docker tag migro-hiring:latest tu-usuario/migro-hiring:latest

# Push
docker push tu-usuario/migro-hiring:latest
```

### **Con Variables de Entorno en Build**

```bash
docker build \
  --build-arg VITE_API_BASE_URL=https://api.migro.es/api/v1 \
  --build-arg VITE_STRIPE_PUBLISHABLE_KEY=pk_live_xxxxx \
  --build-arg VITE_APP_URL=https://contratacion.migro.es \
  -t migro-hiring:prod \
  --target runner \
  .
```

---

## 📊 Monitoreo

### **Health Checks**

Todos los servicios tienen health checks configurados:

```bash
# Ver estado de salud
docker-compose ps

# Endpoint de health en producción
curl http://localhost/health
```

### **Logs**

```bash
# Logs en tiempo real
docker-compose logs -f dev

# Últimas 100 líneas
docker-compose logs --tail=100 dev

# Logs de nginx en producción
docker-compose exec prod tail -f /var/log/nginx/access.log
```

---

## 🔒 Seguridad

### **Headers de Seguridad**

Configurados en `docker/nginx.conf`:
- X-Frame-Options
- X-Content-Type-Options
- X-XSS-Protection
- Content-Security-Policy
- Referrer-Policy

### **Escaneo de Vulnerabilidades**

```bash
# Escanear imagen con Trivy
docker run --rm -v /var/run/docker.sock:/var/run/docker.sock \
  aquasec/trivy image migro-hiring:latest
```

---

## 📚 Recursos

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Vite Docker Guide](https://vitejs.dev/guide/static-deploy.html)
- [Nginx Docker Image](https://hub.docker.com/_/nginx)

---

## 💡 Tips

1. **Usa BuildKit** para builds más rápidos
2. **Monta node_modules como volumen** para mejor performance
3. **Usa `.dockerignore`** para excluir archivos innecesarios
4. **Multi-stage builds** reducen el tamaño de la imagen final
5. **Health checks** aseguran que el servicio esté saludable

---

**Última actualización:** 23 de Octubre de 2025

