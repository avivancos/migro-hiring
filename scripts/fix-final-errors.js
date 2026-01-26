const fs = require('fs');
const path = require('path');

// Script final para corregir errores específicos que los otros scripts pueden introducir

function fixFinalErrors(filePath) {
  if (!fs.existsSync(filePath)) {
    return false;
  }

  let content = fs.readFileSync(filePath, 'utf8');
  const original = content;
  let changed = false;

  // 1. Eliminar CheckIcon solo de archivos específicos donde sabemos que no se usa
  // Verificar uso real (como componente JSX o como valor)
  const checkIconUsedInJSX = /<CheckIcon\s/.test(content);
  const checkIconUsedAsValue = /(icon|IconComponent|Icon):\s*CheckIcon|=\s*CheckIcon/.test(content);
  const checkIconUsed = checkIconUsedInJSX || checkIconUsedAsValue;
  
  // Solo eliminar de archivos específicos donde sabemos que no se usa
  const filesToFix = [
    'KYCVerification.tsx',
    'AdminRoutePermissions.tsx'
  ];
  const shouldFix = filesToFix.some(f => filePath.includes(f));
  
  if (content.includes('CheckIcon') && !checkIconUsed && shouldFix) {
    // Remover de imports
    content = content.replace(/import\s+{([^}]*)\bCheckIcon\b([^}]*)}\s+from\s+['"]@heroicons[^'"]+['"];?/g, (match) => {
      changed = true;
      const items = match.match(/import\s+{([^}]+)}/)[1]
        .split(',')
        .map(i => i.trim())
        .filter(item => item && item !== 'CheckIcon');
      
      if (items.length === 0) {
        return '';
      }
      
      const moduleMatch = match.match(/from\s+['"](@heroicons\/react\/[^'"]+)['"]/);
      const module = moduleMatch ? moduleMatch[1] : '@heroicons/react/24/outline';
      
      return `import { ${items.join(', ')} } from '${module}';`;
    });
  }

  // 2. Eliminar XMarkIcon si solo aparece en placeholders de texto (no en JSX)
  // Verificar uso real en JSX
  const xMarkIconUsed = /<XMarkIcon\s/.test(content);
  if (content.includes('XMarkIcon') && !xMarkIconUsed) {
    // Solo eliminar de archivos específicos donde sabemos que solo aparece en placeholders
    const targetFiles = [
      'ContractDataRequestModal.tsx',
      'RequestContractModal.tsx',
      'CRMDashboardPage.tsx'
    ];
    const shouldFix = targetFiles.some(f => filePath.includes(f));
    
    if (shouldFix) {
      // Remover de imports
      content = content.replace(/import\s+{([^}]*)\bXMarkIcon\b([^}]*)}\s+from\s+['"]@heroicons[^'"]+['"];?/g, (match) => {
        changed = true;
        const items = match.match(/import\s+{([^}]+)}/)[1]
          .split(',')
          .map(i => i.trim())
          .filter(item => item && item !== 'XMarkIcon');
        
        if (items.length === 0) {
          return '';
        }
        
        const moduleMatch = match.match(/from\s+['"](@heroicons\/react\/[^'"]+)['"]/);
        const module = moduleMatch ? moduleMatch[1] : '@heroicons/react/24/outline';
        
        return `import { ${items.join(', ')} } from '${module}';`;
      });
    }
  }

  // 3. Eliminar BookOpenIcon duplicado (dejar solo el de outline)
  if (content.includes('BookOpenIcon')) {
    // Verificar si está importado desde solid
    const solidImport = /import\s+{[^}]*\bBookOpenIcon\b[^}]*}\s+from\s+['"]@heroicons\/react\/24\/solid['"];?/g;
    if (solidImport.test(content)) {
      // Eliminar BookOpenIcon del import de solid
      content = content.replace(/import\s+{([^}]*)\bBookOpenIcon\b([^}]*)}\s+from\s+['"]@heroicons\/react\/24\/solid['"];?/g, (match) => {
        changed = true;
        const items = match.match(/import\s+{([^}]+)}/)[1]
          .split(',')
          .map(i => i.trim())
          .filter(item => item && item !== 'BookOpenIcon');
        
        if (items.length === 0) {
          return '';
        }
        
        return `import { ${items.join(', ')} } from '@heroicons/react/24/solid';`;
      });
    }
  }

  // 4. Eliminar imports y variables no utilizados específicos de CRMOpportunities.tsx
  if (filePath.includes('CRMOpportunities.tsx')) {
    // Eliminar import de isAgent si no se usa
    if (content.includes('import') && content.includes('isAgent') && !content.match(/isAgent\(/)) {
      // Eliminar isAgent del import
      content = content.replace(/import\s+{([^}]*)\bisAgent\b([^}]*)}\s+from\s+['"]@\/utils\/searchValidation['"];?\n?/g, (match) => {
        changed = true;
        const items = match.match(/import\s+{([^}]+)}/)[1]
          .split(',')
          .map(i => i.trim())
          .filter(item => item && item !== 'isAgent');
        
        if (items.length === 0) {
          return '';
        }
        
        return `import { ${items.join(', ')} } from '@/utils/searchValidation';`;
      });
    }
    
    // Eliminar import de useAuth si no se usa
    const useAuthMatches = content.match(/useAuth\(/g);
    const hasUseAuthUsage = useAuthMatches && useAuthMatches.length > 0;
    
    if (content.includes('import') && content.includes('useAuth') && !hasUseAuthUsage) {
      content = content.replace(/import\s+{\s*useAuth\s*}\s+from\s+['"]@\/providers\/AuthProvider['"];?\n?/g, '');
      changed = true;
    }
    
    // Eliminar variable user si no se usa (después de la línea de useAuth)
    const userMatches = content.match(/\buser\b/g);
    const hasUserUsage = userMatches && userMatches.length > 1; // Más de 1 porque aparece en la declaración
    
    if (content.includes('const { user } = useAuth();') && !hasUserUsage) {
      content = content.replace(/const\s+{\s*user\s*}\s*=\s*useAuth\(\);?\n?/g, '');
      changed = true;
    }
  }

  // Limpiar líneas vacías múltiples
  content = content.replace(/\n{3,}/g, '\n\n');
  
  // Limpiar líneas vacías al inicio
  content = content.replace(/^\n+/, '');

  if (changed && content !== original) {
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

console.log('Corrigiendo errores finales...\n');

const srcDir = path.join(__dirname, '..', 'src');
const files = findFiles(srcDir);

let fixed = 0;
files.forEach(file => {
  try {
    if (fixFinalErrors(file)) {
      fixed++;
      console.log(`✅ ${path.relative(srcDir, file)}`);
    }
  } catch (error) {
    console.error(`❌ Error en ${file}:`, error.message);
  }
});

console.log(`\n✅ ${fixed} archivos corregidos`);
