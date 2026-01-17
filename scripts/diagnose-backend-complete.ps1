# Script de diagnóstico COMPLETO del backend para CI/CD (PowerShell)
# Verifica TODOS los endpoints (~135+) usados en el frontend
# Genera reportes detallados con sugerencias específicas

param(
    [string]$ApiBaseUrl = $env:VITE_API_BASE_URL,
    [string]$Mode = "all"  # 'quick', 'complete', 'all', 'crm', 'admin', etc.
)

if (-not $ApiBaseUrl) {
    $ApiBaseUrl = "http://localhost:3000/api"
}

$BackendUrl = $ApiBaseUrl -replace '/api$', ''

$ErrorCount = 0
$WarningCount = 0
$TotalChecked = 0
$Passed = 0
$Failed = 0

$ReportFile = "backend-error-report-complete-$(Get-Date -Format 'yyyyMMdd-HHmmss').json"
$ReportData = @{
    timestamp = (Get-Date -Format "yyyy-MM-ddTHH:mm:ssZ")
    api_base_url = $ApiBaseUrl
    mode = $Mode
    summary = @{
        total_checked = 0
        total_errors = 0
        total_warnings = 0
        passed = 0
        failed = 0
    }
    endpoints = @{}
    suggestions = @()
} | ConvertTo-Json -Depth 10

Write-Host "🔍 Iniciando diagnóstico COMPLETO del backend..." -ForegroundColor Cyan
Write-Host "📡 API Base URL: $ApiBaseUrl"
Write-Host "📡 Backend URL: $BackendUrl"
Write-Host "🔧 Modo: $Mode"
Write-Host ""

function Test-Endpoint {
    param(
        [string]$Method,
        [string]$Url,
        [string]$ExpectedStatus,
        [string]$Description,
        [string]$Body = "",
        [int]$TimeoutSeconds = 10
    )
    
    $script:TotalChecked++
    
    Write-Host "  🔍 $Method $Url... " -NoNewline
    
    try {
        $headers = @{
            "Content-Type" = "application/json"
        }
        
        $params = @{
            Uri = $Url
            Method = $Method
            Headers = $headers
            TimeoutSec = $TimeoutSeconds
            UseBasicParsing = $true
            ErrorAction = "Stop"
        }
        
        if ($Body) {
            $params.Body = $Body
        }
        
        $response = Invoke-WebRequest @params
        $statusCode = $response.StatusCode
        
        # Verificar múltiples códigos esperados (separados por |)
        $expectedCodes = $ExpectedStatus -split '\|'
        $matched = $expectedCodes -contains $statusCode.ToString()
        
        if ($matched) {
            Write-Host "✅ OK ($statusCode)" -ForegroundColor Green
            $script:Passed++
            return $true
        } else {
            Write-Host "⚠️  $statusCode (esperado: $ExpectedStatus)" -ForegroundColor Yellow
            $script:WarningCount++
            return $false
        }
    } catch {
        $statusCode = $_.Exception.Response.StatusCode.value__
        
        if (-not $statusCode) {
            Write-Host "❌ TIMEOUT/CONNECTION ERROR" -ForegroundColor Red
            $script:Failed++
            $script:ErrorCount++
            return $false
        }
        
        # Verificar múltiples códigos esperados
        $expectedCodes = $ExpectedStatus -split '\|'
        $matched = $expectedCodes -contains $statusCode.ToString()
        
        if ($matched) {
            Write-Host "✅ OK ($statusCode)" -ForegroundColor Green
            $script:Passed++
            return $true
        } elseif ($statusCode -eq 500) {
            Write-Host "❌ ERROR 500" -ForegroundColor Red
            $script:Failed++
            $script:ErrorCount++
            return $false
        } else {
            Write-Host "⚠️  $statusCode (esperado: $ExpectedStatus)" -ForegroundColor Yellow
            $script:WarningCount++
            return $false
        }
    }
}

