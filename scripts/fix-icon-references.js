const fs = require('fs');
const path = require('path');

// Mapeo de referencias de iconos que se usan como variables
const ICON_VAR_MAPPING = {
  'Phone': 'PhoneIcon',
  'Mail': 'EnvelopeIcon',
  'Calendar': 'CalendarIcon',
  'FileText': 'DocumentTextIcon',
  'Users': 'UsersIcon',
  'CheckSquare': 'CheckSquareIcon',
  'StickyNote': 'DocumentTextIcon',
  'FileCheck': 'DocumentCheckIcon',
  'Settings': 'Cog6ToothIcon',
  'LayoutDashboard': 'Squares2X2Icon',
  'TrendingUp': 'ArrowTrendingUpIcon',
  'PhoneIncoming': 'PhoneIcon',
  'PhoneOutgoing': 'PhoneIcon',
  'PhoneMissed': 'PhoneXMarkIcon',
  'PhoneCall': 'PhoneIcon',
  'Clock': 'ClockIcon',
  'CheckCircle2': 'CheckCircleIcon',
  'Activity': 'ChartBarIcon',
  'ChartBarIcon': 'ChartBarIcon',
  'Bell': 'BellIcon',
  'AlertTriangle': 'ExclamationTriangleIcon',
  'X': 'XMarkIcon',
  'Check': 'CheckIcon',
  'Pencil': 'PencilIcon',
  'LinkIcon': 'LinkIcon',
  'Euro': 'CurrencyEuroIcon',
  'List': 'ListBulletIcon',
  'BarChart3': 'ChartBarIcon',
  'Code': 'CodeBracketIcon',
  'Server': 'ServerIcon',
  'Globe': 'GlobeAltIcon',
  'MessageSquare': 'ChatBubbleLeftIcon',
};

function fixFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  const original = content;

  // Eliminar referencias a LucideIcons
  content = content.replace(/const\s*{\s*Activity\s*}\s*=\s*LucideIcons;?\s*/g, '');
  content = content.replace(/\/\/\s*TODO:.*LucideIcons.*\n/g, '');
  content = content.replace(/\/\/\s*import\s*\*\s*as\s*LucideIcons.*\n/g, '');

  // Reemplazar referencias a iconos como variables
  Object.entries(ICON_VAR_MAPPING).forEach(([lucide, heroicon]) => {
    // Reemplazar en returns de funciones
    const returnRegex = new RegExp(`return\\s+${lucide}([^a-zA-Z]|$)`, 'g');
    content = content.replace(returnRegex, `return ${heroicon}$1`);
    
    // Reemplazar en asignaciones
    const assignRegex = new RegExp(`(icon|IconComponent|iconComponent)\\s*=\\s*${lucide}([^a-zA-Z]|$)`, 'g');
    content = content.replace(assignRegex, `$1 = ${heroicon}$2`);
    
    // Reemplazar en ternarios y comparaciones
    const ternaryRegex = new RegExp(`([?:]\\s*)${lucide}([^a-zA-Z]|$)`, 'g');
    content = content.replace(ternaryRegex, `$1${heroicon}$2`);
    
    // Reemplazar en JSX como componente
    const jsxRegex = new RegExp(`<${lucide}(\\s|>)`, 'g');
    content = content.replace(jsxRegex, `<${heroicon}$1`);
    
    // Reemplazar en objetos (icon: IconName)
    const objRegex = new RegExp(`(icon|Icon):\\s*${lucide}([,}])`, 'g');
    content = content.replace(objRegex, `$1: ${heroicon}$2`);
  });

  // Corregir iconos específicos que no existen
  content = content.replace(/CircleIcon/g, 'XCircleIcon'); // CircleIcon no existe, usar XCircleIcon
  content = content.replace(/UserCheckIcon/g, 'UserIcon'); // No existe en outline, usar UserIcon
  content = content.replace(/UserXMarkIcon/g, 'UserIcon'); // No existe en outline
  content = content.replace(/Bars3VerticalIcon/g, 'EllipsisVerticalIcon'); // Nombre incorrecto
  content = content.replace(/PhoneArrowIncomingIcon/g, 'PhoneIcon'); // No existe
  content = content.replace(/PhoneArrowOutgoingIcon/g, 'PhoneIcon'); // No existe

  // Eliminar imports duplicados
  const importLines = content.split('\n');
  const seenImports = new Set();
  const fixedImports = [];
  let inImport = false;
  let currentImport = '';

  importLines.forEach((line, index) => {
    if (line.trim().startsWith('import ') && line.includes('@heroicons')) {
      if (line.includes('from')) {
        // Import completo
        const importKey = line.trim();
        if (!seenImports.has(importKey)) {
          seenImports.add(importKey);
          // Limpiar duplicados dentro del mismo import
          const importMatch = line.match(/import\s+{([^}]+)}\s+from/);
          if (importMatch) {
            const items = importMatch[1].split(',').map(i => i.trim());
            const uniqueItems = [...new Set(items)];
            const newLine = line.replace(/{[^}]+}/, `{ ${uniqueItems.join(', ')} }`);
            fixedImports.push(newLine);
          } else {
            fixedImports.push(line);
          }
        }
        inImport = false;
        currentImport = '';
      } else {
        // Continuación de import multi-línea
        if (!inImport) {
          inImport = true;
          currentImport = line;
        } else {
          currentImport += '\n' + line;
        }
      }
    } else {
      if (inImport && line.trim().startsWith('}')) {
        currentImport += '\n' + line;
        if (!seenImports.has(currentImport.trim())) {
          seenImports.add(currentImport.trim());
          fixedImports.push(currentImport);
        }
        inImport = false;
        currentImport = '';
      } else if (inImport) {
        currentImport += '\n' + line;
      } else {
        fixedImports.push(line);
      }
    }
  });

  // Agregar imports faltantes si se usan
  const importsToAdd = new Set();
  Object.values(ICON_VAR_MAPPING).forEach(icon => {
    if (content.includes(icon) && !content.includes(`import.*${icon}.*from.*@heroicons`)) {
      importsToAdd.add(icon);
    }
  });

  // Corregir tamaño de props (size -> width/height)
  content = content.replace(/size=\\{(\d+)\\}/g, 'width={$1} height={$1}');

  if (content !== original || fixedImports.length !== importLines.length) {
    const newContent = fixedImports.join('\n');
    // Agregar imports faltantes al principio después de otros imports
    if (importsToAdd.size > 0) {
      const importSection = newContent.match(/(import[^;]+;[\s\S]*?)(?=\n(?!import)|$)/);
      if (importSection) {
        const heroIconsImports = Array.from(importsToAdd).join(', ');
        const newImports = newContent.replace(
          /(import.*@heroicons[^;]+;)/,
          `$1\nimport { ${heroIconsImports} } from '@heroicons/react/24/outline';`
        );
        return newImports;
      }
    }
    return newContent;
  }

  return content;
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

console.log(`Corrigiendo ${files.length} archivos...\n`);

let fixed = 0;
files.forEach(file => {
  try {
    const original = fs.readFileSync(file, 'utf8');
    const fixedContent = fixFile(file);
    if (fixedContent !== original) {
      fs.writeFileSync(file, fixedContent, 'utf8');
      fixed++;
      console.log(`✅ Corregido: ${path.relative(srcDir, file)}`);
    }
  } catch (error) {
    console.error(`❌ Error en ${file}:`, error.message);
  }
});

console.log(`\n✅ ${fixed} archivos corregidos`);
