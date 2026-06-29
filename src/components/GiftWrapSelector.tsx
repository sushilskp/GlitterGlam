import React from 'react';
import { Gift, Check, Plus } from 'lucide-react';
import { useCartTotals } from '../lib/cartStore';
import { loadGiftWrapOptions } from '../lib/featureStore';

interface GiftWrapSelectorProps {
  variant?: 'card' | 'compact';
}

export default function GiftWrapSelector({ variant = 'card' }: GiftWrapSelectorProps) {
  const totals = useCartTotals();
  const options = loadGiftWrapOptions().filter(o => o.active);

  if (options.length === 0) return null;

  if (variant === 'compact') {
    return (
      <div className="flex items-center gap-2 text-xs text-stone-600">
        <Gift className="w-4 h-4 text-[#C9A66B]" />
        <span>Gift wrap from ₹49 — ask in chat or apply at checkout.</span>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 mb-1">
        <Gift className="w-4 h-4 text-[#C9A66B]" />
        <p className="text-xs uppercase tracking-widest font-bold text-stone-700">Add Gift Wrap</p>
        <span className="text-[10px] text-stone-400">(optional)</span>
      </div>
      <div className="space-y-2">
        <label className="flex items-center gap-2 p-2.5 border border-stone-200 rounded cursor-pointer hover:border-[#C9A66B]/60 transition-colors">
          <input
            type="radio"
            name="giftwrap"
            checked={!totals.cart.giftWrapId}
            onChange={() => totals.setGiftWrapId(null)}
            className="accent-[#C9A66B]"
          />
          <span className="text-sm text-stone-700">No gift wrap</span>
        </label>
        {options.map(opt => {
          const selected = totals.cart.giftWrapId === opt.id;
          return (
            <label
              key={opt.id}
              className={`flex items-start gap-2 p-2.5 border rounded cursor-pointer transition-all ${
                selected
                  ? 'border-[#C9A66B] bg-[#C9A66B]/5 ring-1 ring-[#C9A66B]/30'
                  : 'border-stone-200 hover:border-[#C9A66B]/60'
              }`}
            >
              <input
                type="radio"
                name="giftwrap"
                checked={selected}
                onChange={() => totals.setGiftWrapId(opt.id)}
                className="accent-[#C9A66B] mt-0.5"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-bold text-stone-900">{opt.name}</span>
                  <span className="text-sm font-bold text-[#C9A66B]">+₹{opt.price}</span>
                </div>
                <p className="text-xs text-stone-500 mt-0.5 leading-relaxed">{opt.description}</p>
              </div>
              {selected && <Check className="w-4 h-4 text-[#C9A66B] shrink-0 mt-1" />}
            </label>
          );
        })}
      </div>
    </div>
  );
}