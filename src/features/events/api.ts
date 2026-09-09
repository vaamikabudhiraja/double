import type { ChatMessage } from '@/features/chat/types';
import type { Gig } from '@/features/gigs/types';
import { getSupabase } from '@/lib/supabase';

import type { EventRoom } from './types';

const ROOM_COLS = 'id, ticketmaster_id, name, venue, starts_at, url, going_count';

function mapRoom(r: {
  id: string;
  ticketmaster_id: string;
  name: string;
  venue: string | null;
  starts_at: string | null;
  url: string | null;
  going_count: number;
}): EventRoom {
  return {
    id: r.id,
    ticketmasterId: r.ticketmaster_id,
    name: r.name,
    venue: r.venue,
    startsAt: r.starts_at,
    url: r.url,
    goingCount: r.going_count,
  };
}

/** Finds the room for a gig, or null if nobody's created it yet. */
export async function findRoom(ticketmasterId: string): Promise<EventRoom | null> {
  const { data, error } = await getSupabase()
    .from('event_rooms')
    .select(ROOM_COLS)
    .eq('ticketmaster_id', ticketmasterId)
    .maybeSingle();
  if (error) throw error;
  return data ? mapRoom(data) : null;
}

/** Creates the room for a gig (or returns the existing one on a race). */
export async function createRoom(gig: Gig): Promise<EventRoom> {
  const { data, error } = await getSupabase()
    .from('event_rooms')
    .insert({
      ticketmaster_id: gig.id,
      name: gig.name,
      venue: gig.venue,
      starts_at: gig.startsAt,
      url: gig.url,
    })
    .select(ROOM_COLS)
    .single();
  if (error) {
    const existing = await findRoom(gig.id);
    if (existing) return existing;
    throw error;
  }
  return mapRoom(data);
}

export async function getMyAttendance(
  eventId: string,
  userId: string,
): Promise<{ attending: boolean; pint: boolean }> {
  const { data, error } = await getSupabase()
    .from('event_attendees')
    .select('pint')
    .eq('event_id', eventId)
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw error;
  return { attending: !!data, pint: data?.pint ?? false };
}

export async function joinEvent(eventId: string, userId: string): Promise<void> {
  const { error } = await getSupabase()
    .from('event_attendees')
    .upsert(
      { event_id: eventId, user_id: userId },
      { onConflict: 'event_id,user_id', ignoreDuplicates: true },
    );
  if (error) throw error;
}

export async function leaveEvent(eventId: string, userId: string): Promise<void> {
  const { error } = await getSupabase()
    .from('event_attendees')
    .delete()
    .eq('event_id', eventId)
    .eq('user_id', userId);
  if (error) throw error;
}

export async function setPint(
  eventId: string,
  userId: string,
  pint: boolean,
): Promise<void> {
  const { error } = await getSupabase()
    .from('event_attendees')
    .update({ pint })
    .eq('event_id', eventId)
    .eq('user_id', userId);
  if (error) throw error;
}

/** Names of everyone going (visible only to attendees, per RLS). */
export async function listAttendeeNames(eventId: string): Promise<string[]> {
  const sb = getSupabase();
  const { data, error } = await sb
    .from('event_attendees')
    .select('user_id')
    .eq('event_id', eventId);
  if (error) throw error;
  const ids = (data ?? []).map((r) => r.user_id);
  if (ids.length === 0) return [];
  const { data: profs } = await sb
    .from('profiles')
    .select('id, display_name')
    .in('id', ids);
  const names = new Map((profs ?? []).map((p) => [p.id, p.display_name]));
  return ids.map((id) => names.get(id) ?? 'Someone');
}

// ---- Event chat --------------------------------------------------------------

export async function fetchEventMessages(eventId: string): Promise<ChatMessage[]> {
  const sb = getSupabase();
  const { data, error } = await sb
    .from('event_messages')
    .select('id, body, created_at, sender_id')
    .eq('event_id', eventId)
    .order('created_at', { ascending: true })
    .limit(100);
  if (error) throw error;

  const rows = data ?? [];
  const ids = [...new Set(rows.map((r) => r.sender_id))];
  const names = new Map<string, string>();
  if (ids.length) {
    const { data: profs } = await sb
      .from('profiles')
      .select('id, display_name')
      .in('id', ids);
    (profs ?? []).forEach((p) => names.set(p.id, p.display_name));
  }
  return rows.map((r) => ({
    id: r.id,
    body: r.body,
    createdAt: r.created_at,
    senderId: r.sender_id,
    senderName: names.get(r.sender_id) ?? 'Someone',
  }));
}

export async function sendEventMessage(
  eventId: string,
  senderId: string,
  body: string,
): Promise<{ id: string; createdAt: string }> {
  const { data, error } = await getSupabase()
    .from('event_messages')
    .insert({ event_id: eventId, sender_id: senderId, body })
    .select('id, created_at')
    .single();
  if (error) throw error;
  return { id: data.id, createdAt: data.created_at };
}
