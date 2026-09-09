import { getSupabase } from '@/lib/supabase';

import type { Group, JoinPolicy } from './types';

const COLUMNS = 'id, name, category, description, join_policy, member_count, host_id';

/** All groups, newest first (discovery is public). */
export async function listGroups(): Promise<Group[]> {
  const { data, error } = await getSupabase()
    .from('groups')
    .select(COLUMNS)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

/** The group ids the current user belongs to (RLS scopes this to the caller). */
export async function listMyGroupIds(userId: string): Promise<string[]> {
  const { data, error } = await getSupabase()
    .from('group_members')
    .select('group_id')
    .eq('user_id', userId);
  if (error) throw error;
  return (data ?? []).map((row) => row.group_id);
}

export type NewGroup = {
  name: string;
  category: string;
  description: string | null;
  join_policy: JoinPolicy;
};

/** Creates a group hosted by the user; a trigger adds them as the host member. */
export async function createGroup(hostId: string, input: NewGroup): Promise<Group> {
  const { data, error } = await getSupabase()
    .from('groups')
    .insert({ ...input, host_id: hostId })
    .select(COLUMNS)
    .single();
  if (error) throw error;
  return data;
}

export async function joinGroup(groupId: string, userId: string): Promise<void> {
  const { error } = await getSupabase()
    .from('group_members')
    .insert({ group_id: groupId, user_id: userId, role: 'member' });
  if (error) throw error;
}

export async function leaveGroup(groupId: string, userId: string): Promise<void> {
  const { error } = await getSupabase()
    .from('group_members')
    .delete()
    .eq('group_id', groupId)
    .eq('user_id', userId);
  if (error) throw error;
}
