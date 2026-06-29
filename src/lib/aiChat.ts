// AI Stylist chat client.
//
// Two modes:
//   1. Online — proxies to /api/chat which forwards to OpenRouter. Works
//      with ANY free OpenRouter model the operator picks.
//   2. Offline — when OPENROUTER_API_KEY is not set, the client falls back
//      to a deterministic product recommender that picks from the live
//      product catalogue using simple keyword + tag matching. This keeps
//      the chat always working, even on a dev machine without a key.
//
// The system prompt is built per-turn from the current catalogue so the AI
// can ground every recommendation in real SKUs the customer can buy.

import { Product } from '../types';

export interface ChatTurn {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatResponse {
  content: string;
  productRefs: string[];   // SKUs the assistant is currently recommending
  model: string;
  source: 'openrouter' | 'offline';
}

const FREE_MODEL_OPTIONS = [
  'meta-llama/llama-3.1-8b-instruct:free',
  'meta-llama/llama-3.3-70b-instruct:free',
  'mistralai/mistral-7b-instruct:free',
  'qwen/qwen-2.5-7b-instruct:free',
  'google/gemini-2.0-flash-exp:free',
  'nvidia/llama-3.1-nemotron-70b-instruct:free',
];

export function listFreeModels(): string[] {
  return FREE_MODEL_OPTIONS;
}

function summariseProducts(products: Product[]): string {
  // Cap the catalogue passed to the LLM to keep tokens low.
  return products.slice(0, 80).map(p => {
    const stock = p.stock <= 0 ? 'OUT OF STOCK' : `${p.stock} in stock`;
    const tags = (p.occasionTags || []).join(', ');
    return `- [${p.sku}] ${p.name} | ${p.category} | ₹${p.discountPrice.toLocaleString('en-IN')} (MRP ₹${p.price.toLocaleString('en-IN')}) | ${p.type} | ${p.material} | ${stock} | tags: ${tags || 'none'} | highlights: ${(p.highlights || []).slice(0, 3).join('; ')}`;
  }).join('\n');
}

export function buildSystemPrompt(products: Product[], storeName: string = 'Glitter Glam'): string {
  return `You are the AI Stylist for ${storeName}, an affordable luxury Indian jewellery boutique based in Punjab.
You help customers pick necklaces, earrings, rings, bracelets and bangles.
You can ONLY recommend products that appear in the catalogue below. For every recommendation, ALWAYS mention the product's SKU in square brackets so the frontend can render it as a clickable card.

Catalogue (max 80 items):
${summariseProducts(products)}

Rules:
- Be warm, concise, and confident. Use 2-4 short sentences per reply.
- Always reference the SKU of every product you recommend as [SKU] (square brackets) so the frontend can render it as a clickable card. Example: "Our [GG-BR-001] Bridal Choker would suit you perfectly."
- Write in plain prose. Do NOT use any markdown, asterisks, bold, italics, bullet symbols, or hashtags in your reply.
- If the user mentions an occasion (wedding, festival, daily wear, office, party, gift, etc.), filter recommendations to matching categories/tags.
- If asked for gifting, suggest adding the Royal Velvet Box gift wrap.
- Never invent SKUs. If nothing fits, say so honestly and ask 1 short clarifying question.
- Always end with a soft call to action (e.g. "Want me to send the link on WhatsApp?" or "Shall I compare two designs?").`;
}

// ----- Offline recommender -----

const KEYWORD_TO_CATEGORY: Record<string, string[]> = {
  // category -> keywords that hint at it
  Necklaces: ['necklace', 'choker', 'neck', 'set', 'rani haar', 'haram', 'mangalsutra', 'pendant', 'chain'],
  Earrings: ['earring', 'ear', 'jhumka', 'jhumki', 'stud', 'drop', 'tikli', 'balis'],
  Rings: ['ring', 'finger', 'band', 'engagement', 'cocktail'],
  Bracelets: ['bracelet', 'hand harness', 'sleek'],
  Bangles: ['bangle', 'kada', 'cuff', 'chudiyan', 'kangan'],
};

const KEYWORD_TO_OCCASION: Record<string, string[]> = {
  Bridal: ['bridal', 'bride', 'wedding', 'shaadi', 'marriage'],
  Festive: ['festive', 'festival', 'diwali', 'navratri', 'dussehra', 'karva chauth', 'teej'],
  Party: ['party', 'sangeet', 'cocktail', 'reception', 'evening', 'date'],
  Daily: ['daily', 'office', 'work', 'everyday', 'casual', 'minimal'],
  Gift: ['gift', 'present', 'surprise', 'for her', 'for mom', 'for sister', 'birthday', 'anniversary'],
};

function scoreProduct(p: Product, queryTokens: string[]): number {
  let score = 0;
  const haystack = [
    p.name,
    p.category,
    p.material,
    p.type,
    p.description,
    ...(p.occasionTags || []),
    ...(p.highlights || []),
  ].join(' ').toLowerCase();

  for (const tok of queryTokens) {
    if (haystack.includes(tok)) score += 2;
    if (p.name.toLowerCase().includes(tok)) score += 3;
    if ((p.occasionTags || []).some(t => t.toLowerCase().includes(tok))) score += 4;
  }
  if (p.isFeatured) score += 1;
  if (p.stock > 0) score += 0.5;
  return score;
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(t => t.length > 2);
}

function offlineReply(history: ChatTurn[], products: Product[]): ChatResponse {
  const last = [...history].reverse().find(t => t.role === 'user');
  const userText = last?.content || '';
  const tokens = tokenize(userText);

  let filtered: Product[] = products;
  for (const [cat, kws] of Object.entries(KEYWORD_TO_CATEGORY)) {
    if (kws.some(k => tokens.includes(k) || userText.toLowerCase().includes(k))) {
      filtered = filtered.filter(p => p.category === cat);
    }
  }
  for (const [occ, kws] of Object.entries(KEYWORD_TO_OCCASION)) {
    if (kws.some(k => userText.toLowerCase().includes(k))) {
      filtered = filtered.filter(p =>
        (p.occasionTags || []).some(t => t.toLowerCase() === occ.toLowerCase()) ||
        p.tags?.some(t => t.toLowerCase() === occ.toLowerCase()) ||
        (occ === 'Daily' && (p.occasionTags || []).some(t => /daily|casual|office/i.test(t))),
      );
    }
  }

  // If keyword filtering culled everything, fall back to the full list.
  const candidates = (filtered.length > 0 ? filtered : products).slice();
  const ranked = candidates
    .map(p => ({ p, s: scoreProduct(p, tokens) }))
    .sort((a, b) => b.s - a.s)
    .slice(0, 3)
    .map(x => x.p);

  const intro = greetingFor(userText);
  if (ranked.length === 0) {
    return {
      content:
        intro +
        "I couldn't find a perfect match in our current catalogue yet. Could you tell me the occasion (bridal, festive, party, daily) or which category you prefer (necklace, earrings, ring, bangle, bracelet)?",
      productRefs: [],
      model: 'offline-rule-based',
      source: 'offline',
    };
  }

  const lines = ranked.map((p, i) => {
    const tag = (p.occasionTags && p.occasionTags[0]) ? ` — great for ${p.occasionTags[0].toLowerCase()}` : '';
    return `${i + 1}. [${p.sku}] ${p.name} — ₹${p.discountPrice.toLocaleString('en-IN')}${tag}`;
  });
  const refs = ranked.map(p => p.sku);
  return {
    content:
      intro +
      `Based on what you told me, here are my top picks:\n${lines.join('\n')}\n\nTap any piece in the catalogue to view details, or tell me your budget / occasion and I'll narrow it down further.`,
    productRefs: refs,
    model: 'offline-rule-based',
    source: 'offline',
  };
}

function greetingFor(text: string): string {
  const t = text.toLowerCase();
  if (/gift|present/.test(t)) return "Looking for a gift? Lovely — ";
  if (/bridal|wedding/.test(t)) return "For your big day, you'll want something that photographs beautifully. ";
  if (/festive|diwali|navratri/.test(t)) return "Festive looks need sparkle — ";
  if (/daily|office/.test(t)) return "For daily elegance, comfort matters. ";
  if (/party|sangeet/.test(t)) return "Party-ready sparkle coming up. ";
  return "Happy to help you find the perfect piece. ";
}

// ----- Public API -----

export async function sendChat(
  history: ChatTurn[],
  products: Product[],
  options: { model?: string; signal?: AbortSignal } = {},
): Promise<ChatResponse> {
  const systemPrompt = buildSystemPrompt(products);

  // Try OpenRouter first; on any failure, fall back to offline.
  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: options.model,
        messages: [{ role: 'system', content: systemPrompt }, ...history],
      }),
      signal: options.signal,
    });

    if (res.ok) {
      const data = await res.json();
      const rawContent = data?.choices?.[0]?.message?.content || '';
      // Strip any leftover markdown emphasis/headers so the chat never shows
      // raw `**`, `#`, etc. Keep [SKU] brackets intact.
      const content = stripMarkdown(rawContent);
      const refs = extractSkusFromText(content, products);
      return {
        content: content || "I'm not sure what to suggest yet — could you tell me the occasion and your budget?",
        productRefs: refs,
        model: data?.model || options.model || 'openrouter',
        source: 'openrouter',
      };
    }
    // 503 = no API key; 429/5xx = upstream issue. Either way, fall back.
    if (res.status !== 503) {
      console.warn(`[chat] upstream ${res.status}, falling back to offline mode.`);
    } else {
      // 503 means not configured — silent fallback is fine.
    }
  } catch (err) {
    console.warn('[chat] fetch failed, using offline mode:', err);
  }

  return offlineReply(history, products);
}

