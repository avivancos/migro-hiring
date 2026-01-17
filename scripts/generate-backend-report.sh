#!/bin/bash
# Script para generar reporte de errores del backend con sugerencias
# Se ejecuta automáticamente cuando se detectan errores en el diagnóstico

set -e

REPORT_FILE="${1:-backend-error-report.json}"
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

# Inicializar reporte
cat > "$REPORT_FILE" <<EOF
{
  "timestamp": "$TIMESTAMP",
  "summary": {
    "total_errors": 0,
    "total_warnings": 0,
    "critical_errors": [],
    "warnings": []
  },
  "endpoints": {},
  "suggestions": []
}
EOF

# Función para agregar error al reporte
add_error() {
    local endpoint=$1
    local status_code=$2
    local expected_status=$3
    local description=$4
    local response_body=$5
    
    # Leer el reporte actual
    local temp_file=$(mktemp)
    cat "$REPORT_FILE" > "$temp_file"
    
    # Agregar error usando jq si está disponible, o crear manualmente
    if command -v jq &> /dev/null; then
        jq --arg ep "$endpoint" \
           --arg sc "$status_code" \
           --arg es "$expected_status" \
           --arg desc "$description" \
           --arg body "$response_body" \
           '.endpoints[$ep] = {
             "status_code": $sc | tonumber,
             "expected_status": $es | tonumber,
             "description": $desc,
             "response_body": $body,
             "timestamp": "'"$TIMESTAMP"'"
           } | .summary.total_errors += 1' "$temp_file" > "$REPORT_FILE"
    else
        # Fallback: agregar al final del JSON de forma básica
        echo "Error agregado: $endpoint - Status: $status_code"
    fi
    
    rm -f "$temp_file"
    
    # Agregar sugerencias basadas en el código de error
    add_suggestions "$status_code" "$endpoint" "$response_body"
}

# Función para agregar sugerencias según el código de error
add_suggestions() {
    local status_code=$1
    local endpoint=$2
    local response_body=$3
    
    local suggestions_file=$(mktemp)
    
    case $status_code in
        401)
            cat >> "$suggestions_file" <<EOF
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
            ;;
        403)
            cat >> "$suggestions_file" <<EOF
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
            ;;
        404)
            cat >> "$suggestions_file" <<EOF
{
  "code": 404,
  "endpoint": "$endpoint",
  "severity": "medium",
  "title": "Endpoint No Encontrado",
  "description": "El endpoint solicitado no existe o la ruta es incorrecta",
  "suggestions": [
    "Verificar que la ruta del endpoint es correcta",
    "Comprobar que el endpoint está registrado en el router",
    "Revisar la configuración de rutas en el backend"
  ],
  "backend_checks": [
    "Verificar registro de rutas en app/api/routers/",
    "Comprobar prefijos de rutas y versiones de API",
    "Revisar documentación OpenAPI/Swagger para rutas disponibles"
  ]
}
EOF
            ;;
        422)
            cat >> "$suggestions_file" <<EOF
{
  "code": 422,
  "endpoint": "$endpoint",
  "severity": "medium",
  "title": "Error de Validación",
  "description": "Los datos enviados no pasaron la validación",
  "suggestions": [
    "Revisar el formato de los datos enviados",
    "Verificar que todos los campos requeridos están presentes",
    "Comprobar tipos de datos y formatos esperados"
  ],
  "backend_checks": [
    "Revisar schemas Pydantic para validación",
    "Verificar mensajes de error de validación en la respuesta",
    "Comprobar que los campos opcionales/requeridos están bien definidos"
  ]
}
EOF
            ;;
        500)
            cat >> "$suggestions_file" <<EOF
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
            ;;
        502|503|504)
            cat >> "$suggestions_file" <<EOF
{
  "code": $status_code,
  "endpoint": "$endpoint",
  "severity": "high",
  "title": "Servicio No Disponible",
  "description": "El servicio backend no está disponible o no responde",
  "suggestions": [
    "Verificar que el backend está corriendo",
    "Revisar recursos del servidor (memoria, CPU)",
    "Comprobar logs del servidor/proxy (nginx, etc.)",
    "Verificar que el puerto del backend está abierto y accesible"
  ],
  "backend_checks": [
    "Verificar estado del contenedor: docker-compose ps backend",
    "Revisar logs del backend: docker-compose logs --tail=100 backend",
    "Verificar uso de recursos: docker stats",
    "Comprobar configuración del proxy/load balancer si aplica"
  ]
}
EOF
            ;;
        *)
            cat >> "$suggestions_file" <<EOF
{
  "code": $status_code,
  "endpoint": "$endpoint",
  "severity": "medium",
  "title": "Error HTTP $status_code",
  "description": "El endpoint devolvió un código de estado inesperado",
  "suggestions": [
    "Revisar logs del backend para más detalles",
    "Verificar la respuesta completa del endpoint",
    "Consultar documentación del backend para este código de error"
  ],
  "backend_checks": [
    "Revisar logs del backend",
    "Verificar manejo de errores en el endpoint",
    "Comprobar que el código de error es apropiado para el caso"
  ]
}
EOF
            ;;
    esac
    
    # Agregar sugerencia al reporte principal
    if command -v jq &> /dev/null && [ -f "$suggestions_file" ]; then
        local temp_file=$(mktemp)
        cat "$REPORT_FILE" > "$temp_file"
        jq --slurpfile sug "$suggestions_file" '.suggestions += $sug' "$temp_file" > "$REPORT_FILE"
        rm -f "$temp_file"
    fi
    
    rm -f "$suggestions_file"
}

