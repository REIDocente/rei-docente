const fs = require('fs');
const path = require('path');

function searchServiceRole(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      if (file !== 'node_modules' && file !== '.next') {
        searchServiceRole(fullPath);
      }
    } else if (stat.isFile() && (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.js') || file.endsWith('.json') || file.endsWith('.local') || file.endsWith('.env'))) {
      const content = fs.readFileSync(fullPath, 'utf8');
      if (content.toLowerCase().includes('service_role') || content.toLowerCase().includes('service-role')) {
        console.log(`Found service_role in: ${fullPath}`);
      }
    }
  }
}

searchServiceRole('c:/Users/56940/Desktop/app-docente-ia');
