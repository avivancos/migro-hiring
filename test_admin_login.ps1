# Test script PowerShell para verificar el login de admin con la API real
# Ejecutar con: pwsh test_admin_login.ps1

$API_BASE_URL = "https://api.migro.es/api"
$TEST_EMAIL = "agusvc@gmail.com"
$TEST_PASSWORD = "pomelo2005"

Write-Host "🧪 Test de Login Admin - Migro API" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "📡 API Base URL: $API_BASE_URL" -ForegroundColor Yellow
Write-Host "📧 Email: $TEST_EMAIL" -ForegroundColor Yellow
Write-Host "🔐 Password: $('*' * $TEST_PASSWORD.Length)" -ForegroundColor Yellow
Write-Host ""

try {
    Write-Host "⏳ Enviando solicitud de login..." -ForegroundColor Blue
    Write-Host ""
    
    $startTime = Get-Date
    $body = @{
        email = $TEST_EMAIL
        password = $TEST_PASSWORD
    } | ConvertTo-Json
    
    $headers = @{
        "Content-Type" = "application/json"
        "Accept" = "application/json"
    }
    
    $response = Invoke-RestMethod -Uri "$API_BASE_URL/auth/login" `
        -Method Post `
        -Body $body `
        -Headers $headers `
        -TimeoutSec 30
    
    $endTime = Get-Date
    $duration = ($endTime - $startTime).TotalMilliseconds
    
    Write-Host "✅ Login exitoso!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📊 Respuesta del servidor:" -ForegroundColor Cyan
    Write-Host "   Tiempo de respuesta: $([math]::Round($duration, 2))ms" -ForegroundColor White
    Write-Host ""
    
    Write-Host "🔑 Tokens recibidos:" -ForegroundColor Cyan
    if ($response.access_token) {
        $tokenPreview = $response.access_token.Substring(0, [Math]::Min(50, $response.access_token.Length))
        Write-Host "   Access Token: $tokenPreview..." -ForegroundColor White
    }
    if ($response.refresh_token) {
        $refreshPreview = $response.refresh_token.Substring(0, [Math]::Min(50, $response.refresh_token.Length))
        Write-Host "   Refresh Token: $refreshPreview..." -ForegroundColor White
    }
    Write-Host "   Token Type: $($response.token_type)" -ForegroundColor White
    Write-Host ""
    
    if ($response.user) {
        Write-Host "👤 Información del usuario:" -ForegroundColor Cyan
        Write-Host "   ID: $($response.user.id)" -ForegroundColor White
        Write-Host "   Email: $($response.user.email)" -ForegroundColor White
        Write-Host "   Nombre: $($response.user.name)" -ForegroundColor White
        $isAdmin = if ($response.user.is_admin) { "✅ Sí" } else { "❌ No" }
        Write-Host "   Es Admin: $isAdmin" -ForegroundColor White
        Write-Host "   Rol: $($response.user.role)" -ForegroundColor White
        Write-Host ""
        
        # Verificar permisos de admin
        if ($response.user.is_admin -or $response.user.role -eq "admin" -or $response.user.role -eq "superuser") {
            Write-Host "✅ Usuario tiene permisos de administrador" -ForegroundColor Green
            Write-Host ""
        } else {
            Write-Host "⚠️  Usuario NO tiene permisos de administrador" -ForegroundColor Yellow
            Write-Host ""
        }
    }
    
    # Test adicional: Verificar que el token funciona
    Write-Host "🔍 Verificando token con endpoint /users/me..." -ForegroundColor Blue
    Write-Host ""
    try {
        $meHeaders = @{
            "Authorization" = "Bearer $($response.access_token)"
            "Accept" = "application/json"
        }
        
        $meResponse = Invoke-RestMethod -Uri "$API_BASE_URL/users/me" `
            -Method Get `
            -Headers $meHeaders `
            -TimeoutSec 30
        
        Write-Host "✅ Token verificado correctamente" -ForegroundColor Green
        Write-Host "   Usuario actual: $($meResponse.email)" -ForegroundColor White
        Write-Host ""
    } catch {
        Write-Host "❌ Error al verificar token:" -ForegroundColor Red
        if ($_.Exception.Response) {
            $statusCode = $_.Exception.Response.StatusCode.value__
            Write-Host "   Status: $statusCode" -ForegroundColor Red
        }
        Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
        Write-Host ""
    }
    
    Write-Host "✅ Test completado exitosamente" -ForegroundColor Green
    Write-Host ""
    exit 0
    
} catch {
    Write-Host "❌ Error en el login" -ForegroundColor Red
    Write-Host ""
    
    if ($_.Exception.Response) {
        $statusCode = $_.Exception.Response.StatusCode.value__
        Write-Host "📊 Respuesta del servidor:" -ForegroundColor Cyan
        Write-Host "   Status: $statusCode" -ForegroundColor Red
        
        try {
            $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
            $responseBody = $reader.ReadToEnd()
            $errorData = $responseBody | ConvertFrom-Json
            Write-Host "   Data: $($errorData | ConvertTo-Json -Depth 3)" -ForegroundColor Red
        } catch {
            Write-Host "   No se pudo leer el cuerpo de la respuesta" -ForegroundColor Red
        }
        Write-Host ""
        
        if ($statusCode -eq 401) {
            Write-Host "❌ Credenciales incorrectas" -ForegroundColor Red
            Write-Host "   Verifica que el email y contraseña sean correctos" -ForegroundColor Yellow
            Write-Host ""
        } elseif ($statusCode -eq 403) {
            Write-Host "❌ Acceso denegado" -ForegroundColor Red
            Write-Host "   El usuario no tiene permisos de administrador" -ForegroundColor Yellow
            Write-Host ""
        } elseif ($statusCode -eq 404) {
            Write-Host "❌ Endpoint no encontrado" -ForegroundColor Red
            Write-Host "   Verifica que la URL del endpoint sea correcta" -ForegroundColor Yellow
            Write-Host ""
        } elseif ($statusCode -ge 500) {
            Write-Host "❌ Error del servidor" -ForegroundColor Red
            Write-Host "   El servidor está experimentando problemas" -ForegroundColor Yellow
            Write-Host ""
        }
    } else {
        Write-Host "❌ Error de conexión:" -ForegroundColor Red
        Write-Host "   $($_.Exception.Message)" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "   Verifica tu conexión a internet y que la API esté disponible" -ForegroundColor Yellow
        Write-Host ""
    }
    
    Write-Host "❌ Test fallido" -ForegroundColor Red
    Write-Host ""
    exit 1
}

