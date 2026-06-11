/**
 * Jusoor — Secure AI Proxy (Cloudflare Worker)
 * Production AI architecture: the Anthropic API key lives ONLY on this server
 * as a secret. The browser never sees or stores a key.
 *
 * Deploy: see SETUP_AI_PROXY.md (≈10 minutes, free tier).
 */

const ALLOWED_ORIGIN = 'https://alialhadri.github.io'; // your site — change if you move domains
const MAX_BODY_BYTES = 100_000;                        // reject oversized payloads
const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages';
const ALLOWED_MODELS = ['claude-sonnet-4-6', 'claude-haiku-4-5-20251001', 'claude-opus-4-6'];

export default {
  async fetch(request, env) {
    const cors = {
      'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, anthropic-version',
      'Access-Control-Max-Age': '86400',
    };

    // CORS preflight
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
    if (request.method !== 'POST')
      return json({ error: { message: 'Method not allowed' } }, 405, cors);

    // Only our site may call this proxy
    const origin = request.headers.get('Origin') || '';
    if (origin !== ALLOWED_ORIGIN)
      return json({ error: { message: 'Forbidden origin' } }, 403, cors);

    // Size guard
    const bodyText = await request.text();
    if (bodyText.length > MAX_BODY_BYTES)
      return json({ error: { message: 'Payload too large' } }, 413, cors);

    // Model allow-list guard
    let body;
    try { body = JSON.parse(bodyText); } catch {
      return json({ error: { message: 'Invalid JSON' } }, 400, cors);
    }
    if (!ALLOWED_MODELS.includes(body.model))
      return json({ error: { message: 'Model not allowed' } }, 400, cors);
    if ((body.max_tokens || 0) > 4000) body.max_tokens = 4000; // cost guard

    // Forward to Anthropic with the SERVER-SIDE secret key
    const upstream = await fetch(ANTHROPIC_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': env.ANTHROPIC_API_KEY, // secret — set in Worker settings, never in code
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(body),
    });

    const out = await upstream.text();
    return new Response(out, {
      status: upstream.status,
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  },
};

function json(obj, status, cors) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json' },
  });
}
