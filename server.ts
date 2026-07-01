import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

// Parse standard request payloads
app.use(express.json({ limit: "2mb" }));

// 1. Health and check configuration
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    supabaseConfigured: Boolean(process.env.VITE_SUPABASE_URL && process.env.VITE_SUPABASE_ANON_KEY),
    openRouterConfigured: Boolean(process.env.OPENROUTER_API_KEY),
  });
});

// 2. AI chat proxy — keeps the OpenRouter API key off the client and lets
// the chatbot use ANY free OpenRouter model the operator picks. The
// frontend posts { messages, model } and the server forwards to OpenRouter.
app.post("/api/chat", async (req, res) => {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    res.status(503).json({
      error: "openrouter_not_configured",
      message: "Set OPENROUTER_API_KEY in your .env to enable the AI stylist.",
    });
    return;
  }
  // Sanitize the key — strip any whitespace or invisible chars that might
  // have been introduced when the operator pasted it into .env.
  const cleanKey = apiKey.trim().replace(/[\u200B-\u200D\uFEFF\s]/g, '');

  const { messages, model } = req.body || {};
  if (!Array.isArray(messages) || messages.length === 0) {
    res.status(400).json({ error: "bad_request", message: "messages[] is required" });
    return;
  }
  const chosenModel =
    (typeof model === "string" && model.trim()) ||
    process.env.OPENROUTER_MODEL ||
    "openrouter/free";

  // Fallback ladder — if the operator's chosen free model is currently
  // rate-limited, down, or returns an error, we try the next one before
  // giving up. Order matters: most capable first.
  const FALLBACK_MODELS = [
    "openrouter/free",
    "meta-llama/llama-3.3-70b-instruct:free",
    "google/gemma-3-27b-it:free",
    "mistralai/mistral-small-3.2-24b-instruct:free",
    "qwen/qwen-2.5-72b-instruct:free",
    "meta-llama/llama-3.1-8b-instruct:free",
    "qwen/qwen-2.5-7b-instruct:free",
    "deepseek/deepseek-chat-v3-0324:free",
    "google/gemini-2.0-flash-exp:free",
    "nvidia/llama-3.1-nemotron-70b-instruct:free",
  ];
  // Try the operator's pick first, then walk the fallback list — but skip
  // the operator's pick in the ladder to avoid duplicate attempts.
  const modelChain = [
    chosenModel,
    ...FALLBACK_MODELS.filter(m => m !== chosenModel),
  ];

  let lastError = "";
  for (const tryModel of modelChain) {
    try {
      const upstream = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${cleanKey}`,
          // OpenRouter recommends these for attribution / leaderboards.
          "HTTP-Referer": req.headers.origin || `http://localhost:${PORT}`,
          "X-Title": "Glitter Glam AI Stylist",
        },
        body: JSON.stringify({
          model: tryModel,
          messages,
          // Cap output to keep the chat snappy and within the free tier.
          // 1500 covers short reasoning models while still bounding the bill.
          max_tokens: 1500,
          temperature: 0.7,
        }),
      });

      if (upstream.ok) {
        const data = await upstream.json();
        // Tag the actual model that served the request so the client can
        // surface it in the chat header (helps when the auto-router picks).
        if (data && !data.model) data.model = tryModel;
        res.json(data);
        return;
      }

      // 4xx (except 429) means the request is malformed / not authorised —
      // don't waste time on fallbacks, just return.
      const errText = await upstream.text().catch(() => "");
      lastError = `[${tryModel}] ${upstream.status}: ${errText.slice(0, 200)}`;
      console.warn(`[OpenRouter] ${lastError}`);
      if (upstream.status >= 400 && upstream.status < 500 && upstream.status !== 429) {
        res.status(upstream.status).json({
          error: "upstream_error",
          status: upstream.status,
          model: tryModel,
          message: errText.slice(0, 500),
        });
        return;
      }
      // 429 / 5xx — try the next model in the chain.
    } catch (err: any) {
      lastError = `[${tryModel}] network: ${err?.message || "unknown"}`;
      console.warn(`[OpenRouter] ${lastError}`);
      // Network error — try the next model.
    }
  }

  // All models failed.
  res.status(502).json({
    error: "all_models_failed",
    message: lastError || "No free model is currently available. Please try again in a moment.",
  });
});

// Vite middleware development integration or Fallback index production pipeline
async function bootstrapServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Glitter Glam Engine] Live backend server running on http://localhost:${PORT}`);
    const key = process.env.OPENROUTER_API_KEY;
    if (!key) {
      console.log(`[AI Stylist] OPENROUTER_API_KEY not set — chatbot will run in offline mode.`);
    } else {
      const clean = key.trim().replace(/[\u200B-\u200D\uFEFF\s]/g, '');
      console.log(`[AI Stylist] OpenRouter proxy ready at /api/chat (key=${clean.slice(0, 10)}... len=${clean.length})`);
    }
  });
}

bootstrapServer();
