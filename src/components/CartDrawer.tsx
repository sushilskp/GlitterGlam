import React, { useState } from 'react';
import { X, Minus, Plus, Trash2, MessageCircle, ShoppingBag, Gift, Tag } from 'lucide-react';
import { useCartTotals, buildCartWhatsAppUrl } from '../lib/cartStore';
import CouponInput from './CouponInput';
import GiftWrapSelector from './GiftWrapSelector';

interface CartDrawerProps {
  open: boolean;
  onClose: () => void;
  whatsappContact: string;
}

export default function CartDrawer({ open, onClose, whatsappContact }: CartDrawerProps) {
  const totals = useCartTotals();
  const [checkoutForm, setCheckoutForm] = useState({ name: '', city: '', note: '' });
  const [showCheckout, setShowCheckout] = useState(false);

  function placeOrder() {
    const { url } = buildCartWhatsAppUrl(whatsappContact, {
      name: checkoutForm.name || undefined,
      city: checkoutForm.city || undefined,
      note: checkoutForm.note || undefined,
    });
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  return (
    <div
      className={`fixed inset-0 z-50 transition-opacity ${open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
      aria-hidden={!open}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <aside
        className={`absolute top-0 right-0 h-full w-full sm:w-[440px] bg-[#FDFBF8] shadow-2xl flex flex-col transition-transform duration-300 ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
        role="dialog"
        aria-label="Shopping cart"
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#C9A66B]/20 flex items-center justify-between bg-gradient-to-r from-[#1D1D1D] to-[#2a2a2a] text-white">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-[#C9A66B]" />
            <h2 className="font-serif text-lg font-semibold">Your Cart</h2>
            <span className="text-xs text-stone-300">({totals.cart.items.length})</span>
          </div>
          <button onClick={onClose} aria-label="Close cart" className="text-stone-300 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
          {totals.cart.items.length === 0 ? (
            <div className="text-center py-16 space-y-2">
              <ShoppingBag className="w-10 h-10 text-stone-300 mx-auto" />
              <p className="font-serif text-stone-700">Your cart is empty</p>
              <p className="text-xs text-stone-500">Add a few pieces to begin your order.</p>
              <button
                onClick={onClose}
                className="mt-3 text-xs uppercase tracking-widest font-bold text-[#C9A66B] hover:underline"
              >
                Browse the catalogue
              </button>
            </div>
          ) : (
            totals.cart.items.map(item => (
              <div key={item.productId + (item.size || '')} className="flex gap-3 p-3 border border-stone-200 rounded-lg bg-white">
                <img
                  src={item.image || 'https://via.placeholder.com/120'}
                  alt={item.name}
                  className="w-16 h-16 object-cover rounded border border-stone-200 shrink-0"
                  referrerPolicy="no-referrer"
                  onError={(e) => { (e.currentTarget as HTMLImageElement).src = 'https://via.placeholder.com/120'; }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-stone-900 line-clamp-1">{item.name}</p>
                  <p className="text-[10px] text-stone-500 uppercase tracking-wider mt-0.5 font-mono">
                    {item.sku}{item.size ? ` · ${item.size}` : ''}
                  </p>
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center border border-stone-300 rounded">
                      <button
                        onClick={() => totals.updateQty(item.productId, item.size, item.quantity - 1)}
                        className="px-2 py-1 text-stone-600 hover:bg-stone-100"
                        aria-label="Decrease quantity"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="px-2 text-xs font-bold min-w-[24px] text-center">{item.quantity}</span>
                      <button
                        onClick={() => totals.updateQty(item.productId, item.size, item.quantity + 1)}
                        className="px-2 py-1 text-stone-600 hover:bg-stone-100"
                        aria-label="Increase quantity"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                    <span className="text-sm font-bold text-[#C9A66B]">
                      ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => totals.removeItem(item.productId, item.size)}
                  className="text-stone-300 hover:text-red-500 self-start"
                  aria-label="Remove item"
                  title="Remove"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Footer: coupon + gift wrap + totals + checkout */}
        {totals.cart.items.length > 0 && (
          <div className="border-t border-[#C9A66B]/20 bg-white px-5 py-4 space-y-3 max-h-[60vh] overflow-y-auto">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-stone-700 mb-2 flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-[#C9A66B]" /> Coupon
                </p>
                <CouponInput />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-stone-700 mb-2 flex items-center gap-1.5">
                  <Gift className="w-3.5 h-3.5 text-[#C9A66B]" /> Gift Wrap
                </p>
                <GiftWrapSelector />
              </div>
            </div>

            <div className="border-t border-stone-200 pt-3 space-y-1 text-sm">
              <div className="flex justify-between text-stone-600">
                <span>Subtotal</span>
                <span>₹{totals.subtotal.toLocaleString('en-IN')}</span>
              </div>
              {totals.discount > 0 && (
                <div className="flex justify-between text-emerald-700">
                  <span>Coupon discount {totals.coupon && `(${totals.coupon.code})`}</span>
                  <span>−₹{totals.discount.toLocaleString('en-IN')}</span>
                </div>
              )}
              {totals.giftWrapPrice > 0 && (
                <div className="flex justify-between text-stone-600">
                  <span>Gift wrap</span>
                  <span>+₹{totals.giftWrapPrice.toLocaleString('en-IN')}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-bold text-stone-900 pt-2 border-t border-stone-200">
                <span>Total</span>
                <span className="text-[#C9A66B]">₹{totals.total.toLocaleString('en-IN')}</span>
              </div>
              <p className="text-[10px] text-stone-500 pt-1">Inclusive of all taxes. Final price confirmed by Glitter Glam on WhatsApp.</p>
            </div>

            {showCheckout && (
              <div className="border-t border-stone-200 pt-3 space-y-2 tab-fade-in">
                <input
                  type="text"
                  placeholder="Your name (optional)"
                  value={checkoutForm.name}
                  onChange={(e) => setCheckoutForm({ ...checkoutForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-stone-300 rounded text-sm"
                />
                <input
                  type="text"
                  placeholder="City / Pincode (optional)"
                  value={checkoutForm.city}
                  onChange={(e) => setCheckoutForm({ ...checkoutForm, city: e.target.value })}
                  className="w-full px-3 py-2 border border-stone-300 rounded text-sm"
                />
                <textarea
                  placeholder="Note for the founders (customisation, gift message...)"
                  rows={2}
                  value={checkoutForm.note}
                  onChange={(e) => setCheckoutForm({ ...checkoutForm, note: e.target.value })}
                  className="w-full px-3 py-2 border border-stone-300 rounded text-sm resize-none"
                />
              </div>
            )}

            <div className="space-y-2">
              {!showCheckout ? (
                <button
                  onClick={() => setShowCheckout(true)}
                  className="w-full bg-[#1D1D1D] hover:bg-[#C9A66B] text-white py-3 text-xs uppercase tracking-widest font-bold rounded transition-colors flex items-center justify-center gap-2"
                >
                  Continue <Plus className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={placeOrder}
                  className="w-full bg-[#25D366] hover:bg-[#1DA851] text-white py-3 text-xs uppercase tracking-widest font-bold rounded transition-colors flex items-center justify-center gap-2 shadow-md"
                >
                  <MessageCircle className="w-4 h-4" /> Send Order via WhatsApp
                </button>
              )}
              <button
                onClick={() => { if (confirm('Clear the entire cart?')) totals.clearCart(); }}
                className="w-full text-[10px] uppercase tracking-widest text-stone-500 hover:text-red-500"
              >
                Clear cart
              </button>
            </div>
          </div>
        )}
      </aside>
    </div>
  );
}