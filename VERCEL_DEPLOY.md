# Vercel Deployment Guide — Glitter Glam

## Quick start

1. Go to https://vercel.com/dashboard
2. **Import Project** → pick `sushilskp/GlitterGlam`
3. Vercel will auto-detect Vite framework
4. **Before clicking Deploy**, add these Environment Variables:

| Variable | Required | Notes |
|----------|----------|-------|
| `OPENROUTER_API_KEY` | **YES** | Your OpenRouter key (`sk-or-v1-...`). Get one free at https://openrouter.ai/keys |
| `OPENROUTER_MODEL` | optional | Default: `openrouter/free`. Override to pin a specific model. |
| `APP_URL` | optional | Your Vercel URL, e.g. `https://glitter-glam.vercel.app`. Used as `HTTP-Referer` header. |
| `VITE_SUPABASE_URL` | for live DB | From your Supabase project settings. |
| `VITE_SUPABASE_ANON_KEY` | for live DB | From your Supabase project settings. |

5. Click **Deploy**. Build takes ~1-2 min.
6. Test: open `https://<your-app>.vercel.app/api/health` — should return JSON with `openRouterConfigured: true`.

## How it works

```
┌──────────────────────────────────────────────────┐
│  Vercel Project (Glitter Glam)                   │
│                                                  │
│  ┌────────────┐    ┌──────────────────────────┐  │
│  │  dist/     │    │  api/ (serverless)       │  │
│  │  static    │    │                          │  │
│  │  frontend  │    │  chat.ts  → /api/chat    │  │
│  │            │    │  health.ts → /api/health │  │
│  └────────────┘    └──────────────────────────┘  │
│         │                      │                 │
│         └──────┬───────────────┘                 │
│                ▼                                 │
│         vercel.json rewrites                     │
│         /api/*  → serverless functions            │
│         /*      → index.html (SPA)               │
└──────────────────────────────────────────────────┘
```

## Files added in this commit

- `api/chat.ts` — Vercel serverless function for OpenRouter proxy (with model fallback ladder)
- `api/health.ts` — Vercel serverless function for `/api/health` config check
- `vercel.json` — Build config, rewrites, and cache headers

## Files kept (still work for local dev)

- `server.ts` — Express server for `npm run dev` (local)
- `npm run build:express` — builds the Express server bundle (local production-like)

## Troubleshooting

### Chat returns "openrouter_not_configured"
→ `OPENROUTER_API_KEY` is not set in Vercel env. Go to Project Settings → Environment Variables → add it → **Redeploy**.

### Chat returns "all_models_failed"
→ Either OpenRouter is down or all free models are rate-limited. Wait a minute and try again.

### 404 on `/api/chat`
→ `api/chat.ts` didn't get picked up. Check the build log for TypeScript errors. The `api/` directory must be at the project root (not inside `src/` or `dist/`).

### Frontend works but chat is silent
→ Open browser DevTools → Network → look at the `/api/chat` request. Check the response body and the terminal output in Vercel dashboard → Logs.

## Environment scopes

In Vercel env vars, you can scope variables to:
- **Production** — main deployed URL
- **Preview** — every PR / branch preview
- **Development** — `vercel dev` locally

Recommended: put `OPENROUTER_API_KEY` in **all three** so preview deploys work too.
