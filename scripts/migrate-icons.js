#!/usr/bin/env node
/**
 * Script para migrar iconos de lucide-react a @heroicons/react
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Mapeo de iconos lucide -> heroicons
const ICON_MAPPING = {
  'Search': { name: 'MagnifyingGlassIcon', path: 'outline' },
  'Home': { name: 'HomeIcon', path: 'outline' },
  'User': { name: 'UserIcon', path: 'outline' },
  'Users': { name: 'UsersIcon', path: 'outline' },
  'UserPlus': { name: 'UserPlusIcon', path: 'outline' },
  'Mail': { name: 'EnvelopeIcon', path: 'outline' },
  'Phone': { name: 'PhoneIcon', path: 'outline' },
  'PhoneIncoming': { name: 'PhoneArrowIncomingIcon', path: 'outline' },
  'PhoneOutgoing': { name: 'PhoneArrowOutgoingIcon', path: 'outline' },
  'PhoneMissed': { name: 'PhoneXMarkIcon', path: 'outline' },
  'PhoneCall': { name: 'PhoneIcon', path: 'outline' },
  'Calendar': { name: 'CalendarIcon', path: 'outline' },
  'Clock': { name: 'ClockIcon', path: 'outline' },
  'Check': { name: 'CheckIcon', path: 'outline' },
  'CheckCircle': { name: 'CheckCircleIcon', path: 'outline' },
  'CheckCircle2': { name: 'CheckCircleIcon', path: 'solid' },
  'X': { name: 'XMarkIcon', path: 'outline' },
  'XCircle': { name: 'XCircleIcon', path: 'outline' },
  'Edit': { name: 'PencilIcon', path: 'outline' },
  'Edit2': { name: 'PencilSquareIcon', path: 'outline' },
  'Trash2': { name: 'TrashIcon', path: 'outline' },
  'Save': { name: 'ArrowDownTrayIcon', path: 'outline' },
  'Download': { name: 'ArrowDownTrayIcon', path: 'outline' },
  'Upload': { name: 'ArrowUpTrayIcon', path: 'outline' },
  'ArrowLeft': { name: 'ArrowLeftIcon', path: 'outline' },
  'ArrowRight': { name: 'ArrowRightIcon', path: 'outline' },
  'ArrowUp': { name: 'ArrowUpIcon', path: 'outline' },
  'ArrowDown': { name: 'ArrowDownIcon', path: 'outline' },
  'ArrowUpDown': { name: 'ArrowsUpDownIcon', path: 'outline' },
  'ChevronLeft': { name: 'ChevronLeftIcon', path: 'outline' },
  'ChevronRight': { name: 'ChevronRightIcon', path: 'outline' },
  'ChevronDown': { name: 'ChevronDownIcon', path: 'outline' },
  'ChevronUp': { name: 'ChevronUpIcon', path: 'outline' },
  'Plus': { name: 'PlusIcon', path: 'outline' },
  'Minus': { name: 'MinusIcon', path: 'outline' },
  'FileText': { name: 'DocumentTextIcon', path: 'outline' },
  'FileCheck': { name: 'DocumentCheckIcon', path: 'outline' },
  'File': { name: 'DocumentIcon', path: 'outline' },
  'Image': { name: 'PhotoIcon', path: 'outline' },
  'Shield': { name: 'ShieldCheckIcon', path: 'outline' },
  'CreditCard': { name: 'CreditCardIcon', path: 'outline' },
  'Settings': { name: 'Cog6ToothIcon', path: 'outline' },
  'Settings2': { name: 'CogIcon', path: 'outline' },
  'LogOut': { name: 'ArrowRightOnRectangleIcon', path: 'outline' },
  'LogIn': { name: 'ArrowLeftOnRectangleIcon', path: 'outline' },
  'Filter': { name: 'FunnelIcon', path: 'outline' },
  'MapPin': { name: 'MapPinIcon', path: 'outline' },
  'Flag': { name: 'FlagIcon', path: 'outline' },
  'Star': { name: 'StarIcon', path: 'outline' },
  'Building2': { name: 'BuildingOffice2Icon', path: 'outline' },
  'DollarSign': { name: 'CurrencyDollarIcon', path: 'outline' },
  'Activity': { name: 'ChartBarIcon', path: 'outline' },
  'BarChart3': { name: 'ChartBarIcon', path: 'outline' },
  'ExternalLink': { name: 'ArrowTopRightOnSquareIcon', path: 'outline' },
  'AlertCircle': { name: 'ExclamationCircleIcon', path: 'outline' },
  'AlertTriangle': { name: 'ExclamationTriangleIcon', path: 'outline' },
  'Info': { name: 'InformationCircleIcon', path: 'outline' },
  'Loader2': { name: 'ArrowPathIcon', path: 'outline' },
  'RefreshCw': { name: 'ArrowPathIcon', path: 'outline' },
  'Copy': { name: 'DocumentDuplicateIcon', path: 'outline' },
  'Lock': { name: 'LockClosedIcon', path: 'outline' },
  'Unlock': { name: 'LockOpenIcon', path: 'outline' },
  'Eye': { name: 'EyeIcon', path: 'outline' },
  'EyeOff': { name: 'EyeSlashIcon', path: 'outline' },
  'MessageCircle': { name: 'ChatBubbleLeftRightIcon', path: 'outline' },
  'MessageSquare': { name: 'ChatBubbleLeftIcon', path: 'outline' },
  'Send': { name: 'PaperAirplaneIcon', path: 'outline' },
  'List': { name: 'ListBulletIcon', path: 'outline' },
  'LayoutGrid': { name: 'Squares2X2Icon', path: 'outline' },
  'Grid3x3': { name: 'Squares2X2Icon', path: 'outline' },
  'Menu': { name: 'Bars3Icon', path: 'outline' },
  'Circle': { name: 'CircleIcon', path: 'outline' },
  'PenTool': { name: 'PencilIcon', path: 'outline' },
  'Share2': { name: 'ShareIcon', path: 'outline' },
  'Lightbulb': { name: 'LightBulbIcon', path: 'outline' },
  'Sparkles': { name: 'SparklesIcon', path: 'outline' },
  'Bot': { name: 'CommandLineIcon', path: 'outline' },
  'GripVertical': { name: 'Bars3VerticalIcon', path: 'outline' },
  'LayoutDashboard': { name: 'Squares2X2Icon', path: 'outline' },
  'Briefcase': { name: 'BriefcaseIcon', path: 'outline' },
  'Key': { name: 'KeyIcon', path: 'outline' },
  'UserCheck': { name: 'UserCheckIcon', path: 'outline' },
  'UserX': { name: 'UserXMarkIcon', path: 'outline' },
  'UserCog': { name: 'UserIcon', path: 'outline' },
  'History': { name: 'ClockIcon', path: 'outline' },
  'TrendingUp': { name: 'ArrowTrendingUpIcon', path: 'outline' },
};

function migrateFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;

  // Reemplazar imports
  const importRegex = /import\s+{([^}]+)}\s+from\s+['"]lucide-react['"]/g;
  const wildcardImportRegex = /import\s+\*\s+as\s+(\w+)\s+from\s+['"]lucide-react['"]/g;

  // Manejar wildcard imports
  content = content.replace(wildcardImportRegex, (match, alias) => {
    modified = true;
    console.log(`  ⚠️  Wildcard import encontrado (${alias}) - necesita migración manual`);
    return `// TODO: Migrar wildcard import ${alias} from lucide-react\n// ${match}`;
  });

  // Manejar imports normales
  content = content.replace(importRegex, (match, importsStr) => {
    const imports = importsStr.split(',').map(i => i.trim()).filter(Boolean);
    const heroIconImports = {};
    
    imports.forEach(imp => {
      const iconName = imp.trim().split(/\s+as\s+/)[0].trim();
      const alias = imp.includes(' as ') ? imp.split(' as ')[1].trim() : iconName;
      
      if (ICON_MAPPING[iconName]) {
        const mapping = ICON_MAPPING[iconName];
        const path = mapping.path;
        if (!heroIconImports[path]) {
          heroIconImports[path] = [];
        }
        heroIconImports[path].push(mapping.name + (alias !== iconName ? ` as ${alias}` : ''));
      } else {
        console.log(`  ⚠️  Icono no mapeado: ${iconName}`);
      }
    });

    if (Object.keys(heroIconImports).length === 0) {
      return match; // No hay iconos para migrar
    }

    modified = true;
    const newImports = Object.entries(heroIconImports).map(([path, icons]) => 
      `import { ${icons.join(', ')} } from '@heroicons/react/24/${path}';`
    ).join('\n');
    
    return newImports;
  });

  // Reemplazar usos de iconos en JSX
  Object.entries(ICON_MAPPING).forEach(([lucide, heroicon]) => {
    // Reemplazar <IconName .../> por <HeroIconName .../>
    const iconRegex = new RegExp(`<${lucide}(\\s|>)`, 'g');
    if (iconRegex.test(content)) {
      content = content.replace(iconRegex, `<${heroicon.name}$1`);
      modified = true;
    }
    
    // Reemplazar size={} por width={} height={} para heroicons
    const sizePropRegex = new RegExp(`<${heroicon.name}([^>]*)size=\\{([^}]+)\\}([^>]*)>`, 'g');
    content = content.replace(sizePropRegex, (match, before, size, after) => {
      modified = true;
      return `<${heroicon.name}${before}width={${size}} height={${size}}${after}>`;
    });
  });

  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    return true;
  }
  return false;
}

// Encontrar todos los archivos TypeScript/TSX en src/
function findFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory() && !filePath.includes('node_modules')) {
      findFiles(filePath, fileList);
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      fileList.push(filePath);
    }
  });
  
  return fileList;
}

// Ejecutar migración
const srcDir = path.join(__dirname, '..', 'src');
const files = findFiles(srcDir);
const filesWithLucide = files.filter(file => {
  const content = fs.readFileSync(file, 'utf8');
  return content.includes('lucide-react');
});

console.log(`Encontrados ${filesWithLucide.length} archivos con lucide-react\n`);

let migrated = 0;
filesWithLucide.forEach(file => {
  console.log(`Migrando: ${path.relative(srcDir, file)}`);
  if (migrateFile(file)) {
    migrated++;
    console.log(`  ✅ Migrado`);
  } else {
    console.log(`  ⏭️  Sin cambios`);
  }
});

console.log(`\n✅ Migración completada: ${migrated}/${filesWithLucide.length} archivos modificados`);