function Test-EndpointGet {
    param(
        [string]$Url,
        [string]$Description
    )
    
    if ($Url -match '/health') {
        Test-Endpoint -Method "GET" -Url $Url -ExpectedStatus "200" -Description $Description
    } else {
        Test-Endpoint -Method "GET" -Url $Url -ExpectedStatus "401|403|404|422" -Description $Description
    }
}

function Test-EndpointPost {
    param(
        [string]$Url,
        [string]$Body,
        [string]$Description
    )
    
    if ($Url -match '/auth/') {
        Test-Endpoint -Method "POST" -Url $Url -ExpectedStatus "400|401|422" -Description $Description -Body $Body
    } else {
        Test-Endpoint -Method "POST" -Url $Url -ExpectedStatus "401|403|404|422" -Description $Description -Body $Body
    }
}

function Test-EndpointPut {
    param(
        [string]$Method,
        [string]$Url,
        [string]$Body,
        [string]$Description
    )
    
    Test-Endpoint -Method $Method -Url $Url -ExpectedStatus "401|403|404|422" -Description $Description -Body $Body
}

function Test-EndpointDelete {
    param(
        [string]$Url,
        [string]$Description
    )
    
    Test-Endpoint -Method "DELETE" -Url $Url -ExpectedStatus "401|403|404" -Description $Description
}

function Write-Category {
    param([string]$CategoryName)
    
    Write-Host ""
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
    Write-Host $CategoryName -ForegroundColor Cyan
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
}

# ============================================================================
# 1. HEALTH CHECK Y AUTH BÁSICOS
# ============================================================================

Write-Category "1️⃣  HEALTH CHECK Y AUTENTICACIÓN BÁSICA"

Test-Endpoint -Method "GET" -Url "$BackendUrl/api/health" -ExpectedStatus "200" -Description "Health Check"
Test-EndpointPost -Url "$BackendUrl/api/auth/login" -Body '{"email":"test@example.com","password":"test"}' -Description "Login endpoint"
Test-EndpointPost -Url "$BackendUrl/api/auth/refresh" -Body '{"refresh_token":"invalid"}' -Description "Refresh token endpoint"
Test-EndpointPost -Url "$BackendUrl/api/auth/register" -Body '{"email":"test@example.com","password":"test123"}' -Description "Register endpoint"
Test-EndpointPost -Url "$BackendUrl/api/auth/logout" -Body '{"refresh_token":"invalid"}' -Description "Logout endpoint"

# ============================================================================
# 2. CRM - LEADS
# ============================================================================

if ($Mode -eq "all" -or $Mode -eq "complete" -or $Mode -eq "crm") {
    Write-Category "2️⃣  CRM - LEADS (9 endpoints)"
    
    Test-EndpointGet -Url "$BackendUrl/api/crm/leads" -Description "Listar leads"
    Test-EndpointGet -Url "$BackendUrl/api/crm/leads/count" -Description "Contar leads"
    Test-EndpointGet -Url "$BackendUrl/api/crm/leads/1" -Description "Obtener lead por ID"
    Test-EndpointGet -Url "$BackendUrl/api/crm/leads/new" -Description "Obtener defaults para nuevo lead"
    Test-EndpointPost -Url "$BackendUrl/api/crm/leads" -Body '{"name":"Test"}' -Description "Crear lead"
    Test-EndpointPut -Method "PUT" -Url "$BackendUrl/api/crm/leads/1" -Body '{"name":"Updated"}' -Description "Actualizar lead"
    Test-EndpointDelete -Url "$BackendUrl/api/crm/leads/1" -Description "Eliminar lead"
    Test-EndpointPost -Url "$BackendUrl/api/crm/leads/1/convert" -Body '{}' -Description "Convertir lead a contacto"
    Test-EndpointPost -Url "$BackendUrl/api/crm/leads/1/mark-initial-contact-completed" -Body '{}' -Description "Marcar como contactado"
}

# ============================================================================
# 3. CRM - CONTACTS
# ============================================================================

