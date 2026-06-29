// Lightweight cart store. Per product decision we keep this in localStorage
// only — no Supabase round-trip — so the cart survives page reloads but never
// gets out of sync across devices (that's fine for a WhatsApp-checkout flow).
import { useEffect, useState, useCallback } from 'react';
import { Product } from '../types';
import { computeDiscount, findActiveCoupon, getGiftWrapOption, Coupon, GiftWrapOption } from './featureStore';

export interface CartItem {
  productId: string;
  sku: string;
  name: string;
  price: number;            // unit discount price
  mrp: number;              // unit MRP for strike-through display
  image: string;
  size?: string;
  quantity: number;
  category: string;
}

export interface CartState {
  items: CartItem[];
  couponCode: string;
  giftWrapId: string | null;
  updatedAt: string;
}

const K_CART = 'gg_cart';

function readState(): CartState {
  if (typeof window === 'undefined') return emptyState();
  try {
    const raw = window.localStorage.getItem(K_CART);
    if (!raw) return emptyState();
    const parsed = JSON.parse(raw) as CartState;
    if (!parsed.items) parsed.items = [];
    if (typeof parsed.couponCode !== 'string') parsed.couponCode = '';
    return parsed;
  } catch {
    return emptyState();
  }
}

function emptyState(): CartState {
  return { items: [], couponCode: '', giftWrapId: null, updatedAt: new Date().toISOString() };
}

function writeState(s: CartState) {
  if (typeof window === 'undefined') return;
  s.updatedAt = new Date().toISOString();
  window.localStorage.setItem(K_CART, JSON.stringify(s));
  // Notify any mounted listeners (used by the Header cart badge).
  window.dispatchEvent(new CustomEvent('gg:cartUpdated'));
}

export function getCart(): CartState {
  return readState();
}

export function addToCart(product: Product, size?: string, qty: number = 1) {
  const s = readState();
  const chosen = size || product.sizeOptions[0] || 'Free Size';
  const existing = s.items.find(i => i.productId === product.id && i.size === chosen);
  if (existing) {
    existing.quantity = Math.min(product.stock || 99, existing.quantity + qty);
  } else {
    s.items.push({
      productId: product.id,
      sku: product.sku,
      name: product.name,
      price: product.discountPrice,
      mrp: product.price,
      image: product.images[0] || '',
      size: chosen,
      quantity: qty,
      category: product.category,
    });
  }
  writeState(s);
}

export function updateCartItemQty(productId: string, size: string | undefined, qty: number) {
  const s = readState();
  const item = s.items.find(i => i.productId === productId && i.size === size);
  if (!item) return;
  if (qty <= 0) {
    s.items = s.items.filter(i => !(i.productId === productId && i.size === size));
  } else {
    item.quantity = qty;
  }
  writeState(s);
}

export function removeCartItem(productId: string, size?: string) {
  const s = readState();
  s.items = s.items.filter(i => !(i.productId === productId && i.size === size));
  writeState(s);
}

export function clearCart() {
  writeState(emptyState());
}

export function setCouponCode(code: string) {
  const s = readState();
  s.couponCode = code.trim().toUpperCase();
  writeState(s);
}

export function setGiftWrapId(id: string | null) {
  const s = readState();
  s.giftWrapId = id;
  writeState(s);
}

// ---------- Pricing helpers ----------

export function cartSubtotal(s: CartState = readState()): number {
  return s.items.reduce((acc, i) => acc + i.price * i.quantity, 0);
}

export function cartMrp(s: CartState = readState()): number {
  return s.items.reduce((acc, i) => acc + i.mrp * i.quantity, 0);
}

export function cartItemCount(s: CartState = readState()): number {
  return s.items.reduce((acc, i) => acc + i.quantity, 0);
}

export function appliedCoupon(s: CartState = readState()): Coupon | null {
  return findActiveCoupon(s.couponCode);
}

export function appliedGiftWrap(s: CartState = readState()): GiftWrapOption | null {
  return getGiftWrapOption(s.giftWrapId);
}

export function cartTotals(s: CartState = readState()) {
  const sub = cartSubtotal(s);
  const coupon = appliedCoupon(s);
  const discount = computeDiscount(sub, coupon);
  const wrap = appliedGiftWrap(s);
  const wrapPrice = wrap && s.items.length > 0 ? wrap.price : 0;
  const total = Math.max(0, sub - discount + wrapPrice);
  return {
    subtotal: sub,
    mrp: cartMrp(s),
    discount,
    coupon,
    giftWrap: wrap,
    giftWrapPrice: wrapPrice,
    total,
  };
}

// ---------- WhatsApp routing ----------

function sanitize(num: string): string {
  const cleaned = num.replace(/\D/g, '');
  if (cleaned.length === 10) return '91' + cleaned;
  return cleaned || '919876976655';
}

