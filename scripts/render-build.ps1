# Script de build para Render con auto-repair (PowerShell para Windows local)
# Para Render, usar el .sh en lugar de este

$ErrorActionPreference = "Continue"

Write-Host "🔨 Iniciando build para Render..." -ForegroundColor Yellow

# Función para auto-repair de errores comunes
function Auto-Repair {
    Write-Host "🔧 Ejecutando auto-repair..." -ForegroundColor Yellow
    
    # 1. Limpiar imports no usados
    if (Test-Path "scripts/remove-unused-imports.js") {
        Write-Host "  → Limpiando imports no usados..." -ForegroundColor Gray
        node scripts/remove-unused-imports.js 2>$null
    }
    
    # 2. Corregir referencias de iconos
    if (Test-Path "scripts/fix-icon-references.js") {
        Write-Host "  → Corrigiendo referencias de iconos..." -ForegroundColor Gray
        node scripts/fix-icon-references.js 2>$null
    }
    
    # 3. Corregir nombres de iconos
    if (Test-Path "scripts/fix-icon-names.js") {
        Write-Host "  → Corrigiendo nombres de iconos..." -ForegroundColor Gray
        node scripts/fix-icon-names.js 2>$null
    }
    
    # 4. Limpiar imports duplicados
    if (Test-Path "scripts/fix-imports-and-references.js") {
        Write-Host "  → Limpiando imports duplicados..." -ForegroundColor Gray
        node scripts/fix-imports-and-references.js 2>$null
    }
    
    Write-Host "✅ Auto-repair completado" -ForegroundColor Green
}

# Función para limpiar el entorno
function Clean-Environment {
    Write-Host "🧹 Limpiando entorno..." -ForegroundColor Yellow
    
    # Limpiar builds anteriores
    if (Test-Path "dist") { Remove-Item -Recurse -Force "dist" }
    if (Test-Path "node_modules/.vite") { Remove-Item -Recurse -Force "node_modules/.vite" }
    if (Test-Path "node_modules/.cache") { Remove-Item -Recurse -Force "node_modules/.cache" }
    if (Test-Path ".vite") { Remove-Item -Recurse -Force ".vite" }
    
    Write-Host "✅ Entorno limpiado" -ForegroundColor Green
}

# Función para verificar dependencias
function Check-Dependencies {
    Write-Host "📦 Verificando dependencias..." -ForegroundColor Yellow
    
    if (-not (Test-Path "node_modules") -or -not (Test-Path "node_modules/.bin/vite")) {
        Write-Host "  → Instalando dependencias..." -ForegroundColor Gray
        npm ci --legacy-peer-deps --no-audit --no-fund
    } else {
        Write-Host "  → Dependencias ya instaladas" -ForegroundColor Gray
    }
    
    Write-Host "✅ Dependencias verificadas" -ForegroundColor Green
}

# Función principal de build con retry
function Build-WithRetry {
    $maxAttempts = 3
    $attempt = 1
    
    while ($attempt -le $maxAttempts) {
        Write-Host "🔨 Intentando build (intento $attempt/$maxAttempts)..." -ForegroundColor Yellow
        
        $buildOutput = npm run build 2>&1
        $buildOutput | Out-File -FilePath "build.log" -Encoding utf8
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Build exitoso" -ForegroundColor Green
            Remove-Item -Force "build.log" -ErrorAction SilentlyContinue
            return $true
        } else {
            Write-Host "❌ Build falló en intento $attempt" -ForegroundColor Red
            
            if ($attempt -lt $maxAttempts) {
                Write-Host "  → Ejecutando auto-repair antes del siguiente intento..." -ForegroundColor Yellow
                Auto-Repair
                Start-Sleep -Seconds 2
            }
            
            $attempt++
        }
    }
    
    Write-Host "❌ Build falló después de $maxAttempts intentos" -ForegroundColor Red
    Write-Host "Últimos errores del build:"
    Get-Content "build.log" -Tail 50 -ErrorAction SilentlyContinue
    return $false
}

# Función para preparar el start
function Prepare-Start {
    Write-Host "🚀 Preparando para npm start..." -ForegroundColor Yellow
    
    if (-not (Test-Path "dist")) {
        Write-Host "❌ Error: dist/ no existe después del build" -ForegroundColor Red
        return $false
    }
    
    if (-not (Test-Path "dist/index.html")) {
        Write-Host "❌ Error: dist/index.html no existe" -ForegroundColor Red
        return $false
    }
    
    Write-Host "  → Tamaño del build:"
    $size = (Get-ChildItem -Path "dist" -Recurse | Measure-Object -Property Length -Sum).Sum / 1MB
    Write-Host "    $([math]::Round($size, 2)) MB" -ForegroundColor Gray
    
    Write-Host "✅ Preparación completada" -ForegroundColor Green
    return $true
}

# ==========================================
# EJECUCIÓN PRINCIPAL
# ==========================================

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "   RENDER BUILD SCRIPT CON AUTO-REPAIR" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

# Paso 1: Limpiar entorno
Clean-Environment
Write-Host ""

# Paso 2: Verificar dependencias
Check-Dependencies
Write-Host ""

# Paso 3: Auto-repair inicial
Auto-Repair
Write-Host ""

# Paso 4: Build con retry
if (Build-WithRetry) {
    Write-Host ""
    # Paso 5: Preparar para start
    if (Prepare-Start) {
        Write-Host ""
        Write-Host "========================================" -ForegroundColor Green
        Write-Host "   ✅ BUILD COMPLETADO EXITOSAMENTE" -ForegroundColor Green
        Write-Host "========================================" -ForegroundColor Green
        Write-Host ""
        Write-Host "🚀 Iniciando servidor..." -ForegroundColor Green
        Write-Host ""
        # Ejecutar npm start
        npm start
    } else {
        Write-Host "❌ Error preparando el start" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Red
    Write-Host "   ❌ BUILD FALLÓ" -ForegroundColor Red
    Write-Host "========================================" -ForegroundColor Red
    exit 1
}
