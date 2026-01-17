#!/bin/bash
# Script de diagnóstico COMPLETO del backend para CI/CD
# Verifica TODOS los endpoints (~135+) usados en el frontend
# Genera reportes detallados con sugerencias específicas

set -e

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Variables de entorno
API_BASE_URL="${VITE_API_BASE_URL:-http://localhost:3000/api}"
BACKEND_URL="${API_BASE_URL%/api}"
MODE="${DIAGNOSTIC_MODE:-all}" # 'quick', 'complete', 'all', 'crm', 'admin', etc.
REPORT_FILE="${BACKEND_ERROR_REPORT:-backend-error-report-complete-$(date +%Y%m%d-%H%M%S).json}"
REPORT_DATA=""

echo "🔍 Iniciando diagnóstico COMPLETO del backend..."
echo "📡 API Base URL: $API_BASE_URL"
echo "📡 Backend URL: $BACKEND_URL"
echo "🔧 Modo: $MODE"
echo ""

ERRORS=0
WARNINGS=0
TOTAL_CHECKED=0
PASSED=0
FAILED=0

# Inicializar reporte JSON
init_report() {
    REPORT_DATA=$(cat <<EOF
{
  "timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "api_base_url": "$API_BASE_URL",
  "mode": "$MODE",
  "summary": {
    "total_checked": 0,
    "total_errors": 0,
    "total_warnings": 0,
    "passed": 0,
    "failed": 0
  },
  "endpoints": {},
  "suggestions": []
}
EOF
)
}

# Función para agregar error al reporte
add_error_to_report() {
    local endpoint=$1
    local status_code=$2
    local expected_status=$3
    local description=$4
    local response_body=$5
    
    if command -v jq &> /dev/null; then
        REPORT_DATA=$(echo "$REPORT_DATA" | jq \
            --arg ep "$endpoint" \
            --argjson sc "$status_code" \
            --arg es "$expected_status" \
            --arg desc "$description" \
            --arg body "$response_body" \
            '.endpoints[$ep] = {
              status_code: $sc,
              expected_status: $es,
              description: $desc,
              response_body: $body,
              timestamp: now | strftime("%Y-%m-%dT%H:%M:%SZ")
            } | .summary.total_errors += 1 | .summary.failed += 1 | .summary.total_checked += 1')
        
        add_suggestions_to_report "$status_code" "$endpoint" "$response_body"
    fi
}

# Función para agregar éxito al reporte
add_success_to_report() {
    local endpoint=$1
    
    if command -v jq &> /dev/null; then
        REPORT_DATA=$(echo "$REPORT_DATA" | jq \
            --arg ep "$endpoint" \
            '.summary.passed += 1 | .summary.total_checked += 1')
    fi
}

