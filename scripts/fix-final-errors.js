const fs = require('fs');
const path = require('path');

// Mapeo de referencias de variables a iconos
const VAR_TO_ICON = {
  'Phone': 'PhoneIcon',
  'Mail': 'EnvelopeIcon',
  'Calendar': 'CalendarIcon',
  'FileText': 'DocumentTextIcon',
  'Users': 'UsersIcon',
  'Clock': 'ClockIcon',
  'CheckCircle': 'CheckCircleIcon',
  'Briefcase': 'BriefcaseIcon',
  'List': 'ListBulletIcon',
  'BarChart3': 'ChartBarIcon',
  'Activity': 'ChartBarIcon',
  'Pencil': 'PencilIcon',
  'Play': 'PlayIcon',
  'Pause': 'PauseIcon',
  'CheckSquare': 'CheckIcon', // No existe CheckSquareIcon, usar CheckIcon
  'CheckSquareIcon': 'CheckIcon',
};

// Iconos que deben ser importados si se usan
const ICONS_TO_IMPORT = {
  'ChartBarIcon': '@heroicons/react/24/outline',
  'ExclamationCircleIcon': '@heroicons/react/24/outline',
  'UserIcon': '@heroicons/react/24/outline',
  'ArrowRightIcon': '@heroicons/react/24/outline',
  'ArrowTopRightOnSquareIcon': '@heroicons/react/24/outline',
  'TrashIcon': '@heroicons/react/24/outline',
  'XCircleIcon': '@heroicons/react/24/outline',
  'EyeIcon': '@heroicons/react/24/outline',
  'PlusIcon': '@heroicons/react/24/outline',
  'FlagIcon': '@heroicons/react/24/outline',
  'CurrencyEuroIcon': '@heroicons/react/24/outline',
  'LinkIcon': '@heroicons/react/24/outline',
  'CodeBracketIcon': '@heroicons/react/24/outline',
  'ServerIcon': '@heroicons/react/24/outline',
  'GlobeAltIcon': '@heroicons/react/24/outline',
  'BellIcon': '@heroicons/react/24/outline',
  'PlayIcon': '@heroicons/react/24/outline',
  'PauseIcon': '@heroicons/react/24/outline',
  'ArrowPathIcon': '@heroicons/react/24/outline',
  'ArrowDownTrayIcon': '@heroicons/react/24/outline',
  'HomeIcon': '@heroicons/react/24/outline',
  'CheckIcon': '@heroicons/react/24/outline',
  'DocumentTextIcon': '@heroicons/react/24/outline',
  'CurrencyDollarIcon': '@heroicons/react/24/outline',
};

function fixFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  const original = content;

  // 1. Reemplazar referencias a variables de iconos antiguos
  Object.entries(VAR_TO_ICON).forEach(([oldVar, newIcon]) => {
    // En asignaciones: icon={OldVar}
    content = content.replace(
      new RegExp(`(icon|Icon|iconComponent)\\s*[:=]\\s*${oldVar}\\b`, 'g'),
      `$1: ${newIcon}`
    );
    
    // En returns: return OldVar
    content = content.replace(
      new RegExp(`return\\s+${oldVar}\\b`, 'g'),
      `return ${newIcon}`
    );
    
    // En comparaciones: === OldVar
    content = content.replace(
      new RegExp(`===?\\s*${oldVar}\\b`, 'g'),
      (match) => match.replace(oldVar, newIcon)
    );
    
    // En ternarios: ? OldVar :
    content = content.replace(
      new RegExp(`\\?\\s*${oldVar}\\s*:`, 'g'),
      (match) => match.replace(oldVar, newIcon)
    );
  });

  // 2. Reemplazar props size por width/height
  content = content.replace(
    /size=\{(\d+)\}/g,
    'width={$1} height={$1}'
  );

  // 3. Agregar imports faltantes
  const usedIcons = new Set();
  
  // Detectar iconos usados
  Object.keys(ICONS_TO_IMPORT).forEach(icon => {
    if (content.includes(icon) && !content.includes(`import.*${icon}.*from`)) {
      usedIcons.add(icon);
    }
  });

  if (usedIcons.size > 0) {
    // Buscar si ya hay imports de heroicons
    const heroIconImports = content.match(/import\s+{[^}]+}\s+from\s+['"]@heroicons\/react\/24\/outline['"];/g);
    
    if (heroIconImports && heroIconImports.length > 0) {
      // Agregar a import existente
      const lastImport = heroIconImports[heroIconImports.length - 1];
      const match = lastImport.match(/import\s+{([^}]+)}\s+from/);
      if (match) {
        const existing = match[1].split(',').map(i => i.trim()).filter(Boolean);
        const toAdd = Array.from(usedIcons).filter(icon => !existing.includes(icon));
        
        if (toAdd.length > 0) {
          const newItems = [...existing, ...toAdd].sort().join(', ');
          content = content.replace(lastImport, lastImport.replace(/{[^}]+}/, `{ ${newItems} }`));
        }
      }
    } else {
      // Crear nuevo import
      const iconsList = Array.from(usedIcons).sort().join(', ');
      const firstLine = content.split('\n')[0];
      if (!firstLine.includes('import')) {
        content = `import { ${iconsList} } from '@heroicons/react/24/outline';\n${content}`;
      } else {
        // Insertar después de los primeros imports
        const lines = content.split('\n');
        let insertIndex = 0;
        for (let i = 0; i < lines.length; i++) {
          if (lines[i].trim().startsWith('import')) {
            insertIndex = i + 1;
          } else if (insertIndex > 0 && lines[i].trim() === '') {
            break;
          }
        }
        lines.splice(insertIndex, 0, `import { ${iconsList} } from '@heroicons/react/24/outline';`);
        content = lines.join('\n');
      }
    }
  }

  // 4. Eliminar referencias a LucideIcons
  content = content.replace(/const\s*{\s*Activity\s*}\s*=\s*LucideIcons;?\s*/g, '');
  content = content.replace(/\/\/\s*TODO:.*LucideIcons.*\n/gi, '');
  content = content.replace(/\/\/\s*import.*LucideIcons.*\n/gi, '');

  // 5. Corregir tipos incorrectos (UserIcon como tipo)
  content = content.replace(/useState<UserIcon\s*\|\s*null>/g, 'useState<User | null>');

  // 6. Corregir Bars3VerticalIcon
  content = content.replace(/Bars3VerticalIcon/g, 'EllipsisVerticalIcon');
  if (content.includes('EllipsisVerticalIcon') && !content.includes("import.*EllipsisVerticalIcon.*from")) {
    content = content.replace(
      /(import\s+{[^}]+}\s+from\s+['"]@heroicons\/react\/24\/outline['"];)/,
      (match) => {
        const itemsMatch = match.match(/import\s+{([^}]+)}/);
        if (itemsMatch && !itemsMatch[1].includes('EllipsisVerticalIcon')) {
          return match.replace(/{[^}]+}/, `{ ${itemsMatch[1]}, EllipsisVerticalIcon }`);
        }
        return match;
      }
    );
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
      fileList.push(filePath);
    }
  });
  
  return fileList;
}

const srcDir = path.join(__dirname, '..', 'src');
const files = findFiles(srcDir);

console.log(`Corrigiendo errores finales en ${files.length} archivos...\n`);

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
