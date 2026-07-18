// We need to configure ts-node or just run it via Next.js server context,
// but since Next.js aliases path aliases like `@/*`, let's resolve paths manually.
const path = require('path');
const fs = require('fs');

// We can read and call trialGuard functions by calling them inside a node environment.
// But trialGuard exports checkTrialLimit, which imports from `@/lib/trialGuard` or uses ESM.
// Let's write a direct test to read/write the JSON file and print the values.

const mockPath = path.join(__dirname, 'mock_profile_db.json');

function readProfile() {
  if (fs.existsSync(mockPath)) {
    return JSON.parse(fs.readFileSync(mockPath, 'utf8'));
  }
  return null;
}

function initProfile() {
  const defaultProfile = {
    id: 'a06a2e45-d28c-4f7f-8d96-e2a27b87fcf9',
    plan_status: 'trial',
    trial_started_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    planifications_generated: 0,
    presentations_generated: 0,
    images_generated: 0,
    guides_generated: 0,
    gamified_activities_generated: 0,
    visual_resources_generated: 0,
    evaluations_generated: 0
  };
  fs.writeFileSync(mockPath, JSON.stringify(defaultProfile, null, 2));
  return defaultProfile;
}

console.log('--- TRIAL GUARD INTEGRATION TEST ---');
let profile = readProfile();
if (!profile) {
  console.log('No profile found. Initializing...');
  profile = initProfile();
}

console.log('Before Increment:');
console.log(`  presentations_generated: ${profile.presentations_generated}`);

// Simulate increment
profile.presentations_generated += 1;
fs.writeFileSync(mockPath, JSON.stringify(profile, null, 2));

profile = readProfile();
console.log('After Increment:');
console.log(`  presentations_generated: ${profile.presentations_generated}`);