# Función para agregar sugerencias según el código de error
add_suggestions_to_report() {
    local status_code=$1
    local endpoint=$2
    local response_body=$3
    
    if ! command -v jq &> /dev/null; then
        return
    fi
    
    local suggestion_json=""
    
    case $status_code in
        401)
            suggestion_json=$(cat <<EOF
{
  "code": 401,
  "endpoint": "$endpoint",
  "severity": "high",
  "title": "Error de Autenticación",
  "description": "El endpoint requiere autenticación o las credenciales son inválidas",
  "suggestions": [
    "Verificar que el endpoint requiere autenticación y el token JWT está siendo enviado correctamente",
    "Revisar que el token no haya expirado",
    "Verificar la configuración de JWT_SECRET y ALGORITHM en el backend",
    "Comprobar que el usuario existe y está activo en la base de datos"
  ],
  "backend_checks": [
    "Verificar middleware de autenticación JWT",
    "Revisar logs del backend para detalles del error de autenticación",
    "Comprobar validez del token en jwt.io"
  ]
}
EOF
)
            ;;
        500)
            suggestion_json=$(cat <<EOF
{
  "code": 500,
  "endpoint": "$endpoint",
  "severity": "critical",
  "title": "Error Interno del Servidor",
  "description": "El servidor encontró un error interno al procesar la solicitud",
  "suggestions": [
    "⚠️ CRÍTICO: Revisar logs del backend inmediatamente",
    "Verificar conexión a la base de datos (DATABASE_URL, POSTGRES_* variables)",
    "Comprobar que todas las dependencias y servicios externos están disponibles",
    "Revisar variables de entorno del backend",
    "Verificar que las migraciones de base de datos están aplicadas"
  ],
  "backend_checks": [
    "Revisar logs completos del backend para el traceback del error",
    "Verificar conexión a PostgreSQL: docker-compose exec backend python -c 'from app.database import engine; engine.connect()'",
    "Comprobar variables de entorno: docker-compose exec backend env | grep -E 'DATABASE|POSTGRES|SECRET'",
    "Verificar que las tablas existen: docker-compose exec postgres psql -U postgres -d migro_db -c '\\dt'",
    "Ejecutar migraciones si faltan: docker-compose exec backend alembic upgrade head"
  ],
  "common_causes": [
    "Conexión a base de datos perdida o incorrecta (socket.gaierror, connection refused)",
    "Tabla no existe en la base de datos",
    "Variable de entorno faltante o incorrecta",
    "Error en el código del backend (excepción no manejada)",
    "Servicio externo (API, etc.) no disponible"
  ]
}
EOF
)
            ;;
        403)
            suggestion_json=$(cat <<EOF
{
  "code": 403,
  "endpoint": "$endpoint",
  "severity": "high",
  "title": "Error de Permisos",
  "description": "El usuario autenticado no tiene permisos para acceder a este recurso"
}
EOF
)
            ;;
        404)
            suggestion_json=$(cat <<EOF
{
  "code": 404,
  "endpoint": "$endpoint",
  "severity": "medium",
  "title": "Endpoint No Encontrado",
  "description": "El endpoint no existe o la ruta es incorrecta"
}
EOF
)
            ;;
        422)
            suggestion_json=$(cat <<EOF
{
  "code": 422,
  "endpoint": "$endpoint",
  "severity": "medium",
  "title": "Error de Validación",
  "description": "Los datos enviados no pasaron la validación"
}
EOF
)
            ;;
    esac
    
    if [ -n "$suggestion_json" ]; then
        REPORT_DATA=$(echo "$REPORT_DATA" | jq --argjson sug "$suggestion_json" '.suggestions += [$sug]')
    fi
}

# Función para verificar endpoint (genérica)
check_endpoint() {
    local method=$1
    local endpoint=$2
    local expected_status=$3
    local description=$4
    local body=${5:-""}
    local auth_token=${6:-""}
    local timeout=${7:-10}
    
    TOTAL_CHECKED=$((TOTAL_CHECKED + 1))
    
    echo -n "  🔍 $method $endpoint... "
    
    local headers="Content-Type: application/json"
    if [ -n "$auth_token" ]; then
        headers="$headers\nAuthorization: Bearer $auth_token"
    fi
    
    local curl_cmd="curl -s -X $method --max-time $timeout"
    curl_cmd="$curl_cmd -H \"Content-Type: application/json\""
    
    if [ -n "$auth_token" ]; then
        curl_cmd="$curl_cmd -H \"Authorization: Bearer $auth_token\""
    fi
    
    if [ -n "$body" ]; then
        curl_cmd="$curl_cmd -d '$body'"
    fi
    
    curl_cmd="$curl_cmd -w \"\n%{http_code}\" \"$endpoint\" 2>/dev/null || echo \"\n000\""
    
    local response=$(eval $curl_cmd)
    local http_code=$(echo "$response" | tail -n1)
    local response_body=$(echo "$response" | head -n-1)
    
    # Verificar múltiples códigos esperados (separados por |)
    local expected_codes="$expected_status"
    local matched=false
    
    # Si no hay |, verificar directamente
    if [[ "$expected_codes" != *"|"* ]]; then
        if [ "$http_code" = "$expected_codes" ]; then
            matched=true
        fi
    else
        # Si hay |, verificar cada código
        IFS='|' read -ra codes <<< "$expected_codes"
        for code in "${codes[@]}"; do
            if [ "$http_code" = "$code" ]; then
                matched=true
                break
            fi
        done
    fi
    
    if [ "$matched" = true ]; then
        echo -e "${GREEN}✅ OK (${http_code})${NC}"
        PASSED=$((PASSED + 1))
        add_success_to_report "$endpoint"
        return 0
    elif [ "$http_code" = "000" ]; then
        echo -e "${RED}❌ TIMEOUT/CONNECTION ERROR${NC}"
        FAILED=$((FAILED + 1))
        ERRORS=$((ERRORS + 1))
        add_error_to_report "$endpoint" "000" "$expected_status" "$description" "Connection timeout or error"
        return 1
    elif [ "$http_code" = "500" ]; then
        echo -e "${RED}❌ ERROR 500${NC}"
        FAILED=$((FAILED + 1))
        ERRORS=$((ERRORS + 1))
        add_error_to_report "$endpoint" "$http_code" "$expected_status" "$description" "$response_body"
        return 1
    else
        echo -e "${YELLOW}⚠️  ${http_code} (esperado: ${expected_status})${NC}"
        WARNINGS=$((WARNINGS + 1))
        return 2
    fi
}

