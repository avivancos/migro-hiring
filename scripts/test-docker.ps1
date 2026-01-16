# Script de verificación completa de Docker
# Ejecuta tests de endpoints, verifica logs y genera reporte

param(
    [string]$ContainerName = "migro-hiring-prod",
    [int]$Port = 80
)

$ErrorActionPreference = "Continue"
$logFile = "docker-verification-$(Get-Date -Format 'yyyyMMdd-HHmmss').log"

function Write-Log {
    param([string]$Message, [string]$Level = "INFO")
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logMessage = "[$timestamp] [$Level] $Message"
    Write-Host $logMessage
    Add-Content -Path $logFile -Value $logMessage
}

Write-Log "=== Inicio de verificación Docker ===" "INFO"
Write-Log "Contenedor: $ContainerName" "INFO"
Write-Log "Puerto: $Port" "INFO"

# 1. Verificar que el contenedor está corriendo
Write-Log "Verificando estado del contenedor..." "INFO"
$containerStatus = docker ps --filter "name=$ContainerName" --format "{{.Status}}" 2>&1
if ($containerStatus -match "Up") {
    Write-Log "✅ Contenedor está corriendo: $containerStatus" "SUCCESS"
} else {
    Write-Log "❌ Contenedor NO está corriendo: $containerStatus" "ERROR"
    exit 1
}

# 2. Verificar puertos
Write-Log "Verificando mapeo de puertos..." "INFO"
$ports = docker ps --filter "name=$ContainerName" --format "{{.Ports}}" 2>&1
Write-Log "Puertos mapeados: $ports" "INFO"

# 3. Verificar endpoints HTTP
Write-Log "Probando endpoints HTTP..." "INFO"
$endpoints = @(
    @{Path="/healthz"; Expected=200},
    @{Path="/"; Expected=200},
    @{Path="/crm"; Expected=200}
)

$allPassed = $true
foreach ($endpoint in $endpoints) {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:$Port$($endpoint.Path)" -UseBasicParsing -TimeoutSec 10 -ErrorAction Stop
        if ($response.StatusCode -eq $endpoint.Expected) {
            Write-Log "✅ $($endpoint.Path) : $($response.StatusCode)" "SUCCESS"
        } else {
            Write-Log "⚠️ $($endpoint.Path) : $($response.StatusCode) (esperado: $($endpoint.Expected))" "WARNING"
            $allPassed = $false
        }
    } catch {
        Write-Log "❌ $($endpoint.Path) : Error - $($_.Exception.Message)" "ERROR"
        $allPassed = $false
    }
}

# 4. Verificar logs de nginx
Write-Log "Verificando logs de nginx..." "INFO"
$nginxLogs = docker logs $ContainerName --tail 20 2>&1
if ($nginxLogs -match "nginx") {
    Write-Log "✅ Logs de nginx encontrados" "SUCCESS"
    Add-Content -Path $logFile -Value "`n=== Últimos 20 logs ==="
    Add-Content -Path $logFile -Value $nginxLogs
} else {
    Write-Log "⚠️ No se encontraron logs de nginx" "WARNING"
}

# 5. Verificar configuración nginx
Write-Log "Verificando configuración nginx..." "INFO"
$nginxTest = docker exec $ContainerName nginx -t 2>&1
if ($nginxTest -match "successful") {
    Write-Log "✅ Configuración nginx válida" "SUCCESS"
} else {
    Write-Log "❌ Error en configuración nginx: $nginxTest" "ERROR"
    $allPassed = $false
}

# 6. Verificar procesos nginx
Write-Log "Verificando procesos nginx..." "INFO"
$processes = docker exec $ContainerName sh -c "ps aux | grep nginx | grep -v grep" 2>&1
if ($processes) {
    Write-Log "✅ Procesos nginx encontrados" "SUCCESS"
    Add-Content -Path $logFile -Value "`n=== Procesos nginx ==="
    Add-Content -Path $logFile -Value $processes
} else {
    Write-Log "❌ No se encontraron procesos nginx" "ERROR"
    $allPassed = $false
}

# 7. Verificar archivos estáticos
Write-Log "Verificando archivos estáticos..." "INFO"
$indexExists = docker exec $ContainerName sh -c "test -f /usr/share/nginx/html/index.html && echo 'exists' || echo 'missing'" 2>&1
if ($indexExists -match "exists") {
    Write-Log "✅ index.html existe" "SUCCESS"
} else {
    Write-Log "❌ index.html NO existe" "ERROR"
    $allPassed = $false
}

# Resumen
Write-Log "`n=== Resumen ===" "INFO"
if ($allPassed) {
    Write-Log "✅ Todas las verificaciones pasaron" "SUCCESS"
    Write-Log "Log guardado en: $logFile" "INFO"
    exit 0
} else {
    Write-Log "❌ Algunas verificaciones fallaron" "ERROR"
    Write-Log "Log guardado en: $logFile" "INFO"
    exit 1
}