if ($Mode -eq "all" -or $Mode -eq "complete" -or $Mode -eq "crm") {
    Write-Category "3️⃣  CRM - CONTACTS (10 endpoints)"
    
    Test-EndpointGet -Url "$BackendUrl/api/crm/contacts" -Description "Listar contactos"
    Test-EndpointGet -Url "$BackendUrl/api/crm/contacts/count" -Description "Contar contactos"
    Test-EndpointGet -Url "$BackendUrl/api/crm/contacts/1" -Description "Obtener contacto por ID"
    Test-EndpointPost -Url "$BackendUrl/api/crm/contacts" -Body '{"name":"Test"}' -Description "Crear contacto"
    Test-EndpointPut -Method "PUT" -Url "$BackendUrl/api/crm/contacts/1" -Body '{"name":"Updated"}' -Description "Actualizar contacto"
    Test-EndpointDelete -Url "$BackendUrl/api/crm/contacts/1" -Description "Eliminar contacto"
    Test-EndpointGet -Url "$BackendUrl/api/crm/contacts/1/leads" -Description "Obtener leads del contacto"
    Test-EndpointGet -Url "$BackendUrl/api/crm/contacts/1/tasks" -Description "Obtener tareas del contacto"
    Test-EndpointGet -Url "$BackendUrl/api/crm/contacts/1/calls" -Description "Obtener llamadas del contacto"
    Test-EndpointGet -Url "$BackendUrl/api/crm/contacts/1/notes" -Description "Obtener notas del contacto"
}

# ============================================================================
# 4. CRM - COMPANIES
# ============================================================================

if ($Mode -eq "all" -or $Mode -eq "complete" -or $Mode -eq "crm") {
    Write-Category "4️⃣  CRM - COMPANIES (5 endpoints)"
    
    Test-EndpointGet -Url "$BackendUrl/api/crm/companies" -Description "Listar empresas"
    Test-EndpointGet -Url "$BackendUrl/api/crm/companies/1" -Description "Obtener empresa por ID"
    Test-EndpointPost -Url "$BackendUrl/api/crm/companies" -Body '{"name":"Test"}' -Description "Crear empresa"
    Test-EndpointPut -Method "PUT" -Url "$BackendUrl/api/crm/companies/1" -Body '{"name":"Updated"}' -Description "Actualizar empresa"
    Test-EndpointDelete -Url "$BackendUrl/api/crm/companies/1" -Description "Eliminar empresa"
}

# ============================================================================
# 5. CRM - TASKS
# ============================================================================

if ($Mode -eq "all" -or $Mode -eq "complete" -or $Mode -eq "crm") {
    Write-Category "5️⃣  CRM - TASKS (6 endpoints)"
    
    Test-EndpointGet -Url "$BackendUrl/api/crm/tasks" -Description "Listar tareas"
    Test-EndpointGet -Url "$BackendUrl/api/crm/tasks/calendar" -Description "Tareas para calendario"
    Test-EndpointPost -Url "$BackendUrl/api/crm/tasks" -Body '{"text":"Test"}' -Description "Crear tarea"
    Test-EndpointPut -Method "PUT" -Url "$BackendUrl/api/crm/tasks/1" -Body '{"text":"Updated"}' -Description "Actualizar tarea"
    Test-EndpointPut -Method "PUT" -Url "$BackendUrl/api/crm/tasks/1/complete" -Body '{"is_completed":true}' -Description "Marcar tarea como completada"
    Test-EndpointDelete -Url "$BackendUrl/api/crm/tasks/1" -Description "Eliminar tarea"
}

# ============================================================================
# 6. CRM - NOTES
# ============================================================================

if ($Mode -eq "all" -or $Mode -eq "complete" -or $Mode -eq "crm") {
    Write-Category "6️⃣  CRM - NOTES (3 endpoints)"
    
    Test-EndpointGet -Url "$BackendUrl/api/crm/notes" -Description "Listar notas"
    Test-EndpointPost -Url "$BackendUrl/api/crm/notes" -Body '{"content":"Test"}' -Description "Crear nota"
    Test-EndpointDelete -Url "$BackendUrl/api/crm/notes/1" -Description "Eliminar nota"
}