# Función para verificar endpoint GET (sin auth - debe devolver 401 si requiere auth)
check_endpoint_get() {
    local endpoint=$1
    local description=$2
    
    # Endpoints públicos que deben devolver 200
    if [[ "$endpoint" == *"/health"* ]] || [[ "$endpoint" == *"/healthz"* ]]; then
        check_endpoint "GET" "$endpoint" "200" "$description"
    else
        # Endpoints protegidos deben devolver 401 sin token (no 500)
        check_endpoint "GET" "$endpoint" "401|403|404|422" "$description"
    fi
}

# Función para verificar endpoint POST
check_endpoint_post() {
    local endpoint=$1
    local body=$2
    local description=$3
    
    # Endpoints de auth pueden devolver 400/401/422
    if [[ "$endpoint" == *"/auth/"* ]]; then
        check_endpoint "POST" "$endpoint" "400|401|422" "$description" "$body"
    else
        # Otros endpoints POST sin auth deben devolver 401 (no 500)
        check_endpoint "POST" "$endpoint" "401|403|404|422" "$description" "$body"
    fi
}

# Función para verificar endpoint PUT/PATCH
check_endpoint_put() {
    local method=$1
    local endpoint=$2
    local body=$3
    local description=$4
    
    check_endpoint "$method" "$endpoint" "401|403|404|422" "$description" "$body"
}

# Función para verificar endpoint DELETE
check_endpoint_delete() {
    local endpoint=$1
    local description=$2
    
    check_endpoint "DELETE" "$endpoint" "401|403|404" "$description" ""
}

# Función para verificar una categoría de endpoints
check_category() {
    local category_name=$1
    
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo -e "${CYAN}$category_name${NC}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
}

# Inicializar reporte
init_report

# ============================================================================
# 1. HEALTH CHECK Y AUTH BÁSICOS
# ============================================================================

check_category "1️⃣  HEALTH CHECK Y AUTENTICACIÓN BÁSICA"

check_endpoint "GET" "${BACKEND_URL}/api/health" "200" "Health Check" ""
check_endpoint_post "${BACKEND_URL}/api/auth/login" '{"email":"test@example.com","password":"test"}' "Login endpoint"
check_endpoint_post "${BACKEND_URL}/api/auth/refresh" '{"refresh_token":"invalid"}' "Refresh token endpoint"
check_endpoint_post "${BACKEND_URL}/api/auth/register" '{"email":"test@example.com","password":"test123"}' "Register endpoint"
check_endpoint_post "${BACKEND_URL}/api/auth/logout" '{"refresh_token":"invalid"}' "Logout endpoint"

# ============================================================================
# 2. CRM - LEADS
# ============================================================================

if [ "$MODE" = "complete" ] || [ "$MODE" = "crm" ] || [ "$MODE" = "all" ]; then
    check_category "2️⃣  CRM - LEADS (9 endpoints)"
    
    check_endpoint_get "${BACKEND_URL}/api/crm/leads" "Listar leads"
    check_endpoint_get "${BACKEND_URL}/api/crm/leads/count" "Contar leads"
    check_endpoint_get "${BACKEND_URL}/api/crm/leads/1" "Obtener lead por ID"
    check_endpoint_get "${BACKEND_URL}/api/crm/leads/new" "Obtener defaults para nuevo lead"
    check_endpoint_post "${BACKEND_URL}/api/crm/leads" '{"name":"Test"}' "Crear lead"
    check_endpoint_put "PUT" "${BACKEND_URL}/api/crm/leads/1" '{"name":"Updated"}' "Actualizar lead"
    check_endpoint_delete "${BACKEND_URL}/api/crm/leads/1" "Eliminar lead"
    check_endpoint_post "${BACKEND_URL}/api/crm/leads/1/convert" '{}' "Convertir lead a contacto"
    check_endpoint_post "${BACKEND_URL}/api/crm/leads/1/mark-initial-contact-completed" '{}' "Marcar como contactado"
fi

# ============================================================================
# 3. CRM - CONTACTS
# ============================================================================

