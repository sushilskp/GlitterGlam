// Vercel serverless function for the AI Stylist chat.
//
// This mirrors the behaviour of the Express route in /server.ts so the
// chatbot works identically on Vercel deployments.
//
// Required env var:
//   OPENROUTER_API_KEY  - your OpenRouter key
// Optional env vars:
//   OPENROUTER_MODEL    - override the default model
//   APP_URL             - used for HTTP-Referer header
//
// Route:  POST /api/chat
// Body:   { messages: ChatMessage[], model?: string }
// Respn:  OpenRouter JSON, or { error, message } on failure
//
// Vercel picks this file up automatically because it lives under /api and
// exports a default function with the standard (req, res) signature.

import type { VercelRequest, VercelResponse } from '@vercel/node';

const FALLBACK_MODELS = [
  'openrouter/free',
  'meta-llama/llama-3.3-70b-instruct:free',
  'google/gemma-3-27b-it:free',
  'mistralai/mistral-small-3.2-24b-instruct:free',
  'qwen/qwen-2.5-72b-instruct:free',
  'meta-llama/llama-3.1-8b-instruct:free',
  'qwen/qwen-2.5-7b-instruct:free',
  'deepseek/deepseek-chat-v3-0324:free',
  'google/gemini-2.0-flash-exp:free',
  'nvidia/llama-3.1-nemotron-70b-instruct:free',
];

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS — allow the same origin (Vercel serves both frontend and API from
  // one domain) and any preview deployments.
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'method_not_allowed', message: 'Use POST' });
  }

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return res.status(503).json({
      error: 'openrouter_not_configured',
      message: 'Set OPENROUTER_API_KEY in your Vercel env to enable the AI stylist.',
    });
  }

  // Sanitize the key — strip any whitespace / zero-width chars that may
  // have been introduced when the operator pasted it into Vercel.
  const cleanKey = apiKey.trim().replace(/[\u200B-\u200D\uFEFF\s]/g, '');

  const { messages, model } = (req.body || {}) as { messages?: any[]; model?: string };
  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'bad_request', message: 'messages[] is required' });
  }

  const chosenModel =
    (typeof model === 'string' && model.trim()) ||
    process.env.OPENROUTER_MODEL ||
    'openrouter/free';

  // Build the fallback chain: operator's pick first, then the rest.
  const modelChain = [chosenModel, ...FALLBACK_MODELS.filter(m => m !== chosenModel)];

  const referer =
    (req.headers.origin as string) ||
    (req.headers.referer as string) ||
    process.env.APP_URL ||
    'https://glitter-glam.vercel.app';

  let lastError = '';
  for (const tryModel of modelChain) {
    try {
      const upstream = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${cleanKey}`,
          'HTTP-Referer': referer,
          'X-Title': 'Glitter Glam AI Stylist',
        },
        body: JSON.stringify({
          model: tryModel,
          messages,
          max_tokens: 1500,
          temperature: 0.7,
        }),
      });

      if (upstream.ok) {
        const data: any = await upstream.json();
        if (data && !data.model) data.model = tryModel;
        return res.status(200).json(data);
      }

      const errText = await upstream.text().catch(() => '');
      lastError = `[${tryModel}] ${upstream.status}: ${errText.slice(0, 200)}`;
      console.warn(`[OpenRouter] ${lastError}`);

      // 4xx (except 429) — request is malformed / unauth — don't try more.
      if (upstream.status >= 400 && upstream.status < 500 && upstream.status !== 429) {
        return res.status(upstream.status).json({
          error: 'upstream_error',
          status: upstream.status,
          model: tryModel,
          message: errText.slice(0, 500),
        });
      }
      // 429 / 5xx → try next model.
    } catch (err: any) {
      lastError = `[${tryModel}] network: ${err?.message || 'unknown'}`;
      console.warn(`[OpenRouter] ${lastError}`);
    }
  }

  return res.status(502).json({
    error: 'all_models_failed',
    message: lastError || 'No free model is currently available. Please try again in a moment.',
  });
}
