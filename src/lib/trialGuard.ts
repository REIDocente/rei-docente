/**
 * lib/trialGuard.ts
 *
 * Shared helper for enforcing trial limits across all content generation endpoints.
 *
 * Usage pattern in any API route:
 *
 *   import { checkTrialLimit, incrementCounter, TRIAL_LIMITS } from '@/lib/trialGuard';
 *
 *   const guard = await checkTrialLimit(supabase, userId, 'visual_resources_generated');
 *   if (guard.blocked) {
 *     return NextResponse.json(
 *       { error: 'limite_alcanzado', reason: guard.reason },
 *       { status: 403 }
 *     );
 *   }
 *
 *   // ... do generation ...
 *
 *   await incrementCounter(supabase, userId, 'visual_resources_generated');
 */

import { SupabaseClient } from '@supabase/supabase-js';

// ─── Types ────────────────────────────────────────────────────────────────────

export type CounterColumn =
  | 'planifications_generated'
  | 'presentations_generated'
  | 'images_generated'
  | 'guides_generated'
  | 'gamified_activities_generated'
  | 'visual_resources_generated'
  | 'evaluations_generated'
  | 'juegos_generated'
  | 'lecturas_generated';

export interface UserProfile {
  id: string;
  plan_status: 'trial' | 'active' | 'expired';
  trial_started_at: string | null;
  active_started_at?: string | null;
  last_cycle_start?: string | null;
  planifications_generated: number;
  presentations_generated: number;
  images_generated: number;
  guides_generated: number;
  gamified_activities_generated: number;
  visual_resources_generated: number;
  evaluations_generated: number;
  juegos_generated: number;
  lecturas_generated: number;
}