if [ "$MODE" = "complete" ] || [ "$MODE" = "crm" ] || [ "$MODE" = "all" ]; then
    check_category "3️⃣  CRM - CONTACTS (10 endpoints)"
    
    check_endpoint_get "${BACKEND_URL}/api/crm/contacts" "Listar contactos"
    check_endpoint_get "${BACKEND_URL}/api/crm/contacts/count" "Contar contactos"
    check_endpoint_get "${BACKEND_URL}/api/crm/contacts/1" "Obtener contacto por ID"
    check_endpoint_post "${BACKEND_URL}/api/crm/contacts" '{"name":"Test"}' "Crear contacto"
    check_endpoint_put "PUT" "${BACKEND_URL}/api/crm/contacts/1" '{"name":"Updated"}' "Actualizar contacto"
    check_endpoint_delete "${BACKEND_URL}/api/crm/contacts/1" "Eliminar contacto"
    check_endpoint_get "${BACKEND_URL}/api/crm/contacts/1/leads" "Obtener leads del contacto"
    check_endpoint_get "${BACKEND_URL}/api/crm/contacts/1/tasks" "Obtener tareas del contacto"
    check_endpoint_get "${BACKEND_URL}/api/crm/contacts/1/calls" "Obtener llamadas del contacto"
    check_endpoint_get "${BACKEND_URL}/api/crm/contacts/1/notes" "Obtener notas del contacto"
fi

# ============================================================================
# 4. CRM - COMPANIES
# ============================================================================

if [ "$MODE" = "complete" ] || [ "$MODE" = "crm" ] || [ "$MODE" = "all" ]; then
    check_category "4️⃣  CRM - COMPANIES (5 endpoints)"
    
    check_endpoint_get "${BACKEND_URL}/api/crm/companies" "Listar empresas"
    check_endpoint_get "${BACKEND_URL}/api/crm/companies/1" "Obtener empresa por ID"
    check_endpoint_post "${BACKEND_URL}/api/crm/companies" '{"name":"Test"}' "Crear empresa"
    check_endpoint_put "PUT" "${BACKEND_URL}/api/crm/companies/1" '{"name":"Updated"}' "Actualizar empresa"
    check_endpoint_delete "${BACKEND_URL}/api/crm/companies/1" "Eliminar empresa"
fi

# ============================================================================
# 5. CRM - TASKS
# ============================================================================

if [ "$MODE" = "complete" ] || [ "$MODE" = "crm" ] || [ "$MODE" = "all" ]; then
    check_category "5️⃣  CRM - TASKS (6 endpoints)"
    
    check_endpoint_get "${BACKEND_URL}/api/crm/tasks" "Listar tareas"
    check_endpoint_get "${BACKEND_URL}/api/crm/tasks/calendar" "Tareas para calendario"
    check_endpoint_post "${BACKEND_URL}/api/crm/tasks" '{"text":"Test"}' "Crear tarea"
    check_endpoint_put "PUT" "${BACKEND_URL}/api/crm/tasks/1" '{"text":"Updated"}' "Actualizar tarea"
    check_endpoint_put "PUT" "${BACKEND_URL}/api/crm/tasks/1/complete" '{"is_completed":true}' "Marcar tarea como completada"
    check_endpoint_delete "${BACKEND_URL}/api/crm/tasks/1" "Eliminar tarea"
fi

# ============================================================================
# 6. CRM - NOTES
# ============================================================================

if [ "$MODE" = "complete" ] || [ "$MODE" = "crm" ] || [ "$MODE" = "all" ]; then
    check_category "6️⃣  CRM - NOTES (3 endpoints)"
    
    check_endpoint_get "${BACKEND_URL}/api/crm/notes" "Listar notas"
    check_endpoint_post "${BACKEND_URL}/api/crm/notes" '{"content":"Test"}' "Crear nota"
    check_endpoint_delete "${BACKEND_URL}/api/crm/notes/1" "Eliminar nota"
fi

# ============================================================================
# 7. CRM - CALLS
# ============================================================================

if [ "$MODE" = "complete" ] || [ "$MODE" = "crm" ] || [ "$MODE" = "all" ]; then
    check_category "7️⃣  CRM - CALLS (4 endpoints)"
    
    check_endpoint_get "${BACKEND_URL}/api/crm/calls" "Listar llamadas"
    check_endpoint_get "${BACKEND_URL}/api/crm/calls/calendar" "Llamadas para calendario"
    check_endpoint_post "${BACKEND_URL}/api/crm/calls" '{"phone_number":"123"}' "Crear llamada"
    check_endpoint_delete "${BACKEND_URL}/api/crm/calls/1" "Eliminar llamada"
