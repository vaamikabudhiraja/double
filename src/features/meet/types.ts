export type PairStatus = 'pending' | 'confirmed';

/** A pair from the current viewer's perspective. */
export interface Pair {
  id: string;
  status: PairStatus;
  otherId: string;
  otherName: string;
  /** True when someone asked YOU (you're the partner and it's pending). */
  incoming: boolean;
}

export interface UserResult {
  id: string;
  name: string;
}
