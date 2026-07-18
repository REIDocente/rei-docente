const fs = require('fs');

const file = 'src/app/planner/new/page.tsx';
let content = fs.readFileSync(file, 'utf8');

// Find the broken bypass
const brokenTarget = `    const checkAuth = async () => {\n      const { data: { user } } = await supabase.auth.getUser();\n      if (!user) {\n        console.log('[Bypass] Planner auth bypass activated');\n        setInitials('G');\n        setAuthLoading(false);\n      } else {`;

const correctReplacement = `    const checkAuth = async () => {\n      const { data: { user } } = await supabase.auth.getUser();\n      if (!user) {\n        console.log('[Bypass] Planner auth bypass activated');\n        setUser({ id: 'mock-user-123', email: 'guest@reidocente.cl' });\n      } else {`;

if (content.includes(brokenTarget)) {
  content = content.replace(brokenTarget, correctReplacement);
  fs.writeFileSync(file, content, 'utf8');
  console.log('Fixed planner bypass successfully!');
} else {
  // If not found, try replacing from original target
  const originalTarget = `    const checkAuth = async () => {\n      const { data: { user } } = await supabase.auth.getUser();\n      if (!user) {\n        router.push('/login');\n      } else {`;
  if (content.includes(originalTarget)) {
    content = content.replace(originalTarget, correctReplacement);
    fs.writeFileSync(file, content, 'utf8');
    console.log('Applied correct planner bypass successfully!');
  } else {
    console.log('Could not find planner target!');
  }
}
