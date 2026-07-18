/**
 * lib/trialGuard.ts
 */
import { SupabaseClient } from '@supabase/supabase-js';

export type CounterColumn =
  | 'planificaciones'
  | 'guias'
  | 'evaluaciones'
  | 'rei_play'
  | 'rei_lecturas'
  | 'experiencias_rei';

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
  rei_play_count: number;
  rei_lecturas_count: number;
  experiencias_rei_count: number;
}

export interface TrialGuardResult {
  blocked: boolean;
  reason?: 'trial_expired' | 'limit_reached';
  profile?: UserProfile;
  renewalDate?: string;
}

const TRIAL_DAYS = 7;

export const TRIAL_LIMITS = {
  planificaciones: 3,
  guias: 2,
  evaluaciones: 3,
  rei_play: 2,
  rei_lecturas: 1,
  experiencias_rei: 1,
};

export const ACTIVE_LIMITS: Record<CounterColumn, number> = {
  planificaciones: 24,
  guias: 12,
  evaluaciones: 12,
  rei_play: 999999,
  rei_lecturas: 999999,
  experiencias_rei: 999999,
};

export const COLUMN_MAP: Record<CounterColumn, string> = {
  planificaciones:  'planifications_generated',
  guias:            'guias_generated',
  evaluaciones:     'evaluations_generated',
  rei_play:         'rei_play_count',
  rei_lecturas:     'rei_lecturas_count',
  experiencias_rei: 'experiencias_rei_count',
};

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
    lecturas_generated: 0,
    rei_play_count: 0,
    rei_lecturas_count: 0,
    experiencias_rei_count: 0
  };
  try {
    const scratchDir = path.dirname(mockPath);
    if (!fs.existsSync(scratchDir)) fs.mkdirSync(scratchDir, { recursive: true });
    if (fs.existsSync(mockPath)) {
      const data = JSON.parse(fs.readFileSync(mockPath, 'utf8'));
      return { ...defaultProfile, ...data };
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

async function getOrCreateProfile(supabase: SupabaseClient, userId: string): Promise<UserProfile | null> {
  const { data: rpcData, error: rpcErr } = await supabase
    .rpc('get_or_create_profile', { p_user_id: userId })
    .single();
  if (!rpcErr && rpcData) return rpcData as UserProfile;

  const { data: selectData, error: selectErr } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();
  if (selectErr || !selectData) {
    const { data: insertData } = await supabase
      .from('user_profiles')
      .insert({ id: userId, trial_started_at: new Date().toISOString() })
      .select('*')
      .single();
    return insertData as UserProfile | null;
  }
  return selectData as UserProfile;
}

export async function checkTrialLimit(
  supabase: SupabaseClient,
  userId: string,
  column: CounterColumn
): Promise<TrialGuardResult> {
  try {
    const { data: userData } = await supabase.auth.getUser();
    if (userData?.user?.email) {
      const email = userData.user.email.toLowerCase().trim();
      if (email === 'jvaliente@corporacioncolina.cl' || email === 'valientepaloj@gmail.com') {
        console.log(`[trialGuard] Eximiendo al administrador de límites: ${email}`);
        return { blocked: false };
      }
    }
  } catch (e) {}

  const dbColumn = COLUMN_MAP[column];

  if (process.env.NODE_ENV === 'development' && userId === 'a06a2e45-d28c-4f7f-8d96-e2a27b87fcf9') {
    const profile = getMockProfile();
    const trialStart = profile.trial_started_at ? new Date(profile.trial_started_at) : new Date();
    const trialEnd = new Date(trialStart.getTime() + TRIAL_DAYS * 24 * 60 * 60 * 1000);
    if (new Date() > trialEnd) return { blocked: true, reason: 'trial_expired', profile };
    const currentCount = (profile as any)[dbColumn] ?? 0;
    if (currentCount >= TRIAL_LIMITS[column]) return { blocked: true, reason: 'limit_reached', profile };
    return { blocked: false, profile };
  }

  const profile = await getOrCreateProfile(supabase, userId);
  if (!profile) return { blocked: false };

  if (profile.plan_status === 'active') {
    const activeStart = profile.active_started_at ? new Date(profile.active_started_at) : new Date();
    const now = new Date();
    const cycleMs = 30 * 24 * 60 * 60 * 1000;
    const diffMs = now.getTime() - activeStart.getTime();
    const cycleIndex = Math.max(0, Math.floor(diffMs / cycleMs));
    const currentCycleStart = new Date(activeStart.getTime() + cycleIndex * cycleMs);
    const currentCycleEnd = new Date(currentCycleStart.getTime() + cycleMs);
    const currentCount = (profile as any)[dbColumn] ?? 0;
    const limit = ACTIVE_LIMITS[column];
    if (currentCount >= limit) {
      return { blocked: true, reason: 'limit_reached', profile, renewalDate: currentCycleEnd.toISOString() };
    }
    return { blocked: false, profile, renewalDate: currentCycleEnd.toISOString() };
  }

  if (profile.plan_status === 'expired') return { blocked: true, reason: 'trial_expired', profile };

  const trialStart = profile.trial_started_at ? new Date(profile.trial_started_at) : new Date();
  const trialEnd = new Date(trialStart.getTime() + TRIAL_DAYS * 24 * 60 * 60 * 1000);
  const renewalDate = trialEnd.toISOString();
  if (new Date() > trialEnd) return { blocked: true, reason: 'trial_expired', profile, renewalDate };

  const currentCount: number = (profile as any)[dbColumn] ?? 0;
  if (currentCount >= TRIAL_LIMITS[column]) return { blocked: true, reason: 'limit_reached', profile, renewalDate };

  return { blocked: false, profile, renewalDate };
}

export async function incrementCounter(
  supabase: SupabaseClient,
  userId: string,
  column: CounterColumn
): Promise<void> {
  const dbColumn = COLUMN_MAP[column];
  if (process.env.NODE_ENV === 'development' && userId === 'a06a2e45-d28c-4f7f-8d96-e2a27b87fcf9') {
    const profile = getMockProfile();
    (profile as any)[dbColumn] = ((profile as any)[dbColumn] ?? 0) + 1;
    saveMockProfile(profile);
    return;
  }
  const { error } = await supabase.rpc('increment_usage_counter', { p_user_id: userId, p_column: dbColumn });
  if (error) {
    const { data: profile } = await supabase.from('user_profiles').select(dbColumn).eq('id', userId).single();
    if (profile) {
      const current: number = (profile as any)[dbColumn] ?? 0;
      await supabase.from('user_profiles').update({ [dbColumn]: current + 1, updated_at: new Date().toISOString() }).eq('id', userId);
    }
  }
}

export async function getUserProfile(supabase: SupabaseClient, userId: string): Promise<UserProfile | null> {
  if (process.env.NODE_ENV === 'development' && userId === 'a06a2e45-d28c-4f7f-8d96-e2a27b87fcf9') {
    return getMockProfile();
  }
  return getOrCreateProfile(supabase, userId);
}
