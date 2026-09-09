/** A gig as returned by the `gigs` Edge Function (see supabase/functions/gigs). */
export interface Gig {
  id: string;
  name: string;
  venue: string | null;
  /** ISO datetime or date string, or null. */
  startsAt: string | null;
  url: string | null;
  imageUrl: string | null;
}
