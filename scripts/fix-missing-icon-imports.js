const fs = require('fs');
const path = require('path');

// Lista de todos los iconos comunes de Heroicons que pueden usarse
// Este script detecta automáticamente qué iconos se usan en el código
// y verifica que estén importados correctamente
const HEROICON_NAMES = [
  'ArrowPathIcon', 'ArrowDownTrayIcon', 'HomeIcon', 'XCircleIcon', 'EyeIcon',
  'PlusIcon', 'UserIcon', 'FlagIcon', 'ExclamationCircleIcon', 'ArrowRightIcon',
  'CheckCircleIcon', 'ClockIcon', 'DocumentTextIcon', 'XMarkIcon', 'CalendarIcon',
  'PhoneIcon', 'EnvelopeIcon', 'CheckIcon', 'TrashIcon', 'PencilIcon',
  'ArrowLeftIcon', 'ArrowUpIcon', 'ArrowDownIcon', 'ChevronLeftIcon', 'ChevronRightIcon',
  'ChevronDownIcon', 'ChevronUpIcon', 'MinusIcon', 'MagnifyingGlassIcon', 'UsersIcon',
  'SettingsIcon', 'LogOutIcon', 'FilterIcon', 'StarIcon', 'BuildingOffice2Icon',
  'CurrencyDollarIcon', 'ChartBarIcon', 'InformationCircleIcon', 'ArrowPathIcon',
  'DocumentDuplicateIcon', 'LockClosedIcon', 'LockOpenIcon', 'EyeSlashIcon',
  'ChatBubbleLeftRightIcon', 'ChatBubbleLeftIcon', 'PaperAirplaneIcon', 'ListBulletIcon',
  'Squares2X2Icon', 'Bars3Icon', 'ShareIcon', 'LightBulbIcon', 'SparklesIcon',
  'CommandLineIcon', 'EllipsisVerticalIcon', 'BriefcaseIcon', 'KeyIcon',
  'ArrowTrendingUpIcon', 'EllipsisHorizontalIcon', 'BookOpenIcon', 'PlayIcon',
  'PauseIcon', 'CheckSquareIcon', 'BellIcon', 'CurrencyEuroIcon', 'LinkIcon',
  'GlobeAltIcon', 'CodeBracketIcon', 'ServerIcon', 'ExclamationTriangleIcon',
];

// Mapeo de módulos comunes
const MODULE_MAP = {
  '@heroicons/react/24/outline': HEROICON_NAMES,
  '@heroicons/react/24/solid': ['CheckCircleIcon'], // Agregar más según sea necesario
};

function fixFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  const original = content;
  
  // Encontrar todos los iconos usados en el archivo
  const usedIcons = new Map(); // iconName -> module
  
  // Primero verificar qué imports ya existen
  const existingImports = new Map();
  const lines = content.split('\n');
  lines.forEach(line => {
    if (line.trim().startsWith('import ') && line.includes('@heroicons')) {
      const moduleMatch = line.match(/from\s+['"](@heroicons\/react\/[^'"]+)['"]/);
      const importMatch = line.match(/import\s+{([^}]+)}\s+from/);
      if (moduleMatch && importMatch) {
        const module = moduleMatch[1];
        const items = importMatch[1].split(',').map(i => i.trim()).filter(Boolean);
        items.forEach(item => {
          if (!existingImports.has(item)) {
            existingImports.set(item, module);
          }
        });
      }
    }
  });
  
  // Buscar todos los iconos Heroicons usados (como componentes JSX)
  HEROICON_NAMES.forEach(iconName => {
    // Buscar uso del icono como componente JSX: <IconName
    const jsxRegex = new RegExp(`<${iconName}(\\s|>)`, 'g');
    if (jsxRegex.test(content)) {
      // Si ya está importado, usar el mismo módulo
      if (existingImports.has(iconName)) {
        usedIcons.set(iconName, existingImports.get(iconName));
      } else {
        // Detectar el módulo basado en cómo se usa
        // CheckCircleIcon puede estar en solid si se usa con colores sólidos
        const module = iconName === 'CheckCircleIcon' && content.includes('text-green') 
          ? '@heroicons/react/24/solid' 
          : '@heroicons/react/24/outline';
        usedIcons.set(iconName, module);
      }
    }
  });

  if (usedIcons.size === 0) {
    return false; // No hay iconos para agregar
  }

  // Encontrar todos los imports existentes de heroicons
  const heroIconImports = new Map();
  const importLineIndices = new Map(); // module -> lineIndex
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
        
        if (!heroIconImports.has(module)) {
          heroIconImports.set(module, new Set());
          importLineIndices.set(module, index);
        }
        
        items.forEach(item => heroIconImports.get(module).add(item));
      }
    }
  });

  // Verificar qué iconos faltan
  const missingIcons = new Map();
  usedIcons.forEach((module, iconName) => {
    const existing = heroIconImports.get(module);
    
    if (!existing || !existing.has(iconName)) {
      if (!missingIcons.has(module)) {
        missingIcons.set(module, []);
      }
      missingIcons.get(module).push(iconName);
    }
  });

  if (missingIcons.size === 0) {
    return false; // Todos los iconos ya están importados
  }

  // Agregar los iconos faltantes
  if (missingIcons.size > 0) {
    const newLines = [...lines];
    missingIcons.forEach((iconNames, module) => {
      const existing = heroIconImports.get(module) || new Set();
      const allIcons = [...Array.from(existing), ...iconNames].sort();
      const importLine = `import { ${allIcons.join(', ')} } from '${module}';`;
      
      // Buscar la línea del import de este módulo y reemplazarla
      const lineIndex = importLineIndices.get(module);
      if (lineIndex !== undefined) {
        newLines[lineIndex] = importLine;
      } else {
        // Crear nuevo import si no existe
        // Buscar dónde insertar (después de otros imports)
        let insertIndex = 0;
        for (let i = 0; i < newLines.length; i++) {
          if (newLines[i].trim().startsWith('import ')) {
            insertIndex = i + 1;
          } else if (insertIndex > 0 && newLines[i].trim() === '') {
            break;
          } else if (insertIndex === 0 && newLines[i].trim() && !newLines[i].trim().startsWith('import ')) {
            break;
          }
        }
        newLines.splice(insertIndex, 0, importLine);
      }
    });
    content = newLines.join('\n');
  }

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

console.log(`Verificando imports de iconos en ${files.length} archivos...\n`);

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
