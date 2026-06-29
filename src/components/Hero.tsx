import React, { useState, useEffect } from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';
import { HomeSettings } from '../types';
import { LOCAL_HERO_GALLERY } from '../assets/localGallery';

interface HeroProps {
  settings: HomeSettings;
  onExplore: () => void;
  onVisit: () => void;
}

export default function Hero({ settings, onExplore, onVisit }: HeroProps) {
  const [currentSlide, setCurrentSlide] = useState(0);

  // Slide order:
  //   1. Cloud-uploaded images (settings.heroGalleryImages) — admin uploads
  //   2. Hero banner override (settings.heroBannerImage) — admin override
  //   3. Local built-in images — guaranteed on every deploy
  // This means even on a brand-new deployment with zero Supabase content the
  // hero slideshow still rotates through the curated local catalog.
  const gallerySlides = Array.from(new Set(
    [
      ...(settings.heroGalleryImages || []).filter(Boolean),
      settings.heroBannerImage || '',
      ...LOCAL_HERO_GALLERY
    ].filter(Boolean)
  ));

  const slides = [
    {
      badge: 'Festive Luxury Edition',
      title: settings.heroHeadline || 'Jewellery That Makes Every Look Shine',
      subtitle: settings.heroSubtitle || 'Discover our premium collections in a curated luxury presentation.',
      tag: 'Crafted in Punjab, adored nationwide.'
    },
    {
      badge: "Founder's Rare Select",
      title: 'Exquisite 1-Gram Gold Masterpieces',
      subtitle: 'Handcrafted copper-infused structures with flawless gold plating and premium finishing.',
      tag: 'Bespoke bridal sets and standard size customization available.'
    }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % gallerySlides.length);
    }, 4500);
    return () => clearInterval(timer);
  }, [gallerySlides.length]);

  const activeSlide = slides[currentSlide % slides.length];

  return (
    <section className="relative min-h-[70vh] sm:min-h-[80vh] lg:min-h-[85vh] flex items-center hero-gradient overflow-hidden border-b border-[#C9A66B]/15">
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 overflow-hidden">
          {gallerySlides.map((image, index) => (
            <img
              key={`${image}-${index}`}
              src={image}
              alt={`Glitter Glam slide ${index + 1}`}
              className={`absolute inset-0 w-full h-full object-cover transition-all duration-1000 ease-out ${
                index === currentSlide % gallerySlides.length ? 'opacity-100 scale-100' : 'opacity-0 scale-105'
              }`}
            />
          ))}
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/55 to-black/45 sm:from-black/50 sm:via-black/20 sm:to-black/35" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,225,170,0.26),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(201,166,107,0.2),transparent_26%)]" />
        </div>

        <div className="absolute top-6 left-6 w-40 h-40 sm:top-10 sm:left-12 sm:w-72 sm:h-72 bg-[#C9A66B]/10 sm:bg-[#C9A66B]/8 rounded-full blur-3xl animate-[bounce_10s_infinite_alternate]" />
        <div className="absolute bottom-12 right-8 w-52 h-52 sm:bottom-20 sm:right-16 sm:w-96 sm:h-96 bg-[#A67C52]/10 sm:bg-[#A67C52]/8 rounded-full blur-3xl animate-[pulse_12s_infinite]" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12 relative z-10 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-12 items-center">
          {/* Left: text content — spans 7/12 on desktop, full on mobile */}
          <div className="lg:col-span-7 space-y-3 sm:space-y-6 text-center lg:text-left transition-all duration-700">
            <div className="inline-flex items-center gap-1.5 sm:gap-2 bg-white/10 text-[#F6E8D1] text-[9px] sm:text-xs font-semibold uppercase tracking-[0.3em] sm:tracking-[0.35em] px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-full backdrop-blur-md border border-white/15">
              <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              {activeSlide.badge}
            </div>

            <h1 className="font-serif text-[1.55rem] leading-[1.1] sm:text-5xl lg:text-6xl text-white font-semibold tracking-tight drop-shadow-lg break-words">
              {activeSlide.title}
            </h1>

            <p className="text-[12px] sm:text-base text-white/85 max-w-xl mx-auto lg:mx-0 font-light leading-relaxed">
              {activeSlide.subtitle}
            </p>

            {/* Poetry card — shows on all sizes, scales tight on mobile */}
            <div className="relative border-l-2 border-[#C9A66B] pl-3 sm:pl-5 py-2 sm:py-2 my-3 sm:my-6 italic text-[11px] sm:text-sm text-[#F6E8D1] max-w-lg mx-auto lg:mx-0 text-left bg-black/25 sm:bg-black/20 rounded-r-md pr-3 sm:pr-4 shadow-sm backdrop-blur-sm">
              <p className="font-serif font-light leading-relaxed whitespace-pre-line">
                "Glitter Glam ki chamak se har andaaz nikhar jaaye,
Jo pehne ek baar, woh nazar sabki chura le jaaye."
              </p>
              <div className="absolute -bottom-2.5 sm:-bottom-3 right-3 sm:right-4 bg-[#FDFBF8] text-[8px] sm:text-[9px] uppercase tracking-wider text-[#C9A66B] border border-[#C9A66B]/15 px-1.5 sm:px-2 py-0.5 rounded-md font-semibold">
                Glitter Glam Poetry
              </div>
            </div>

            <p className="text-[10px] sm:text-xs font-semibold text-white/80 uppercase tracking-widest pt-0.5 sm:pt-2">
              Pinpointed luxury in every glance.
            </p>

            <div className="flex items-center justify-center lg:justify-start gap-1.5 sm:gap-2 pt-1 sm:pt-2 flex-wrap">
              {gallerySlides.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentSlide(index)}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    index === currentSlide ? 'w-6 sm:w-8 bg-[#C9A66B]' : 'w-2 bg-white/60'
                  }`}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>

            <div className="flex flex-row sm:flex-row justify-center lg:justify-start gap-2 sm:gap-4 pt-2 sm:pt-4">
              <button
                onClick={onExplore}
                className="flex-1 sm:flex-initial bg-[#1D1D1D] text-[#FDFBF8] px-4 sm:px-8 py-3 sm:py-4 uppercase tracking-[0.18em] sm:tracking-[0.2em] text-[10px] sm:text-xs font-bold hover:bg-[#C9A66B] transition-all hover:shadow-[0_8px_20px_-4px_rgba(201,166,107,0.4)] cursor-pointer flex items-center justify-center gap-1.5 sm:gap-2 shadow-lg"
              >
                Shop <span className="hidden sm:inline">Collection</span>
                <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>
              <button
                onClick={onVisit}
                className="flex-1 sm:flex-initial border border-[#C9A66B] text-white px-4 sm:px-8 py-3 sm:py-4 uppercase tracking-[0.18em] sm:tracking-[0.2em] text-[10px] sm:text-xs font-bold hover:bg-white/10 transition-all flex items-center justify-center gap-1.5 sm:gap-2 bg-white/5 backdrop-blur-md hover:shadow-md cursor-pointer"
              >
                Visit Showroom
              </button>
            </div>
          </div>

          {/* Right: gallery preview — visible on all sizes, compact on mobile, full card on lg+ */}
          <div className="block lg:col-span-5 relative mt-2 sm:mt-0">
            <div className="relative mx-auto w-full max-w-[260px] sm:max-w-[340px] lg:max-w-[420px] aspect-[4/5] rounded-[1.25rem] sm:rounded-[1.5rem] lg:rounded-[2rem] overflow-hidden border border-white/25 shadow-[0_18px_60px_rgba(0,0,0,0.32)]">
              {gallerySlides.map((image, index) => (
                <img
                  key={`${image}-preview-${index}`}
                  src={image}
                  alt={`Gallery preview ${index + 1}`}
                  className={`absolute inset-0 w-full h-full object-cover transition-all duration-1000 ease-out ${
                    index === currentSlide ? 'opacity-100 scale-100' : 'opacity-0 scale-110'
                  }`}
                />
              ))}
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-white/10" />
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