# Función para generar reporte en formato legible
generate_readable_report() {
    local json_file=$1
    local output_file="${json_file%.json}.txt"
    
    cat > "$output_file" <<EOF
═══════════════════════════════════════════════════════════════════
   REPORTE DE ERRORES DEL BACKEND
═══════════════════════════════════════════════════════════════════

Fecha: $(date)
Reporte generado automáticamente por el diagnóstico de CI/CD

EOF

    if command -v jq &> /dev/null; then
        # Usar jq para formatear
        local total_errors=$(jq -r '.summary.total_errors' "$json_file")
        
        echo "📊 RESUMEN" >> "$output_file"
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" >> "$output_file"
        echo "Total de errores: $total_errors" >> "$output_file"
        echo "" >> "$output_file"
        
        # Agregar detalles de endpoints
        echo "🔍 ENDPOINTS CON ERRORES" >> "$output_file"
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" >> "$output_file"
        
        jq -r '.endpoints | to_entries[] | "Endpoint: \(.key)\n  Status: \(.value.status_code) (esperado: \(.value.expected_status))\n  Descripción: \(.value.description)\n"' "$json_file" >> "$output_file"
        
        echo "" >> "$output_file"
        echo "💡 SUGERENCIAS" >> "$output_file"
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" >> "$output_file"
        
        jq -r '.suggestions[] | "━━━━\n[\(.severity | ascii_upcase)] \(.title)\nEndpoint: \(.endpoint)\nCódigo: \(.code)\n\nDescripción:\n\(.description)\n\n💡 Sugerencias:\n\(.suggestions[] | "  • \(.)")\n\n🔧 Verificaciones del Backend:\n\(.backend_checks[] | "  • \(.)")\n"' "$json_file" >> "$output_file"
    else
        echo "⚠️  jq no está disponible. Instala jq para un reporte más detallado." >> "$output_file"
        echo "Reporte JSON disponible en: $json_file" >> "$output_file"
    fi
    
    echo "" >> "$output_file"
    echo "═══════════════════════════════════════════════════════════════════" >> "$output_file"
    echo "Para más información, consulta: docs/DIAGNOSTICO_ERROR_AUTH_LOCAL.md" >> "$output_file"
    echo "═══════════════════════════════════════════════════════════════════" >> "$output_file"
    
    echo "✅ Reporte legible generado en: $output_file"
}

# Función principal que puede ser llamada desde diagnose-backend.sh
main() {
    local report_file="${REPORT_FILE:-backend-error-report-$(date +%Y%m%d-%H%M%S).json}"
    
    echo "📝 Generando reporte de errores..."
    echo "Archivo: $report_file"
    
    # Esta función será llamada desde diagnose-backend.sh cuando se detecten errores
    # Por ahora, es un template que se puede usar
    
    if [ -f "$report_file" ]; then
        generate_readable_report "$report_file"
    fi
}

# Ejecutar si se llama directamente
if [ "${BASH_SOURCE[0]}" = "${0}" ]; then
    main "$@"
fi

# Exportar funciones para uso en otros scripts
export -f add_error
export -f add_suggestions
export -f generate_readable_report