// Find SKUs the model mentioned so the chat can render rich cards.
function extractSkusFromText(text: string, products: Product[]): string[] {
  if (!text) return [];
  const skuSet = new Set(products.map(p => p.sku));
  const refs = new Set<string>();
  // Match [SKU] format first.
  const bracket = text.matchAll(/\[([A-Za-z0-9_\-]+)\]/g);
  for (const m of bracket) {
    if (skuSet.has(m[1])) refs.add(m[1]);
  }
  // Fallback: bare SKU words.
  for (const sku of skuSet) {
    if (text.includes(sku)) refs.add(sku);
  }
  return Array.from(refs).slice(0, 4);
}

// Clean up any markdown that the LLM may slip in despite instructions.
// Keeps [SKU] brackets and prose intact, just removes emphasis markers.
function stripMarkdown(text: string): string {
  if (!text) return text;
  return text
    // Strip bold/italic emphasis: **x**, __x__, *x*, _x_
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/__([^_]+)__/g, '$1')
    .replace(/(^|[^*])\*([^*\n]+)\*(?!\*)/g, '$1$2')
    .replace(/(^|[^_])_([^_\n]+)_(?!_)/g, '$1$2')
    // Strip leading bullet markers at line start
    .replace(/^[\s]*[-*+]\s+/gm, '')
    // Strip markdown headers
    .replace(/^\s{0,3}#{1,6}\s+/gm, '')
    // Strip stray backticks used for code spans (we don't render code)
    .replace(/`([^`]+)`/g, '$1')
    // Collapse any triple+ newlines into double
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
