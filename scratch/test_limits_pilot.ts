import { createClient } from '@supabase/supabase-js';
import { checkTrialLimit, incrementCounter, TRIAL_LIMITS } from '../src/lib/trialGuard';
import fs from 'fs';
import path from 'path';

// Define a mock Supabase Client
const supabase = createClient('https://mock.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9');
const MOCK_USER_ID = 'a06a2e45-d28c-4f7f-8d96-e2a27b87fcf9';
const mockPath = path.join(__dirname, 'mock_profile_db.json');

function resetMockProfile() {
  const defaultProfile = {
    id: MOCK_USER_ID,
    plan_status: 'trial',
    trial_started_at: new Date().toISOString(),
    planifications_generated: 0,
    presentations_generated: 0,
    images_generated: 0,
    guides_generated: 0,
    gamified_activities_generated: 0,
    visual_resources_generated: 0,
    evaluations_generated: 0,
    juegos_generated: 0,
    lecturas_generated: 0,
    guias_generated: 0,
    rei_play_count: 0,
    rei_lecturas_count: 0,
    experiencias_rei_count: 0,
  };
  fs.writeFileSync(mockPath, JSON.stringify(defaultProfile, null, 2));
}

async function testModule(column: string, limit: number) {
  console.log(`\n--- Testing module: ${column} (Limit: ${limit}) ---`);
  resetMockProfile();

  // Generate up to limit
  for (let i = 0; i < limit; i++) {
    const guard = await checkTrialLimit(supabase, MOCK_USER_ID, column);
    if (guard.blocked) {
      throw new Error(`Should NOT be blocked at generation ${i + 1} of ${limit} for ${column}`);
    }
    await incrementCounter(supabase, MOCK_USER_ID, column);
    console.log(`  Generation ${i + 1} of ${limit} succeeded.`);
  }

  // The next generation should be blocked
  const guard = await checkTrialLimit(supabase, MOCK_USER_ID, column);
  if (!guard.blocked) {
    throw new Error(`Should be BLOCKED at generation ${limit + 1} for ${column}`);
  }
  console.log(`  Generation ${limit + 1} blocked successfully! Reason: ${guard.reason}`);
}

async function run() {
  (process.env as any).NODE_ENV = 'development';

  // 1. Test Planificaciones (5)
  await testModule('planifications_generated', 5);

  // 2. Test Evaluaciones (5)
  await testModule('evaluations_generated', 5);

  // 3. Test Guías (5)
  await testModule('guides_generated', 5);

  // 4. Test REI Play (0 - Blocked)
  await testModule('juegos_generated', 0);

  // 5. Test Experiencias REI (0 - Blocked)
  await testModule('experiencias_rei_count', 0);

  // 6. Test Lecturas Domiciliarias (1)
  await testModule('lecturas_generated', 1);

  console.log('\n======================================');
  console.log('ALL TESTS PASSED SUCCESSFULLY!');
  console.log('======================================');
}

run().catch((e) => {
  console.error('\nTEST FAILED:', e.message);
  process.exit(1);
});
