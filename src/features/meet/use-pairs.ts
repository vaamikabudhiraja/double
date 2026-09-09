import { useCallback, useEffect, useMemo, useState } from 'react';

import { confirmPair, listMyPairs, removePair, requestPair } from './api';
import type { Pair } from './types';

export function usePairs(userId: string | undefined) {
  const [pairs, setPairs] = useState<Pair[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      setPairs(await listMyPairs(userId));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load your +1.');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    load();
  }, [load]);

  const groups = useMemo(
    () => ({
      confirmed: pairs.filter((p) => p.status === 'confirmed'),
      incoming: pairs.filter((p) => p.incoming),
      outgoing: pairs.filter((p) => p.status === 'pending' && !p.incoming),
    }),
    [pairs],
  );

  const ask = useCallback(
    async (partnerId: string) => {
      if (!userId) return;
      await requestPair(userId, partnerId);
      await load();
    },
    [userId, load],
  );

  const accept = useCallback(
    async (pairId: string) => {
      await confirmPair(pairId);
      await load();
    },
    [load],
  );

  const remove = useCallback(
    async (pairId: string) => {
      await removePair(pairId);
      await load();
    },
    [load],
  );

  /** Ids already paired/requested, to hide from search results. */
  const relatedIds = useMemo(
    () => new Set(pairs.map((p) => p.otherId)),
    [pairs],
  );

  return { pairs, groups, relatedIds, loading, error, ask, accept, remove, reload: load };
}