export interface TrialGuardResult {
  /** true → do NOT proceed with generation */
  blocked: boolean;
  /** human-readable reason for blocking (only set when blocked === true) */
  reason?: 'trial_expired' | 'limit_reached';
  /** the full profile (always present when the DB was reachable) */
  profile?: UserProfile;
  /** active cycle or trial renewal/expiration date */
  renewalDate?: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

/** Trial period in days */
const TRIAL_DAYS = 7;

/**
 * Maximum number of items a trial user can generate per category.
 * Each limit is INDEPENDENT — hitting one does not affect the others.
 */
export const TRIAL_LIMITS: Record<CounterColumn, number> = {
  planifications_generated:      10,
  presentations_generated:       10,
  images_generated:              15,
  guides_generated:              5,
  gamified_activities_generated: 15,
  visual_resources_generated:    15,
  evaluations_generated:         6,
  juegos_generated:              3,
  lecturas_generated:            3,
};

/**
 * Maximum number of items an active user can generate per category per 30 days.
 */
export const ACTIVE_LIMITS: Record<CounterColumn, number> = {
  planifications_generated:      24,
  presentations_generated:       24,
  images_generated:              999999, // inactive / unlimited
  guides_generated:              12,
  gamified_activities_generated: 999999, // inactive / unlimited
  visual_resources_generated:    999999, // inactive / unificado
  evaluations_generated:         12,
  juegos_generated:              999999,
  lecturas_generated:            999999,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getMockProfile(): UserProfile {
  const fs = require('fs');
  const path = require('path');
  const mockPath = path.join(process.cwd(), 'scratch', 'mock_profile_db.json');
  const defaultProfile: UserProfile = {
    id: 'a06a2e45-d28c-4f7f-8d96-e2a27b87fcf9',
    plan_status: 'trial',
    trial_started_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    planifications_generated: 0,
    presentations_generated: 0,
    images_generated: 0,
    guides_generated: 0,
    gamified_activities_generated: 0,
    visual_resources_generated: 0,
    evaluations_generated: 0,
    juegos_generated: 0,
    lecturas_generated: 0
  };

  try {
    const scratchDir = path.dirname(mockPath);
    if (!fs.existsSync(scratchDir)) {
      fs.mkdirSync(scratchDir, { recursive: true });
    }
    if (fs.existsSync(mockPath)) {
      return JSON.parse(fs.readFileSync(mockPath, 'utf8'));
    } else {
      fs.writeFileSync(mockPath, JSON.stringify(defaultProfile, null, 2));
      return defaultProfile;
    }
  } catch (e) {
    console.error('[trialGuard] Error in getMockProfile:', e);
    return defaultProfile;
  }
}

function saveMockProfile(profile: UserProfile) {
  const fs = require('fs');
  const path = require('path');
  const mockPath = path.join(process.cwd(), 'scratch', 'mock_profile_db.json');
  try {
    fs.writeFileSync(mockPath, JSON.stringify(profile, null, 2));
  } catch (e) {
    console.error('[trialGuard] Error in saveMockProfile:', e);
  }
}

/**
 * Returns the user profile row, creating it if it does not yet exist.
 * Uses the `get_or_create_profile` RPC to avoid race conditions.
 */
async function getOrCreateProfile(
  supabase: SupabaseClient,
  userId: string
): Promise<UserProfile | null> {
  // Try RPC first (atomic upsert)
  const { data: rpcData, error: rpcErr } = await supabase
    .rpc('get_or_create_profile', { p_user_id: userId })
    .single();

  if (!rpcErr && rpcData) {
    return rpcData as UserProfile;
  }

  // Fallback: direct select (in case RPC is not deployed yet)
  const { data: selectData, error: selectErr } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  if (selectErr || !selectData) {
    // Create it
    const { data: insertData } = await supabase
      .from('user_profiles')
      .insert({ id: userId, trial_started_at: new Date().toISOString() })
      .select('*')
      .single();
    return insertData as UserProfile | null;
  }

  return selectData as UserProfile;
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Checks whether a user is allowed to generate a new item of the given type.
 *
 * Rules:
 *   - plan_status === 'active'  → always allowed (no limits)
 *   - plan_status === 'trial'   → allowed if BOTH:
 *       1. today < trial_started_at + 30 days
 *       2. counter < TRIAL_LIMITS[column]
 *   - plan_status === 'expired' → always blocked
 */
export async function checkTrialLimit(
  supabase: SupabaseClient,
  userId: string,
  column: CounterColumn
): Promise<TrialGuardResult> {
  // Administradores exentos de límites (Opción A)
  try {
    const { data: userData } = await supabase.auth.getUser();
    if (userData?.user?.email) {
      const email = userData.user.email.toLowerCase().trim();
      if (email === 'jvaliente@corporacioncolina.cl' || email === 'valientepaloj@gmail.com') {
        console.log(`[trialGuard] Eximiendo al administrador de límites: ${email}`);
        return { blocked: false };
      }
    }
  } catch (e) {
    // Fail silent and proceed with normal limit check
  }

  if (process.env.NODE_ENV === 'development' && userId === 'a06a2e45-d28c-4f7f-8d96-e2a27b87fcf9') {
    const profile = getMockProfile();
    const trialStart = profile.trial_started_at ? new Date(profile.trial_started_at) : new Date();
    const trialEnd = new Date(trialStart.getTime() + TRIAL_DAYS * 24 * 60 * 60 * 1000);
    const now = new Date();

    if (now > trialEnd) {
      return { blocked: true, reason: 'trial_expired', profile };
    }

    const currentCount = profile[column] ?? 0;
    const limit = TRIAL_LIMITS[column];

    if (currentCount >= limit) {
      return { blocked: true, reason: 'limit_reached', profile };
    }

    return { blocked: false, profile };
  }

  const profile = await getOrCreateProfile(supabase, userId);

  if (!profile) {
    // If we can't read the profile, fail open (don't block the user)
    return { blocked: false };
  }

  // Active subscribers — monthly quota validation
  if (profile.plan_status === 'active') {
    const activeStart = profile.active_started_at ? new Date(profile.active_started_at) : new Date();
    const now = new Date();
    const cycleMs = 30 * 24 * 60 * 60 * 1000;
    const diffMs = now.getTime() - activeStart.getTime();
    
    // Determine the current cycle start and end
    const cycleIndex = Math.max(0, Math.floor(diffMs / cycleMs));
    const currentCycleStart = new Date(activeStart.getTime() + cycleIndex * cycleMs);
    const currentCycleEnd = new Date(currentCycleStart.getTime() + cycleMs);
    
    let dbUpdateNeeded = false;
    let updatedProfile = { ...profile };

    if (!profile.last_cycle_start) {
      // First check after subscription activation: initialize last_cycle_start to currentCycleStart.
      // Do NOT reset counters to allow carryover / manual adjustment values.
      updatedProfile.last_cycle_start = currentCycleStart.toISOString();
      dbUpdateNeeded = true;
    } else {
      const lastCycleStart = new Date(profile.last_cycle_start);
      if (lastCycleStart.getTime() < currentCycleStart.getTime()) {
        // We have crossed into a new 30-day billing cycle! Reset usage counters.
        updatedProfile.planifications_generated = 0;
        updatedProfile.presentations_generated = 0;
        updatedProfile.images_generated = 0;
        updatedProfile.guides_generated = 0;
        updatedProfile.gamified_activities_generated = 0;
        updatedProfile.visual_resources_generated = 0;
        updatedProfile.evaluations_generated = 0;
        updatedProfile.juegos_generated = 0;
        updatedProfile.lecturas_generated = 0;
        updatedProfile.last_cycle_start = currentCycleStart.toISOString();
        dbUpdateNeeded = true;
      }
    }

    if (dbUpdateNeeded) {
      const { error } = await supabase
        .from('user_profiles')
        .update({
          planifications_generated: updatedProfile.planifications_generated,
          presentations_generated: updatedProfile.presentations_generated,
          images_generated: updatedProfile.images_generated,
          guides_generated: updatedProfile.guides_generated,
          gamified_activities_generated: updatedProfile.gamified_activities_generated,
          visual_resources_generated: updatedProfile.visual_resources_generated,
          evaluations_generated: updatedProfile.evaluations_generated,
          juegos_generated: updatedProfile.juegos_generated,
          lecturas_generated: updatedProfile.lecturas_generated,
          last_cycle_start: updatedProfile.last_cycle_start,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (!error) {
        // Sync our local object properties
        profile.planifications_generated = updatedProfile.planifications_generated;
        profile.presentations_generated = updatedProfile.presentations_generated;
        profile.images_generated = updatedProfile.images_generated;
        profile.guides_generated = updatedProfile.guides_generated;
        profile.gamified_activities_generated = updatedProfile.gamified_activities_generated;
        profile.visual_resources_generated = updatedProfile.visual_resources_generated;
        profile.evaluations_generated = updatedProfile.evaluations_generated;
        profile.juegos_generated = updatedProfile.juegos_generated;
        profile.lecturas_generated = updatedProfile.lecturas_generated;
        profile.last_cycle_start = updatedProfile.last_cycle_start;
      }
    }

    const currentCount = profile[column] ?? 0;
    const limit = ACTIVE_LIMITS[column];
    const renewalDate = currentCycleEnd.toISOString();

    if (currentCount >= limit) {
      return { blocked: true, reason: 'limit_reached', profile, renewalDate };
    }

    return { blocked: false, profile, renewalDate };
  }

  // Expired plan
  if (profile.plan_status === 'expired') {
    return { blocked: true, reason: 'trial_expired', profile };
  }

  // Trial plan — check both time and usage
  const trialStart = profile.trial_started_at
    ? new Date(profile.trial_started_at)
    : new Date();
  const trialEnd = new Date(trialStart.getTime() + TRIAL_DAYS * 24 * 60 * 60 * 1000);
  const now = new Date();
  const renewalDate = trialEnd.toISOString();

  if (now > trialEnd) {
    return { blocked: true, reason: 'trial_expired', profile, renewalDate };
  }

  const currentCount: number = profile[column] ?? 0;
  const limit = TRIAL_LIMITS[column];

  if (currentCount >= limit) {
    return { blocked: true, reason: 'limit_reached', profile, renewalDate };
  }

  return { blocked: false, profile, renewalDate };
}

/**
 * Increments the given usage counter by 1 for the user.
 * Called AFTER successful generation (including HTML fallback).
 * Errors are logged but not thrown — a failed increment should not
 * cause the generation response to fail.
 */
export async function incrementCounter(
  supabase: SupabaseClient,
  userId: string,
  column: CounterColumn
): Promise<void> {
  if (process.env.NODE_ENV === 'development' && userId === 'a06a2e45-d28c-4f7f-8d96-e2a27b87fcf9') {
    const profile = getMockProfile();
    profile[column] = (profile[column] ?? 0) + 1;
    saveMockProfile(profile);
    return;
  }

  const { error } = await supabase.rpc('increment_usage_counter', {
    p_user_id: userId,
    p_column:  column,
  });

  if (error) {
    // Fallback: manual increment
    const { data: profile } = await supabase
      .from('user_profiles')
      .select(column)
      .eq('id', userId)
      .single();

    if (profile) {
      const current: number = (profile as Record<string, number>)[column] ?? 0;
      await supabase
        .from('user_profiles')
        .update({ [column]: current + 1, updated_at: new Date().toISOString() })
        .eq('id', userId);
    }
  }
}

/**
 * Returns the full user profile for display in the frontend.
 * Used by the dashboard to show usage counters.
 */
export async function getUserProfile(
  supabase: SupabaseClient,
  userId: string
): Promise<UserProfile | null> {
  if (process.env.NODE_ENV === 'development' && userId === 'a06a2e45-d28c-4f7f-8d96-e2a27b87fcf9') {
    return getMockProfile();
  }
  return getOrCreateProfile(supabase, userId);
}