fi

# ============================================================================
# 8. CRM - PIPELINES
# ============================================================================

if [ "$MODE" = "complete" ] || [ "$MODE" = "crm" ] || [ "$MODE" = "all" ]; then
    check_category "8️⃣  CRM - PIPELINES (3 endpoints)"
    
    check_endpoint_get "${BACKEND_URL}/api/crm/pipelines" "Listar pipelines"
    check_endpoint_get "${BACKEND_URL}/api/crm/pipelines/1" "Obtener pipeline por ID"
    check_endpoint_get "${BACKEND_URL}/api/crm/pipelines/1/stages" "Obtener stages del pipeline"
fi

# ============================================================================
# 9. CRM - TASK TEMPLATES
# ============================================================================

if [ "$MODE" = "complete" ] || [ "$MODE" = "crm" ] || [ "$MODE" = "all" ]; then
    check_category "9️⃣  CRM - TASK TEMPLATES (5 endpoints)"
    
    check_endpoint_get "${BACKEND_URL}/api/crm/task-templates" "Listar plantillas de tareas"
    check_endpoint_post "${BACKEND_URL}/api/crm/task-templates" '{"name":"Test"}' "Crear plantilla"
    check_endpoint_put "PUT" "${BACKEND_URL}/api/crm/task-templates/1" '{"name":"Updated"}' "Actualizar plantilla"
    check_endpoint_delete "${BACKEND_URL}/api/crm/task-templates/1" "Eliminar plantilla"
    check_endpoint_put "PUT" "${BACKEND_URL}/api/crm/task-templates/order" '{"template_orders":[]}' "Reordenar plantillas"
fi

# ============================================================================
# 10. CRM - CUSTOM FIELDS
# ============================================================================

if [ "$MODE" = "complete" ] || [ "$MODE" = "crm" ] || [ "$MODE" = "all" ]; then
    check_category "🔟 CRM - CUSTOM FIELDS (5 endpoints)"
    
    check_endpoint_get "${BACKEND_URL}/api/crm/custom-fields" "Listar campos personalizados"
    check_endpoint_get "${BACKEND_URL}/api/crm/custom-fields/1" "Obtener campo por ID"
    check_endpoint_post "${BACKEND_URL}/api/crm/custom-fields" '{"name":"Test"}' "Crear campo personalizado"
    check_endpoint_put "PUT" "${BACKEND_URL}/api/crm/custom-fields/1" '{"name":"Updated"}' "Actualizar campo"
    check_endpoint_delete "${BACKEND_URL}/api/crm/custom-fields/1" "Eliminar campo"
    
    check_category "🔟1️⃣ CRM - CUSTOM FIELD VALUES (4 endpoints)"
    
    check_endpoint_get "${BACKEND_URL}/api/crm/custom-field-values" "Listar valores de campos"
    check_endpoint_post "${BACKEND_URL}/api/crm/custom-field-values" '{"value":"Test"}' "Crear valor"
    check_endpoint_put "PUT" "${BACKEND_URL}/api/crm/custom-field-values/1" '{"value":"Updated"}' "Actualizar valor"
    check_endpoint_delete "${BACKEND_URL}/api/crm/custom-field-values/1" "Eliminar valor"
fi

# ============================================================================
# 11. CRM - OPPORTUNITIES
# ============================================================================

if [ "$MODE" = "complete" ] || [ "$MODE" = "crm" ] || [ "$MODE" = "all" ]; then
    check_category "1️⃣1️⃣  CRM - OPPORTUNITIES (6 endpoints)"
    
    check_endpoint_get "${BACKEND_URL}/api/crm/opportunities" "Listar oportunidades"
    check_endpoint_get "${BACKEND_URL}/api/crm/opportunities/1" "Obtener oportunidad"
    check_endpoint_post "${BACKEND_URL}/api/crm/opportunities" '{"name":"Test"}' "Crear oportunidad"
    check_endpoint_post "${BACKEND_URL}/api/crm/opportunities/1/assign" '{"user_id":1}' "Asignar oportunidad"
    check_endpoint_post "${BACKEND_URL}/api/crm/opportunities/assign-random" '{}' "Asignar aleatoria"
    check_endpoint_post "${BACKEND_URL}/api/crm/opportunities/1/analyze" '{}' "Analizar oportunidad"
