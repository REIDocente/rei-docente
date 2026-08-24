import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Mock Supabase with simple mock query results
const MOCK_USER_ID = 'a06a2e45-d28c-4f7f-8d96-e2a27b87fcf9';
const mockProfilePath = path.join(__dirname, 'mock_profile_db.json');

// Simulate the logic in api/lecturas/generate/route.ts
async function simulateLecturasGenerate(libroId: string, existingRows: any[], profile: any) {
  const booksWithResources = existingRows.filter(row => {
    const recs = row.recursos_generados;
    return recs && typeof recs === 'object' && Object.keys(recs).length > 0;
  });

  const uniqueBooksCount = booksWithResources.length;
  const isThisBookAlreadyStarted = booksWithResources.some(row => row.libro_id === libroId);

  console.log(`Generating resource for book "${libroId}"...`);
  console.log(`  Started books count: ${uniqueBooksCount}, Same book already started: ${isThisBookAlreadyStarted}`);

  if (!isThisBookAlreadyStarted) {
    // Check limit
    const limit = 1;
    const current = profile.lecturas_generated;
    if (current >= limit) {
      console.log(`  [BLOCKED] Limit reached (${current} of ${limit})`);
      return { ok: false, error: 'limite_alcanzado' };
    }
    // Increment limit
    profile.lecturas_generated += 1;
    fs.writeFileSync(mockProfilePath, JSON.stringify(profile, null, 2));
    console.log(`  [SUCCESS] New book started. Incremented lecturas_generated to ${profile.lecturas_generated}`);
  } else {
    console.log(`  [SUCCESS] Same book. Counter remains at ${profile.lecturas_generated}`);
  }

  // Update existing rows
  let row = existingRows.find(r => r.libro_id === libroId);
  if (!row) {
    row = { libro_id: libroId, recursos_generados: {} };
    existingRows.push(row);
  }
  row.recursos_generados['recurso_' + Date.now()] = { content: 'mock' };

  return { ok: true };
}

async function run() {
  console.log('--- LECTURAS SAME BOOK & NEW BOOK LIMIT TEST ---');
  
  // 1. Reset profile
  const profile = {
    id: MOCK_USER_ID,
    plan_status: 'trial',
    trial_started_at: new Date().toISOString(),
    lecturas_generated: 0
  };
  fs.writeFileSync(mockProfilePath, JSON.stringify(profile, null, 2));
  
  const existingRows: any[] = [];

  // 2. Generate resource for book A (should succeed, increment count)
  let res = await simulateLecturasGenerate('libro-a', existingRows, profile);
  if (!res.ok) throw new Error('Generation for Book A (first resource) should succeed');

  // 3. Generate 2nd resource for book A (should succeed, bypass counter increment)
  res = await simulateLecturasGenerate('libro-a', existingRows, profile);
  if (!res.ok) throw new Error('Generation for Book A (second resource) should succeed without increment');

  // 4. Generate resource for book B (should be blocked since count is 1)
  res = await simulateLecturasGenerate('libro-b', existingRows, profile);
  if (res.ok) throw new Error('Generation for Book B should be BLOCKED');

  console.log('\n======================================');
  console.log('LECTURAS SAME BOOK & NEW BOOK TESTS PASSED!');
  console.log('======================================');
}

run().catch((e) => {
  console.error('\nTEST FAILED:', e.message);
  process.exit(1);
});
