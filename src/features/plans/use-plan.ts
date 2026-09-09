import { useCallback, useEffect, useState } from 'react';

import { getNextPlan, setRsvp } from './api';
import type { PlanWithRsvp, RsvpStatus } from './types';

/** Loads a group's next plan and exposes RSVP + reload. */
export function usePlan(groupId: string, userId: string | undefined) {
  const [plan, setPlan] = useState<PlanWithRsvp | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setPlan(await getNextPlan(groupId, userId));
    } catch {
      setPlan(null);
    } finally {
      setLoading(false);
    }
  }, [groupId, userId]);

  useEffect(() => {
    load();
  }, [load]);

  const rsvp = useCallback(
    async (status: RsvpStatus) => {
      if (!plan || !userId) return;
      // Optimistic update.
      setPlan((prev) => {
        if (!prev) return prev;
        const wasIn = prev.myStatus === 'in';
        const nowIn = status === 'in';
        const delta = nowIn === wasIn ? 0 : nowIn ? 1 : -1;
        return { ...prev, myStatus: status, goingCount: Math.max(0, prev.goingCount + delta) };
      });
      try {
        await setRsvp(plan.id, userId, status);
      } catch {
        load();
      }
    },
    [plan, userId, load],
  );

  return { plan, loading, rsvp, reload: load };
}