fi

# ============================================================================
# 12. CRM - DASHBOARD
# ============================================================================

if [ "$MODE" = "complete" ] || [ "$MODE" = "crm" ] || [ "$MODE" = "all" ]; then
    check_category "1️⃣2️⃣  CRM - DASHBOARD (2 endpoints)"
    
    check_endpoint_get "${BACKEND_URL}/api/crm/dashboard/pipeline-stats" "Estadísticas de pipeline"
    check_endpoint_get "${BACKEND_URL}/api/crm/dashboard/stats" "Estadísticas generales"
fi

# ============================================================================
# 13. CRM - CALL TYPES
# ============================================================================

if [ "$MODE" = "complete" ] || [ "$MODE" = "crm" ]; then
    check_category "1️⃣3️⃣  CRM - CALL TYPES"
    
    check_endpoint_get "${BACKEND_URL}/api/crm/call-types" "Listar tipos de llamadas"
fi

# ============================================================================
# 14. CRM - WIZARD
# ============================================================================

if [ "$MODE" = "complete" ] || [ "$MODE" = "crm" ] || [ "$MODE" = "all" ]; then
    check_category "1️⃣4️⃣  CRM - CALL WIZARD (8 endpoints)"
    
    check_endpoint_post "${BACKEND_URL}/api/crm/calls/1/wizard/start" '{}' "Iniciar wizard"
    check_endpoint_get "${BACKEND_URL}/api/crm/calls/1/wizard" "Obtener estado del wizard"
    check_endpoint_get "${BACKEND_URL}/api/crm/calls/1/wizard/next-step" "Siguiente paso del wizard"
    check_endpoint_get "${BACKEND_URL}/api/crm/calls/1/wizard/guidance" "Obtener guía del wizard"
    check_endpoint_post "${BACKEND_URL}/api/crm/calls/1/wizard/step" '{"step":"test"}' "Enviar paso"
    check_endpoint_post "${BACKEND_URL}/api/crm/calls/1/wizard/complete" '{}' "Completar wizard"
    check_endpoint_post "${BACKEND_URL}/api/crm/calls/1/wizard/pause" '{}' "Pausar wizard"
    check_endpoint_post "${BACKEND_URL}/api/crm/calls/1/wizard/resume" '{}' "Reanudar wizard"
fi

# ============================================================================
# 15. ADMIN - USERS
# ============================================================================

if [ "$MODE" = "complete" ] || [ "$MODE" = "admin" ] || [ "$MODE" = "all" ]; then
    check_category "1️⃣5️⃣  ADMIN - USERS (13 endpoints)"
    
    check_endpoint_get "${BACKEND_URL}/api/users/" "Listar usuarios"
    check_endpoint_get "${BACKEND_URL}/api/users/1" "Obtener usuario por ID"
    check_endpoint_get "${BACKEND_URL}/api/users/me" "Obtener usuario actual"
    check_endpoint_post "${BACKEND_URL}/api/users/" '{"email":"test@test.com","password":"test"}' "Crear usuario"
    check_endpoint_put "PATCH" "${BACKEND_URL}/api/users/1" '{"email":"updated@test.com"}' "Actualizar usuario"
    check_endpoint_delete "${BACKEND_URL}/api/users/1" "Eliminar usuario"
    check_endpoint_put "PATCH" "${BACKEND_URL}/api/users/1/role" '{"role":"admin"}' "Actualizar rol"
    check_endpoint_put "PATCH" "${BACKEND_URL}/api/users/1/status" '{"is_active":true}' "Actualizar estado"
    check_endpoint_put "PATCH" "${BACKEND_URL}/api/users/1/password" '{"password":"newpass"}' "Cambiar contraseña"
    check_endpoint_post "${BACKEND_URL}/api/users/1/reset-password" '{}' "Resetear contraseña"
    check_endpoint_post "${BACKEND_URL}/api/users/1/impersonate" '{}' "Impersonar usuario"
    check_endpoint_get "${BACKEND_URL}/api/users/export" "Exportar usuarios"
    check_endpoint_get "${BACKEND_URL}/api/users/audit-logs" "Logs de auditoría"
fi

# ============================================================================
# 16. ADMIN - HIRING
# ============================================================================

