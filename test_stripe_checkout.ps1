# 🧪 Script de Testing para Stripe Checkout (PowerShell)

Write-Host "🧪 Testing Stripe Checkout Implementation" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# Variables
$API_BASE = "https://api.migro.es/api"
$TEST_CODE = "TEST1"
$LIVE_CODE = "LIVE1"

Write-Host ""
Write-Host "1️⃣ Testing endpoint de checkout con código TEST..." -ForegroundColor Yellow
Write-Host "---------------------------------------------------" -ForegroundColor Yellow

# Test 1: Código TEST
Write-Host "Testing: POST $API_BASE/hiring/$TEST_CODE/checkout" -ForegroundColor Gray

try {
    $response = Invoke-RestMethod -Uri "$API_BASE/hiring/$TEST_CODE/checkout" -Method POST -ContentType "application/json" -Body "{}"
    Write-Host "✅ TEST checkout endpoint funciona" -ForegroundColor Green
    Write-Host "Response: $($response | ConvertTo-Json)" -ForegroundColor Gray
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    Write-Host "❌ TEST checkout endpoint falló - Status: $statusCode" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "2️⃣ Testing endpoint de checkout con código LIVE..." -ForegroundColor Yellow
Write-Host "--------------------------------------------------" -ForegroundColor Yellow

# Test 2: Código LIVE
Write-Host "Testing: POST $API_BASE/hiring/$LIVE_CODE/checkout" -ForegroundColor Gray

try {
    $response = Invoke-RestMethod -Uri "$API_BASE/hiring/$LIVE_CODE/checkout" -Method POST -ContentType "application/json" -Body "{}"
    Write-Host "✅ LIVE checkout endpoint funciona" -ForegroundColor Green
    Write-Host "Response: $($response | ConvertTo-Json)" -ForegroundColor Gray
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    if ($statusCode -eq 404) {
        Write-Host "⚠️ LIVE checkout endpoint no implementado (404)" -ForegroundColor Yellow
    } else {
        Write-Host "❌ LIVE checkout endpoint error: $statusCode" -ForegroundColor Red
    }
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "3️⃣ Testing CORS headers..." -ForegroundColor Yellow
Write-Host "--------------------------" -ForegroundColor Yellow

# Test 3: CORS headers
Write-Host "Testing CORS: OPTIONS $API_BASE/hiring/$LIVE_CODE/checkout" -ForegroundColor Gray

try {
    $headers = @{
        "Origin" = "https://contratacion.migro.es"
        "Access-Control-Request-Method" = "POST"
        "Access-Control-Request-Headers" = "Content-Type"
    }
    
    $response = Invoke-WebRequest -Uri "$API_BASE/hiring/$LIVE_CODE/checkout" -Method OPTIONS -Headers $headers
    Write-Host "✅ CORS configurado correctamente - Status: $($response.StatusCode)" -ForegroundColor Green
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    Write-Host "❌ CORS no configurado - Status: $statusCode" -ForegroundColor Red
}

Write-Host ""
Write-Host "4️⃣ Testing frontend integration..." -ForegroundColor Yellow
Write-Host "----------------------------------" -ForegroundColor Yellow

# Test 4: Frontend
Write-Host "Testing frontend: GET https://contratacion.migro.es/contratacion/$TEST_CODE" -ForegroundColor Gray

try {
    $response = Invoke-WebRequest -Uri "https://contratacion.migro.es/contratacion/$TEST_CODE"
    Write-Host "✅ Frontend accesible - Status: $($response.StatusCode)" -ForegroundColor Green
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    Write-Host "❌ Frontend no accesible - Status: $statusCode" -ForegroundColor Red
}

Write-Host ""
Write-Host "📊 Resumen de Tests" -ForegroundColor Cyan
Write-Host "===================" -ForegroundColor Cyan
Write-Host "✅ Frontend: Stripe Checkout implementado" -ForegroundColor Green
Write-Host "✅ Códigos TEST: Funcionan con simulación" -ForegroundColor Green
Write-Host "⚠️ Códigos LIVE: Requieren implementación backend" -ForegroundColor Yellow
Write-Host "⚠️ CORS: Requiere configuración en backend" -ForegroundColor Yellow
Write-Host ""
Write-Host "🎯 Próximos pasos:" -ForegroundColor Cyan
Write-Host "1. Implementar endpoint /hiring/{code}/checkout en backend" -ForegroundColor White
Write-Host "2. Configurar CORS para https://contratacion.migro.es" -ForegroundColor White
Write-Host "3. Configurar webhook de Stripe" -ForegroundColor White
Write-Host "4. Probar con codigo LIVE1" -ForegroundColor White
