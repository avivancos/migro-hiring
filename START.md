# 🚀 INICIO RÁPIDO - Migro Hiring

**Guía de 2 minutos para levantar el proyecto con Docker**

---

## ⚡ Pasos Rápidos

### **1️⃣ Configurar Variables de Entorno** (30 segundos)

```powershell
# Copiar archivo de ejemplo
Copy-Item .env.example .env.local

# Editar con tus valores (o usar los defaults para desarrollo)
notepad .env.local
```

**Valores mínimos necesarios:**
```bash
VITE_API_BASE_URL=http://localhost:8000/api/v1
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_placeholder
VITE_APP_URL=http://localhost:5173
```

### **2️⃣ Iniciar Docker** (1 minuto)

**Opción A - Docker Compose (Recomendado):**
```powershell
docker-compose up dev
```

**Opción B - Con npm:**
```powershell
npm run docker:dev
```

**Opción C - Con Makefile:**
```powershell
cd docker
make dev
```

### **3️⃣ Abrir en Navegador** (5 segundos)

Ir a: **http://localhost:5173**

---

## 🎯 ¿Qué se Levanta?

- ✅ **Servidor Vite** en puerto 5173
- ✅ **Hot Reload** activado (cambios en tiempo real)
- ✅ **React 19** con TypeScript
- ✅ **Contenedor Docker** aislado y listo

---

## 🛠️ Comandos Útiles

```powershell
# Ver logs en tiempo real
docker-compose logs -f dev

# Detener
docker-compose down

# Reiniciar
docker-compose restart dev

# Acceder al contenedor
docker-compose exec dev sh

# Instalar nueva dependencia
docker-compose exec dev npm install nombre-paquete

# Limpiar todo y empezar de cero
docker-compose down -v
docker-compose up dev
```

---

## 📁 Estructura Básica

```
migro-hiring/
├── src/                    # Código fuente React
├── docker/                 # Configuración Docker
├── .env.example           # Template de variables
├── .env.local            # TUS variables (crear este)
├── docker-compose.yml     # Definición de servicios
├── Dockerfile            # Imagen Docker
└── START.md              # Este archivo
```

---

## 🐛 Problemas Comunes

### **Puerto 5173 ya está en uso**

```powershell
# Cambiar puerto en docker-compose.yml
ports:
  - "3000:5173"  # Usar 3000 en vez de 5173
```

### **Hot reload no funciona**

Ya está configurado con `usePolling: true` en `vite.config.ts` ✅

### **Error al iniciar contenedor**

```powershell
# Ver logs detallados
docker-compose logs dev

# Recrear contenedor
docker-compose up --force-recreate dev
```

### **Cambios en package.json no se reflejan**

```powershell
# Eliminar volumen de node_modules y recrear
docker-compose down -v
docker-compose up dev
```

---

## 📚 Siguiente Paso

Una vez que el proyecto esté corriendo, el siguiente paso es:

1. **Instalar dependencias** del proyecto (React Router, Stripe, Tailwind, etc.)
2. **Configurar Tailwind CSS** y shadcn/ui
3. **Crear la estructura de carpetas** completa
4. **Implementar componentes** del flujo de contratación

Ver `plan.md` para el roadmap completo.

---

## 🔥 Quick Commands Cheat Sheet

```powershell
# Desarrollo
docker-compose up dev              # Iniciar
docker-compose down                # Detener
docker-compose logs -f dev         # Logs
docker-compose exec dev sh         # Shell

# Producción (para testing)
docker-compose --profile production up prod

# Limpieza
docker-compose down -v             # Detener + eliminar volúmenes
docker-compose down -v --rmi all   # Detener + eliminar todo
```

---

## ✅ Checklist de Verificación

Después de iniciar, verifica que todo funciona:

- [ ] `http://localhost:5173` carga correctamente
- [ ] Aparece la página de React (logo girando)
- [ ] Los cambios en `src/App.tsx` se reflejan automáticamente
- [ ] No hay errores en la consola del navegador
- [ ] Docker Desktop muestra el contenedor `migro-hiring-dev` corriendo

---

## 📞 Ayuda

- **Documentación Docker completa**: `docker/README.md`
- **Quick Start Docker**: `docker/docker-quickstart.md`
- **Plan del proyecto**: `plan.md`
- **README principal**: `README.md`

---

**¡Listo para desarrollar! 🎉**

**Tiempo total de setup**: ~2 minutos ⚡

