const fs = require('fs');
const path = require('path');

// Archivos con imports no usados detectados
const filesToFix = [
  'src/components/admin/AssignRandomOpportunities.tsx',
  'src/components/admin/Sidebar.tsx',
  'src/components/KYCVerification.tsx',
  'src/pages/admin/AdminContractCreate.tsx',
  'src/pages/admin/AdminDashboard.tsx',
  'src/pages/admin/AdminRoutePermissions.tsx',
  'src/pages/admin/AdminUserCreate.tsx',
  'src/pages/admin/AdminUserDetail.tsx',
  'src/pages/admin/AdminUsers.tsx',
  'src/pages/AdminDashboard.tsx',
  'src/pages/PrivacyPolicy.tsx',
];

function removeUnusedImports(filePath) {
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  No existe: ${filePath}`);
    return false;
  }

  let content = fs.readFileSync(filePath, 'utf8');
  const original = content;

  // Remover imports específicos no usados
  const unusedImports = {
    'PlusIcon': 'PlusIcon',
    'CheckIcon': 'CheckIcon',
  };

  Object.entries(unusedImports).forEach(([iconName]) => {
    // Buscar y remover del import de heroicons
    const importRegex = new RegExp(`import\\s+{[^}]*\\b${iconName}\\b[^}]*}\\s+from\\s+['"]@heroicons[^'"]+['"];?`, 'g');
    content = content.replace(importRegex, (match) => {
      const itemsMatch = match.match(/import\s+{([^}]+)}/);
      if (itemsMatch) {
        const items = itemsMatch[1]
          .split(',')
          .map(i => i.trim())
          .filter(item => item && item !== iconName);
        
        if (items.length === 0) {
          // Si no quedan items, eliminar toda la línea de import
          return '';
        }
        
        const moduleMatch = match.match(/from\s+['"]([^'"]+)['"]/);
        const module = moduleMatch ? moduleMatch[1] : '@heroicons/react/24/outline';
        
        return `import { ${items.join(', ')} } from '${module}';`;
      }
      return match;
    });
  });

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

console.log('Eliminando imports no usados...\n');

let fixed = 0;
filesToFix.forEach(file => {
  const fullPath = path.join(__dirname, '..', file);
  if (removeUnusedImports(fullPath)) {
    fixed++;
    console.log(`✅ ${file}`);
  }
});

console.log(`\n✅ ${fixed} archivos corregidos`);
