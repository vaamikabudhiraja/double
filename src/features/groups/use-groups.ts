import { useCallback, useEffect, useState } from 'react';

import { listGroups, listMyGroupIds } from './api';
import type { Group, GroupWithMembership } from './types';

function decorate(
  groups: Group[],
  myIds: Set<string>,
  userId: string | undefined,
): GroupWithMembership[] {
  return groups.map((g) => ({
    ...g,
    isMember: myIds.has(g.id),
    isHost: !!userId && g.host_id === userId,
  }));
}

export function useGroups(userId: string | undefined) {
  const [groups, setGroups] = useState<GroupWithMembership[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (isRefresh: boolean) => {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);
      try {
        const [all, mine] = await Promise.all([
          listGroups(),
          userId ? listMyGroupIds(userId) : Promise.resolve<string[]>([]),
        ]);
        setGroups(decorate(all, new Set(mine), userId));
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Could not load groups.');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [userId],
  );

  useEffect(() => {
    load(false);
  }, [load]);

  return {
    groups,
    loading,
    refreshing,
    error,
    reload: () => load(true),
  };
}
