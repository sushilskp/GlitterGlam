import React, { useEffect, useState } from 'react';
import { Sparkles, Tag, X, Copy } from 'lucide-react';
import { Coupon } from '../types';
import { loadCoupons } from '../lib/featureStore';

export default function OfferBanner() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    setCoupons(loadCoupons().filter(c => c.active));
  }, []);

  if (hidden || coupons.length === 0) return null;

  return (
    <div className="offer-ribbon text-[#F4E6CF] py-2 px-4 relative z-40">
      <div className="max-w-7xl mx-auto flex items-center justify-center gap-2 text-[11px] sm:text-xs">
        <Sparkles className="w-3.5 h-3.5 text-[#C9A66B] shrink-0 hidden sm:inline" />
        <div className="overflow-hidden whitespace-nowrap flex-1">
          <div className="flex gap-8 items-center justify-center animate-[slideIn_30s_linear_infinite] hover:[animation-play-state:paused]">
            {[...coupons, ...coupons].map((c, i) => (
              <span key={`${c.id}-${i}`} className="inline-flex items-center gap-2">
                <Tag className="w-3 h-3 text-[#C9A66B]" />
                <span className="font-semibold">{c.description}</span>
                <span className="font-mono bg-[#C9A66B]/20 border border-[#C9A66B]/40 text-[#C9A66B] px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">
                  Code: {c.code}
                </span>
              </span>
            ))}
          </div>
        </div>
        <button
          onClick={() => {
            navigator.clipboard.writeText(coupons[0].code).catch(() => {});
            alert(`Copied code: ${coupons[0].code}`);
          }}
          className="hidden sm:inline-flex items-center gap-1 text-[10px] uppercase tracking-widest font-bold text-[#C9A66B] hover:text-white"
          title="Copy first coupon code"
        >
          <Copy className="w-3 h-3" /> Copy
        </button>
        <button
          onClick={() => setHidden(true)}
          aria-label="Dismiss offer banner"
          className="text-stone-400 hover:text-white shrink-0"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}