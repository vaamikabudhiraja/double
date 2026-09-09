import { getSupabase } from '@/lib/supabase';

import type { Profile } from './types';

const COLUMNS = 'id, display_name, bio, new_to_dublin';

/** Loads the signed-in user's profile row (auto-created on sign-up). */
export async function getMyProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await getSupabase()
    .from('profiles')
    .select(COLUMNS)
    .eq('id', userId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export type ProfileUpdate = {
  display_name: string;
  bio: string | null;
  new_to_dublin: boolean;
};

/** Updates the signed-in user's own profile (RLS enforces owner-only writes). */
export async function updateMyProfile(
  userId: string,
  patch: ProfileUpdate,
): Promise<Profile> {
  const { data, error } = await getSupabase()
    .from('profiles')
    .update(patch)
    .eq('id', userId)
    .select(COLUMNS)
    .single();
  if (error) throw error;
  return data;
}
