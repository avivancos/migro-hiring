# Script para iniciar Docker con configuración correcta de localhost
# Este script convierte localhost a host.docker.internal para que Docker pueda acceder al host

param(
    [string]$Profile = "production"
)

Write-Host "🐳 Iniciando Docker con configuración para desarrollo local..." -ForegroundColor Cyan

# Cargar variables de entorno desde .env
if (Test-Path .env) {
    Write-Host "📝 Cargando variables desde .env..." -ForegroundColor Yellow
    Get-Content .env | ForEach-Object {
        if ($_ -match '^\s*([^#][^=]+)=(.*)$') {
            $key = $matches[1].Trim()
            $value = $matches[2].Trim()
            [Environment]::SetEnvironmentVariable($key, $value, "Process")
        }
    }
}

# Obtener VITE_API_BASE_URL del entorno
$apiBaseUrl = $env:VITE_API_BASE_URL
if (-not $apiBaseUrl) {
    Write-Host "❌ Error: VITE_API_BASE_URL no está definida en .env" -ForegroundColor Red
    exit 1
}

Write-Host "🔧 URL de API original: $apiBaseUrl" -ForegroundColor Gray

# IMPORTANTE: NO convertir localhost a host.docker.internal para VITE_API_BASE_URL
# porque esta URL se usa en el navegador del usuario (fuera de Docker), no dentro del contenedor
# El navegador necesita usar localhost:3000 que está mapeado desde el host
# Solo se convierte para variables que se usan DENTRO del contenedor
$env:DOCKER_API_BASE_URL = $apiBaseUrl

Write-Host "🔧 URL de API (usada por el navegador): $apiBaseUrl" -ForegroundColor Green
Write-Host "ℹ️  NOTA: El navegador usa localhost porque corre fuera de Docker" -ForegroundColor Yellow

# Asegurar que VITE_SHORT_URL_BASE esté definida
if (-not $env:VITE_SHORT_URL_BASE) {
    $env:VITE_SHORT_URL_BASE = $env:VITE_APP_URL
    Write-Host "🔧 VITE_SHORT_URL_BASE no definida, usando VITE_APP_URL: $env:VITE_SHORT_URL_BASE" -ForegroundColor Yellow
}

# Asegurar que VITE_PUBLIC_DOMAIN esté definida
if (-not $env:VITE_PUBLIC_DOMAIN) {
    $appUrl = $env:VITE_APP_URL -replace 'https?://', ''
    $env:VITE_PUBLIC_DOMAIN = $appUrl
    Write-Host "🔧 VITE_PUBLIC_DOMAIN no definida, usando dominio de VITE_APP_URL: $env:VITE_PUBLIC_DOMAIN" -ForegroundColor Yellow
}

# Convertir también VITE_PILI_API_URL si existe
if ($env:VITE_PILI_API_URL) {
    $dockerPiliUrl = $env:VITE_PILI_API_URL -replace 'localhost', 'host.docker.internal'
    $env:DOCKER_PILI_API_URL = $dockerPiliUrl
    Write-Host "🔧 URL de Pili para Docker: $dockerPiliUrl" -ForegroundColor Green
} else {
    # Si no está definida, usar un valor por defecto para desarrollo
    $env:VITE_PILI_API_URL = "http://host.docker.internal:8001/api"
    $env:DOCKER_PILI_API_URL = $env:VITE_PILI_API_URL
    Write-Host "🔧 VITE_PILI_API_URL no definida, usando valor por defecto: $env:VITE_PILI_API_URL" -ForegroundColor Yellow
}

# Iniciar docker-compose
Write-Host "🚀 Iniciando docker-compose con perfil: $Profile" -ForegroundColor Cyan
docker-compose --profile $Profile up -d prod

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Docker iniciado correctamente" -ForegroundColor Green
    Write-Host "🌐 Aplicación disponible en: http://localhost:80" -ForegroundColor Green
    Write-Host "📊 Ver logs: docker-compose logs -f prod" -ForegroundColor Yellow
} else {
    Write-Host "❌ Error al iniciar Docker" -ForegroundColor Red
    exit 1
}
