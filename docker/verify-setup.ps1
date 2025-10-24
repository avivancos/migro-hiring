# Script de Verificación del Setup de Docker
# Migro Hiring Frontend

Write-Host "🔍 Verificando setup de Docker para Migro Hiring..." -ForegroundColor Cyan
Write-Host ""

$errors = 0
$warnings = 0

# Verificar Docker Desktop
Write-Host "Verificando Docker Desktop..." -ForegroundColor Yellow
try {
    $dockerVersion = docker --version
    Write-Host "✅ Docker instalado: $dockerVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker no está instalado o no está en PATH" -ForegroundColor Red
    $errors++
}

# Verificar Docker Compose
Write-Host "Verificando Docker Compose..." -ForegroundColor Yellow
try {
    $composeVersion = docker-compose --version
    Write-Host "✅ Docker Compose instalado: $composeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker Compose no está instalado" -ForegroundColor Red
    $errors++
}

# Verificar archivos necesarios
Write-Host ""
Write-Host "Verificando archivos de configuración..." -ForegroundColor Yellow

$requiredFiles = @(
    "Dockerfile",
    "docker-compose.yml",
    ".dockerignore",
    ".env.example",
    "docker/nginx.conf",
    "docker/Makefile",
    "vite.config.ts",
    "package.json"
)

foreach ($file in $requiredFiles) {
    if (Test-Path $file) {
        Write-Host "✅ $file existe" -ForegroundColor Green
    } else {
        Write-Host "❌ $file no encontrado" -ForegroundColor Red
        $errors++
    }
}

# Verificar .env.local
Write-Host ""
Write-Host "Verificando variables de entorno..." -ForegroundColor Yellow
if (Test-Path ".env.local") {
    Write-Host "✅ .env.local existe" -ForegroundColor Green
    
    # Verificar contenido básico
    $envContent = Get-Content ".env.local" -Raw
    if ($envContent -match "VITE_API_BASE_URL") {
        Write-Host "✅ VITE_API_BASE_URL configurada" -ForegroundColor Green
    } else {
        Write-Host "⚠️  VITE_API_BASE_URL no encontrada en .env.local" -ForegroundColor Yellow
        $warnings++
    }
    
    if ($envContent -match "VITE_STRIPE_PUBLISHABLE_KEY") {
        Write-Host "✅ VITE_STRIPE_PUBLISHABLE_KEY configurada" -ForegroundColor Green
    } else {
        Write-Host "⚠️  VITE_STRIPE_PUBLISHABLE_KEY no encontrada en .env.local" -ForegroundColor Yellow
        $warnings++
    }
} else {
    Write-Host "⚠️  .env.local no existe. Ejecuta: Copy-Item .env.example .env.local" -ForegroundColor Yellow
    $warnings++
}

# Verificar puertos disponibles
Write-Host ""
Write-Host "Verificando puertos..." -ForegroundColor Yellow

function Test-Port {
    param($Port)
    try {
        $connection = Test-NetConnection -ComputerName localhost -Port $Port -WarningAction SilentlyContinue -ErrorAction SilentlyContinue
        return $connection.TcpTestSucceeded
    } catch {
        return $false
    }
}

if (Test-Port 5173) {
    Write-Host "⚠️  Puerto 5173 está en uso" -ForegroundColor Yellow
    $warnings++
} else {
    Write-Host "✅ Puerto 5173 disponible" -ForegroundColor Green
}

if (Test-Port 80) {
    Write-Host "⚠️  Puerto 80 está en uso" -ForegroundColor Yellow
} else {
    Write-Host "✅ Puerto 80 disponible" -ForegroundColor Green
}

# Verificar contenedores existentes
Write-Host ""
Write-Host "Verificando contenedores..." -ForegroundColor Yellow
try {
    $containers = docker ps -a --filter "name=migro-hiring" --format "{{.Names}}: {{.Status}}"
    if ($containers) {
        Write-Host "📦 Contenedores encontrados:" -ForegroundColor Cyan
        $containers | ForEach-Object { Write-Host "   $_" -ForegroundColor Gray }
    } else {
        Write-Host "✅ No hay contenedores previos" -ForegroundColor Green
    }
} catch {
    Write-Host "⚠️  No se pudo verificar contenedores" -ForegroundColor Yellow
}

# Verificar imágenes
Write-Host ""
Write-Host "Verificando imágenes Docker..." -ForegroundColor Yellow
try {
    $images = docker images --filter "reference=migro-hiring*" --format "{{.Repository}}:{{.Tag}} ({{.Size}})"
    if ($images) {
        Write-Host "🖼️  Imágenes encontradas:" -ForegroundColor Cyan
        $images | ForEach-Object { Write-Host "   $_" -ForegroundColor Gray }
    } else {
        Write-Host "✅ No hay imágenes previas (se crearán al hacer build)" -ForegroundColor Green
    }
} catch {
    Write-Host "⚠️  No se pudo verificar imágenes" -ForegroundColor Yellow
}

# Resumen
Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "📊 RESUMEN DE VERIFICACIÓN" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan

if ($errors -eq 0 -and $warnings -eq 0) {
    Write-Host "🎉 ¡TODO PERFECTO!" -ForegroundColor Green
    Write-Host ""
    Write-Host "El setup está completo. Para iniciar:" -ForegroundColor White
    Write-Host "  docker-compose up dev" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Y abrir: http://localhost:5173" -ForegroundColor Cyan
    exit 0
} elseif ($errors -eq 0) {
    Write-Host "⚠️  Setup OK con $warnings advertencia(s)" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Puedes continuar, pero revisa las advertencias arriba." -ForegroundColor White
    Write-Host ""
    Write-Host "Para iniciar:" -ForegroundColor White
    Write-Host "  docker-compose up dev" -ForegroundColor Cyan
    exit 0
} else {
    Write-Host "❌ Setup INCOMPLETO: $errors error(es), $warnings advertencia(s)" -ForegroundColor Red
    Write-Host ""
    Write-Host "Por favor, corrige los errores antes de continuar." -ForegroundColor White
    exit 1
}

