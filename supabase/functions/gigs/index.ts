// Tonight gig feed — proxies Ticketmaster Discovery so the API key stays
// server-side (CLAUDE.md: external APIs go through Edge Functions, never the
// client). Deploy with:  supabase functions deploy gigs --no-verify-jwt
// and set the key with:  supabase secrets set TICKETMASTER_API_KEY=...
//
// --no-verify-jwt because gig browsing is open to everyone (open-app principle);
// the key is the only secret and it never leaves the server.

import { normalizeEvents } from './normalize.ts';

const TICKETMASTER_URL = 'https://app.ticketmaster.com/discovery/v2/events.json';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS },
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS });
  }

  const apiKey = Deno.env.get('TICKETMASTER_API_KEY');
  if (!apiKey) {
    return json({ error: 'TICKETMASTER_API_KEY is not set on the function.' }, 500);
  }

  // Dublin music events from now, soonest first.
  const params = new URLSearchParams({
    apikey: apiKey,
    city: 'Dublin',
    countryCode: 'IE',
    classificationName: 'music',
    sort: 'date,asc',
    size: '30',
    startDateTime: `${new Date().toISOString().slice(0, 19)}Z`,
  });

  let payload: unknown;
  try {
    const res = await fetch(`${TICKETMASTER_URL}?${params.toString()}`);
    if (!res.ok) {
      return json({ error: `Ticketmaster responded ${res.status}` }, 502);
    }
    payload = await res.json();
  } catch (_e) {
    return json({ error: 'Could not reach Ticketmaster.' }, 502);
  }

  return json({ gigs: normalizeEvents(payload) });
});
