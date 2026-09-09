import { getSupabase } from '@/lib/supabase';

/** Ids the user has blocked. */
export async function listBlockedIds(userId: string): Promise<string[]> {
  const { data, error } = await getSupabase()
    .from('blocks')
    .select('blocked_id')
    .eq('blocker_id', userId);
  if (error) throw error;
  return (data ?? []).map((r) => r.blocked_id);
}

export async function blockUser(userId: string, blockedId: string): Promise<void> {
  const { error } = await getSupabase()
    .from('blocks')
    .upsert(
      { blocker_id: userId, blocked_id: blockedId },
      { onConflict: 'blocker_id,blocked_id', ignoreDuplicates: true },
    );
  if (error) throw error;
}

export async function reportUser(
  reporterId: string,
  reportedId: string,
  context: string,
): Promise<void> {
  const { error } = await getSupabase()
    .from('user_reports')
    .insert({ reporter_id: reporterId, reported_id: reportedId, context });
  if (error) throw error;
}
