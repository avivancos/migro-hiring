# Script de diagnóstico del backend para CI/CD (PowerShell)
# Verifica la salud del backend y detecta problemas comunes

param(
    [string]$ApiBaseUrl = $env:VITE_API_BASE_URL
)

if (-not $ApiBaseUrl) {
    $ApiBaseUrl = "http://localhost:3000/api"
}

$BackendUrl = $ApiBaseUrl -replace '/api$', ''

$ErrorCount = 0
$WarningCount = 0

Write-Host "🔍 Iniciando diagnóstico del backend..." -ForegroundColor Cyan
Write-Host "📡 API Base URL: $ApiBaseUrl"
Write-Host "📡 Backend URL: $BackendUrl"
Write-Host ""

function Test-Endpoint {
    param(
        [string]$Url,
        [int]$ExpectedStatus,
        [string]$Description,
        [int]$TimeoutSeconds = 10
    )
    
    Write-Host "🔍 Verificando $Description... " -NoNewline
    
    try {
        $response = Invoke-WebRequest -Uri $Url -Method Get -TimeoutSec $TimeoutSeconds -UseBasicParsing -ErrorAction Stop
        $statusCode = $response.StatusCode
        
        if ($statusCode -eq $ExpectedStatus) {
            Write-Host "✅ OK ($statusCode)" -ForegroundColor Green
            return $true
        } else {
            Write-Host "❌ FALLO ($statusCode, esperado: $ExpectedStatus)" -ForegroundColor Red
            $script:ErrorCount++
            return $false
        }
    } catch {
        $statusCode = $_.Exception.Response.StatusCode.value__
        if ($statusCode -eq $ExpectedStatus) {
            Write-Host "✅ OK ($statusCode)" -ForegroundColor Green
            return $true
        } else {
            Write-Host "❌ ERROR (Status: $statusCode, esperado: $ExpectedStatus)" -ForegroundColor Red
            Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
            $script:ErrorCount++
            return $false
        }
    }
}

function Test-LoginEndpoint {
    param(
        [string]$Url
    )
    
    Write-Host "🔍 Verificando endpoint de login... " -NoNewline
    
    try {
        $body = @{
            email = "test@example.com"
            password = "test"
        } | ConvertTo-Json
        
        $response = Invoke-WebRequest -Uri $Url -Method Post -Body $body -ContentType "application/json" -TimeoutSec 10 -UseBasicParsing -ErrorAction Stop
        $statusCode = $response.StatusCode
        
        # Esperamos 401, 422, o 400 (no 500)
        if ($statusCode -in @(400, 401, 422)) {
            Write-Host "✅ OK ($statusCode) - Endpoint responde correctamente" -ForegroundColor Green
            try {
                $json = $response.Content | ConvertFrom-Json
                if ($json.detail) {
                    Write-Host "   Detalle: $($json.detail)" -ForegroundColor Gray
                }
            } catch {
                # No es JSON, no importa
            }
            return $true
        } else {
            Write-Host "⚠️  Status inesperado ($statusCode)" -ForegroundColor Yellow
            $script:WarningCount++
            return $false
        }
    } catch {
        $statusCode = $_.Exception.Response.StatusCode.value__
        
        if ($statusCode -eq 500) {
            Write-Host "❌ ERROR 500 - Problema interno del servidor" -ForegroundColor Red
            Write-Host "   Esto sugiere un problema con la base de datos o configuración" -ForegroundColor Yellow
            $script:ErrorCount++
            return $false
        } elseif ($statusCode -in @(400, 401, 422)) {
            Write-Host "✅ OK ($statusCode) - Endpoint responde correctamente" -ForegroundColor Green
            try {
                $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
                $responseBody = $reader.ReadToEnd()
                $json = $responseBody | ConvertFrom-Json
                if ($json.detail) {
                    Write-Host "   Detalle: $($json.detail)" -ForegroundColor Gray
                }
            } catch {
                # No se pudo parsear
            }
            return $true
        } else {
            Write-Host "❌ ERROR (Status: $statusCode)" -ForegroundColor Red
            $script:ErrorCount++
            return $false
        }
    }
}

