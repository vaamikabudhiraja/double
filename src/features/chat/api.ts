import { getSupabase } from '@/lib/supabase';

import type { ChatMessage } from './types';

/** Resolves display names for a set of sender ids (profiles are readable by all). */
async function fetchNames(ids: string[]): Promise<Map<string, string>> {
  const unique = [...new Set(ids)];
  const map = new Map<string, string>();
  if (unique.length === 0) return map;
  const { data } = await getSupabase()
    .from('profiles')
    .select('id, display_name')
    .in('id', unique);
  (data ?? []).forEach((p) => map.set(p.id, p.display_name));
  return map;
}

/** Last 100 messages in a group, oldest first (RLS restricts to members). */
export async function fetchMessages(groupId: string): Promise<ChatMessage[]> {
  const { data, error } = await getSupabase()
    .from('messages')
    .select('id, body, created_at, sender_id')
    .eq('group_id', groupId)
    .order('created_at', { ascending: true })
    .limit(100);
  if (error) throw error;

  const rows = data ?? [];
  const names = await fetchNames(rows.map((r) => r.sender_id));
  return rows.map((r) => ({
    id: r.id,
    body: r.body,
    createdAt: r.created_at,
    senderId: r.sender_id,
    senderName: names.get(r.sender_id) ?? 'Someone',
  }));
}

export async function sendMessage(
  groupId: string,
  senderId: string,
  body: string,
): Promise<{ id: string; createdAt: string }> {
  const { data, error } = await getSupabase()
    .from('messages')
    .insert({ group_id: groupId, sender_id: senderId, body })
    .select('id, created_at')
    .single();
  if (error) throw error;
  return { id: data.id, createdAt: data.created_at };
}

export async function fetchName(userId: string): Promise<string> {
  const { data } = await getSupabase()
    .from('profiles')
    .select('display_name')
    .eq('id', userId)
    .maybeSingle();
  return data?.display_name ?? 'Someone';
}
