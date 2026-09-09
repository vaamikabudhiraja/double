import { getSupabase } from '@/lib/supabase';

import type { Gig } from './types';

/**
 * Fetches Dublin gigs via the `gigs` Edge Function (which proxies Ticketmaster
 * server-side). Throws a friendly error if the function isn't deployed yet.
 */
export async function fetchGigs(): Promise<Gig[]> {
  const { data, error } = await getSupabase().functions.invoke<{
    gigs?: Gig[];
    error?: string;
  }>('gigs', { method: 'GET' });

  if (error) {
    throw new Error(
      "Couldn't load gigs. Deploy the `gigs` Edge Function and set " +
        'TICKETMASTER_API_KEY (see supabase/README.md).',
    );
  }
  if (data?.error) {
    throw new Error(data.error);
  }
  return data?.gigs ?? [];
}
