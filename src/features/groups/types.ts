import type { JoinPolicy } from '@/lib/database.types';

export type { JoinPolicy };

export interface Group {
  id: string;
  name: string;
  category: string;
  description: string | null;
  join_policy: JoinPolicy;
  member_count: number;
  host_id: string;
}

/** A group plus the current viewer's relationship to it. */
export interface GroupWithMembership extends Group {
  isMember: boolean;
  isHost: boolean;
}

/** Categories offered when creating a group (from the wireframe). */
export const CATEGORIES = [
  { key: 'outdoors', label: 'Outdoors', emoji: '🥾' },
  { key: 'wine', label: 'Wine', emoji: '🍷' },
  { key: 'games', label: 'Games', emoji: '🎲' },
  { key: 'music', label: 'Music', emoji: '🎧' },
  { key: 'fitness', label: 'Fitness', emoji: '🏃' },
  { key: 'food', label: 'Food', emoji: '🍳' },
] as const;

export function categoryEmoji(key: string): string {
  return CATEGORIES.find((c) => c.key === key)?.emoji ?? '✨';
}

export function categoryLabel(key: string): string {
  return CATEGORIES.find((c) => c.key === key)?.label ?? key;
}
