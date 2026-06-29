// Lightweight localStorage-backed store for the e-commerce growth features
// (coupons, feedback, gift-wrap options, chat history). No Supabase wiring
// per product decision — these live entirely in the browser.
//
// All collections share the same shape: `read<T>(key, fallback)` and
// `write<T>(key, value)` keep things simple and dependency-free.

// Re-export the type aliases so other modules (cartStore, AIChatbot) can
// import them from a single place.
export type { Coupon, Feedback, GiftWrapOption, ChatMessage } from '../types';

import { Coupon, Feedback, GiftWrapOption, ChatMessage } from '../types';

const K_COUPONS   = 'gg_coupons';
const K_FEEDBACK  = 'gg_feedback';
const K_GIFTWRAP  = 'gg_giftwrap';
const K_CHAT      = 'gg_chat_history';

function read<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write<T>(key: string, value: T) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.warn(`[featureStore] write failed for ${key}:`, err);
  }
}

// ---------- Coupons / offers ----------

const DEFAULT_COUPONS: Coupon[] = [
  {
    id: 'welcome',
    code: 'GLAM10',
    description: '10% off your first order — welcome to Glitter Glam!',
    discountType: 'percent',
    discountValue: 10,
    minCartValue: 0,
    active: true,
    createdAt: new Date('2026-01-01').toISOString(),
  },
  {
    id: 'flat500',
    code: 'FESTIVE500',
    description: 'Flat ₹500 off on orders above ₹3,000 — festive season',
    discountType: 'flat',
    discountValue: 500,
    minCartValue: 3000,
    active: true,
    createdAt: new Date('2026-01-01').toISOString(),
  },
  {
    id: 'bridal',
    code: 'BRIDAL15',
    description: '15% off on bridal jewellery (orders above ₹5,000)',
    discountType: 'percent',
    discountValue: 15,
    minCartValue: 5000,
    active: true,
    createdAt: new Date('2026-01-01').toISOString(),
  },
];

export function loadCoupons(): Coupon[] {
  const list = read<Coupon[]>(K_COUPONS, []);
  if (list.length === 0) {
    write(K_COUPONS, DEFAULT_COUPONS);
    return DEFAULT_COUPONS;
  }
  return list;
}

export function saveCoupons(coupons: Coupon[]) {
  write(K_COUPONS, coupons);
}

export function upsertCoupon(coupon: Coupon) {
  const all = loadCoupons();
  const next = [coupon, ...all.filter(c => c.id !== coupon.id)];
  saveCoupons(next);
  return coupon;
}

export function deleteCoupon(id: string) {
  saveCoupons(loadCoupons().filter(c => c.id !== id));
}

export function findActiveCoupon(code: string): Coupon | null {
  if (!code) return null;
  const target = code.trim().toUpperCase();
  const all = loadCoupons();
  const hit = all.find(c => c.code.toUpperCase() === target);
  if (!hit) return null;
  if (!hit.active) return null;
  if (hit.expiresAt && new Date(hit.expiresAt).getTime() < Date.now()) return null;
  return hit;
}

export function computeDiscount(subtotal: number, coupon: Coupon | null): number {
  if (!coupon) return 0;
  if (subtotal < coupon.minCartValue) return 0;
  if (coupon.discountType === 'percent') {
    return Math.round((subtotal * coupon.discountValue) / 100);
  }
  return Math.min(coupon.discountValue, subtotal);
}

// ---------- Feedback ----------

export function loadFeedback(): Feedback[] {
  return read<Feedback[]>(K_FEEDBACK, []);
}

export function saveFeedback(entry: Feedback) {
  const all = loadFeedback();
  write(K_FEEDBACK, [entry, ...all].slice(0, 500));
  return entry;
}

export function deleteFeedback(id: string) {
  write(K_FEEDBACK, loadFeedback().filter(f => f.id !== id));
}

// ---------- Gift wrap options ----------

const DEFAULT_GIFTWRAP: GiftWrapOption[] = [
  {
    id: 'velvet',
    name: 'Royal Velvet Box',
    description: 'Velvet-lined luxury box with satin ribbon bow — perfect for gifting.',
    price: 99,
    active: true,
  },
  {
    id: 'paper',
    name: 'Festive Paper Wrap',
    description: 'Premium gold-printed gift paper with hand-tied bow.',
    price: 49,
    active: true,
  },
  {
    id: 'premium',
    name: 'Premium Bridal Trunk',
    description: 'Keepsake wooden trunk with velvet inserts. Reuse it forever.',
    price: 249,
    active: true,
  },
];

export function loadGiftWrapOptions(): GiftWrapOption[] {
  const list = read<GiftWrapOption[]>(K_GIFTWRAP, []);
  if (list.length === 0) {
    write(K_GIFTWRAP, DEFAULT_GIFTWRAP);
    return DEFAULT_GIFTWRAP;
  }
  return list;
}

export function saveGiftWrapOptions(options: GiftWrapOption[]) {
  write(K_GIFTWRAP, options);
}

export function getActiveGiftWrapOptions(): GiftWrapOption[] {
  return loadGiftWrapOptions().filter(o => o.active);
}

export function getGiftWrapOption(id: string | null | undefined): GiftWrapOption | null {
  if (!id) return null;
  return loadGiftWrapOptions().find(o => o.id === id) || null;
}

// ---------- Chat history ----------

const MAX_CHAT_TURNS = 30;

export function loadChatHistory(): ChatMessage[] {
  return read<ChatMessage[]>(K_CHAT, []);
}

export function saveChatHistory(messages: ChatMessage[]) {
  // Trim to the most recent N turns so the storage never grows unbounded.
  const trimmed = messages.slice(-MAX_CHAT_TURNS);
  write(K_CHAT, trimmed);
}

export function clearChatHistory() {
  write(K_CHAT, []);
}