export function buildCartWhatsAppUrl(whatsappContact: string, opts?: { name?: string; city?: string; note?: string }) {
  const s = readState();
  const totals = cartTotals(s);
  if (s.items.length === 0) {
    return {
      url: `https://wa.me/${sanitize(whatsappContact)}?text=${encodeURIComponent('Hello Glitter Glam! I have a question.')}`,
      message: '',
    };
  }
  const lines: string[] = [];
  lines.push('*Glitter Glam Order Request*');
  if (opts?.name) lines.push(`*Name:* ${opts.name}`);
  if (opts?.city) lines.push(`*City:* ${opts.city}`);
  lines.push('');
  lines.push('*Items:*');
  s.items.forEach((i, idx) => {
    lines.push(`${idx + 1}. ${i.name}`);
    lines.push(`   - SKU: ${i.sku}`);
    if (i.size) lines.push(`   - Size: ${i.size}`);
    lines.push(`   - Qty: ${i.quantity}`);
    lines.push(`   - Price: ₹${(i.price * i.quantity).toLocaleString('en-IN')}`);
  });
  lines.push('');
  lines.push(`*Subtotal:* ₹${totals.subtotal.toLocaleString('en-IN')}`);
  if (totals.coupon) {
    lines.push(`*Coupon:* ${totals.coupon.code} (-₹${totals.discount.toLocaleString('en-IN')})`);
  }
  if (totals.giftWrap) {
    lines.push(`*Gift Wrap:* ${totals.giftWrap.name} (+₹${totals.giftWrapPrice.toLocaleString('en-IN')})`);
  }
  lines.push(`*Grand Total:* ₹${totals.total.toLocaleString('en-IN')}`);
  if (opts?.note) {
    lines.push('');
    lines.push(`*Note:* ${opts.note}`);
  }
  const url = `https://wa.me/${sanitize(whatsappContact)}?text=${encodeURIComponent(lines.join('\n'))}`;
  return { url, message: lines.join('\n') };
}

// ---------- React hooks ----------

/** Lightweight subscription to the cart state. Re-renders on any cart mutation. */
export function useCart(): CartState {
  const [cart, setCart] = useState<CartState>(() => readState());
  useEffect(() => {
    const onUpdate = () => setCart(readState());
    window.addEventListener('gg:cartUpdated', onUpdate);
    // Cross-tab updates.
    const onStorage = (e: StorageEvent) => { if (e.key === K_CART) onUpdate(); };
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener('gg:cartUpdated', onUpdate);
      window.removeEventListener('storage', onStorage);
    };
  }, []);
  return cart;
}

export interface CartTotalsBundle {
  cart: CartState;
  subtotal: number;
  mrp: number;
  discount: number;
  total: number;
  itemCount: number;
  coupon: Coupon | null;
  giftWrap: GiftWrapOption | null;
  giftWrapPrice: number;
  setCouponCode: (code: string) => void;
  setGiftWrapId: (id: string | null) => void;
  addToCart: (p: Product, size?: string, qty?: number) => void;
  updateQty: (productId: string, size: string | undefined, qty: number) => void;
  removeItem: (productId: string, size?: string) => void;
  clearCart: () => void;
}

/** One-stop hook that exposes the cart, totals, and stable mutation callbacks. */
export function useCartTotals(): CartTotalsBundle {
  const cart = useCart();
  const totals = useMemo(() => cartTotals(cart), [cart]);

  const addToCart = useCallback((p: Product, size?: string, qty?: number) => {
    addToCartImpl(p, size, qty);
  }, []);
  const updateQty = useCallback((productId: string, size: string | undefined, qty: number) => {
    updateCartItemQty(productId, size, qty);
  }, []);
  const removeItem = useCallback((productId: string, size?: string) => {
    removeCartItem(productId, size);
  }, []);
  const clear = useCallback(() => clearCart(), []);
  const setCoupon = useCallback((c: string) => setCouponCode(c), []);
  const setGift = useCallback((id: string | null) => setGiftWrapId(id), []);

  return {
    cart,
    subtotal: totals.subtotal,
    mrp: totals.mrp,
    discount: totals.discount,
    total: totals.total,
    itemCount: totals.subtotal === 0 && cart.items.length === 0 ? 0 : cartItemCount(cart),
    coupon: totals.coupon,
    giftWrap: totals.giftWrap,
    giftWrapPrice: totals.giftWrapPrice,
    setCouponCode: setCoupon,
    setGiftWrapId: setGift,
    addToCart,
    updateQty,
    removeItem,
    clearCart: clear,
  };
}

// Re-export cartStore for callers that already imported internal helpers.
import { useMemo } from 'react';

// Aliases so the public API matches what `useCartTotals` consumers need.
const addToCartImpl = addToCart;
