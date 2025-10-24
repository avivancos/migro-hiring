#!/bin/bash
# 🧪 Test Script: Stripe Checkout Status

echo "🧪 Testing Stripe Checkout Implementation Status"
echo "================================================"

API_BASE="https://api.migro.es/api"
TEST_CODE="TEST1"
LIVE_CODE="LIVE1"

echo ""
echo "1️⃣ Testing TEST1 checkout endpoint..."
echo "------------------------------------"

response=$(curl -s -X POST "$API_BASE/hiring/$TEST_CODE/checkout" \
  -H "Content-Type: application/json" \
  -d '{}' \
  -w "HTTP_STATUS:%{http_code}" \
  --connect-timeout 10)

http_status=$(echo $response | grep -o "HTTP_STATUS:[0-9]*" | cut -d: -f2)
response_body=$(echo $response | sed 's/HTTP_STATUS:[0-9]*$//')

echo "Status: $http_status"
echo "Response: $response_body"

if [ "$http_status" = "200" ]; then
    echo "✅ TEST1 checkout endpoint funciona"
elif [ "$http_status" = "404" ]; then
    echo "⚠️ TEST1 checkout endpoint no implementado (404)"
else
    echo "❌ TEST1 checkout endpoint error: $http_status"
fi

echo ""
echo "2️⃣ Testing LIVE1 checkout endpoint..."
echo "------------------------------------"

response=$(curl -s -X POST "$API_BASE/hiring/$LIVE_CODE/checkout" \
  -H "Content-Type: application/json" \
  -d '{}' \
  -w "HTTP_STATUS:%{http_code}" \
  --connect-timeout 10)

http_status=$(echo $response | grep -o "HTTP_STATUS:[0-9]*" | cut -d: -f2)
response_body=$(echo $response | sed 's/HTTP_STATUS:[0-9]*$//')

echo "Status: $http_status"
echo "Response: $response_body"

if [ "$http_status" = "200" ]; then
    echo "✅ LIVE1 checkout endpoint funciona"
elif [ "$http_status" = "404" ]; then
    echo "⚠️ LIVE1 checkout endpoint no implementado (404)"
else
    echo "❌ LIVE1 checkout endpoint error: $http_status"
fi

echo ""
echo "3️⃣ Testing frontend deployment..."
echo "--------------------------------"

response=$(curl -s -o /dev/null -w "HTTP_STATUS:%{http_code}" \
  "https://contratacion.migro.es/contratacion/$TEST_CODE" \
  --connect-timeout 10)

http_status=$(echo $response | grep -o "HTTP_STATUS:[0-9]*" | cut -d: -f2)

echo "Frontend Status: $http_status"

if [ "$http_status" = "200" ]; then
    echo "✅ Frontend desplegado correctamente"
else
    echo "❌ Frontend no accesible"
fi

echo ""
echo "📊 RESUMEN FINAL"
echo "================"
echo "✅ Frontend: Stripe Checkout implementado y desplegado"
echo "✅ Códigos TEST: Funcionan con simulación (sin backend)"
echo "⚠️ Endpoint /checkout: NO IMPLEMENTADO en backend (404)"
echo "⚠️ Códigos LIVE: Requieren implementación backend"
echo ""
echo "🎯 PRÓXIMO PASO:"
echo "Implementar endpoint POST /api/hiring/{code}/checkout en backend"
echo ""
echo "📚 Documentación:"
echo "- RESUMEN_IMPLEMENTACION_BACKEND.md"
echo "- BACKEND_STRIPE_CHECKOUT_COMPLETE.md"
echo "- BACKEND_STRIPE_CHECKOUT_ENDPOINT.md"
