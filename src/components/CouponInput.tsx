import React, { useState } from 'react';
import { Tag, X, Check, AlertTriangle } from 'lucide-react';
import { useCartTotals } from '../lib/cartStore';
import { findActiveCoupon } from '../lib/featureStore';

interface CouponInputProps {
  variant?: 'banner' | 'inline';
  onApplied?: (code: string) => void;
}

export default function CouponInput({ variant = 'inline', onApplied }: CouponInputProps) {
  const totals = useCartTotals();
  const [code, setCode] = useState(totals.coupon?.code || totals.cart.couponCode || '');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  function apply(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) {
      setError('Enter a coupon code first.');
      return;
    }
    const found = findActiveCoupon(trimmed);
    if (!found) {
      setError(`"${trimmed}" is not a valid or active coupon.`);
      return;
    }
    if (totals.subtotal < found.minCartValue) {
      setError(`Add ₹${(found.minCartValue - totals.subtotal).toLocaleString('en-IN')} more to use ${found.code}.`);
      return;
    }
    totals.setCouponCode(found.code);
    setSuccess(`Applied ${found.code} — you saved ${found.discountType === 'percent' ? `${found.discountValue}%` : `₹${found.discountValue}`}!`);
    onApplied?.(found.code);
  }

  function clear() {
    setCode('');
    setError(null);
    setSuccess(null);
    totals.setCouponCode('');
  }

  if (variant === 'banner' && !totals.coupon) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2">
        <Tag className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
        <div className="text-xs text-amber-900">
          <p className="font-bold">Try our coupons at checkout!</p>
          <p className="text-amber-800 mt-0.5">Use <span className="font-mono font-bold">GLAM10</span> for 10% off or <span className="font-mono font-bold">FESTIVE500</span> for ₹500 off ₹3,000+.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <form onSubmit={apply} className="flex items-stretch gap-2">
        <div className="relative flex-1">
          <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
          <input
            type="text"
            value={code}
            onChange={(e) => { setCode(e.target.value); setError(null); setSuccess(null); }}
            placeholder="Coupon code (try GLAM10)"
            className="w-full pl-9 pr-9 py-2.5 border border-stone-300 rounded text-sm focus:outline-none focus:border-[#C9A66B] uppercase font-mono tracking-wide"
            disabled={!!totals.coupon}
          />
          {code && !totals.coupon && (
            <button type="button" onClick={() => setCode('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700">
              <X className="w-4 h-4" />
            </button>
          )}
          {totals.coupon && (
            <button type="button" onClick={clear} className="absolute right-2 top-1/2 -translate-y-1/2 text-emerald-600 hover:text-emerald-700" title="Remove coupon">
              <Check className="w-4 h-4" />
            </button>
          )}
        </div>
        {!totals.coupon && (
          <button
            type="submit"
            className="bg-[#1D1D1D] hover:bg-[#C9A66B] text-white px-4 py-2.5 text-xs uppercase tracking-widest font-bold rounded transition-colors"
          >
            Apply
          </button>
        )}
      </form>

      {error && (
        <p className="text-xs text-red-600 flex items-center gap-1.5">
          <AlertTriangle className="w-3.5 h-3.5" /> {error}
        </p>
      )}
      {success && (
        <p className="text-xs text-emerald-700 flex items-center gap-1.5">
          <Check className="w-3.5 h-3.5" /> {success}
        </p>
      )}
      {totals.coupon && (
        <p className="text-xs text-stone-500">
          Coupon <span className="font-mono font-bold text-stone-700">{totals.coupon.code}</span> is applied — saves you ₹{totals.discount.toLocaleString('en-IN')}.
        </p>
      )}
    </div>
  );
}