# ============================================================================
# 7. CRM - CALLS
# ============================================================================

if ($Mode -eq "all" -or $Mode -eq "complete" -or $Mode -eq "crm") {
    Write-Category "7️⃣  CRM - CALLS (4 endpoints)"
    
    Test-EndpointGet -Url "$BackendUrl/api/crm/calls" -Description "Listar llamadas"
    Test-EndpointGet -Url "$BackendUrl/api/crm/calls/calendar" -Description "Llamadas para calendario"
    Test-EndpointPost -Url "$BackendUrl/api/crm/calls" -Body '{"phone_number":"123"}' -Description "Crear llamada"
    Test-EndpointDelete -Url "$BackendUrl/api/crm/calls/1" -Description "Eliminar llamada"
}

# ============================================================================
# 8. CRM - PIPELINES
# ============================================================================

if ($Mode -eq "all" -or $Mode -eq "complete" -or $Mode -eq "crm") {
    Write-Category "8️⃣  CRM - PIPELINES (3 endpoints)"
    
    Test-EndpointGet -Url "$BackendUrl/api/crm/pipelines" -Description "Listar pipelines"
    Test-EndpointGet -Url "$BackendUrl/api/crm/pipelines/1" -Description "Obtener pipeline por ID"
    Test-EndpointGet -Url "$BackendUrl/api/crm/pipelines/1/stages" -Description "Obtener stages del pipeline"
}

# ============================================================================
# 9. CRM - TASK TEMPLATES
# ============================================================================

if ($Mode -eq "all" -or $Mode -eq "complete" -or $Mode -eq "crm") {
    Write-Category "9️⃣  CRM - TASK TEMPLATES (5 endpoints)"
    
    Test-EndpointGet -Url "$BackendUrl/api/crm/task-templates" -Description "Listar plantillas de tareas"
    Test-EndpointPost -Url "$BackendUrl/api/crm/task-templates" -Body '{"name":"Test"}' -Description "Crear plantilla"
    Test-EndpointPut -Method "PUT" -Url "$BackendUrl/api/crm/task-templates/1" -Body '{"name":"Updated"}' -Description "Actualizar plantilla"
    Test-EndpointDelete -Url "$BackendUrl/api/crm/task-templates/1" -Description "Eliminar plantilla"
    Test-EndpointPut -Method "PUT" -Url "$BackendUrl/api/crm/task-templates/order" -Body '{"template_orders":[]}' -Description "Reordenar plantillas"
}

# ============================================================================
# 10. CRM - CUSTOM FIELDS
# ============================================================================

if ($Mode -eq "all" -or $Mode -eq "complete" -or $Mode -eq "crm") {
    Write-Category "🔟 CRM - CUSTOM FIELDS (5 endpoints)"
    
    Test-EndpointGet -Url "$BackendUrl/api/crm/custom-fields" -Description "Listar campos personalizados"
    Test-EndpointGet -Url "$BackendUrl/api/crm/custom-fields/1" -Description "Obtener campo por ID"
    Test-EndpointPost -Url "$BackendUrl/api/crm/custom-fields" -Body '{"name":"Test"}' -Description "Crear campo personalizado"
    Test-EndpointPut -Method "PUT" -Url "$BackendUrl/api/crm/custom-fields/1" -Body '{"name":"Updated"}' -Description "Actualizar campo"
    Test-EndpointDelete -Url "$BackendUrl/api/crm/custom-fields/1" -Description "Eliminar campo"
    
    Write-Category "🔟1️⃣ CRM - CUSTOM FIELD VALUES (4 endpoints)"
    
    Test-EndpointGet -Url "$BackendUrl/api/crm/custom-field-values" -Description "Listar valores de campos"
    Test-EndpointPost -Url "$BackendUrl/api/crm/custom-field-values" -Body '{"value":"Test"}' -Description "Crear valor"
    Test-EndpointPut -Method "PUT" -Url "$BackendUrl/api/crm/custom-field-values/1" -Body '{"value":"Updated"}' -Description "Actualizar valor"
    Test-EndpointDelete -Url "$BackendUrl/api/crm/custom-field-values/1" -Description "Eliminar valor"
}

