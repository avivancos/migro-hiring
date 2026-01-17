#!/usr/bin/env node

/**
 * Script para generar reporte de tests de formularios
 * Ejecuta todos los tests de formularios y genera un reporte detallado
 * indicando qué campos fallan y dónde
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const FORM_TESTS = [
  'src/components/CRM/__tests__/ContactForm.test.tsx',
  'src/components/CRM/__tests__/CallForm.test.tsx',
  'src/components/CRM/__tests__/NoteForm.test.tsx',
  'src/components/CRM/__tests__/TaskForm.test.tsx',
  'src/components/CRM/__tests__/LeadForm.test.tsx',
  'src/components/CRM/__tests__/CompanyForm.test.tsx',
  'src/components/expedientes/__tests__/ExpedienteForm.test.tsx',
];

const REPORT_DIR = path.join(process.cwd(), 'test-reports');
const REPORT_FILE = path.join(REPORT_DIR, `forms-test-report-${Date.now()}.json`);
const HTML_REPORT = path.join(REPORT_DIR, 'forms-test-report.html');

// Crear directorio de reportes si no existe
if (!fs.existsSync(REPORT_DIR)) {
  fs.mkdirSync(REPORT_DIR, { recursive: true });
}

console.log('🧪 Ejecutando tests de formularios...\n');

const results = {
  timestamp: new Date().toISOString(),
  forms: [],
  summary: {
    total: 0,
    passed: 0,
    failed: 0,
    skipped: 0,
  },
};

// Ejecutar tests para cada formulario
for (const testFile of FORM_TESTS) {
  const formName = path.basename(testFile, '.test.tsx').replace('Form', '');
  console.log(`📋 Testing ${formName}...`);
  
  try {
    // Capturar toda la salida (stdout y stderr)
    let output = '';
    let exitCode = 0;
    
    try {
      const result = execSync(`npm test -- ${testFile} --run 2>&1`, {
        encoding: 'utf-8',
        stdio: 'pipe',
        timeout: 120000, // 2 minutos
        killSignal: 'SIGTERM',
      });
      output = result.toString();
    } catch (err) {
      // Si el comando falla (tests fallaron), capturar toda la salida
      output = (err.stdout || err.stderr || err.message || '').toString();
      exitCode = err.status || 1;
      
      // Si hay más salida en el error, capturarla también
      if (err.output) {
        output = err.output.map(o => o ? o.toString() : '').join('\n') + '\n' + output;
      }
    }
    
    // Guardar salida completa para debugging
    const debugFile = path.join(REPORT_DIR, `${formName}-debug.log`);
    fs.writeFileSync(debugFile, output);
    
    // Parsear salida JSON de vitest si está disponible
    let parsedResults = null;
    const lines = output.split('\n');
    for (const line of lines) {
      if (line.trim().startsWith('{') && (line.includes('testFiles') || line.includes('numPassingTests'))) {
        try {
          parsedResults = JSON.parse(line);
          break;
        } catch (e) {
          // Continuar buscando
        }
      }
    }
    
    // Si no hay JSON, parsear salida de texto
    if (!parsedResults || !parsedResults.testFiles) {
      // Buscar en formato vitest: "Test Files  1 passed (1)" y "Tests  4 passed (4)"
      // Mejorar regex para capturar múltiples formatos
      const testFilesMatch = output.match(/Test Files\s+(\d+)\s+(?:passed|failed)(?:\s+\((\d+)\))?/);
      const testsMatch = output.match(/Tests\s+(\d+)\s+passed(?:.*?(\d+)\s+failed)?(?:.*?(\d+)\s+skipped)?/);
      
      // También buscar formato: "✓ file.tsx (4 tests)"
      const singleFileMatch = output.match(/[✓×]\s+\S+\.test\.tsx\s+\((\d+)\s+tests(?:.*?(\d+)\s+failed)?\)/);
      
      let passedTests = 0;
      let failedTests = 0;
      let skippedTests = 0;
      let totalTests = 0;
      
      if (testsMatch) {
        passedTests = parseInt(testsMatch[1] || '0', 10);
        failedTests = parseInt(testsMatch[2] || '0', 10);
        skippedTests = parseInt(testsMatch[3] || '0', 10);
        totalTests = passedTests + failedTests + skippedTests;
      } else if (singleFileMatch) {
        totalTests = parseInt(singleFileMatch[1] || '0', 10);
        failedTests = parseInt(singleFileMatch[2] || '0', 10);
        passedTests = totalTests - failedTests;
      }
      
      // Si no se encontró nada pero hay exit code, usar eso
      if (totalTests === 0 && exitCode !== 0) {
        failedTests = 1; // Asumir que falló si no se pudo parsear
        totalTests = 1;
      }
      
      parsedResults = {
        testFiles: [{
          numPassingTests: passedTests,
          numFailingTests: failedTests,
          numPendingTests: skippedTests,
          tests: []
        }]
      };
      
      // Buscar tests que fallaron en la salida con mejor parsing
      const failedTestsList = [];
      let collectingFailure = false;
      let currentTestName = '';
      let errorLines = [];
      let inFailureBlock = false;
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        
        // Detectar inicio de test fallido - múltiples formatos
        if (line.includes('×') || (line.includes('FAIL') && line.includes('Test')) || line.includes('Failed Tests')) {
          // Extraer nombre del test de diferentes formatos
          const nameMatch = line.match(/>\s*(.+?)(?:\s+\(\d+ms\)|\s*$)/) ||
                           line.match(/(.+?)\s+→\s+/) ||
                           line.match(/\s+(.+?)$/);
          
          if (nameMatch && nameMatch[1] && nameMatch[1].trim() !== '') {
            // Guardar test anterior si existe
            if (currentTestName && errorLines.length > 0) {
              failedTestsList.push({
                name: currentTestName,
                error: errorLines.join('\n').substring(0, 1000),
                fullError: errorLines.join('\n'),
              });
            }
            currentTestName = nameMatch[1].trim();
            errorLines = [];
            collectingFailure = true;
            inFailureBlock = true;
          }
        }
        
        // Colectar líneas de error - más exhaustivo
        if (collectingFailure && currentTestName) {
          // Capturar cualquier línea que parezca un error
          if (line.includes('AssertionError') || 
              line.includes('expected') || 
              line.includes('toHaveProperty') || 
              line.includes('Error:') ||
              line.includes('TypeError') ||
              line.includes('ReferenceError') ||
              line.includes('at ') ||
              (inFailureBlock && line.trim() !== '' && !line.match(/^\s*$/))) {
            errorLines.push(line.trim());
          }
          
          // Detectar fin de bloque de error
          if (line.match(/^Test Files|^Tests\s+\d+|^Duration/) && errorLines.length > 0) {
            collectingFailure = false;
            inFailureBlock = false;
          }
        }
      }
      
      // Agregar último test si queda pendiente
      if (currentTestName && errorLines.length > 0) {
        failedTestsList.push({
          name: currentTestName,
          error: errorLines.join('\n').substring(0, 1000),
          fullError: errorLines.join('\n'),
        });
      }
      
      parsedResults.testFiles[0].tests = failedTestsList.map(t => ({
        status: 'failed',
        name: t.name,
        error: { message: t.error },
        fullError: t.fullError
      }));
    }
    
    if (parsedResults && parsedResults.testFiles && parsedResults.testFiles.length > 0) {
      const testFileResult = parsedResults.testFiles[0];
      const formResult = {
        name: formName,
        file: testFile,
        status: (testFileResult.numFailingTests || 0) === 0 ? 'passed' : 'failed',
        tests: {
          total: (testFileResult.numPassingTests || 0) + (testFileResult.numFailingTests || 0) + (testFileResult.numPendingTests || 0) || 1,
          passed: testFileResult.numPassingTests || 0,
          failed: testFileResult.numFailingTests || 0,
          skipped: testFileResult.numPendingTests || 0,
        },
        failures: (testFileResult.tests || [])
          .filter(t => t.status === 'failed')
          .map(t => ({
            name: t.name || 'Unknown test',
            error: t.error?.message || t.error || (typeof t.error === 'string' ? t.error : 'Unknown error'),
            fullError: t.fullError || t.error?.message || t.error || (typeof t.error === 'string' ? t.error : ''),
            location: t.location?.file || testFile,
          })),
        debugLog: output.substring(0, 10000), // Primeros 10KB de logs
        fullOutput: output.length < 50000 ? output : output.substring(0, 50000) + '\n... (truncated)',
      };
      
      results.forms.push(formResult);
      results.summary.total += formResult.tests.total;
      results.summary.passed += formResult.tests.passed;
      results.summary.failed += formResult.tests.failed;
      results.summary.skipped += formResult.tests.skipped;
      
      const status = formResult.status === 'passed' ? '✅' : formResult.status === 'failed' ? '❌' : '⚠️';
      console.log(`  ${status} ${formResult.tests.passed}/${formResult.tests.total} tests passed`);
      
      if (formResult.failures.length > 0) {
        console.log(`  ⚠️  ${formResult.failures.length} test(s) failed:`);
        formResult.failures.forEach(f => {
          const errorPreview = f.error ? f.error.substring(0, 150).replace(/\n/g, ' ') : 'Sin detalles de error';
          console.log(`     - ${f.name}`);
          console.log(`       Error: ${errorPreview}`);
        });
        console.log(`  📄 Log completo guardado en: ${debugFile}`);
      } else if (formResult.tests.total === 0) {
        console.log(`  ⚠️  No se pudieron parsear los resultados. Ver log: ${debugFile}`);
      }
    } else {
      // Si no se pudo parsear, registrar como error pero continuar
      console.log(`  ⚠️  No se pudo parsear el resultado`);
      results.forms.push({
        name: formName,
        file: testFile,
        status: 'unknown',
        tests: { total: 0, passed: 0, failed: 0, skipped: 0 },
        failures: [],
      });
    }
  } catch (error) {
    console.error(`  ❌ Error ejecutando tests para ${formName}:`, error.message);
    results.forms.push({
      name: formName,
      file: testFile,
      status: 'error',
      error: error.message,
      tests: { total: 0, passed: 0, failed: 0, skipped: 0 },
    });
  }
}

// Guardar reporte JSON
fs.writeFileSync(REPORT_FILE, JSON.stringify(results, null, 2));

// Generar reporte HTML
const html = generateHTMLReport(results);
fs.writeFileSync(HTML_REPORT, html);

console.log(`\n📊 Reporte guardado en:`);
console.log(`   JSON: ${REPORT_FILE}`);
console.log(`   HTML: ${HTML_REPORT}`);

console.log(`\n📈 Resumen:`);
console.log(`   Total de tests: ${results.summary.total}`);
console.log(`   ✅ Pasados: ${results.summary.passed}`);
console.log(`   ❌ Fallidos: ${results.summary.failed}`);
console.log(`   ⏭️  Omitidos: ${results.summary.skipped}`);

function escapeHtml(text) {
  if (!text) return '';
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.toString().replace(/[&<>"']/g, m => map[m]);
}

function generateHTMLReport(results) {
  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reporte de Tests de Formularios</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      margin: 0;
      padding: 20px;
      background: #f5f5f5;
    }
    .container {
      max-width: 1200px;
      margin: 0 auto;
      background: white;
      padding: 30px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    h1 {
      color: #333;
      border-bottom: 3px solid #4CAF50;
      padding-bottom: 10px;
    }
    .summary {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      margin: 30px 0;
    }
    .summary-card {
      padding: 20px;
      border-radius: 8px;
      text-align: center;
    }
    .summary-card.total { background: #e3f2fd; }
    .summary-card.passed { background: #e8f5e9; }
    .summary-card.failed { background: #ffebee; }
    .summary-card.skipped { background: #fff3e0; }
    .summary-card h3 {
      margin: 0 0 10px 0;
      font-size: 2em;
      color: #333;
    }
    .summary-card p {
      margin: 0;
      color: #666;
    }
    .form-section {
      margin: 30px 0;
      padding: 20px;
      border: 1px solid #ddd;
      border-radius: 8px;
    }
    .form-section.passed { border-left: 5px solid #4CAF50; }
    .form-section.failed { border-left: 5px solid #f44336; }
    .form-section.error { border-left: 5px solid #ff9800; }
    .form-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 15px;
    }
    .form-name {
      font-size: 1.3em;
      font-weight: bold;
      color: #333;
    }
    .status-badge {
      padding: 5px 15px;
      border-radius: 20px;
      font-size: 0.9em;
      font-weight: bold;
    }
    .status-badge.passed { background: #4CAF50; color: white; }
    .status-badge.failed { background: #f44336; color: white; }
    .status-badge.error { background: #ff9800; color: white; }
    .test-results {
      margin-top: 15px;
    }
    .test-item {
      padding: 10px;
      margin: 5px 0;
      border-radius: 4px;
      background: #f9f9f9;
    }
    .test-item.failed {
      background: #ffebee;
      border-left: 3px solid #f44336;
    }
    .test-item h4 {
      margin: 0 0 5px 0;
      color: #333;
    }
    .test-item .error {
      color: #d32f2f;
      font-size: 0.9em;
      font-family: 'Courier New', monospace;
    }
    .timestamp {
      color: #999;
      font-size: 0.9em;
      margin-top: 30px;
      text-align: center;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>🧪 Reporte de Tests de Formularios</h1>
    
    <div class="summary">
      <div class="summary-card total">
        <h3>${results.summary.total}</h3>
        <p>Total de Tests</p>
      </div>
      <div class="summary-card passed">
        <h3>${results.summary.passed}</h3>
        <p>✅ Pasados</p>
      </div>
      <div class="summary-card failed">
        <h3>${results.summary.failed}</h3>
        <p>❌ Fallidos</p>
      </div>
      <div class="summary-card skipped">
        <h3>${results.summary.skipped}</h3>
        <p>⏭️ Omitidos</p>
      </div>
    </div>
    
    ${results.forms.map(form => `
      <div class="form-section ${form.status}">
        <div class="form-header">
          <div class="form-name">📋 ${form.name}</div>
          <span class="status-badge ${form.status}">${form.status === 'passed' ? '✅ Pasado' : form.status === 'failed' ? '❌ Fallido' : '⚠️ Error'}</span>
        </div>
        ${form.tests ? `
          <div class="test-results">
            <p><strong>Tests:</strong> ${form.tests.passed}/${form.tests.total} pasados</p>
            ${form.failures && form.failures.length > 0 ? `
              <h4>Fallos detectados:</h4>
              ${form.failures.map(f => `
                <div class="test-item failed">
                  <h4>${f.name}</h4>
                  <div class="error">${f.error || 'Error desconocido'}</div>
                  ${f.fullError && f.fullError !== f.error ? `
                    <details style="margin-top: 10px;">
                      <summary style="cursor: pointer; color: #1976d2; font-weight: bold;">Ver error completo</summary>
                      <pre style="background: #f5f5f5; padding: 10px; border-radius: 4px; overflow-x: auto; margin-top: 5px;">${escapeHtml(f.fullError)}</pre>
                    </details>
                  ` : ''}
                  <div style="font-size: 0.8em; color: #666; margin-top: 5px;">${f.location || form.file}</div>
                </div>
              `).join('')}
            ` : ''}
          </div>
        ` : ''}
        ${form.error ? `
          <div class="test-item failed">
            <h4>Error al ejecutar tests</h4>
            <div class="error">${escapeHtml(form.error)}</div>
          </div>
        ` : ''}
        ${form.debugLog ? `
          <details style="margin-top: 15px;">
            <summary style="cursor: pointer; color: #1976d2; font-weight: bold;">📄 Ver logs de debug</summary>
            <pre style="background: #f5f5f5; padding: 10px; border-radius: 4px; overflow-x: auto; margin-top: 5px; max-height: 400px; overflow-y: auto;">${escapeHtml(form.debugLog)}</pre>
          </details>
        ` : ''}
      </div>
    `).join('')}
    
    <div class="timestamp">
      Generado el ${new Date(results.timestamp).toLocaleString('es-ES')}
    </div>
  </div>
</body>
</html>
  `;
}
