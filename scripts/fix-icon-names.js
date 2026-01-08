const fs = require('fs');
const path = require('path');

// Mapeo de nombres incorrectos a correctos
const ICON_NAME_FIXES = {
  'ExclamationXCircleIcon': 'ExclamationCircleIcon',
  'CheckXCircleIcon': 'CheckCircleIcon',
  'XXCircleIcon': 'XCircleIcon',
  'InformationXCircleIcon': 'InformationCircleIcon',
};

function fixFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  const original = content;

  // Reemplazar nombres incorrectos en imports
  Object.entries(ICON_NAME_FIXES).forEach(([wrong, correct]) => {
    // En imports
    const importRegex = new RegExp(`\\b${wrong}\\b`, 'g');
    content = content.replace(importRegex, correct);
    
    // En JSX
    const jsxRegex = new RegExp(`<${wrong}(\\s|>)`, 'g');
    content = content.replace(jsxRegex, `<${correct}$1`);
    
    // En usos como variables
    const varRegex = new RegExp(`\\b${wrong}\\b`, 'g');
    content = content.replace(varRegex, correct);
  });

  // Eliminar imports duplicados del mismo icono
  const lines = content.split('\n');
  const fixedLines = [];
  const seenIconImports = new Map(); // módulo -> Set de iconos

  lines.forEach(line => {
    if (line.trim().startsWith('import ') && line.includes('@heroicons')) {
      const moduleMatch = line.match(/from\s+['"](@heroicons\/react\/[^'"]+)['"]/);
      const importMatch = line.match(/import\s+{([^}]+)}\s+from/);
      
      if (moduleMatch && importMatch) {
        const module = moduleMatch[1];
        const items = importMatch[1]
          .split(',')
          .map(i => i.trim())
          .filter(Boolean);
        
        if (!seenIconImports.has(module)) {
          seenIconImports.set(module, new Set());
        }
        
        const existing = seenIconImports.get(module);
        items.forEach(item => existing.add(item));
        
        // Reconstruir la línea con todos los iconos únicos
        const uniqueItems = Array.from(existing).sort();
        const newLine = line.replace(/{[^}]+}/, `{ ${uniqueItems.join(', ')} }`);
        
        // Solo agregar si es la última línea de imports de este módulo
        // Buscar si hay más líneas de este módulo después
        let isLast = true;
        for (let i = lines.indexOf(line) + 1; i < lines.length; i++) {
          if (lines[i].includes(module)) {
            isLast = false;
            break;
          }
          if (lines[i].trim() && !lines[i].trim().startsWith('import')) {
            break;
          }
        }
        
        if (isLast) {
          fixedLines.push(newLine);
          return;
        }
      }
    }
    fixedLines.push(line);
  });

  content = fixedLines.join('\n');

  // Limpiar líneas vacías múltiples
  content = content.replace(/\n{3,}/g, '\n\n');

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    return true;
  }
  return false;
}

function findFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory() && !filePath.includes('node_modules')) {
      findFiles(filePath, fileList);
    } else if ((file.endsWith('.tsx') || file.endsWith('.ts')) && filePath.includes('src')) {
      // Excluir iconMapping.ts ya que es un archivo de configuración
      if (!filePath.includes('iconMapping.ts')) {
        fileList.push(filePath);
      }
    }
  });
  
  return fileList;
}

const srcDir = path.join(__dirname, '..', 'src');
const files = findFiles(srcDir);

console.log(`Corrigiendo nombres de iconos en ${files.length} archivos...\n`);

let fixed = 0;
files.forEach(file => {
  try {
    if (fixFile(file)) {
      fixed++;
      console.log(`✅ ${path.relative(srcDir, file)}`);
    }
  } catch (error) {
    console.error(`❌ Error en ${file}:`, error.message);
  }
});

console.log(`\n✅ ${fixed} archivos corregidos`);
