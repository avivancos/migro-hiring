const fs = require('fs');
const path = require('path');

function fixFiles(dir) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory() && !filePath.includes('node_modules')) {
      fixFiles(filePath);
    } else if ((file.endsWith('.ts') || file.endsWith('.tsx')) && filePath.includes('src')) {
      let content = fs.readFileSync(filePath, 'utf8');
      const original = content;
      
      // Reemplazar doble punto y coma al final de imports de heroicons
      content = content.replace(/from\s+['"]@heroicons\/react\/[^'"]+['"];;/g, (match) => {
        return match.replace(';;', ';');
      });
      
      if (content !== original) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log('Fixed:', filePath);
      }
    }
  });
}

fixFiles('./src');
console.log('Done!');