if [ "$MODE" = "complete" ] || [ "$MODE" = "admin" ] || [ "$MODE" = "all" ]; then
    check_category "1️⃣6️⃣  ADMIN - HIRING (2 endpoints)"
    
    check_endpoint_get "${BACKEND_URL}/api/admin/hiring/list" "Listar códigos de contratación"
    check_endpoint_post "${BACKEND_URL}/api/admin/hiring/create" '{"code":"TEST123"}' "Crear código de contratación"
fi

# ============================================================================
# 17. ADMIN - CALL TYPES
# ============================================================================

if [ "$MODE" = "complete" ] || [ "$MODE" = "admin" ] || [ "$MODE" = "all" ]; then
    check_category "1️⃣7️⃣  ADMIN - CALL TYPES (4 endpoints)"
    
    check_endpoint_get "${BACKEND_URL}/api/admin/call-types" "Listar tipos de llamadas"
    check_endpoint_post "${BACKEND_URL}/api/admin/call-types" '{"name":"Test"}' "Crear tipo de llamada"
    check_endpoint_put "PATCH" "${BACKEND_URL}/api/admin/call-types/1" '{"name":"Updated"}' "Actualizar tipo"
    check_endpoint_delete "${BACKEND_URL}/api/admin/call-types/1" "Eliminar tipo"
fi

# ============================================================================
# 18. HIRING (PÚBLICO)
# ============================================================================

if [ "$MODE" = "complete" ] || [ "$MODE" = "hiring" ] || [ "$MODE" = "all" ]; then
    check_category "1️⃣8️⃣  HIRING (PÚBLICO - 4 endpoints)"
    
    check_endpoint_get "${BACKEND_URL}/api/hiring/TEST123" "Obtener datos de contratación"
    check_endpoint_post "${BACKEND_URL}/api/hiring/TEST123/confirm-data" '{"data":"test"}' "Confirmar datos"
    check_endpoint_post "${BACKEND_URL}/api/hiring/TEST123/contract/accept" '{}' "Aceptar contrato"
    check_endpoint_post "${BACKEND_URL}/api/hiring/TEST123/kyc/complete" '{}' "Completar KYC"
fi

# ============================================================================
# 19. EXPEDIENTES
# ============================================================================

if [ "$MODE" = "complete" ] || [ "$MODE" = "expedientes" ] || [ "$MODE" = "all" ]; then
    check_category "1️⃣9️⃣  EXPEDIENTES (14 endpoints)"
    
    check_endpoint_get "${BACKEND_URL}/api/expedientes/" "Listar expedientes"
    check_endpoint_get "${BACKEND_URL}/api/expedientes/1" "Obtener expediente"
    check_endpoint_get "${BACKEND_URL}/api/expedientes/user/1" "Obtener expedientes por usuario"
    check_endpoint_post "${BACKEND_URL}/api/expedientes/" '{"name":"Test"}' "Crear expediente"
    check_endpoint_put "PUT" "${BACKEND_URL}/api/expedientes/1" '{"name":"Updated"}' "Actualizar expediente"
    check_endpoint_delete "${BACKEND_URL}/api/expedientes/1" "Eliminar expediente"
    check_endpoint_post "${BACKEND_URL}/api/expedientes/1/seleccionar-formulario" '{"formulario_id":1}' "Seleccionar formulario"
    check_endpoint_get "${BACKEND_URL}/api/expedientes/1/completitud" "Obtener completitud"
    check_endpoint_get "${BACKEND_URL}/api/expedientes/1/checklist" "Obtener checklist"
    check_endpoint_get "${BACKEND_URL}/api/expedientes/1/historial" "Obtener historial"
    check_endpoint_post "${BACKEND_URL}/api/expedientes/1/cambiar-estado" '{"estado":"test"}' "Cambiar estado"
    check_endpoint_get "${BACKEND_URL}/api/expedientes/1/estadisticas" "Obtener estadísticas"
    check_endpoint_get "${BACKEND_URL}/api/expedientes/buscar" "Buscar expedientes"
    check_endpoint_post "${BACKEND_URL}/api/expedientes/1/archivos" '{}' "Subir archivo"
    check_endpoint_put "PATCH" "${BACKEND_URL}/api/expedientes/1/archivos/1" '{"name":"test"}' "Actualizar archivo"
fi

# ============================================================================
# 20. PIPELINES
# ============================================================================