# ============================================================================
# 11. CRM - OPPORTUNITIES
# ============================================================================

if ($Mode -eq "all" -or $Mode -eq "complete" -or $Mode -eq "crm") {
    Write-Category "1️⃣1️⃣  CRM - OPPORTUNITIES (6 endpoints)"
    
    Test-EndpointGet -Url "$BackendUrl/api/crm/opportunities" -Description "Listar oportunidades"
    Test-EndpointGet -Url "$BackendUrl/api/crm/opportunities/1" -Description "Obtener oportunidad"
    Test-EndpointPost -Url "$BackendUrl/api/crm/opportunities" -Body '{"name":"Test"}' -Description "Crear oportunidad"
    Test-EndpointPost -Url "$BackendUrl/api/crm/opportunities/1/assign" -Body '{"user_id":1}' -Description "Asignar oportunidad"
    Test-EndpointPost -Url "$BackendUrl/api/crm/opportunities/assign-random" -Body '{}' -Description "Asignar aleatoria"
    Test-EndpointPost -Url "$BackendUrl/api/crm/opportunities/1/analyze" -Body '{}' -Description "Analizar oportunidad"
}

# ============================================================================
# 12. CRM - DASHBOARD
# ============================================================================

if ($Mode -eq "all" -or $Mode -eq "complete" -or $Mode -eq "crm") {
    Write-Category "1️⃣2️⃣  CRM - DASHBOARD (2 endpoints)"
    
    Test-EndpointGet -Url "$BackendUrl/api/crm/dashboard/pipeline-stats" -Description "Estadísticas de pipeline"
    Test-EndpointGet -Url "$BackendUrl/api/crm/dashboard/stats" -Description "Estadísticas generales"
}

# ============================================================================
# 13. CRM - CALL TYPES
# ============================================================================

if ($Mode -eq "all" -or $Mode -eq "complete" -or $Mode -eq "crm") {
    Write-Category "1️⃣3️⃣  CRM - CALL TYPES (1 endpoint)"
    
    Test-EndpointGet -Url "$BackendUrl/api/crm/call-types" -Description "Listar tipos de llamadas"
}

# ============================================================================
# 14. CRM - WIZARD
# ============================================================================

if ($Mode -eq "all" -or $Mode -eq "complete" -or $Mode -eq "crm") {
    Write-Category "1️⃣4️⃣  CRM - CALL WIZARD (8 endpoints)"
    
    Test-EndpointPost -Url "$BackendUrl/api/crm/calls/1/wizard/start" -Body '{}' -Description "Iniciar wizard"
    Test-EndpointGet -Url "$BackendUrl/api/crm/calls/1/wizard" -Description "Obtener estado del wizard"
    Test-EndpointGet -Url "$BackendUrl/api/crm/calls/1/wizard/next-step" -Description "Siguiente paso del wizard"
    Test-EndpointGet -Url "$BackendUrl/api/crm/calls/1/wizard/guidance" -Description "Obtener guía del wizard"
    Test-EndpointPost -Url "$BackendUrl/api/crm/calls/1/wizard/step" -Body '{"step":"test"}' -Description "Enviar paso"
    Test-EndpointPost -Url "$BackendUrl/api/crm/calls/1/wizard/complete" -Body '{}' -Description "Completar wizard"
    Test-EndpointPost -Url "$BackendUrl/api/crm/calls/1/wizard/pause" -Body '{}' -Description "Pausar wizard"
    Test-EndpointPost -Url "$BackendUrl/api/crm/calls/1/wizard/resume" -Body '{}' -Description "Reanudar wizard"
}

