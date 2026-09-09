// Pure mapping from a Ticketmaster Discovery API payload to the slim shape the
// app needs. Kept separate from index.ts so it can be unit-tested without a
// network call (see normalize.test.ts).

export interface Gig {
  id: string;
  name: string;
  venue: string | null;
  /** ISO datetime or date string, or null if Ticketmaster didn't provide one. */
  startsAt: string | null;
  url: string | null;
  imageUrl: string | null;
}

interface TicketmasterImage {
  url?: string;
  ratio?: string;
  width?: number;
}

export function normalizeEvents(payload: unknown): Gig[] {
  const events = (payload as any)?._embedded?.events;
  if (!Array.isArray(events)) return [];

  return events.map((event: any): Gig => ({
    id: String(event?.id ?? cryptoRandom()),
    name: typeof event?.name === 'string' ? event.name : 'Untitled event',
    venue: event?._embedded?.venues?.[0]?.name ?? null,
    startsAt: event?.dates?.start?.dateTime ?? event?.dates?.start?.localDate ?? null,
    url: typeof event?.url === 'string' ? event.url : null,
    imageUrl: pickImage(event?.images),
  }));
}

/** Prefer a wide, reasonably large image; fall back to whatever exists. */
function pickImage(images: unknown): string | null {
  if (!Array.isArray(images)) return null;
  const wide = (images as TicketmasterImage[]).find(
    (img) => img.ratio === '16_9' && (img.width ?? 0) >= 640,
  );
  return wide?.url ?? (images as TicketmasterImage[])[0]?.url ?? null;
}

function cryptoRandom(): string {
  return Math.random().toString(36).slice(2);
}
