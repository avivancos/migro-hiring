#!/bin/bash
# Script de build para Render con auto-repair y ejecución limpia
# Este script se ejecuta en Render antes de npm start

set -e  # Salir si hay errores críticos

echo "🔨 Iniciando build para Render..."

# Colores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Función para auto-repair de errores comunes
auto_repair() {
    echo -e "${YELLOW}🔧 Ejecutando auto-repair...${NC}"
    
    # 1. Limpiar imports no usados
    if [ -f "scripts/remove-unused-imports.js" ]; then
        echo "  → Limpiando imports no usados..."
        node scripts/remove-unused-imports.js || true
    fi
    
    # 2. Corregir referencias de iconos
    if [ -f "scripts/fix-icon-references.js" ]; then
        echo "  → Corrigiendo referencias de iconos..."
        node scripts/fix-icon-references.js || true
    fi
    
    # 3. Corregir nombres de iconos
    if [ -f "scripts/fix-icon-names.js" ]; then
        echo "  → Corrigiendo nombres de iconos..."
        node scripts/fix-icon-names.js || true
    fi
    
    # 4. Limpiar imports duplicados
    if [ -f "scripts/fix-imports-and-references.js" ]; then
        echo "  → Limpiando imports duplicados..."
        node scripts/fix-imports-and-references.js || true
    fi
    
    echo -e "${GREEN}✅ Auto-repair completado${NC}"
}

# Función para limpiar el entorno
clean_environment() {
    echo -e "${YELLOW}🧹 Limpiando entorno...${NC}"
    
    # Limpiar builds anteriores
    rm -rf dist
    rm -rf node_modules/.vite
    rm -rf node_modules/.cache
    rm -rf .vite
    
    # Limpiar logs y temporales
    find . -name "*.log" -type f -delete 2>/dev/null || true
    find . -name ".DS_Store" -type f -delete 2>/dev/null || true
    
    echo -e "${GREEN}✅ Entorno limpiado${NC}"
}

# Función para verificar dependencias
check_dependencies() {
    echo -e "${YELLOW}📦 Verificando dependencias...${NC}"
    
    if [ ! -d "node_modules" ] || [ ! -f "node_modules/.bin/vite" ]; then
        echo "  → Instalando dependencias..."
        npm ci --legacy-peer-deps --no-audit --no-fund
    else
        echo "  → Dependencias ya instaladas"
    fi
    
    echo -e "${GREEN}✅ Dependencias verificadas${NC}"
}

# Función principal de build con retry y auto-repair
build_with_retry() {
    local max_attempts=3
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        echo -e "${YELLOW}🔨 Intentando build (intento $attempt/$max_attempts)...${NC}"
        
        if npm run build 2>&1 | tee build.log; then
            echo -e "${GREEN}✅ Build exitoso${NC}"
            rm -f build.log
            return 0
        else
            echo -e "${RED}❌ Build falló en intento $attempt${NC}"
            
            if [ $attempt -lt $max_attempts ]; then
                echo -e "${YELLOW}  → Ejecutando auto-repair antes del siguiente intento...${NC}"
                auto_repair
                sleep 2
            fi
            
            attempt=$((attempt + 1))
        fi
    done
    
    echo -e "${RED}❌ Build falló después de $max_attempts intentos${NC}"
    echo "Últimos errores del build:"
    tail -50 build.log 2>/dev/null || true
    return 1
}

# Función para preparar el start
prepare_start() {
    echo -e "${YELLOW}🚀 Preparando para npm start...${NC}"
    
    # Verificar que dist existe
    if [ ! -d "dist" ]; then
        echo -e "${RED}❌ Error: dist/ no existe después del build${NC}"
        return 1
    fi
    
    # Verificar que index.html existe
    if [ ! -f "dist/index.html" ]; then
        echo -e "${RED}❌ Error: dist/index.html no existe${NC}"
        return 1
    fi
    
    # Mostrar tamaño del build
    echo "  → Tamaño del build:"
    du -sh dist || true
    
    echo -e "${GREEN}✅ Preparación completada${NC}"
}

# ==========================================
# EJECUCIÓN PRINCIPAL
# ==========================================

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}   RENDER BUILD SCRIPT CON AUTO-REPAIR${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# Paso 1: Limpiar entorno
clean_environment
echo ""

# Paso 2: Verificar dependencias
check_dependencies
echo ""

# Paso 3: Auto-repair inicial (proactivo)
auto_repair
echo ""

# Paso 4: Build con retry y auto-repair
if build_with_retry; then
    echo ""
    # Paso 5: Preparar para start
    if prepare_start; then
        echo ""
        echo -e "${GREEN}========================================${NC}"
        echo -e "${GREEN}   ✅ BUILD COMPLETADO EXITOSAMENTE${NC}"
        echo -e "${GREEN}========================================${NC}"
        echo ""
        echo -e "${GREEN}🚀 Build completado, listo para npm start${NC}"
        echo ""
        echo -e "${YELLOW}ℹ️  Render ejecutará 'npm start' automáticamente${NC}"
        echo ""
        # El script solo hace el build, Render ejecuta npm start después
        exit 0
    else
        echo -e "${RED}❌ Error preparando el start${NC}"
        exit 1
    fi
else
    echo -e "${RED}========================================${NC}"
    echo -e "${RED}   ❌ BUILD FALLÓ${NC}"
    echo -e "${RED}========================================${NC}"
    exit 1
fi
