# Script para probar el build de Docker localmente en PowerShell
# Simula exactamente lo que hace Render durante el build

$ErrorActionPreference = "Continue"

Write-Host "[TEST] Probando build de Docker localmente..." -ForegroundColor Cyan
Write-Host ""

# Ejecutar scripts de auto-repair
Write-Host "[AUTO-REPAIR] Ejecutando scripts de auto-repair..." -ForegroundColor Yellow

Write-Host "  - remove-unused-imports.js" -ForegroundColor Gray
node scripts/remove-unused-imports.js 2>$null

Write-Host "  - fix-icon-references.js" -ForegroundColor Gray
node scripts/fix-icon-references.js 2>$null

Write-Host "  - fix-icon-names.js" -ForegroundColor Gray
node scripts/fix-icon-names.js 2>$null

Write-Host "  - fix-imports-and-references.js" -ForegroundColor Gray
node scripts/fix-imports-and-references.js 2>$null

Write-Host "  - fix-missing-icon-imports.js" -ForegroundColor Gray
node scripts/fix-missing-icon-imports.js 2>$null

Write-Host "  - fix-final-errors.js" -ForegroundColor Gray
node scripts/fix-final-errors.js 2>$null

Write-Host ""
Write-Host "[CHECK] Verificando errores de TypeScript..." -ForegroundColor Yellow

$ERRORS = 0

# Verificar CheckIcon
Write-Host "  → Verificando CheckIcon no usado..." -ForegroundColor Gray
$checkIconFiles = @(
    "src/components/KYCVerification.tsx",
    "src/pages/admin/AdminRoutePermissions.tsx"
)

$checkIconErrors = 0
foreach ($file in $checkIconFiles) {
    if (Test-Path $file) {
        $content = Get-Content $file -Raw
        if ($content -match "CheckIcon" -and $content -notmatch "<CheckIcon") {
            Write-Host "  [ERROR] CheckIcon encontrado en imports pero no usado en $file" -ForegroundColor Red
            $checkIconErrors++
        }
    }
}

if ($checkIconErrors -eq 0) {
    Write-Host "  [OK] CheckIcon OK" -ForegroundColor Green
} else {
    $ERRORS += $checkIconErrors
}

# Verificar BookOpenIcon duplicado
Write-Host "  - Verificando BookOpenIcon duplicado..." -ForegroundColor Gray
$bookOpenFile = "src/components/agentJournal/AgentJournalWidget.tsx"
if (Test-Path $bookOpenFile) {
    $content = Get-Content $bookOpenFile -Raw
    # Contar imports de BookOpenIcon
    $importCount = ([regex]::Matches($content, "import.*BookOpenIcon")).Count
    if ($importCount -gt 1) {
        Write-Host "  [ERROR] BookOpenIcon duplicado encontrado ($importCount imports)" -ForegroundColor Red
        $ERRORS++
    } else {
        Write-Host "  [OK] BookOpenIcon OK" -ForegroundColor Green
    }
}

# Verificar XMarkIcon
Write-Host "  - Verificando XMarkIcon no usado..." -ForegroundColor Gray
$xMarkFiles = @(
    "src/components/opportunities/ContractDataRequestModal.tsx",
    "src/components/opportunities/RequestContractModal.tsx",
    "src/pages/CRMDashboardPage.tsx"
)

$xMarkErrors = 0
foreach ($file in $xMarkFiles) {
    if (Test-Path $file) {
        $content = Get-Content $file -Raw
        # Verificar si está en import pero no se usa como componente JSX
        if ($content -match "import.*XMarkIcon" -and $content -notmatch "<XMarkIcon") {
            Write-Host "  [ERROR] XMarkIcon encontrado en imports pero solo usado en placeholders en $file" -ForegroundColor Red
            $xMarkErrors++
        }
    }
}

if ($xMarkErrors -eq 0) {
    Write-Host "  [OK] XMarkIcon OK" -ForegroundColor Green
} else {
    $ERRORS += $xMarkErrors
}

Write-Host ""
if ($ERRORS -gt 0) {
    Write-Host "Se encontraron $ERRORS errores" -ForegroundColor Red
    Write-Host ""
    Write-Host "Por favor, corrige estos errores antes de hacer push a producción." -ForegroundColor Yellow
    exit 1
} else {
    Write-Host "✅ Todas las verificaciones pasaron" -ForegroundColor Green
    Write-Host ""
    Write-Host "🏗️  Ejecutando build de TypeScript..." -ForegroundColor Yellow
    npm run build
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "✅ Build exitoso - Listo para producción" -ForegroundColor Green
    } else {
        Write-Host ""
        Write-Host "❌ Build fallo" -ForegroundColor Red
        exit 1
    }
}
