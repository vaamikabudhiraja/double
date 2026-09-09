import { useCallback, useEffect, useState } from 'react';

import { fetchGigs } from './api';
import type { Gig } from './types';

type GigsState = {
  gigs: Gig[];
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  reload: () => void;
};

/** Loads the Tonight gig feed, with pull-to-refresh support. */
export function useGigs(): GigsState {
  const [gigs, setGigs] = useState<Gig[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (isRefresh: boolean) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      setGigs(await fetchGigs());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load gigs.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load(false);
  }, [load]);

  return { gigs, loading, refreshing, error, reload: () => load(true) };
}
