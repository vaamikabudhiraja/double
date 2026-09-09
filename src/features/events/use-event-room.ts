import { useCallback, useEffect, useState } from 'react';

import type { Gig } from '@/features/gigs/types';
import {
  createRoom,
  findRoom,
  getMyAttendance,
  joinEvent,
  leaveEvent,
  listAttendeeNames,
  setPint,
} from './api';
import type { EventRoom } from './types';

/** Loads (and lazily creates) a gig's event room and the viewer's attendance. */
export function useEventRoom(gig: Gig, userId: string | undefined) {
  const [room, setRoom] = useState<EventRoom | null>(null);
  const [attending, setAttending] = useState(false);
  const [pint, setPintState] = useState(false);
  const [names, setNames] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(
    async (existing?: EventRoom) => {
      const found = existing ?? (await findRoom(gig.id));
      setRoom(found);
      if (found && userId) {
        const mine = await getMyAttendance(found.id, userId);
        setAttending(mine.attending);
        setPintState(mine.pint);
        setNames(mine.attending ? await listAttendeeNames(found.id) : []);
      } else {
        setAttending(false);
        setNames([]);
      }
    },
    [gig.id, userId],
  );

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        await refresh();
      } catch (e) {
        if (active) setError(e instanceof Error ? e.message : 'Could not open the room.');
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [refresh]);

  const join = useCallback(async () => {
    if (!userId || busy) return;
    setBusy(true);
    setError(null);
    try {
      const r = room ?? (await createRoom(gig));
      await joinEvent(r.id, userId);
      await refresh(r);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not join.');
    } finally {
      setBusy(false);
    }
  }, [userId, busy, room, gig, refresh]);

  const leave = useCallback(async () => {
    if (!userId || !room || busy) return;
    setBusy(true);
    try {
      await leaveEvent(room.id, userId);
      await refresh(room);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not leave.');
    } finally {
      setBusy(false);
    }
  }, [userId, room, busy, refresh]);

  const togglePint = useCallback(async () => {
    if (!userId || !room) return;
    const next = !pint;
    setPintState(next); // optimistic
    try {
      await setPint(room.id, userId, next);
    } catch {
      setPintState(!next);
    }
  }, [userId, room, pint]);

  return { room, attending, pint, names, loading, busy, error, join, leave, togglePint };
}
