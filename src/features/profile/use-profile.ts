import { useCallback, useEffect, useState } from 'react';

import { getMyProfile } from './api';
import type { Profile } from './types';

/** Loads the current user's profile row. */
export function useMyProfile(userId: string | undefined) {
  const [profile, setProfile] = useState<Profile | null>(null);
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
      setProfile(await getMyProfile(userId));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load your profile.');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    load();
  }, [load]);

  return { profile, loading, error, reload: load };
}
