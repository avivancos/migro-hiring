# 🚀 Quick Start: Build Script para Render

## Uso Rápido

### 1. En Render Dashboard

**Build Command:**
```bash
chmod +x scripts/render-build.sh && bash scripts/render-build.sh
```

**Start Command:**
```bash
npm start
```

### 2. O usar el render.yaml actualizado

El `render.yaml` ya está configurado con el script de auto-repair.

### 3. Probar localmente

```bash
# Linux/Mac/WSL
bash scripts/render-build.sh

# Windows
npm run build:render:win
```

## ¿Qué hace el script?

1. 🧹 **Limpia** dist/ y cachés
2. 📦 **Verifica** dependencias (npm ci si faltan)
3. 🔧 **Auto-repair** proactivo de errores comunes
4. 🔨 **Build** con hasta 3 reintentos automáticos
5. ✅ **Verifica** que el build fue exitoso
6. 🚀 **Prepara** para npm start

## Características

- ✅ Auto-repair de imports no usados
- ✅ Corrección automática de referencias de iconos
- ✅ Reintentos con auto-repair entre intentos
- ✅ Logs detallados para debugging
- ✅ Verificación post-build

## Ver más

Lee `docs/RENDER_BUILD_SCRIPT.md` para documentación completa.
