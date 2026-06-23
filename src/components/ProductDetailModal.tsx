import React, { useState, useEffect, useMemo } from 'react';
import {
  X, MessageSquare, Shield, CheckCircle, Info, Star, Heart, Share2,
  ChevronLeft, ChevronRight, Truck, RotateCcw, Package, Play, Plus
} from 'lucide-react';
import { Product, Review, VideoReview } from '../types';
import ProductCard from './ProductCard';
import {
  loadReviews, saveReview, getReviewsForProduct, averageRating,
  loadVideoReviews, toEmbedUrl
} from '../lib/reviewsStore';
import { v4 as uuidv4 } from 'uuid';

interface ProductDetailModalProps {
  product: Product;
  allProducts: Product[]; // for related products
  onClose: () => void;
  whatsappContact?: string;
}

function sanitizeWhatsAppNumber(num: string): string {
  const cleaned = num.replace(/\D/g, '');
  if (cleaned.length === 10) return '91' + cleaned;
  return cleaned || '919876976655';
}

export default function ProductDetailModal({
  product, allProducts, onClose, whatsappContact = "+91 98769 76655"
}: ProductDetailModalProps) {
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [selectedSize, setSelectedSize] = useState(product.sizeOptions[0] || "Free Size");
  const [quantity, setQuantity] = useState(1);
  const [tab, setTab] = useState<'description' | 'specs' | 'care' | 'reviews' | 'videos'>('description');
  const [imageZoom, setImageZoom] = useState(false);

  // Reviews
  const [reviews, setReviews] = useState<Review[]>([]);
  const [videos, setVideos] = useState<VideoReview[]>([]);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewForm, setReviewForm] = useState({ name: '', rating: 5, comment: '', location: '' });
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const [r, v] = await Promise.all([loadReviews(), loadVideoReviews()]);
      if (!mounted) return;
      setReviews(r);
      setVideos(v);
    })();
    return () => { mounted = false; };
  }, [product.id]);

  const productReviews = useMemo(() => getReviewsForProduct(reviews, product.sku), [reviews, product.sku]);
  const productVideos = useMemo(() => videos.filter(v => v.productSku === product.sku), [videos, product.sku]);
  const { avg, count } = useMemo(() => averageRating(reviews, product.sku), [reviews, product.sku]);

  // Related products: same category, exclude current
  const relatedProducts = useMemo(() => {
    return allProducts
      .filter(p => p.id !== product.id && p.category === product.category)
      .slice(0, 4);
  }, [allProducts, product.id, product.category]);

  const discountPercent = product.price > product.discountPrice
    ? Math.round(((product.price - product.discountPrice) / product.price) * 100)
    : 0;

  const contactNo = sanitizeWhatsAppNumber(whatsappContact);
  const currentUrl = typeof window !== 'undefined' ? window.location.href : '';
  const orderMessage = `*Order Inquiry*\n\n*Product Name:* ${product.name}\n*Product SKU:* ${product.sku}\n*Product Price:* ₹${product.discountPrice.toLocaleString('en-IN')}\n*Selected Size:* ${selectedSize}\n*Quantity:* ${quantity}\n*Product URL:* ${currentUrl}`;

  const isLowStock = product.stock > 0 && product.stock <= 5;
  const isOutOfStock = product.stock <= 0;

  // Keyboard navigation for image gallery
  useEffect(() => {
    if (!imageZoom) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') setActiveImageIndex((i) => (i + 1) % product.images.length);
      if (e.key === 'ArrowLeft') setActiveImageIndex((i) => (i - 1 + product.images.length) % product.images.length);
      if (e.key === 'Escape') setImageZoom(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [imageZoom, product.images.length]);

  const submitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewForm.name.trim() || !reviewForm.comment.trim()) return;
    setSubmittingReview(true);
    const r: Review = {
      id: uuidv4(),
      productSku: product.sku,
      name: reviewForm.name.trim(),
      rating: reviewForm.rating,
      comment: reviewForm.comment.trim(),
      location: reviewForm.location.trim() || undefined,
      approved: true,
      verified: false,
      createdAt: new Date().toISOString(),
    };
    const saved = await saveReview(r);
    setReviews(prev => [saved, ...prev.filter(x => x.id !== saved.id)]);
    setReviewForm({ name: '', rating: 5, comment: '', location: '' });
    setShowReviewForm(false);
    setSubmittingReview(false);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm" id={`detail-modal-${product.id}`}>
      <div className="min-h-screen flex items-start justify-center p-0 sm:p-4 lg:p-8">
        <div className="w-full max-w-6xl bg-[#FDFBF8] shadow-2xl relative animate-[slideIn_0.3s_ease-out]">

          {/* Sticky Top Bar */}
          <div className="sticky top-0 z-30 bg-[#FDFBF8]/95 backdrop-blur border-b border-stone-200 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <img
                src={product.images[0] || ''}
                alt=""
                className="w-9 h-9 object-cover rounded border border-stone-200 hidden sm:block"
                onError={(e) => { e.currentTarget.src = 'https://via.placeholder.com/60'; }}
              />
              <div className="min-w-0">
                <p className="text-[10px] text-[#A67C52] uppercase tracking-widest font-semibold truncate">{product.category}</p>
                <h1 className="font-serif text-sm sm:text-base text-stone-900 font-semibold truncate">{product.name}</h1>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {count > 0 && (
                <span className="hidden sm:flex items-center gap-1 text-xs font-semibold text-stone-700">
                  <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                  {avg.toFixed(1)} <span className="text-stone-400">({count})</span>
                </span>
              )}
              <button onClick={onClose} className="p-2 bg-stone-100 hover:bg-stone-200 rounded-full transition-colors" aria-label="Close">
                <X className="w-5 h-5 text-stone-700" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 lg:gap-8 p-4 sm:p-6 lg:p-8">
            {/* Left: Image Gallery */}
            <div className="lg:col-span-5 lg:sticky lg:top-20 lg:self-start space-y-3">
              <div
                className="aspect-square bg-stone-100 rounded-lg overflow-hidden border border-stone-200 relative cursor-zoom-in group"
                onClick={() => setImageZoom(true)}
              >
                <img
                  src={product.images[activeImageIndex] || product.images[0] || 'https://via.placeholder.com/600'}
                  alt={`${product.name}`}
                  className="w-full h-full object-cover transition-opacity duration-300"
                  referrerPolicy="no-referrer"
                  onError={(e) => { e.currentTarget.src = 'https://via.placeholder.com/600?text=No+Image'; }}
                />
                {product.images.length > 1 && (
                  <>
                    <button
                      onClick={(e) => { e.stopPropagation(); setActiveImageIndex((i) => (i - 1 + product.images.length) % product.images.length); }}
                      className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-white/90 hover:bg-white rounded-full shadow opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); setActiveImageIndex((i) => (i + 1) % product.images.length); }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-white/90 hover:bg-white rounded-full shadow opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </>
                )}
                <div className="absolute top-3 left-3 flex flex-col gap-1.5">
                  {discountPercent > 0 && (
                    <span className="bg-red-500 text-white text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded shadow">
                      -{discountPercent}% OFF
                    </span>
                  )}
                  {isOutOfStock && <span className="bg-stone-800 text-white text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded">Sold Out</span>}
                  {isLowStock && !isOutOfStock && <span className="bg-amber-500 text-white text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded">Only {product.stock} Left</span>}
                </div>
              </div>

              {product.images.length > 1 && (
                <div className="grid grid-cols-5 gap-2">
                  {product.images.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveImageIndex(idx)}
                      className={`aspect-square rounded overflow-hidden border-2 transition-all ${
                        idx === activeImageIndex
                          ? 'border-[#C9A66B] ring-2 ring-[#C9A66B]/30'
                          : 'border-stone-200 opacity-60 hover:opacity-100'
                      }`}
                    >
                      <img src={img || 'https://via.placeholder.com/100'} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" onError={(e) => { e.currentTarget.src = 'https://via.placeholder.com/100'; }} />
                    </button>
                  ))}
                </div>
              )}

              <div className="flex items-center gap-4 pt-2 text-xs text-stone-600">
                <button className="flex items-center gap-1.5 hover:text-red-500 transition-colors">
                  <Heart className="w-4 h-4" /> Wishlist
                </button>
                <button className="flex items-center gap-1.5 hover:text-[#C9A66B] transition-colors">
                  <Share2 className="w-4 h-4" /> Share
                </button>
              </div>
            </div>

            {/* Right: Info, tabs, sticky CTA */}
            <div className="lg:col-span-7 mt-6 lg:mt-0 space-y-6">
              <div>
                <p className="text-xs text-stone-500 uppercase tracking-widest font-mono mb-1">
                  {product.category} · SKU {product.sku}
                </p>
                <h2 className="font-serif text-2xl sm:text-3xl text-stone-900 font-bold leading-tight">{product.name}</h2>

                {count > 0 && (
                  <div className="flex items-center gap-2 mt-2">
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map(n => (
                        <Star
                          key={n}
                          className={`w-4 h-4 ${n <= Math.round(avg) ? 'fill-amber-400 text-amber-400' : 'text-stone-300'}`}
                        />
                      ))}
                    </div>
                    <span className="text-sm font-semibold text-stone-700">{avg.toFixed(1)}</span>
                    <span className="text-xs text-stone-400">({count} review{count !== 1 ? 's' : ''})</span>
                  </div>
                )}

                <div className="flex items-baseline gap-3 mt-4">
                  <span className="font-serif text-3xl text-[#C9A66B] font-extrabold">
                    ₹{product.discountPrice.toLocaleString('en-IN')}
                  </span>
                  {product.price > product.discountPrice && (
                    <>
                      <span className="text-stone-400 line-through text-base">₹{product.price.toLocaleString('en-IN')}</span>
                      <span className="text-green-600 font-semibold text-sm">
                        Save ₹{(product.price - product.discountPrice).toLocaleString('en-IN')} ({discountPercent}%)
                      </span>
                    </>
                  )}
                </div>
                <p className="text-xs text-stone-500 mt-1">Inclusive of all taxes</p>
              </div>

              {product.highlights && product.highlights.length > 0 && (
                <ul className="space-y-1.5 text-sm text-stone-700 bg-amber-50/40 border border-amber-200/60 rounded-lg p-3">
                  {product.highlights.map((h, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
                      <span>{h}</span>
                    </li>
                  ))}
                </ul>
              )}

              {product.sizeOptions.length > 0 && (
                <div>
                  <p className="text-xs uppercase tracking-widest text-stone-500 font-bold mb-2">
                    Size: <span className="text-stone-900">{selectedSize}</span>
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {product.sizeOptions.map((size) => (
                      <button
                        key={size}
                        onClick={() => !isOutOfStock && setSelectedSize(size)}
                        disabled={isOutOfStock}
                        className={`px-3 py-1.5 text-xs font-mono font-semibold border rounded transition-all ${
                          selectedSize === size
                            ? 'border-[#C9A66B] bg-[#C9A66B] text-white'
                            : isOutOfStock
                            ? 'border-stone-200 text-stone-300 bg-stone-50 cursor-not-allowed'
                            : 'border-stone-300 text-stone-700 hover:border-stone-900 bg-white'
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-stretch gap-3">
                <div className="flex items-center border border-stone-300 rounded">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={isOutOfStock}
                    className="px-3 py-3 text-stone-500 hover:text-black font-semibold disabled:opacity-50"
                  >−</button>
                  <span className="px-3 text-sm font-mono font-bold text-stone-700 min-w-10 text-center">{quantity}</span>
                  <button
                    onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                    disabled={isOutOfStock}
                    className="px-3 py-3 text-stone-500 hover:text-black font-semibold disabled:opacity-50"
                  >+</button>
                </div>

                {isOutOfStock ? (
                  <button disabled className="flex-1 py-3 text-xs uppercase tracking-widest font-bold text-white bg-stone-400 cursor-not-allowed rounded">
                    Out of Stock
                  </button>
                ) : (
                  <a
                    href={`https://wa.me/${contactNo}?text=${encodeURIComponent(orderMessage)}`}
                    target="_blank" rel="noreferrer"
                    onClick={onClose}
                    className="flex-1 flex items-center justify-center gap-2 py-3 text-xs sm:text-sm uppercase tracking-widest font-bold text-white bg-[#25D366] hover:bg-[#1DA851] rounded shadow-lg transition-colors"
                  >
                    <MessageSquare className="w-4 h-4" />
                    Order on WhatsApp
                  </a>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                <div className="flex flex-col items-center gap-1 p-3 bg-stone-50 rounded border border-stone-100">
                  <Truck className="w-5 h-5 text-[#C9A66B]" />
                  <p className="text-[10px] font-bold uppercase text-stone-700">Free Shipping</p>
                  <p className="text-[9px] text-stone-500">All India</p>
                </div>
                <div className="flex flex-col items-center gap-1 p-3 bg-stone-50 rounded border border-stone-100">
                  <RotateCcw className="w-5 h-5 text-[#C9A66B]" />
                  <p className="text-[10px] font-bold uppercase text-stone-700">Easy Returns</p>
                  <p className="text-[9px] text-stone-500">7-day policy</p>
                </div>
                <div className="flex flex-col items-center gap-1 p-3 bg-stone-50 rounded border border-stone-100">
                  <Shield className="w-5 h-5 text-[#C9A66B]" />
                  <p className="text-[10px] font-bold uppercase text-stone-700">Secure</p>
                  <p className="text-[9px] text-stone-500">Direct WA order</p>
                </div>
                <div className="flex flex-col items-center gap-1 p-3 bg-stone-50 rounded border border-stone-100">
                  <Package className="w-5 h-5 text-[#C9A66B]" />
                  <p className="text-[10px] font-bold uppercase text-stone-700">In Stock</p>
                  <p className="text-[9px] text-stone-500">{isOutOfStock ? 'Sold out' : `${product.stock} units`}</p>
                </div>
              </div>

              <div>
                <div className="flex border-b border-stone-200 text-xs sm:text-sm uppercase tracking-widest font-semibold gap-1 overflow-x-auto no-scrollbar">
                  {(['description', 'specs', 'care', 'reviews', 'videos'] as const).map(t => (
                    <button
                      key={t}
                      onClick={() => setTab(t)}
                      className={`pb-2.5 px-3 sm:px-4 transition-colors cursor-pointer whitespace-nowrap ${
                        tab === t ? 'border-b-2 border-[#C9A66B] text-stone-900' : 'text-stone-400 hover:text-stone-700'
                      }`}
                    >
                      {t === 'videos' ? `Videos${productVideos.length ? ` (${productVideos.length})` : ''}` : t === 'reviews' ? `Reviews (${count})` : t.charAt(0).toUpperCase() + t.slice(1)}
                    </button>
                  ))}
                </div>

                <div className="py-4 text-sm text-stone-700 leading-relaxed">
                  {tab === 'description' && (
                    <p className="whitespace-pre-line">{product.description}</p>
                  )}

                  {tab === 'specs' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                      <Spec label="Type" value={product.type} />
                      <Spec label="Material" value={product.material} />
                      {product.plating && <Spec label="Plating" value={product.plating} />}
                      {product.hallmark && <Spec label="Finishing" value={product.hallmark} />}
                      {product.weight && <Spec label="Weight" value={product.weight} />}
                      <Spec label="SKU" value={product.sku} />
                      <Spec label="Category" value={product.category} />
                      <Spec label="Stock" value={isOutOfStock ? 'Sold out' : `${product.stock} units`} />
                      {product.occasionTags && product.occasionTags.length > 0 && (
                        <div className="col-span-full">
                          <p className="text-xs uppercase tracking-widest text-stone-500 font-bold mb-1.5">Occasion</p>
                          <div className="flex flex-wrap gap-1.5">
                            {product.occasionTags.map(t => (
                              <span key={t} className="text-[10px] uppercase tracking-wider px-2 py-0.5 bg-stone-100 text-stone-700 rounded">{t}</span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {tab === 'care' && (
                    <div className="space-y-2.5 p-4 bg-amber-50/40 border-l-2 border-[#C9A66B] rounded text-sm">
                      <p className="font-semibold text-stone-800">Founder's Care Instructions</p>
                      <p className="italic whitespace-pre-line">{product.careGuide}</p>
                      <p className="text-xs text-stone-500 mt-2">💡 Tip: Store each design inside airtight synthetic packaging boxes. Avoid direct spray of perfumes, water, or chemical moisturizers.</p>
                    </div>
                  )}

                  {tab === 'reviews' && (
                    <div className="space-y-4">
                      {count > 0 && (
                        <div className="flex items-center gap-4 p-4 bg-stone-50 rounded">
                          <div className="text-center">
                            <p className="text-3xl font-bold text-stone-900">{avg.toFixed(1)}</p>
                            <div className="flex justify-center">
                              {[1, 2, 3, 4, 5].map(n => (
                                <Star key={n} className={`w-3.5 h-3.5 ${n <= Math.round(avg) ? 'fill-amber-400 text-amber-400' : 'text-stone-300'}`} />
                              ))}
                            </div>
                            <p className="text-[10px] text-stone-500 mt-1">{count} review{count !== 1 ? 's' : ''}</p>
                          </div>
                          <div className="flex-1 text-xs text-stone-600">
                            <p>Customers love this piece. Verified buyers rate it highly for finish, design accuracy, and value.</p>
                          </div>
                        </div>
                      )}

                      {!showReviewForm ? (
                        <button
                          onClick={() => setShowReviewForm(true)}
                          className="w-full py-2.5 border-2 border-dashed border-stone-300 text-stone-600 text-sm font-semibold hover:border-[#C9A66B] hover:text-[#C9A66B] transition-colors flex items-center justify-center gap-2 rounded"
                        >
                          <Plus className="w-4 h-4" /> Write a review
                        </button>
                      ) : (
                        <form onSubmit={submitReview} className="p-4 border border-stone-200 rounded bg-white space-y-3">
                          <div className="grid grid-cols-2 gap-3">
                            <input
                              required type="text" placeholder="Your name"
                              value={reviewForm.name}
                              onChange={e => setReviewForm({ ...reviewForm, name: e.target.value })}
                              className="px-3 py-2 border border-stone-300 rounded text-sm"
                            />
                            <input
                              type="text" placeholder="City (optional)"
                              value={reviewForm.location}
                              onChange={e => setReviewForm({ ...reviewForm, location: e.target.value })}
                              className="px-3 py-2 border border-stone-300 rounded text-sm"
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-stone-700">Your rating:</span>
                            {[1, 2, 3, 4, 5].map(n => (
                              <button type="button" key={n} onClick={() => setReviewForm({ ...reviewForm, rating: n })}>
                                <Star className={`w-5 h-5 ${n <= reviewForm.rating ? 'fill-amber-400 text-amber-400' : 'text-stone-300'}`} />
                              </button>
                            ))}
                          </div>
                          <textarea
                            required placeholder="Tell others what you liked..."
                            rows={3}
                            value={reviewForm.comment}
                            onChange={e => setReviewForm({ ...reviewForm, comment: e.target.value })}
                            className="w-full px-3 py-2 border border-stone-300 rounded text-sm"
                          />
                          <div className="flex gap-2 justify-end">
                            <button type="button" onClick={() => setShowReviewForm(false)} className="px-4 py-2 text-xs font-semibold text-stone-600">Cancel</button>
                            <button type="submit" disabled={submittingReview} className="px-4 py-2 bg-[#1D1D1D] text-white text-xs font-semibold uppercase tracking-widest rounded hover:bg-[#C9A66B] disabled:opacity-50">
                              {submittingReview ? 'Posting…' : 'Post review'}
                            </button>
                          </div>
                        </form>
                      )}

                      {productReviews.length === 0 ? (
                        <p className="text-center text-sm text-stone-500 py-6">No reviews yet. Be the first to share your experience!</p>
                      ) : (
                        <div className="space-y-3">
                          {productReviews.map(r => (
                            <div key={r.id} className="p-3 border border-stone-200 rounded">
                              <div className="flex items-center justify-between mb-1">
                                <div className="flex items-center gap-2">
                                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#C9A66B] to-[#A67C52] text-white text-xs font-bold flex items-center justify-center">
                                    {r.name.charAt(0).toUpperCase()}
                                  </div>
                                  <div>
                                    <p className="text-sm font-semibold text-stone-900">{r.name}{r.verified && <CheckCircle className="inline w-3 h-3 text-green-500 ml-1" />}</p>
                                    {r.location && <p className="text-[10px] text-stone-500">{r.location}</p>}
                                  </div>
                                </div>
                                <div className="flex">
                                  {[1, 2, 3, 4, 5].map(n => (
                                    <Star key={n} className={`w-3 h-3 ${n <= r.rating ? 'fill-amber-400 text-amber-400' : 'text-stone-300'}`} />
                                  ))}
                                </div>
                              </div>
                              <p className="text-sm text-stone-700 leading-relaxed">{r.comment}</p>
                              <p className="text-[10px] text-stone-400 mt-1.5">{new Date(r.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {tab === 'videos' && (
                    <div className="space-y-3">
                      {productVideos.length === 0 ? (
                        <p className="text-center text-sm text-stone-500 py-6 flex items-center justify-center gap-2">
                          <Info className="w-4 h-4" /> No video reviews yet. Ask the admin to add a YouTube link.
                        </p>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {productVideos.map(v => {
                            const { embed, type } = toEmbedUrl(v.url);
                            return (
                              <div key={v.id} className="border border-stone-200 rounded overflow-hidden bg-black">
                                <div className="aspect-video relative">
                                  {type === 'mp4' ? (
                                    <video src={embed} controls className="w-full h-full" />
                                  ) : type === 'youtube' || type === 'instagram' ? (
                                    <iframe
                                      src={embed}
                                      title={v.title}
                                      className="w-full h-full"
                                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                      allowFullScreen
                                      loading="lazy"
                                    />
                                  ) : (
                                    <a href={v.url} target="_blank" rel="noreferrer" className="flex items-center justify-center w-full h-full bg-stone-100 text-stone-700">
                                      <Play className="w-8 h-8 mr-2" /> Watch video
                                    </a>
                                  )}
                                </div>
                                <div className="p-2 bg-white">
                                  <p className="text-xs font-semibold text-stone-900 truncate">{v.title}</p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {relatedProducts.length > 0 && (
            <div className="border-t border-stone-200 bg-stone-50/50 px-4 sm:px-6 lg:px-8 py-8">
              <h3 className="font-serif text-xl sm:text-2xl text-stone-900 font-bold mb-4 text-center">You may also like</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                {relatedProducts.map(p => (
                  <ProductCard
                    key={p.id}
                    product={p}
                    onViewDetails={() => {
                      window.dispatchEvent(new CustomEvent('gg:openProduct', { detail: p.id }));
                      onClose();
                    }}
                    whatsappContact={whatsappContact}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {imageZoom && (
        <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4 cursor-zoom-out" onClick={() => setImageZoom(false)}>
          <button onClick={() => setImageZoom(false)} className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white">
            <X className="w-6 h-6" />
          </button>
          {product.images.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); setActiveImageIndex((i) => (i - 1 + product.images.length) % product.images.length); }}
                className="absolute left-4 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); setActiveImageIndex((i) => (i + 1) % product.images.length); }}
                className="absolute right-4 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </>
          )}
          <img
            src={product.images[activeImageIndex] || product.images[0]}
            alt={product.name}
            className="max-h-[90vh] max-w-[90vw] object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}

function Spec({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between border-b border-stone-100 pb-1.5">
      <span className="text-stone-500 text-xs uppercase tracking-wider">{label}</span>
      <span className="font-semibold text-stone-800 text-xs">{value}</span>
    </div>
  );
}
