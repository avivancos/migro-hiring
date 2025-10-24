# Script PowerShell para inicializar variables de entorno en Windows

Write-Host "🔧 Inicializando variables de entorno..." -ForegroundColor Green

# Crear .env.local si no existe
if (-not (Test-Path ".env.local")) {
    Write-Host "📝 Creando .env.local desde .env.example..." -ForegroundColor Yellow
    Copy-Item ".env.example" ".env.local"
    Write-Host "✅ .env.local creado" -ForegroundColor Green
} else {
    Write-Host "✅ .env.local ya existe" -ForegroundColor Green
}

# Verificar variables requeridas
if (-not $env:VITE_API_BASE_URL) {
    Write-Host "⚠️  VITE_API_BASE_URL no está configurada, usando default" -ForegroundColor Yellow
}

if (-not $env:VITE_STRIPE_PUBLISHABLE_KEY) {
    Write-Host "⚠️  VITE_STRIPE_PUBLISHABLE_KEY no está configurada" -ForegroundColor Yellow
}

Write-Host "✅ Inicialización completa" -ForegroundColor Green