# ============================================================================
# 15. ADMIN - USERS
# ============================================================================

if ($Mode -eq "all" -or $Mode -eq "complete" -or $Mode -eq "admin") {
    Write-Category "1️⃣5️⃣  ADMIN - USERS (13 endpoints)"
    
    Test-EndpointGet -Url "$BackendUrl/api/users/" -Description "Listar usuarios"
    Test-EndpointGet -Url "$BackendUrl/api/users/1" -Description "Obtener usuario por ID"
    Test-EndpointGet -Url "$BackendUrl/api/users/me" -Description "Obtener usuario actual"
    Test-EndpointPost -Url "$BackendUrl/api/users/" -Body '{"email":"test@test.com","password":"test"}' -Description "Crear usuario"
    Test-EndpointPut -Method "PATCH" -Url "$BackendUrl/api/users/1" -Body '{"email":"updated@test.com"}' -Description "Actualizar usuario"
    Test-EndpointDelete -Url "$BackendUrl/api/users/1" -Description "Eliminar usuario"
    Test-EndpointPut -Method "PATCH" -Url "$BackendUrl/api/users/1/role" -Body '{"role":"admin"}' -Description "Actualizar rol"
    Test-EndpointPut -Method "PATCH" -Url "$BackendUrl/api/users/1/status" -Body '{"is_active":true}' -Description "Actualizar estado"
    Test-EndpointPut -Method "PATCH" -Url "$BackendUrl/api/users/1/password" -Body '{"password":"newpass"}' -Description "Cambiar contraseña"
    Test-EndpointPost -Url "$BackendUrl/api/users/1/reset-password" -Body '{}' -Description "Resetear contraseña"
    Test-EndpointPost -Url "$BackendUrl/api/users/1/impersonate" -Body '{}' -Description "Impersonar usuario"
    Test-EndpointGet -Url "$BackendUrl/api/users/export" -Description "Exportar usuarios"
    Test-EndpointGet -Url "$BackendUrl/api/users/audit-logs" -Description "Logs de auditoría"
}

# ============================================================================
# 16. ADMIN - HIRING
# ============================================================================

if ($Mode -eq "all" -or $Mode -eq "complete" -or $Mode -eq "admin") {
    Write-Category "1️⃣6️⃣  ADMIN - HIRING (2 endpoints)"
    
    Test-EndpointGet -Url "$BackendUrl/api/admin/hiring/list" -Description "Listar códigos de contratación"
    Test-EndpointPost -Url "$BackendUrl/api/admin/hiring/create" -Body '{"code":"TEST123"}' -Description "Crear código de contratación"
}

# ============================================================================
# 17. ADMIN - CALL TYPES
# ============================================================================

if ($Mode -eq "all" -or $Mode -eq "complete" -or $Mode -eq "admin") {
    Write-Category "1️⃣7️⃣  ADMIN - CALL TYPES (4 endpoints)"
    
    Test-EndpointGet -Url "$BackendUrl/api/admin/call-types" -Description "Listar tipos de llamadas"
    Test-EndpointPost -Url "$BackendUrl/api/admin/call-types" -Body '{"name":"Test"}' -Description "Crear tipo de llamada"
    Test-EndpointPut -Method "PATCH" -Url "$BackendUrl/api/admin/call-types/1" -Body '{"name":"Updated"}' -Description "Actualizar tipo"
    Test-EndpointDelete -Url "$BackendUrl/api/admin/call-types/1" -Description "Eliminar tipo"
}

# ============================================================================
# 18. HIRING (PÚBLICO)
# ============================================================================

