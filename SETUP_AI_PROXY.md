# Jusoor — Secure AI Proxy Setup (≈10 minutes, free)

This moves the Anthropic API key **out of the browser** onto a server you control
(a Cloudflare Worker). After setup, the Jusoor page holds **no key at all** — it sends
de-identified clinical values to *your* proxy, and the proxy talks to Anthropic.

```
Before (demo):    Browser (key in storage) ──────────────► api.anthropic.com
After (prod):     Browser (no key)  ──► YOUR Worker (key as server secret) ──► api.anthropic.com
```

## Steps

1. **Create a free Cloudflare account** — https://dash.cloudflare.com/sign-up (no card needed).

2. **Create the Worker**
   - Dashboard → **Workers & Pages** → **Create** → **Create Worker**
   - Name it `jusoor-ai` → **Deploy** (deploys the hello-world template first)

3. **Paste the code**
   - Click **Edit code**, delete everything, paste the contents of `ai-proxy-worker.js`
   - Press **Deploy**

4. **Add your API key as a secret** (never in the code)
   - Worker → **Settings** → **Variables and Secrets** → **Add**
   - Type: **Secret** · Name: `ANTHROPIC_API_KEY` · Value: your `sk-ant-api03-…` key
   - **Save & Deploy**

5. **Copy the Worker URL** — looks like `https://jusoor-ai.YOURACCOUNT.workers.dev`

6. **Connect Jusoor**
   - Open the Jusoor site → **Settings** → **Secure AI Proxy URL** → paste the URL → **Save**
   - Status pill should now read **AI: Ready · 🔒 secure proxy**
   - Press **Clear** on the API key field — the browser no longer needs it

## What this gives you

- Key stored as an encrypted server secret; browser and page source contain no key
- Only `https://alialhadri.github.io` may call the proxy (origin check)
- Model allow-list + max-token cap (cost guard) + payload size limit
- Free tier: 100,000 requests/day — far beyond demo needs

## What it does NOT solve (for the H.C.C. conversation)

Data still transits Anthropic (US). For real patient data under PDPL you need the full
Phase-1 backend in a KSA region with a data-processing agreement or a locally hosted
model — this Worker is the correct *architecture pattern* for that build, demonstrated
on free infrastructure.
