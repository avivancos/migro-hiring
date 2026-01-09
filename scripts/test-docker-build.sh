#!/bin/bash
# Script para probar el build de Docker localmente
# Simula exactamente lo que hace Render durante el build

set -e

echo "🧪 Probando build de Docker localmente..."
echo ""

# Colores para output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Ejecutar scripts de auto-repair
echo "📝 Ejecutando scripts de auto-repair..."

echo "  → remove-unused-imports.js"
node scripts/remove-unused-imports.js 2>/dev/null || true

echo "  → fix-icon-references.js"
node scripts/fix-icon-references.js 2>/dev/null || true

echo "  → fix-icon-names.js"
node scripts/fix-icon-names.js 2>/dev/null || true

echo "  → fix-imports-and-references.js"
node scripts/fix-imports-and-references.js 2>/dev/null || true

echo "  → fix-missing-icon-imports.js"
node scripts/fix-missing-icon-imports.js 2>/dev/null || true

echo ""
echo "🔍 Verificando errores de TypeScript..."

# Verificar errores comunes
ERRORS=0

echo "  → Verificando CheckIcon no usado..."
if grep -r "CheckIcon" src/components/KYCVerification.tsx src/pages/admin/AdminRoutePermissions.tsx 2>/dev/null | grep -q "^import.*CheckIcon"; then
  echo -e "  ${RED}❌ CheckIcon encontrado en imports pero no usado${NC}"
  ERRORS=$((ERRORS + 1))
else
  echo -e "  ${GREEN}✅ CheckIcon OK${NC}"
fi

echo "  → Verificando BookOpenIcon duplicado..."
BOOKOPEN_COUNT=$(grep -c "BookOpenIcon" src/components/agentJournal/AgentJournalWidget.tsx 2>/dev/null || echo "0")
if [ "$BOOKOPEN_COUNT" -gt "1" ]; then
  echo -e "  ${RED}❌ BookOpenIcon duplicado encontrado${NC}"
  ERRORS=$((ERRORS + 1))
else
  echo -e "  ${GREEN}✅ BookOpenIcon OK${NC}"
fi

echo "  → Verificando XMarkIcon no usado..."
if grep -r "XMarkIcon" src/components/opportunities/ContractDataRequestModal.tsx src/components/opportunities/RequestContractModal.tsx src/pages/CRMDashboardPage.tsx 2>/dev/null | grep -q "^import.*XMarkIcon"; then
  echo -e "  ${RED}❌ XMarkIcon encontrado en imports pero solo usado en placeholders${NC}"
  ERRORS=$((ERRORS + 1))
else
  echo -e "  ${GREEN}✅ XMarkIcon OK${NC}"
fi

echo ""
if [ "$ERRORS" -gt "0" ]; then
  echo -e "${RED}❌ Se encontraron $ERRORS errores${NC}"
  echo ""
  echo "Corrigiendo errores..."
  
  # Corregir CheckIcon
  if grep -q "CheckIcon" src/components/KYCVerification.tsx 2>/dev/null; then
    sed -i.bak '/CheckIcon/d' src/components/KYCVerification.tsx 2>/dev/null || true
  fi
  if grep -q "CheckIcon" src/pages/admin/AdminRoutePermissions.tsx 2>/dev/null; then
    sed -i.bak '/CheckIcon/d' src/pages/admin/AdminRoutePermissions.tsx 2>/dev/null || true
  fi
  
  # Corregir BookOpenIcon duplicado
  # (verificar manualmente)
  
  # Corregir XMarkIcon
  if grep -q "XMarkIcon" src/components/opportunities/ContractDataRequestModal.tsx 2>/dev/null; then
    sed -i.bak 's/, XMarkIcon//g; s/XMarkIcon, //g; s/XMarkIcon//g' src/components/opportunities/ContractDataRequestModal.tsx 2>/dev/null || true
  fi
  if grep -q "XMarkIcon" src/components/opportunities/RequestContractModal.tsx 2>/dev/null; then
    sed -i.bak 's/, XMarkIcon//g; s/XMarkIcon, //g; s/XMarkIcon//g' src/components/opportunities/RequestContractModal.tsx 2>/dev/null || true
  fi
  if grep -q "XMarkIcon" src/pages/CRMDashboardPage.tsx 2>/dev/null; then
    sed -i.bak 's/, XMarkIcon//g; s/XMarkIcon, //g; s/XMarkIcon//g' src/pages/CRMDashboardPage.tsx 2>/dev/null || true
  fi
  
  echo "Intentando build de nuevo..."
  npm run build
else
  echo -e "${GREEN}✅ Todas las verificaciones pasaron${NC}"
  echo ""
  echo "🏗️  Ejecutando build de TypeScript..."
  npm run build
fi

echo ""
echo -e "${GREEN}✅ Prueba completada${NC}"
