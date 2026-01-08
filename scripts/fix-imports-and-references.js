const fs = require('fs');
const path = require('path');

function fixFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  const original = content;

  // 1. Eliminar imports duplicados dentro de la misma línea
  const lines = content.split('\n');
  const fixedLines = [];
  const seenImports = new Map(); // Para rastrear imports por módulo

  lines.forEach((line, lineIndex) => {
    if (line.trim().startsWith('import ') && line.includes('@heroicons')) {
      // Extraer el módulo
      const moduleMatch = line.match(/from\s+['"](@heroicons\/react\/[^'"]+)['"]/);
      if (moduleMatch) {
        const module = moduleMatch[1];
        const importMatch = line.match(/import\s+{([^}]+)}\s+from/);
        if (importMatch) {
          const items = importMatch[1]
            .split(',')
            .map(i => i.trim())
            .filter(Boolean);
          
          // Eliminar duplicados
          const uniqueItems = [...new Set(items)];
          
          if (seenImports.has(module)) {
            // Combinar con imports anteriores del mismo módulo
            const existing = seenImports.get(module);
            const combined = [...new Set([...existing, ...uniqueItems])];
            seenImports.set(module, combined);
            // Actualizar la línea anterior con todos los iconos combinados
            // Buscar la línea anterior del mismo módulo
            for (let i = fixedLines.length - 1; i >= 0; i--) {
              if (fixedLines[i].includes(module)) {
                const moduleMatch2 = fixedLines[i].match(/from\s+['"](@heroicons\/react\/[^'"]+)['"]/);
                if (moduleMatch2 && moduleMatch2[1] === module) {
                  fixedLines[i] = fixedLines[i].replace(/{[^}]+}/, `{ ${combined.sort().join(', ')} }`);
                  break;
                }
              }
            }
            // No agregar esta línea duplicada
            return;
          } else {
            seenImports.set(module, uniqueItems);
            const newLine = line.replace(/{[^}]+}/, `{ ${uniqueItems.sort().join(', ')} }`);
            fixedLines.push(newLine);
            return;
          }
        }
      }
    }
    fixedLines.push(line);
  });

  content = fixedLines.join('\n');

  // 2. Agregar imports faltantes para iconos usados
  const iconUsageMap = {
    'BookOpen': 'BookOpenIcon',
    'BookOpenIcon': 'BookOpenIcon',
  };

  // Buscar usos de iconos sin import
  Object.entries(iconUsageMap).forEach(([oldName, newName]) => {
    if (content.includes(`<${oldName}`) || content.includes(`${oldName}Icon`)) {
      // Verificar si ya está importado
      if (!content.includes(newName) || !content.includes(`import.*${newName}.*from.*@heroicons`)) {
        // Agregar import después de otros imports de heroicons
        const heroIconImportRegex = /(import\s+{[^}]+}\s+from\s+['"]@heroicons\/react\/[^'"]+['"];)/;
        const match = content.match(heroIconImportRegex);
        if (match) {
          // Agregar al import existente
          content = content.replace(
            heroIconImportRegex,
            (m, importLine) => {
              const itemsMatch = importLine.match(/import\s+{([^}]+)}/);
              if (itemsMatch) {
                const items = itemsMatch[1].split(',').map(i => i.trim()).filter(Boolean);
                if (!items.includes(newName)) {
                  items.push(newName);
                  return importLine.replace(/{[^}]+}/, `{ ${items.join(', ')} }`);
                }
              }
              return importLine;
            }
          );
        } else {
          // Crear nuevo import
          const firstImportIndex = content.indexOf('import ');
          if (firstImportIndex !== -1) {
            const beforeImports = content.substring(0, firstImportIndex);
            const afterImports = content.substring(firstImportIndex);
            content = beforeImports + `import { ${newName} } from '@heroicons/react/24/outline';\n` + afterImports;
          }
        }
      }
    }
  });

  // 3. Reemplazar BookOpen por BookOpenIcon en JSX
  content = content.replace(/<BookOpen(\s|>)/g, '<BookOpenIcon$1');

  // 4. Reemplazar tamaño de props
  content = content.replace(/size=\\{(\d+)\\}/g, 'width={$1} height={$1}');

  // 5. Limpiar imports vacíos o comentarios de lucide
  content = content.replace(/\/\/\s*TODO:.*\n/g, '');
  content = content.replace(/\/\/\s*import.*lucide.*\n/gi, '');

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

console.log(`Limpiando imports y referencias en ${files.length} archivos...\n`);

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