if ($Mode -eq "all" -or $Mode -eq "complete" -or $Mode -eq "hiring") {
    Write-Category "1️⃣8️⃣  HIRING (PÚBLICO - 4 endpoints)"
    
    Test-EndpointGet -Url "$BackendUrl/api/hiring/TEST123" -Description "Obtener datos de contratación"
    Test-EndpointPost -Url "$BackendUrl/api/hiring/TEST123/confirm-data" -Body '{"data":"test"}' -Description "Confirmar datos"
    Test-EndpointPost -Url "$BackendUrl/api/hiring/TEST123/contract/accept" -Body '{}' -Description "Aceptar contrato"
    Test-EndpointPost -Url "$BackendUrl/api/hiring/TEST123/kyc/complete" -Body '{}' -Description "Completar KYC"
}

# ============================================================================
# 19. EXPEDIENTES
# ============================================================================

if ($Mode -eq "all" -or $Mode -eq "complete" -or $Mode -eq "expedientes") {
    Write-Category "1️⃣9️⃣  EXPEDIENTES (14 endpoints)"
    
    Test-EndpointGet -Url "$BackendUrl/api/expedientes/" -Description "Listar expedientes"
    Test-EndpointGet -Url "$BackendUrl/api/expedientes/1" -Description "Obtener expediente"
    Test-EndpointGet -Url "$BackendUrl/api/expedientes/user/1" -Description "Obtener expedientes por usuario"
    Test-EndpointPost -Url "$BackendUrl/api/expedientes/" -Body '{"name":"Test"}' -Description "Crear expediente"
    Test-EndpointPut -Method "PUT" -Url "$BackendUrl/api/expedientes/1" -Body '{"name":"Updated"}' -Description "Actualizar expediente"
    Test-EndpointDelete -Url "$BackendUrl/api/expedientes/1" -Description "Eliminar expediente"
    Test-EndpointPost -Url "$BackendUrl/api/expedientes/1/seleccionar-formulario" -Body '{"formulario_id":1}' -Description "Seleccionar formulario"
    Test-EndpointGet -Url "$BackendUrl/api/expedientes/1/completitud" -Description "Obtener completitud"
    Test-EndpointGet -Url "$BackendUrl/api/expedientes/1/checklist" -Description "Obtener checklist"
    Test-EndpointGet -Url "$BackendUrl/api/expedientes/1/historial" -Description "Obtener historial"
    Test-EndpointPost -Url "$BackendUrl/api/expedientes/1/cambiar-estado" -Body '{"estado":"test"}' -Description "Cambiar estado"
    Test-EndpointGet -Url "$BackendUrl/api/expedientes/1/estadisticas" -Description "Obtener estadísticas"
    Test-EndpointGet -Url "$BackendUrl/api/expedientes/buscar" -Description "Buscar expedientes"
    Test-EndpointPost -Url "$BackendUrl/api/expedientes/1/archivos" -Body '{}' -Description "Subir archivo"
    Test-EndpointPut -Method "PATCH" -Url "$BackendUrl/api/expedientes/1/archivos/1" -Body '{"name":"test"}' -Description "Actualizar archivo"
}

# ============================================================================
# 20. PIPELINES
# ============================================================================

if ($Mode -eq "all" -or $Mode -eq "complete" -or $Mode -eq "pipelines") {
    Write-Category "2️⃣0️⃣  PIPELINES (12 endpoints)"
    
    Test-EndpointGet -Url "$BackendUrl/api/pipelines/stages/lead/1" -Description "Obtener stages"
    Test-EndpointPost -Url "$BackendUrl/api/pipelines/stages" -Body '{}' -Description "Crear stage"
    Test-EndpointPut -Method "PATCH" -Url "$BackendUrl/api/pipelines/stages/1/next-action" -Body '{}' -Description "Siguiente acción"
    Test-EndpointGet -Url "$BackendUrl/api/pipelines/stages/lead/1/status" -Description "Obtener estado"
    Test-EndpointPost -Url "$BackendUrl/api/pipelines/actions" -Body '{}' -Description "Crear acción"
    Test-EndpointGet -Url "$BackendUrl/api/pipelines/actions/lead/1" -Description "Obtener acciones"
    Test-EndpointPost -Url "$BackendUrl/api/pipelines/actions/1/validate" -Body '{}' -Description "Validar acción"
    Test-EndpointGet -Url "$BackendUrl/api/pipelines/action-types" -Description "Obtener tipos de acción"
    Test-EndpointPost -Url "$BackendUrl/api/pipelines/calls/1/analyze" -Body '{}' -Description "Analizar llamada"
    Test-EndpointGet -Url "$BackendUrl/api/pipelines/calls/1/next-action" -Description "Siguiente acción de llamada"
    Test-EndpointGet -Url "$BackendUrl/api/pipelines/admin/approve-hiring-code/validate?token=test" -Description "Validar token"
    Test-EndpointPost -Url "$BackendUrl/api/pipelines/admin/approve-hiring-code?token=test" -Body '{}' -Description "Aprobar código"
}