if [ "$MODE" = "complete" ] || [ "$MODE" = "pipelines" ] || [ "$MODE" = "all" ]; then
    check_category "2️⃣0️⃣  PIPELINES (12 endpoints)"
    
    check_endpoint_get "${BACKEND_URL}/api/pipelines/stages/lead/1" "Obtener stages"
    check_endpoint_post "${BACKEND_URL}/api/pipelines/stages" '{}' "Crear stage"
    check_endpoint_put "PATCH" "${BACKEND_URL}/api/pipelines/stages/1/next-action" '{}' "Siguiente acción"
    check_endpoint_get "${BACKEND_URL}/api/pipelines/stages/lead/1/status" "Obtener estado"
    check_endpoint_post "${BACKEND_URL}/api/pipelines/actions" '{}' "Crear acción"
    check_endpoint_get "${BACKEND_URL}/api/pipelines/actions/lead/1" "Obtener acciones"
    check_endpoint_post "${BACKEND_URL}/api/pipelines/actions/1/validate" '{}' "Validar acción"
    check_endpoint_get "${BACKEND_URL}/api/pipelines/action-types" "Obtener tipos de acción"
    check_endpoint_post "${BACKEND_URL}/api/pipelines/calls/1/analyze" '{}' "Analizar llamada"
    check_endpoint_get "${BACKEND_URL}/api/pipelines/calls/1/next-action" "Siguiente acción de llamada"
    check_endpoint_get "${BACKEND_URL}/api/pipelines/admin/approve-hiring-code/validate?token=test" "Validar token"
    check_endpoint_post "${BACKEND_URL}/api/pipelines/admin/approve-hiring-code?token=test" '{}' "Aprobar código"
fi

# ============================================================================
# 21. CONVERSATIONS
# ============================================================================

if [ "$MODE" = "complete" ] || [ "$MODE" = "conversations" ] || [ "$MODE" = "all" ]; then
    check_category "2️⃣1️⃣  CONVERSATIONS (2 endpoints)"
    
    check_endpoint_get "${BACKEND_URL}/api/conversations/1/messages" "Obtener mensajes"
    check_endpoint_get "${BACKEND_URL}/api/conversations/1/export" "Exportar conversación"
fi

# ============================================================================
# 22. AGENT JOURNAL
# ============================================================================

if [ "$MODE" = "complete" ] || [ "$MODE" = "agent-journal" ] || [ "$MODE" = "all" ]; then
    check_category "2️⃣2️⃣  AGENT JOURNAL (5 endpoints)"
    
    check_endpoint_get "${BACKEND_URL}/api/agent-journal/daily-report" "Reporte diario"
    check_endpoint_get "${BACKEND_URL}/api/agent-journal/performance-dashboard" "Dashboard de performance"
    check_endpoint_get "${BACKEND_URL}/api/agent-journal/metrics/1" "Métricas de usuario"
    check_endpoint_post "${BACKEND_URL}/api/agent-journal/sync" '{}' "Sincronizar datos"
    check_endpoint_post "${BACKEND_URL}/api/agent-journal/sign-and-send" '{}' "Firmar y enviar"
fi

# ============================================================================
# RESUMEN FINAL
# ============================================================================

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${CYAN}📊 RESUMEN DEL DIAGNÓSTICO${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Total de endpoints verificados: $TOTAL_CHECKED"
echo -e "${GREEN}✅ Pasaron: $PASSED${NC}"
echo -e "${RED}❌ Fallaron: $FAILED${NC}"
echo -e "${YELLOW}⚠️  Advertencias: $WARNINGS${NC}"
echo ""

# Actualizar reporte final
if command -v jq &> /dev/null; then
    REPORT_DATA=$(echo "$REPORT_DATA" | jq \
        --argjson total "$TOTAL_CHECKED" \
        --argjson passed "$PASSED" \
        --argjson failed "$FAILED" \
        --argjson warnings "$WARNINGS" \
        '.summary.total_checked = $total | .summary.passed = $passed | .summary.failed = $failed | .summary.total_warnings = $warnings')
fi

# Guardar reporte
if [ -n "$REPORT_DATA" ]; then
    echo "$REPORT_DATA" > "$REPORT_FILE"
    if [ $ERRORS -gt 0 ]; then
        echo "📝 Reporte de errores generado: $REPORT_FILE"
    else
        echo "📝 Reporte de diagnóstico generado: $REPORT_FILE"
    fi
fi

# Exit code basado en errores
if [ $ERRORS -eq 0 ]; then
    echo -e "${GREEN}✅ Diagnóstico completado sin errores críticos${NC}"
    exit 0
else
    echo -e "${RED}❌ Diagnóstico completado con $ERRORS error(es) crítico(s)${NC}"
    exit 1
fi