function Test-RefreshEndpoint {
    param(
        [string]$Url
    )
    
    Write-Host "🔍 Verificando endpoint de refresh... " -NoNewline
    
    try {
        $body = @{
            refresh_token = "invalid"
        } | ConvertTo-Json
        
        $response = Invoke-WebRequest -Uri $Url -Method Post -Body $body -ContentType "application/json" -TimeoutSec 10 -UseBasicParsing -ErrorAction Stop
        $statusCode = $response.StatusCode
        
        if ($statusCode -in @(400, 401)) {
            Write-Host "✅ OK ($statusCode) - Endpoint maneja tokens inválidos correctamente" -ForegroundColor Green
            return $true
        } else {
            Write-Host "⚠️  Status inesperado ($statusCode)" -ForegroundColor Yellow
            $script:WarningCount++
            return $false
        }
    } catch {
        $statusCode = $_.Exception.Response.StatusCode.value__
        
        if ($statusCode -eq 500) {
            Write-Host "❌ ERROR 500 - Problema interno del servidor" -ForegroundColor Red
            Write-Host "   ⚠️  PROBLEMA CRÍTICO: El endpoint devuelve 500 en lugar de 400/401" -ForegroundColor Yellow
            Write-Host "   Esto indica un problema con la base de datos o el manejo de errores" -ForegroundColor Yellow
            $script:ErrorCount++
            return $false
        } elseif ($statusCode -in @(400, 401)) {
            Write-Host "✅ OK ($statusCode) - Endpoint maneja tokens inválidos correctamente" -ForegroundColor Green
            return $true
        } else {
            Write-Host "❌ ERROR (Status: $statusCode)" -ForegroundColor Red
            $script:ErrorCount++
            return $false
        }
    }
}

# 1. Health Check
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host "1️⃣  HEALTH CHECK" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray

$healthUrl = "$BackendUrl/api/health"
Test-Endpoint -Url $healthUrl -ExpectedStatus 200 -Description "Health Check"

Write-Host ""

# 2. Login Endpoint
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host "2️⃣  ENDPOINT DE AUTENTICACIÓN" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray

$loginUrl = "$BackendUrl/api/auth/login"
Test-LoginEndpoint -Url $loginUrl

Write-Host ""

# 3. Refresh Endpoint
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host "3️⃣  ENDPOINT DE REFRESH TOKEN" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray

$refreshUrl = "$BackendUrl/api/auth/refresh"
Test-RefreshEndpoint -Url $refreshUrl

Write-Host ""

# 4. Variables de entorno
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host "4️⃣  VARIABLES DE ENTORNO" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray

if ($env:VITE_API_BASE_URL) {
    Write-Host "✅ VITE_API_BASE_URL configurada: $($env:VITE_API_BASE_URL)" -ForegroundColor Green
} else {
    Write-Host "⚠️  VITE_API_BASE_URL no configurada" -ForegroundColor Yellow
    $WarningCount++
}

Write-Host ""

# Resumen
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host "📊 RESUMEN" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray

if ($ErrorCount -eq 0 -and $WarningCount -eq 0) {
    Write-Host "✅ Todos los diagnósticos pasaron correctamente" -ForegroundColor Green
    exit 0
} elseif ($ErrorCount -eq 0) {
    Write-Host "⚠️  Diagnóstico completado con $WarningCount advertencia(s)" -ForegroundColor Yellow
    exit 0
} else {
    Write-Host "❌ Diagnóstico falló con $ErrorCount error(es) y $WarningCount advertencia(s)" -ForegroundColor Red
    Write-Host ""
    Write-Host "🔧 Soluciones sugeridas:" -ForegroundColor Yellow
    Write-Host "   1. Verificar que el backend está corriendo"
    Write-Host "   2. Verificar la conexión a la base de datos"
    Write-Host "   3. Revisar logs del backend para más detalles"
    Write-Host "   4. Consultar docs/DIAGNOSTICO_ERROR_AUTH_LOCAL.md"
    exit 1
}