# ============================================================================
# 21. CONVERSATIONS
# ============================================================================

if ($Mode -eq "all" -or $Mode -eq "complete" -or $Mode -eq "conversations") {
    Write-Category "2️⃣1️⃣  CONVERSATIONS (2 endpoints)"
    
    Test-EndpointGet -Url "$BackendUrl/api/conversations/1/messages" -Description "Obtener mensajes"
    Test-EndpointGet -Url "$BackendUrl/api/conversations/1/export" -Description "Exportar conversación"
}

# ============================================================================
# 22. AGENT JOURNAL
# ============================================================================

if ($Mode -eq "all" -or $Mode -eq "complete" -or $Mode -eq "agent-journal") {
    Write-Category "2️⃣2️⃣  AGENT JOURNAL (5 endpoints)"
    
    Test-EndpointGet -Url "$BackendUrl/api/agent-journal/daily-report" -Description "Reporte diario"
    Test-EndpointGet -Url "$BackendUrl/api/agent-journal/performance-dashboard" -Description "Dashboard de performance"
    Test-EndpointGet -Url "$BackendUrl/api/agent-journal/metrics/1" -Description "Métricas de usuario"
    Test-EndpointPost -Url "$BackendUrl/api/agent-journal/sync" -Body '{}' -Description "Sincronizar datos"
    Test-EndpointPost -Url "$BackendUrl/api/agent-journal/sign-and-send" -Body '{}' -Description "Firmar y enviar"
}

# ============================================================================
# RESUMEN FINAL
# ============================================================================

Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host "📊 RESUMEN DEL DIAGNÓSTICO" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host ""
Write-Host "Total de endpoints verificados: $TotalChecked"
Write-Host "✅ Pasaron: $Passed" -ForegroundColor Green
Write-Host "❌ Fallaron: $Failed" -ForegroundColor Red
Write-Host "⚠️  Advertencias: $WarningCount" -ForegroundColor Yellow
Write-Host ""

# Guardar reporte (simplificado para PowerShell)
$ReportSummary = @{
    timestamp = (Get-Date -Format "yyyy-MM-ddTHH:mm:ssZ")
    api_base_url = $ApiBaseUrl
    mode = $Mode
    summary = @{
        total_checked = $TotalChecked
        total_errors = $ErrorCount
        total_warnings = $WarningCount
        passed = $Passed
        failed = $Failed
    }
} | ConvertTo-Json -Depth 10

$ReportSummary | Out-File -FilePath $ReportFile -Encoding UTF8

if ($ErrorCount -gt 0) {
    Write-Host "📝 Reporte de errores generado: $ReportFile" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "🔧 Soluciones sugeridas:" -ForegroundColor Yellow
    Write-Host "   1. Verificar que el backend está corriendo"
    Write-Host "   2. Verificar la conexión a la base de datos"
    Write-Host "   3. Revisar logs del backend para más detalles"
    Write-Host "   4. Consultar docs/DIAGNOSTICO_ERROR_AUTH_LOCAL.md"
    exit 1
} else {
    Write-Host "✅ Diagnóstico completado sin errores críticos" -ForegroundColor Green
    Write-Host "📝 Reporte generado: $ReportFile"
    exit 0
}
