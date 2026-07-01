// Vercel serverless function: GET /api/health
// Returns 200 with the current configuration status so the frontend (or
// uptime monitor) can verify which integrations are wired up.
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'no-store');

  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    supabaseConfigured: Boolean(
      process.env.VITE_SUPABASE_URL && process.env.VITE_SUPABASE_ANON_KEY,
    ),
    openRouterConfigured: Boolean(process.env.OPENROUTER_API_KEY),
    model: process.env.OPENROUTER_MODEL || 'openrouter/free',
    runtime: 'vercel-serverless',
  });
}
