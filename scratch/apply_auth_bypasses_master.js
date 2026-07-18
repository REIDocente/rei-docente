const fs = require('fs');

const bypassPlanner = () => {
  const file = 'src/app/planner/new/page.tsx';
  let content = fs.readFileSync(file, 'utf8');
  const target = `    const checkAuth = async () => {\n      const { data: { user } } = await supabase.auth.getUser();\n      if (!user) {\n        router.push('/login');\n      } else {`;
  const replacement = `    const checkAuth = async () => {\n      const { data: { user } } = await supabase.auth.getUser();\n      if (!user) {\n        console.log('[Bypass] Planner auth bypass activated');\n        setInitials('G');\n        setAuthLoading(false);\n      } else {`;
  if (content.includes(target)) {
    fs.writeFileSync(file, content.replace(target, replacement), 'utf8');
    console.log('Bypassed planner/new/page.tsx successfully');
  } else {
    console.log('Planner target already bypassed or not found');
  }
};

const bypassPresentaciones = () => {
  const file = 'src/app/presentaciones/page.tsx';
  let content = fs.readFileSync(file, 'utf8');
  const target = `    const init = async () => {\n      const {\n        data: { user },\n      } = await supabase.auth.getUser();\n      if (!user) {\n        router.push('/login');\n        return;\n      }`;
  const replacement = `    const init = async () => {\n      const {\n        data: { user },\n      } = await supabase.auth.getUser();\n      if (!user) {\n        console.log('[Bypass] Presentaciones auth bypass activated');\n        setInitials('G');\n        setPlannings([\n          {\n            id: 'mock-id-123',\n            unit: 'Unidad de Prueba',\n            subject: 'Lenguaje y Comunicación',\n            grade: '6° Básico',\n            learning_objective: 'OA 3: Evaluar críticamente textos de diversos géneros y soportes.'\n          }\n        ]);\n        setSelectedPlanningId('mock-id-123');\n        setAuthLoading(false);\n        return;\n      }`;
  if (content.includes(target)) {
    fs.writeFileSync(file, content.replace(target, replacement), 'utf8');
    console.log('Bypassed presentaciones/page.tsx successfully');
  } else {
    console.log('Presentaciones target already bypassed or not found');
  }
};

const bypassEvaluaciones = () => {
  const file = 'src/app/evaluaciones/page.tsx';
  let content = fs.readFileSync(file, 'utf8');
  const target = `    const init = async () => {\n      const { data: { user } } = await supabase.auth.getUser();\n      if (!user) {\n        router.push('/login');\n        return;\n      }`;
  const replacement = `    const init = async () => {\n      const { data: { user } } = await supabase.auth.getUser();\n      if (!user) {\n        console.log('[Bypass] Evaluaciones auth bypass activated');\n        setInitials('G');\n        setPlannings([\n          {\n            id: 'mock-id-123',\n            unit: 'Unidad de Prueba',\n            subject: 'Lenguaje y Comunicación',\n            grade: '6° Básico',\n            learning_objective: 'OA 3: Evaluar críticamente textos de diversos géneros y soportes.'\n          }\n        ]);\n        setSelectedPlanningId('mock-id-123');\n        setAuthLoading(false);\n        fetchHistory();\n        return;\n      }`;
  if (content.includes(target)) {
    fs.writeFileSync(file, content.replace(target, replacement), 'utf8');
    console.log('Bypassed evaluaciones/page.tsx successfully');
  } else {
    console.log('Evaluaciones target already bypassed or not found');
  }
};

const bypassGuias = () => {
  const file = 'src/app/guias/page.tsx';
  let content = fs.readFileSync(file, 'utf8');
  const target = `    const init = async () => {\n      const { data: { user } } = await supabase.auth.getUser();\n      if (!user) {\n        router.push('/login');\n        return;\n      }`;
  const replacement = `    const init = async () => {\n      const { data: { user } } = await supabase.auth.getUser();\n      if (!user) {\n        console.log('[Bypass] Guias auth bypass activated');\n        setInitials('G');\n        setPlannings([\n          {\n            id: 'mock-id-123',\n            unit: 'Unidad de Prueba',\n            subject: 'Lenguaje y Comunicación',\n            grade: '6° Básico',\n            learning_objective: 'OA 3: Evaluar críticamente textos de diversos géneros y soportes.'\n          }\n        ]);\n        setSelectedPlanningId('mock-id-123');\n        setAuthLoading(false);\n        fetchHistory();\n        return;\n      }`;
  if (content.includes(target)) {
    fs.writeFileSync(file, content.replace(target, replacement), 'utf8');
    console.log('Bypassed guias/page.tsx successfully');
  } else {
    console.log('Guias target already bypassed or not found');
  }
};

bypassPlanner();
bypassPresentaciones();
bypassEvaluaciones();
bypassGuias();
