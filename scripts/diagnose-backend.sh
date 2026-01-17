#!/bin/bash
# Script de diagnóstico del backend para CI/CD
# Verifica la salud del backend y detecta problemas comunes
# Genera reportes automáticos con sugerencias cuando hay errores

set -e

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Variables de entorno
API_BASE_URL="${VITE_API_BASE_URL:-http://localhost:3000/api}"
BACKEND_URL="${API_BASE_URL%/api}"

# Archivo de reporte
REPORT_FILE="${BACKEND_ERROR_REPORT:-backend-error-report-$(date +%Y%m%d-%H%M%S).json}"
REPORT_DATA=""

echo "🔍 Iniciando diagnóstico del backend..."
echo "📡 API Base URL: $API_BASE_URL"
echo "📡 Backend URL: $BACKEND_URL"
echo ""

ERRORS=0
WARNINGS=0

# Inicializar reporte JSON
init_report() {
    REPORT_DATA=$(cat <<EOF
{
  "timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "api_base_url": "$API_BASE_URL",
  "summary": {
    "total_errors": 0,
    "total_warnings": 0
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
    
    # Crear entrada de error
    local error_entry=$(cat <<EOF
"$endpoint": {
  "status_code": $status_code,
  "expected_status": $expected_status,
  "description": "$description",
  "response_body": $(echo "$response_body" | jq -Rs . || echo '""'),
  "timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
}
EOF
)
    
    # Si jq está disponible, usar para actualizar JSON
    if command -v jq &> /dev/null; then
        REPORT_DATA=$(echo "$REPORT_DATA" | jq \
            --arg ep "$endpoint" \
            --argjson sc "$status_code" \
            --argjson es "$expected_status" \
            --arg desc "$description" \
            --arg body "$response_body" \
            '.endpoints[$ep] = {
              status_code: $sc,
              expected_status: $es,
              description: $desc,
              response_body: $body,
              timestamp: now | strftime("%Y-%m-%dT%H:%M:%SZ")
            } | .summary.total_errors += 1')
        
        # Agregar sugerencias basadas en el código de error
        add_suggestions_to_report "$status_code" "$endpoint" "$response_body"
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
  "description": "El usuario autenticado no tiene permisos para acceder a este recurso",
  "suggestions": [
    "Verificar los roles y permisos del usuario",
    "Revisar la configuración de autorización en el backend",
    "Comprobar que el usuario tiene los permisos necesarios (is_superuser, role, etc.)"
  ],
  "backend_checks": [
    "Verificar decoradores de autorización (@require_permissions, etc.)",
    "Revisar la lógica de verificación de permisos",
    "Comprobar roles y permisos en la base de datos"
  ]
}
EOF
)
            ;;
    esac
    
    if [ -n "$suggestion_json" ]; then
        REPORT_DATA=$(echo "$REPORT_DATA" | jq --argjson sug "$suggestion_json" '.suggestions += [$sug]')
    fi
}

# Función para guardar reporte
save_report() {
    if [ -n "$REPORT_DATA" ] && [ $ERRORS -gt 0 ]; then
        echo "$REPORT_DATA" > "$REPORT_FILE"
        echo ""
        echo "📝 Reporte de errores generado: $REPORT_FILE"
        
        # Generar reporte legible si jq está disponible
        if command -v jq &> /dev/null; then
            generate_readable_report "$REPORT_FILE"
        fi
    fi
}

# Función para generar reporte legible
generate_readable_report() {
    local json_file=$1
    local txt_file="${json_file%.json}.txt"
    
    cat > "$txt_file" <<EOF
═══════════════════════════════════════════════════════════════════
   REPORTE DE ERRORES DEL BACKEND
═══════════════════════════════════════════════════════════════════

Fecha: $(date)
API Base URL: $API_BASE_URL
Reporte generado automáticamente por el diagnóstico de CI/CD

EOF

    if command -v jq &> /dev/null; then
        local total_errors=$(jq -r '.summary.total_errors' "$json_file" 2>/dev/null || echo "0")
        
        echo "📊 RESUMEN" >> "$txt_file"
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" >> "$txt_file"
        echo "Total de errores: $total_errors" >> "$txt_file"
        echo "" >> "$txt_file"
        
        # Agregar detalles de endpoints con errores
        echo "🔍 ENDPOINTS CON ERRORES" >> "$txt_file"
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" >> "$txt_file"
        
        jq -r '.endpoints | to_entries[] | "Endpoint: \(.key)\n  Status: \(.value.status_code) (esperado: \(.value.expected_status))\n  Descripción: \(.value.description)\n"' "$json_file" 2>/dev/null >> "$txt_file" || true
        
        echo "" >> "$txt_file"
        echo "💡 SUGERENCIAS PARA EL BACKEND" >> "$txt_file"
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" >> "$txt_file"
        
        jq -r '.suggestions[]? | 
          "━━━━\n[\(.severity | ascii_upcase)] \(.title)\nEndpoint: \(.endpoint)\nCódigo: \(.code)\n\nDescripción:\n\(.description)\n\n💡 Sugerencias:\n\(.suggestions[]? | "  • \(.)")\n\n🔧 Verificaciones del Backend:\n\(.backend_checks[]? | "  • \(.)")\n\(if .common_causes then "\n🔍 Causas Comunes:\n\(.common_causes[]? | "  • \(.)")" else "" end)\n"' "$json_file" 2>/dev/null >> "$txt_file" || true
    else
        echo "⚠️  jq no está disponible. Instala jq para un reporte más detallado." >> "$txt_file"
        echo "Reporte JSON disponible en: $json_file" >> "$txt_file"
    fi
    
    echo "" >> "$txt_file"
    echo "═══════════════════════════════════════════════════════════════════" >> "$txt_file"
    echo "Para más información, consulta: docs/DIAGNOSTICO_ERROR_AUTH_LOCAL.md" >> "$txt_file"
    echo "═══════════════════════════════════════════════════════════════════" >> "$txt_file"
    
    echo "📄 Reporte legible generado: $txt_file"
}

# Inicializar reporte
init_report

# Función para verificar endpoint
check_endpoint() {
    local endpoint=$1
    local expected_status=$2
    local description=$3
    
    echo -n "🔍 Verificando $description... "
    
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$endpoint" || echo "000")
    
    if [ "$HTTP_CODE" = "$expected_status" ]; then
        echo -e "${GREEN}✅ OK (${HTTP_CODE})${NC}"
        return 0
    else
        echo -e "${RED}❌ FALLO (${HTTP_CODE}, esperado: ${expected_status})${NC}"
        ERRORS=$((ERRORS + 1))
        return 1
    fi
}

# Función para verificar endpoint con timeout
check_endpoint_timeout() {
    local endpoint=$1
    local expected_status=$2
    local description=$3
    local timeout=${4:-10}
    
    echo -n "🔍 Verificando $description (timeout: ${timeout}s)... "
    
    HTTP_CODE=$(curl -s --max-time $timeout -o /dev/null -w "%{http_code}" "$endpoint" 2>/dev/null || echo "000")
    
    if [ "$HTTP_CODE" = "$expected_status" ]; then
        echo -e "${GREEN}✅ OK (${HTTP_CODE})${NC}"
        return 0
    elif [ "$HTTP_CODE" = "000" ]; then
        echo -e "${RED}❌ TIMEOUT o ERROR DE CONEXIÓN${NC}"
        ERRORS=$((ERRORS + 1))
        return 1
    else
        echo -e "${YELLOW}⚠️  Status inesperado (${HTTP_CODE}, esperado: ${expected_status})${NC}"
        WARNINGS=$((WARNINGS + 1))
        return 2
    fi
}

# Función para verificar respuesta JSON
check_json_response() {
    local endpoint=$1
    local description=$2
    
    echo -n "🔍 Verificando respuesta JSON de $description... "
    
    RESPONSE=$(curl -s --max-time 10 "$endpoint" 2>/dev/null || echo "")
    
    if [ -z "$RESPONSE" ]; then
        echo -e "${RED}❌ Sin respuesta${NC}"
        ERRORS=$((ERRORS + 1))
        return 1
    fi
    
    # Verificar que es JSON válido (básico)
    if echo "$RESPONSE" | grep -q -E '^\s*(\{|\[)'; then
        echo -e "${GREEN}✅ JSON válido${NC}"
        return 0
    else
        echo -e "${YELLOW}⚠️  Respuesta no parece ser JSON${NC}"
        echo "Respuesta: ${RESPONSE:0:100}..."
        WARNINGS=$((WARNINGS + 1))
        return 2
    fi
}

# 1. Verificar Health Check
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "1️⃣  HEALTH CHECK"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

HEALTH_ENDPOINT="${BACKEND_URL}/api/health"
check_endpoint_timeout "$HEALTH_ENDPOINT" "200" "Health Check" 10

if [ $? -eq 0 ]; then
    HEALTH_RESPONSE=$(curl -s --max-time 10 "$HEALTH_ENDPOINT" 2>/dev/null || echo "")
    echo "   Respuesta: $HEALTH_RESPONSE"
fi

echo ""

# 2. Verificar Endpoint de Login (debe responder 422 por falta de datos o 401 con credenciales inválidas)
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "2️⃣  ENDPOINT DE AUTENTICACIÓN"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

LOGIN_ENDPOINT="${BACKEND_URL}/api/auth/login"

echo -n "🔍 Verificando endpoint de login... "
LOGIN_RESPONSE=$(curl -s -X POST "$LOGIN_ENDPOINT" \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com","password":"test"}' \
    -w "\n%{http_code}" \
    --max-time 10 2>/dev/null || echo "")

if [ -z "$LOGIN_RESPONSE" ]; then
    echo -e "${RED}❌ Sin respuesta (posible error de conexión)${NC}"
    ERRORS=$((ERRORS + 1))
else
    HTTP_CODE=$(echo "$LOGIN_RESPONSE" | tail -n1)
    BODY=$(echo "$LOGIN_RESPONSE" | head -n-1)
    
    # El endpoint debe responder 401, 422, o 400 (no 500)
    if [ "$HTTP_CODE" = "401" ] || [ "$HTTP_CODE" = "422" ] || [ "$HTTP_CODE" = "400" ]; then
        echo -e "${GREEN}✅ OK (${HTTP_CODE}) - Endpoint responde correctamente${NC}"
        if echo "$BODY" | grep -q "detail"; then
            DETAIL=$(echo "$BODY" | grep -o '"detail":"[^"]*"' | head -1 | cut -d'"' -f4)
            echo "   Detalle: $DETAIL"
        fi
    elif [ "$HTTP_CODE" = "500" ]; then
        echo -e "${RED}❌ ERROR 500 - Problema interno del servidor${NC}"
        echo "   Esto sugiere un problema con la base de datos o configuración"
        if echo "$BODY" | grep -q "detail"; then
            DETAIL=$(echo "$BODY" | grep -o '"detail":"[^"]*"' | head -1 | cut -d'"' -f4)
            echo "   Detalle: $DETAIL"
        fi
        ERRORS=$((ERRORS + 1))
        add_error_to_report "$LOGIN_ENDPOINT" "$HTTP_CODE" "401|422|400" "Login endpoint" "$BODY"
    else
        echo -e "${YELLOW}⚠️  Status inesperado (${HTTP_CODE})${NC}"
        WARNINGS=$((WARNINGS + 1))
    fi
fi

echo ""

# 3. Verificar endpoint de refresh (debe responder 400/401 sin token, no 500)
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "3️⃣  ENDPOINT DE REFRESH TOKEN"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

REFRESH_ENDPOINT="${BACKEND_URL}/api/auth/refresh"

echo -n "🔍 Verificando endpoint de refresh... "
REFRESH_RESPONSE=$(curl -s -X POST "$REFRESH_ENDPOINT" \
    -H "Content-Type: application/json" \
    -d '{"refresh_token":"invalid"}' \
    -w "\n%{http_code}" \
    --max-time 10 2>/dev/null || echo "")

if [ -z "$REFRESH_RESPONSE" ]; then
    echo -e "${RED}❌ Sin respuesta (posible error de conexión)${NC}"
    ERRORS=$((ERRORS + 1))
else
    HTTP_CODE=$(echo "$REFRESH_RESPONSE" | tail -n1)
    BODY=$(echo "$REFRESH_RESPONSE" | head -n-1)
    
    # El endpoint debe responder 400 o 401 con token inválido (no 500)
    if [ "$HTTP_CODE" = "400" ] || [ "$HTTP_CODE" = "401" ]; then
        echo -e "${GREEN}✅ OK (${HTTP_CODE}) - Endpoint maneja tokens inválidos correctamente${NC}"
        if echo "$BODY" | grep -q "detail"; then
            DETAIL=$(echo "$BODY" | grep -o '"detail":"[^"]*"' | head -1 | cut -d'"' -f4)
            echo "   Detalle: $DETAIL"
        fi
    elif [ "$HTTP_CODE" = "500" ]; then
        echo -e "${RED}❌ ERROR 500 - Problema interno del servidor${NC}"
        echo "   ⚠️  PROBLEMA CRÍTICO: El endpoint devuelve 500 en lugar de 400/401"
        echo "   Esto indica un problema con la base de datos o el manejo de errores"
        if echo "$BODY" | grep -q "detail"; then
            DETAIL=$(echo "$BODY" | grep -o '"detail":"[^"]*"' | head -1 | cut -d'"' -f4)
            echo "   Detalle: $DETAIL"
        fi
        ERRORS=$((ERRORS + 1))
        add_error_to_report "$REFRESH_ENDPOINT" "$HTTP_CODE" "400|401" "Refresh token endpoint" "$BODY"
    else
        echo -e "${YELLOW}⚠️  Status inesperado (${HTTP_CODE})${NC}"
        WARNINGS=$((WARNINGS + 1))
    fi
fi

echo ""

# 4. Verificar variables de entorno (si están disponibles)
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "4️⃣  VARIABLES DE ENTORNO"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ -n "$VITE_API_BASE_URL" ]; then
    echo -e "${GREEN}✅ VITE_API_BASE_URL configurada: $VITE_API_BASE_URL${NC}"
else
    echo -e "${YELLOW}⚠️  VITE_API_BASE_URL no configurada${NC}"
    WARNINGS=$((WARNINGS + 1))
fi

echo ""

# Resumen
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 RESUMEN"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo -e "${GREEN}✅ Todos los diagnósticos pasaron correctamente${NC}"
    exit 0
elif [ $ERRORS -eq 0 ]; then
    echo -e "${YELLOW}⚠️  Diagnóstico completado con ${WARNINGS} advertencia(s)${NC}"
    exit 0
else
    echo -e "${RED}❌ Diagnóstico falló con ${ERRORS} error(es) y ${WARNINGS} advertencia(s)${NC}"
    echo ""
    
    # Guardar reporte si hay errores
    save_report
    
    echo "🔧 Soluciones sugeridas:"
    echo "   1. Verificar que el backend está corriendo"
    echo "   2. Verificar la conexión a la base de datos"
    echo "   3. Revisar logs del backend para más detalles"
    echo "   4. Consultar docs/DIAGNOSTICO_ERROR_AUTH_LOCAL.md"
    if [ -f "$REPORT_FILE" ]; then
        echo "   5. Revisar el reporte detallado: $REPORT_FILE"
    fi
    exit 1
fi

# Guardar reporte final (incluso si no hay errores, para referencia)
if [ -n "$REPORT_DATA" ]; then
    save_report
fi
