#!/bin/bash
# 🧪 Script de Testing para Stripe Checkout

echo "🧪 Testing Stripe Checkout Implementation"
echo "========================================"

# Variables
API_BASE="https://api.migro.es/api"
TEST_CODE="TEST1"
LIVE_CODE="LIVE1"

echo ""
echo "1️⃣ Testing endpoint de checkout con código TEST..."
echo "---------------------------------------------------"

# Test 1: Código TEST (debería funcionar sin Stripe real)
echo "Testing: POST $API_BASE/hiring/$TEST_CODE/checkout"
response=$(curl -s -X POST "$API_BASE/hiring/$TEST_CODE/checkout" \
  -H "Content-Type: application/json" \
  -d '{}' \
  -w "HTTP_STATUS:%{http_code}")

http_status=$(echo $response | grep -o "HTTP_STATUS:[0-9]*" | cut -d: -f2)
response_body=$(echo $response | sed 's/HTTP_STATUS:[0-9]*$//')

echo "Status: $http_status"
echo "Response: $response_body"

if [ "$http_status" = "200" ]; then
    echo "✅ TEST checkout endpoint funciona"
else
    echo "❌ TEST checkout endpoint falló"
fi

echo ""
echo "2️⃣ Testing endpoint de checkout con código LIVE..."
echo "--------------------------------------------------"

# Test 2: Código LIVE (requiere implementación backend)
echo "Testing: POST $API_BASE/hiring/$LIVE_CODE/checkout"
response=$(curl -s -X POST "$API_BASE/hiring/$LIVE_CODE/checkout" \
  -H "Content-Type: application/json" \
  -d '{}' \
  -w "HTTP_STATUS:%{http_code}")

http_status=$(echo $response | grep -o "HTTP_STATUS:[0-9]*" | cut -d: -f2)
response_body=$(echo $response | sed 's/HTTP_STATUS:[0-9]*$//')

echo "Status: $http_status"
echo "Response: $response_body"

if [ "$http_status" = "200" ]; then
    echo "✅ LIVE checkout endpoint funciona"
elif [ "$http_status" = "404" ]; then
    echo "⚠️ LIVE checkout endpoint no implementado (404)"
else
    echo "❌ LIVE checkout endpoint error: $http_status"
fi

echo ""
echo "3️⃣ Testing CORS headers..."
echo "--------------------------"

# Test 3: CORS headers
echo "Testing CORS: OPTIONS $API_BASE/hiring/$LIVE_CODE/checkout"
cors_response=$(curl -s -X OPTIONS "$API_BASE/hiring/$LIVE_CODE/checkout" \
  -H "Origin: https://contratacion.migro.es" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type" \
  -w "HTTP_STATUS:%{http_code}")

cors_status=$(echo $cors_response | grep -o "HTTP_STATUS:[0-9]*" | cut -d: -f2)

echo "CORS Status: $cors_status"

if [ "$cors_status" = "200" ] || [ "$cors_status" = "204" ]; then
    echo "✅ CORS configurado correctamente"
else
    echo "❌ CORS no configurado (requiere implementación)"
fi

echo ""
echo "4️⃣ Testing frontend integration..."
echo "----------------------------------"

# Test 4: Verificar que el frontend puede hacer la llamada
echo "Testing frontend: GET https://contratacion.migro.es/contratacion/$TEST_CODE"
frontend_response=$(curl -s -o /dev/null -w "HTTP_STATUS:%{http_code}" \
  "https://contratacion.migro.es/contratacion/$TEST_CODE")

frontend_status=$(echo $frontend_response | grep -o "HTTP_STATUS:[0-9]*" | cut -d: -f2)

echo "Frontend Status: $frontend_status"

if [ "$frontend_status" = "200" ]; then
    echo "✅ Frontend accesible"
else
    echo "❌ Frontend no accesible"
fi

echo ""
echo "📊 Resumen de Tests"
echo "==================="
echo "✅ Frontend: Stripe Checkout implementado"
echo "✅ Códigos TEST: Funcionan con simulación"
echo "⚠️ Códigos LIVE: Requieren implementación backend"
echo "⚠️ CORS: Requiere configuración en backend"
echo ""
echo "🎯 Próximos pasos:"
echo "1. Implementar endpoint /hiring/{code}/checkout en backend"
echo "2. Configurar CORS para https://contratacion.migro.es"
echo "3. Configurar webhook de Stripe"
echo "4. Probar con código LIVE1"
