import React from 'react';
import { Sparkles, MessageCircle, AlertTriangle } from 'lucide-react';
import { Product } from '../types';

interface ProductCardProps {
  product: Product;
  onViewDetails: (product: Product) => void;
  whatsappContact?: string;
  key?: string | number;
}

// Utility to clean phone contact for links
function sanitizeWhatsAppNumber(num: string): string {
  const cleaned = num.replace(/\D/g, '');
  if (cleaned.length === 10) {
    return '91' + cleaned;
  }
  return cleaned || '919876976655';
}

export default function ProductCard({
  product,
  onViewDetails,
  whatsappContact = "+91 98769 76655"
}: ProductCardProps) {
  // Calculate discount percentage
  const discountPercent = product.price > product.discountPrice
    ? Math.round(((product.price - product.discountPrice) / product.price) * 100)
    : 0;

  const isLowStock = product.stock > 0 && product.stock <= 5;
  const isOutOfStock = product.stock <= 0;

  const contactNo = sanitizeWhatsAppNumber(whatsappContact);
  const currentUrl = typeof window !== 'undefined' ? window.location.href : '';
  const orderMessage = `*Order Inquiry*\n\n*Product Name:* ${product.name}\n*Product SKU:* ${product.sku}\n*Product Price:* ₹${product.discountPrice.toLocaleString('en-IN')}\n*Quantity:* 1\n*Product URL:* ${currentUrl}`;

  return (
    <div className="product-card overflow-hidden flex flex-col justify-between group relative border border-[#C9A66B]/10 bg-white" id={`prod-card-${product.id}`}>
      
      {/* Upper image stage */}
      <div className="relative aspect-square overflow-hidden bg-stone-100 cursor-pointer" onClick={() => onViewDetails(product)}>
        <img
          src={product.images[0] || 'https://via.placeholder.com/600'}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          referrerPolicy="no-referrer"
          onError={(e) => { e.currentTarget.src = 'https://via.placeholder.com/600?text=No+Image'; }}
        />

        {/* Dynamic Badges Overlay */}
        <div className="absolute top-2 left-2 sm:top-2.5 sm:left-2.5 flex flex-col gap-1 sm:gap-1.5 items-start">
          {/* Product Type badging */}
          <span className={`text-[8px] sm:text-[9px] uppercase tracking-widest px-1.5 sm:px-2.5 py-0.5 sm:py-1 font-bold shadow-sm border ${
            product.type === '1 Gram Gold'
              ? 'bg-[#1D1D1D] text-[#C9A66B] border-[#C9A66B]/30'
              : 'bg-[#C9A66B] text-white border-transparent'
          }`}>
            {product.type}
          </span>

          {/* Discount Tag */}
          {discountPercent > 0 && (
            <span className="bg-red-500 text-white text-[8px] sm:text-[9px] font-bold uppercase tracking-wider px-1.5 sm:px-2 py-0.5 rounded-sm shadow-sm flex items-center gap-1">
              <Sparkles className="w-2 h-2 sm:w-2.5 sm:h-2.5" />
              SAVE {discountPercent}%
            </span>
          )}
        </div>

        {/* Custom triggers for stock */}
        <div className="absolute bottom-2 left-2 sm:bottom-2.5 sm:left-2.5">
          {isOutOfStock ? (
            <span className="bg-red-600/90 text-white text-[9px] sm:text-[10px] uppercase font-bold tracking-widest px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-sm shadow">
              Sold Out
            </span>
          ) : isLowStock ? (
            <span className="bg-amber-600/95 text-white text-[8px] sm:text-[9px] uppercase tracking-wider px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md shadow flex items-center gap-1 font-medium">
              <AlertTriangle className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
              Only {product.stock} Left!
            </span>
          ) : null}
        </div>
      </div>

      {/* Product Information Details block */}
      <div className="p-3 sm:p-4 flex-1 flex flex-col justify-between space-y-2 sm:space-y-4">
        
        {/* Texts */}
        <div className="space-y-1 sm:space-y-1.5 cursor-pointer" onClick={() => onViewDetails(product)}>
          <div className="flex items-center justify-between text-[9px] sm:text-[10px] text-gray-400 uppercase tracking-widest font-semibold">
            <span>{product.category}</span>
            <span className="font-mono text-[8px] sm:text-[9px]">{product.sku}</span>
          </div>

          <h3 className="font-serif text-[12px] sm:text-base text-[#1D1D1D] font-medium leading-snug group-hover:text-[#C9A66B] transition-colors line-clamp-2">
            {product.name}
          </h3>

          <div className="hidden sm:flex items-center gap-1.5 py-0.5">
            <div className="flex text-[#C9A66B] text-sm">
              {"★".repeat(5)}
            </div>
            <span className="text-[10px] text-gray-400 font-medium">(5.0)</span>
          </div>

          <p className="hidden sm:block text-stone-500 text-xs line-clamp-2 font-light italic leading-relaxed pt-1">
            {product.description}
          </p>
        </div>

        {/* Pricing & Interactive CTA Action Triggers */}
        <div>
          <div className="flex items-baseline gap-2 pt-1 sm:pt-2">
            <span className="font-serif text-[15px] sm:text-lg text-[#C9A66B] font-bold">
              ₹{product.discountPrice.toLocaleString('en-IN')}
            </span>
            {product.price > product.discountPrice && (
              <span className="text-gray-400 line-through text-[10px] sm:text-xs font-light">
                MRP: ₹{product.price.toLocaleString('en-IN')}
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-1.5 sm:gap-2 mt-2.5 sm:mt-4">
            <button
              onClick={() => onViewDetails(product)}
              className="bg-[#1D1D1D] text-[#FDFBF8] text-[9px] sm:text-[10px] uppercase font-bold tracking-widest py-2.5 sm:py-3 hover:bg-[#C9A66B] transition-colors cursor-pointer"
            >
              View Piece
            </button>
            <a
              href={`https://wa.me/${contactNo}?text=${encodeURIComponent(orderMessage)}`}
              target="_blank"
              rel="noreferrer"
              className="bg-[#25D366] text-white hover:bg-[#1DA851] text-[9px] sm:text-[10px] uppercase font-bold tracking-widest py-2.5 sm:py-3 flex items-center justify-center gap-1 transition-all rounded shadow"
            >
              <MessageCircle className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              Order via WA
            </a>
          </div>
        </div>

      </div>
    </div>
  );
}

