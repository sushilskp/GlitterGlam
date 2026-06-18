import React, { useState } from 'react';
import { X, MessageSquare, Shield, CheckCircle, Info } from 'lucide-react';
import { Product } from '../types';

interface ProductDetailModalProps {
  product: Product;
  onClose: () => void;
  whatsappContact?: string;
}

// Utility to sweep/clean the phone contact
function sanitizeWhatsAppNumber(num: string): string {
  const cleaned = num.replace(/\D/g, '');
  if (cleaned.length === 10) {
    return '91' + cleaned;
  }
  return cleaned || '919876976655';
}

export default function ProductDetailModal({
  product,
  onClose,
  whatsappContact = "+91 98769 76655"
}: ProductDetailModalProps) {
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [selectedSize, setSelectedSize] = useState(product.sizeOptions[0] || "Free Size");
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<'details' | 'care'>('details');

  const discountPercent = product.price > product.discountPrice
    ? Math.round(((product.price - product.discountPrice) / product.price) * 100)
    : 0;

  const contactNo = sanitizeWhatsAppNumber(whatsappContact);
  const currentUrl = typeof window !== 'undefined' ? window.location.href : '';
  const orderMessage = `*Order Inquiry*\n\n*Product Name:* ${product.name}\n*Product SKU:* ${product.sku}\n*Product Price:* ₹${product.discountPrice.toLocaleString('en-IN')}\n*Selected Size:* ${selectedSize}\n*Quantity:* ${quantity}\n*Product URL:* ${currentUrl}`;

  const isLowStock = product.stock > 0 && product.stock <= 5;
  const isOutOfStock = product.stock <= 0;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 sm:p-6 lg:p-8" id={`detail-modal-${product.id}`}>
      {/* Dark backdrop element with enhanced frosted-glass blur */}
      <div className="fixed inset-0 bg-[#1D1D1D]/65 backdrop-blur-md" onClick={onClose} />

      {/* Main Container - styled as a beautiful premium glass panel */}
      <div className="glass-panel w-full max-w-5xl rounded-lg shadow-2xl relative z-10 overflow-hidden flex flex-col md:flex-row max-h-[92vh] md:max-h-[85vh] bg-[#FDFBF8]/95 animate-[slideIn_0.3s_ease-out]">
        
        {/* Close Button top corner */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2.5 bg-white/90 backdrop-blur rounded-full text-[#1D1D1D] hover:text-[#C9A66B] shadow cursor-pointer focus:outline-none"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Left Side: Images Screen Section */}
        <div className="w-full md:w-1/2 p-4 sm:p-6 flex flex-col justify-between border-r border-[#C9A66B]/10">
          <div className="space-y-4">
            
            {/* Primary Main Display Stage */}
            <div className="aspect-square bg-stone-100 rounded-sm overflow-hidden relative border border-gray-100">
              <img 
                src={product.images[activeImageIndex] || product.images[0] || 'https://via.placeholder.com/600'} 
                alt={`${product.name} Primary View`} 
                className={`w-full h-full object-cover transition-all duration-500 ${isOutOfStock ? 'opacity-70 grayscale' : ''}`} 
                referrerPolicy="no-referrer"
                onError={(e) => { e.currentTarget.src = 'https://via.placeholder.com/600?text=No+Image'; }}
              />
              
              <div className="absolute top-3 left-3 flex flex-col gap-2">
                {isOutOfStock ? (
                  <span className="bg-red-600/95 text-white shadow-sm border border-red-700/30 px-3 py-1.5 text-[10px] font-mono tracking-widest uppercase font-bold">
                    SOLD OUT
                  </span>
                ) : isLowStock ? (
                  <span className="bg-amber-500/95 text-white shadow-sm border border-amber-600/30 px-3 py-1 text-[10px] font-mono tracking-widest uppercase font-bold">
                    ONLY {product.stock} LEFT
                  </span>
                ) : null}
              </div>

              {/* Gold/Artificial indicator floating overlay */}
              <span className="absolute bottom-3 left-3 bg-[#1D1D1D]/90 text-[#C9A66B] border border-[#C9A66B]/30 px-3 py-1 text-[10px] font-mono tracking-widest uppercase font-bold sm:block hidden">
                Verified: {product.type} Selection
              </span>
            </div>

            {/* Thumbnail list selector */}
            <div className="grid grid-cols-4 gap-2.5">
              {product.images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImageIndex(idx)}
                  className={`aspect-square rounded-sm overflow-hidden bg-stone-50 border cursor-pointer transition-all ${
                    idx === activeImageIndex 
                      ? "border-[#C9A66B] ring-1 ring-[#C9A66B]/40" 
                      : "border-gray-200 opacity-60 hover:opacity-100"
                  }`}
                >
                  <img src={img || 'https://via.placeholder.com/600'} alt={`Thumb preview ${idx}`} className="w-full h-full object-cover" referrerPolicy="no-referrer" onError={(e) => { e.currentTarget.src = 'https://via.placeholder.com/600?text=No+Image'; }} />
                </button>
              ))}
            </div>

          </div>

          {/* Secure purchase assurances */}
          <div className="hidden md:grid grid-cols-3 gap-2 pt-6 text-center border-t border-dashed border-gray-200 mt-4">
            <div className="space-y-1">
              <Shield className="w-4 h-4 mx-auto text-[#C9A66B]" />
              <p className="text-[9px] font-bold uppercase text-stone-700">100% Secure</p>
              <p className="text-[8px] text-gray-400">Direct WhatsApp Orders</p>
            </div>
            <div className="space-y-1">
              <CheckCircle className="w-4 h-4 mx-auto text-[#C9A66B]" />
              <p className="text-[9px] font-bold uppercase text-stone-700">Premium Finish</p>
              <p className="text-[8px] text-gray-400">Hand-polished standard</p>
            </div>
            <div className="space-y-1">
              <Info className="w-4 h-4 mx-auto text-[#C9A66B]" />
              <p className="text-[9px] font-bold uppercase text-stone-700">Store Pickup</p>
              <p className="text-[8px] text-gray-400">Green Enclave branch</p>
            </div>
          </div>
        </div>

        {/* Right Side: Information Configuration columns */}
        <div className="w-full md:w-1/2 p-6 sm:p-8 flex flex-col justify-between overflow-y-auto no-scrollbar max-h-[50vh] md:max-h-full">
          <div>
            
            {/* Category and SKU metadata headers */}
            <div className="flex items-center justify-between text-xs text-stone-400 uppercase tracking-widest font-mono">
              <span className="font-semibold text-[#A67C52]">{product.category}</span>
              <span>SKU: {product.sku}</span>
            </div>

            {/* Title name */}
            <h1 className="font-serif text-2xl sm:text-3xl text-stone-900 font-bold tracking-wide mt-2">
              {product.name}
            </h1>

            {/* Price display tag block */}
            <div className="flex items-baseline gap-3.5 mt-3">
              <span className="font-serif text-2xl text-[#C9A66B] font-extrabold">
                ₹{product.discountPrice.toLocaleString('en-IN')}
              </span>
              {product.price > product.discountPrice && (
                <>
                  <span className="text-gray-400 line-through text-sm">
                    MRP: ₹{product.price.toLocaleString('en-IN')}
                  </span>
                  <span className="text-red-500 font-mono text-xs font-bold bg-red-50 px-2 py-0.5 rounded border border-red-100">
                    -{discountPercent}% OFF
                  </span>
                </>
              )}
            </div>

            {/* Custom Tab selectors */}
            <div className="flex border-b border-gray-100 mt-6 text-xs uppercase tracking-widest font-semibold gap-4">
              <button 
                onClick={() => setActiveTab('details')}
                className={`pb-2.5 transition-colors cursor-pointer ${activeTab === 'details' ? 'border-b-2 border-[#C9A66B] text-stone-900 font-bold' : 'text-gray-400 hover:text-stone-700'}`}
              >
                Information
              </button>
              <button 
                onClick={() => setActiveTab('care')}
                className={`pb-2.5 transition-colors cursor-pointer ${activeTab === 'care' ? 'border-b-2 border-[#C9A66B] text-stone-900 font-bold' : 'text-gray-400 hover:text-stone-700'}`}
              >
                Care Guide
              </button>
            </div>

            {/* Dynamic Tab Panel Display */}
            <div className="py-5 text-xs sm:text-sm text-stone-600 leading-relaxed font-light">
              {activeTab === 'details' && (
                <div className="space-y-3">
                  <p>{product.description}</p>
                  <div className="grid grid-cols-2 gap-y-2.5 text-xs pt-2 border-t font-normal">
                    <p><strong className="text-stone-700">Material Composition:</strong> {product.material}</p>
                    {product.plating && <p><strong className="text-stone-700">Plating Standard:</strong> {product.plating}</p>}
                    {product.hallmark && <p><strong className="text-stone-700">Finishing Style:</strong> {product.hallmark}</p>}
                    {product.weight && <p><strong className="text-stone-700">Weight Context:</strong> {product.weight}</p>}
                  </div>
                </div>
              )}

              {activeTab === 'care' && (
                <div className="space-y-2.5 p-3.5 bg-[#F4E6CF]/10 rounded border-l-2 border-[#C9A66B] text-[12px]">
                  <p className="font-semibold text-stone-800">Founder's Care Instructions:</p>
                  <p className="italic">{product.careGuide}</p>
                  <p className="text-[10px] text-gray-400 mt-2">💡 Tips: Store each design inside airtight synthetic packaging boxes. Avoid direct spray of perfumes, water, or chemical moisturizes.</p>
                </div>
              )}
            </div>

            {/* Custom Sizing and quantity config */}
            <div className="space-y-4 pt-4 border-t border-gray-100">
              
              {/* Product Sizes choice selection matrix */}
              <div className="space-y-2">
                <span className="text-[10px] uppercase tracking-widest text-stone-400 font-bold block">Available Sizing Measures:</span>
                <div className="flex flex-wrap gap-2">
                  {product.sizeOptions.map((sizeOption) => (
                    <button
                      key={sizeOption}
                      onClick={() => !isOutOfStock && setSelectedSize(sizeOption)}
                      disabled={isOutOfStock}
                      className={`px-3 py-1.5 text-xs font-mono font-bold border transition-all ${
                        selectedSize === sizeOption && !isOutOfStock
                          ? "border-[#C9A66B] bg-[#C9A66B] text-white shadow-sm" 
                          : isOutOfStock
                          ? "border-gray-100 text-gray-300 cursor-not-allowed bg-stone-50"
                          : "border-stone-200 text-stone-600 hover:border-black bg-white cursor-pointer"
                      }`}
                    >
                      {sizeOption}
                    </button>
                  ))}
                </div>
              </div>

              {/* Ordering Controls */}
              <div className="flex items-center gap-3 pt-2">
                <div className="flex items-center border border-gray-300 rounded-sm">
                  <button 
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={isOutOfStock}
                    className="px-3 py-2 text-gray-500 hover:text-black font-semibold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    -
                  </button>
                  <span className="px-3 text-xs font-mono font-bold text-gray-700">{quantity}</span>
                  <button 
                    onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                    disabled={isOutOfStock}
                    className="px-3 py-2 text-gray-500 hover:text-black font-semibold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    +
                  </button>
                </div>

                {isOutOfStock ? (
                  <button
                    disabled
                    className="flex-1 flex items-center justify-center gap-2 py-3 text-xs uppercase tracking-[0.2em] font-semibold text-white shadow-lg rounded-sm bg-stone-400 cursor-not-allowed transition-colors"
                  >
                    Out of Stock
                  </button>
                ) : (
                  <a
                    href={`https://wa.me/${contactNo}?text=${encodeURIComponent(orderMessage)}`}
                    target="_blank"
                    rel="noreferrer"
                    onClick={onClose}
                    className="flex-1 flex items-center justify-center gap-2 py-3 text-xs uppercase tracking-[0.2em] font-semibold text-white shadow-lg rounded-sm bg-[#25D366] hover:bg-[#1DA851] cursor-pointer transition-colors"
                  >
                    <MessageSquare className="w-4 h-4" />
                    Order on WhatsApp
                  </a>
                )}
              </div>

            </div>
            
            {product.stock <= 0 && (
              <div className="mt-4 bg-red-50 text-red-600 font-bold p-3 text-center rounded border border-red-200 uppercase tracking-widest text-xs">
                Sold Out
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
