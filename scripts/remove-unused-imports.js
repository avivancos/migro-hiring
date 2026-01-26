const fs = require('fs');
const path = require('path');

// Iconos que pueden estar importados pero no usados como componentes JSX
const ICONS_TO_CHECK = [
  'CheckIcon', 'XMarkIcon', 'PlusIcon', 'MinusIcon', 
  'ArrowUpIcon', 'ArrowDownIcon', 'TrashIcon', 'EditIcon',
];

function findUnusedImports(filePath, content) {
  const unused = new Set();
  
  // Buscar todos los imports de heroicons
  const importLines = [];
  const lines = content.split('\n');
  
  lines.forEach((line, index) => {
    if (line.trim().startsWith('import ') && line.includes('@heroicons')) {
      const moduleMatch = line.match(/from\s+['"](@heroicons\/react\/[^'"]+)['"]/);
      const importMatch = line.match(/import\s+{([^}]+)}\s+from/);
      
      if (moduleMatch && importMatch) {
        const module = moduleMatch[1];
        const items = importMatch[1]
          .split(',')
          .map(i => i.trim())
          .filter(Boolean);
        
        items.forEach(item => {
          // Verificar si el icono se usa como componente JSX: <IconName
          const jsxRegex = new RegExp(`<${item}(\\s|>)`, 'g');
          if (!jsxRegex.test(content)) {
            // Verificar si se usa como referencia en código (no solo en strings)
            // Buscar uso fuera de strings y comentarios
            const codeContent = content.split('\n')
              .map((l, i) => i === index ? '' : l) // Excluir la línea del import
              .join('\n');
            
            // Buscar uso como variable o componente
            const varRegex = new RegExp(`\\b${item}\\b`);
            // Verificar que no sea solo en un placeholder de texto
            const placeholderRegex = new RegExp(`['"](.*${item}.*)['"]`, 'g');
            const placeholders = [];
            let match;
            while ((match = placeholderRegex.exec(codeContent)) !== null) {
              placeholders.push(match[1]);
            }
            
            const inPlaceholder = placeholders.some(p => p.includes(item));
            
            if (!varRegex.test(codeContent) || inPlaceholder) {
              unused.add({ icon: item, module, lineIndex: index });
            }
          }
        });
      }
    }
  });
  
  return unused;
}

function removeUnusedImports(filePath) {
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  No existe: ${filePath}`);
    return false;
  }

  let content = fs.readFileSync(filePath, 'utf8');
  const original = content;

  // Encontrar imports no usados
  const unused = findUnusedImports(filePath, content);
  
  if (unused.size === 0) {
    return false;
  }

  // Agrupar por línea de import
  const unusedByLine = new Map();
  unused.forEach(({ icon, module, lineIndex }) => {
    const key = `${lineIndex}_${module}`;
    if (!unusedByLine.has(key)) {
      unusedByLine.set(key, { lineIndex, module, icons: [] });
    }
    unusedByLine.get(key).icons.push(icon);
  });

  // Remover imports no usados
  const lines = content.split('\n');
  unusedByLine.forEach(({ lineIndex, module, icons }) => {
    const line = lines[lineIndex];
    const importMatch = line.match(/import\s+{([^}]+)}\s+from/);
    
    if (importMatch) {
      const items = importMatch[1]
        .split(',')
        .map(i => i.trim())
        .filter(item => item && !icons.includes(item));
      
      if (items.length === 0) {
        // Si no quedan items, eliminar toda la línea
        lines[lineIndex] = '';
      } else {
        lines[lineIndex] = line.replace(/{[^}]+}/, `{ ${items.join(', ')} }`);
      }
    }
  });

  content = lines.filter(l => l !== '').join('\n');

  // Limpiar líneas vacías múltiples
  content = content.replace(/\n{3,}/g, '\n\n');
  
  // Limpiar líneas vacías al inicio
  content = content.replace(/^\n+/, '');

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
      if (!filePath.includes('iconMapping.ts') &&
          !filePath.includes('ClientesDashboard.tsx')) {
        fileList.push(filePath);
      }
    }
  });
  
  return fileList;
}

console.log('Eliminando imports no usados...\n');

const srcDir = path.join(__dirname, '..', 'src');
const files = findFiles(srcDir);

let fixed = 0;
files.forEach(file => {
  try {
    if (removeUnusedImports(file)) {
      fixed++;
      console.log(`✅ ${path.relative(srcDir, file)}`);
    }
  } catch (error) {
    console.error(`❌ Error en ${file}:`, error.message);
  }
});

console.log(`\n✅ ${fixed} archivos corregidos`);
