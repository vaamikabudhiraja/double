// Run with: deno test supabase/functions/gigs/
import { assertEquals } from 'jsr:@std/assert@1';

import { normalizeEvents } from './normalize.ts';

Deno.test('normalizeEvents maps the fields the app needs', () => {
  const gigs = normalizeEvents({
    _embedded: {
      events: [
        {
          id: 'evt1',
          name: 'Sprints',
          dates: { start: { dateTime: '2026-09-12T19:00:00Z' } },
          _embedded: { venues: [{ name: "Whelan's" }] },
          url: 'https://ticketmaster.ie/sprints',
          images: [{ ratio: '16_9', width: 1024, url: 'https://img/wide.jpg' }],
        },
      ],
    },
  });

  assertEquals(gigs.length, 1);
  assertEquals(gigs[0], {
    id: 'evt1',
    name: 'Sprints',
    venue: "Whelan's",
    startsAt: '2026-09-12T19:00:00Z',
    url: 'https://ticketmaster.ie/sprints',
    imageUrl: 'https://img/wide.jpg',
  });
});

Deno.test('normalizeEvents tolerates missing fields', () => {
  const gigs = normalizeEvents({ _embedded: { events: [{ id: 'bare' }] } });
  assertEquals(gigs[0].name, 'Untitled event');
  assertEquals(gigs[0].venue, null);
  assertEquals(gigs[0].startsAt, null);
  assertEquals(gigs[0].url, null);
  assertEquals(gigs[0].imageUrl, null);
});

Deno.test('normalizeEvents returns [] for an empty or malformed payload', () => {
  assertEquals(normalizeEvents({}), []);
  assertEquals(normalizeEvents(null), []);
  assertEquals(normalizeEvents({ _embedded: { events: 'nope' } }), []);
});
