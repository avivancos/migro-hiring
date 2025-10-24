# 🚀 Quick Start - Docker

Guía rápida para empezar a trabajar con Docker en 5 minutos.

---

## ⚡ Inicio Rápido (3 pasos)

### 1️⃣ Clonar y configurar

```bash
# Ya estás en el proyecto, solo configura el entorno
cp .env.example .env.local
# Editar .env.local con tus valores reales
```

### 2️⃣ Iniciar Docker

**Opción A: Docker Compose directo**
```bash
docker-compose up dev
```

**Opción B: Con npm scripts**
```bash
npm run docker:dev
```

**Opción C: Con Makefile (más simple)**
```bash
cd docker
make dev
```

### 3️⃣ Abrir navegador

Ir a: `http://localhost:5173`

---

## 🎯 Comandos más usados

```bash
# Iniciar desarrollo
docker-compose up dev

# Detener
docker-compose down

# Ver logs
docker-compose logs -f dev

# Reiniciar
docker-compose restart dev

# Entrar al contenedor
docker-compose exec dev sh

# Instalar dependencia
docker-compose exec dev npm install nombre-paquete
```

---

## 🛠️ Con Makefile (Recomendado)

```bash
cd docker

# Ver todos los comandos disponibles
make help

# Comandos útiles
make dev        # Iniciar desarrollo
make stop       # Detener
make logs       # Ver logs
make shell      # Acceder al shell
make clean      # Limpiar todo
```

---

## 📦 Estructura

```
migro-hiring/
├── Dockerfile              # Definición de imagen Docker
├── docker-compose.yml      # Orquestación de servicios
├── .dockerignore          # Archivos a ignorar en build
├── .env.example           # Plantilla de variables
├── .env.local            # TUS variables (no commitear)
└── docker/
    ├── nginx.conf         # Configuración Nginx (producción)
    ├── Makefile          # Comandos simplificados
    ├── README.md         # Documentación completa
    └── docker-quickstart.md  # Esta guía
```

---

## 🔧 Variables de Entorno

Editar `.env.local`:

```bash
VITE_API_BASE_URL=http://localhost:8000/api/v1
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx
VITE_APP_URL=http://localhost:5173
```

---

## 🐛 Problemas Comunes

### Puerto 5173 ocupado
```bash
# Cambiar puerto en docker-compose.yml
ports:
  - "3000:5173"  # Usar 3000 en lugar de 5173
```

### Hot reload no funciona
```bash
# Añadir en vite.config.ts
server: {
  watch: {
    usePolling: true  # Para Windows
  }
}
```

### Contenedor no inicia
```bash
# Ver logs detallados
docker-compose logs dev

# Recrear contenedor
docker-compose up --force-recreate dev
```

---

## 📚 Más Información

Ver documentación completa en: `docker/README.md`

---

**¡Listo para desarrollar! 🎉**

