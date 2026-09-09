import { getSupabase } from '@/lib/supabase';

import type { Plan, PlanWithRsvp, RsvpStatus } from './types';

const COLUMNS = 'id, group_id, created_by, title, details, location, starts_at';

function mapPlan(row: {
  id: string;
  group_id: string;
  created_by: string;
  title: string;
  details: string | null;
  location: string | null;
  starts_at: string;
}): Plan {
  return {
    id: row.id,
    groupId: row.group_id,
    createdBy: row.created_by,
    title: row.title,
    details: row.details,
    location: row.location,
    startsAt: row.starts_at,
  };
}

/**
 * The group's next plan: the soonest upcoming one, or the most recent past one
 * if none are upcoming. Returns null if the group has no plans.
 */
export async function getNextPlan(
  groupId: string,
  userId: string | undefined,
): Promise<PlanWithRsvp | null> {
  const sb = getSupabase();
  const nowIso = new Date().toISOString();

  const upcoming = await sb
    .from('plans')
    .select(COLUMNS)
    .eq('group_id', groupId)
    .gte('starts_at', nowIso)
    .order('starts_at', { ascending: true })
    .limit(1)
    .maybeSingle();
  if (upcoming.error) throw upcoming.error;

  let row = upcoming.data;
  if (!row) {
    const recent = await sb
      .from('plans')
      .select(COLUMNS)
      .eq('group_id', groupId)
      .order('starts_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (recent.error) throw recent.error;
    row = recent.data;
  }
  if (!row) return null;

  const plan = mapPlan(row);

  const rsvps = await sb.from('plan_rsvps').select('user_id, status').eq('plan_id', plan.id);
  if (rsvps.error) throw rsvps.error;
  const rows = rsvps.data ?? [];

  return {
    ...plan,
    goingCount: rows.filter((r) => r.status === 'in').length,
    myStatus: userId
      ? ((rows.find((r) => r.user_id === userId)?.status as RsvpStatus | undefined) ?? null)
      : null,
  };
}

export type NewPlan = {
  title: string;
  details: string | null;
  location: string | null;
  startsAt: string;
};

/** Creates a plan for the group and RSVPs the creator as "in". */
export async function createPlan(
  groupId: string,
  userId: string,
  input: NewPlan,
): Promise<Plan> {
  const sb = getSupabase();
  const { data, error } = await sb
    .from('plans')
    .insert({
      group_id: groupId,
      created_by: userId,
      title: input.title,
      details: input.details,
      location: input.location,
      starts_at: input.startsAt,
    })
    .select(COLUMNS)
    .single();
  if (error) throw error;

  await setRsvp(data.id, userId, 'in');
  return mapPlan(data);
}

/** Upserts the user's RSVP for a plan. */
export async function setRsvp(
  planId: string,
  userId: string,
  status: RsvpStatus,
): Promise<void> {
  const { error } = await getSupabase()
    .from('plan_rsvps')
    .upsert(
      { plan_id: planId, user_id: userId, status },
      { onConflict: 'plan_id,user_id' },
    );
  if (error) throw error;
}
