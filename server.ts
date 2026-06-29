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
  const { messages, model } = req.body || {};
  if (!Array.isArray(messages) || messages.length === 0) {
    res.status(400).json({ error: "bad_request", message: "messages[] is required" });
    return;
  }
  const chosenModel =
    (typeof model === "string" && model.trim()) ||
    process.env.OPENROUTER_MODEL ||
    "meta-llama/llama-3.1-8b-instruct:free";

  try {
    const upstream = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        // OpenRouter recommends these for attribution / leaderboards.
        "HTTP-Referer": req.headers.origin || `http://localhost:${PORT}`,
        "X-Title": "Glitter Glam AI Stylist",
      },
      body: JSON.stringify({
        model: chosenModel,
        messages,
        // Cap output to keep the chat snappy and within the free tier.
        max_tokens: 400,
        temperature: 0.7,
      }),
    });

    if (!upstream.ok) {
      const errText = await upstream.text().catch(() => "");
      console.warn(`[OpenRouter] ${upstream.status}: ${errText.slice(0, 300)}`);
      res.status(upstream.status).json({
        error: "upstream_error",
        status: upstream.status,
        message: errText.slice(0, 500),
      });
      return;
    }

    const data = await upstream.json();
    res.json(data);
  } catch (err: any) {
    console.error("[OpenRouter] proxy error:", err);
    res.status(502).json({
      error: "proxy_failure",
      message: err?.message || "Upstream call failed",
    });
  }
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
    if (!process.env.OPENROUTER_API_KEY) {
      console.log(`[AI Stylist] OPENROUTER_API_KEY not set — chatbot will run in offline mode.`);
    } else {
      console.log(`[AI Stylist] OpenRouter proxy ready at /api/chat`);
    }
  });
}

bootstrapServer();
