import { getSupabase } from '@/lib/supabase';

import type { Pair, UserResult } from './types';

/** Everyone the viewer is paired with or has a pending request with. */
export async function listMyPairs(userId: string): Promise<Pair[]> {
  const sb = getSupabase();
  const { data, error } = await sb
    .from('pairs')
    .select('id, requester_id, partner_id, status')
    .or(`requester_id.eq.${userId},partner_id.eq.${userId}`);
  if (error) throw error;

  const rows = data ?? [];
  const otherIds = rows.map((r) =>
    r.requester_id === userId ? r.partner_id : r.requester_id,
  );
  const names = new Map<string, string>();
  if (otherIds.length) {
    const { data: profs } = await sb
      .from('profiles')
      .select('id, display_name')
      .in('id', [...new Set(otherIds)]);
    (profs ?? []).forEach((p) => names.set(p.id, p.display_name));
  }

  return rows.map((r) => {
    const otherId = r.requester_id === userId ? r.partner_id : r.requester_id;
    return {
      id: r.id,
      status: r.status,
      otherId,
      otherName: names.get(otherId) ?? 'Someone',
      incoming: r.partner_id === userId && r.status === 'pending',
    };
  });
}

/** Search profiles by name (excludes the viewer). */
export async function searchUsers(
  query: string,
  excludeId: string,
): Promise<UserResult[]> {
  const q = query.trim();
  if (q.length < 2) return [];
  const { data, error } = await getSupabase()
    .from('profiles')
    .select('id, display_name')
    .ilike('display_name', `%${q}%`)
    .neq('id', excludeId)
    .limit(10);
  if (error) throw error;
  return (data ?? []).map((p) => ({ id: p.id, name: p.display_name }));
}

export async function requestPair(
  requesterId: string,
  partnerId: string,
): Promise<void> {
  const { error } = await getSupabase()
    .from('pairs')
    .insert({ requester_id: requesterId, partner_id: partnerId });
  if (error) throw error;
}

export async function confirmPair(pairId: string): Promise<void> {
  const { error } = await getSupabase()
    .from('pairs')
    .update({ status: 'confirmed' })
    .eq('id', pairId);
  if (error) throw error;
}

/** Decline / cancel / unpair — all just remove the row. */
export async function removePair(pairId: string): Promise<void> {
  const { error } = await getSupabase().from('pairs').delete().eq('id', pairId);
  if (error) throw error;
}
