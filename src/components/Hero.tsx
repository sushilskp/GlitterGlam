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
    <section className="relative min-h-[85vh] flex items-center hero-gradient overflow-hidden border-b border-[#C9A66B]/15">
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
          <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-black/20 to-black/35" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,225,170,0.26),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(201,166,107,0.2),transparent_26%)]" />
        </div>

        <div className="absolute top-10 left-12 w-72 h-72 bg-[#C9A66B]/8 rounded-full blur-3xl animate-[bounce_10s_infinite_alternate]" />
        <div className="absolute bottom-20 right-16 w-96 h-96 bg-[#A67C52]/8 rounded-full blur-3xl animate-[pulse_12s_infinite]" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left transition-all duration-700">
            <div className="inline-flex items-center gap-2 bg-white/10 text-[#F6E8D1] text-[10px] sm:text-xs font-semibold uppercase tracking-[0.35em] px-3.5 py-1.5 rounded-full backdrop-blur-md border border-white/15">
              <Sparkles className="w-3.5 h-3.5" />
              {activeSlide.badge}
            </div>

            <h1 className="font-serif text-3xl sm:text-5xl lg:text-6xl text-white leading-[1.12] font-semibold tracking-tight drop-shadow-lg">
              {activeSlide.title}
            </h1>

            <p className="text-sm sm:text-base text-white/80 max-w-xl mx-auto lg:mx-0 font-light leading-relaxed">
              {activeSlide.subtitle}
            </p>

            <div className="relative border-l-2 border-[#C9A66B] pl-5 py-2 my-6 italic text-sm text-[#F6E8D1] max-w-lg mx-auto lg:mx-0 text-left bg-black/20 rounded-r-md pr-4 shadow-sm backdrop-blur-sm">
              <p className="font-serif font-light leading-relaxed">
                "Glitter Glam ki chamak se har andaaz nikhar jaaye,\nJo pehne ek baar, woh nazar sabki chura le jaaye."
              </p>
              <div className="absolute -bottom-3 right-4 bg-[#FDFBF8] text-[9px] uppercase tracking-wider text-[#C9A66B] border border-[#C9A66B]/15 px-2 py-0.5 rounded-md font-semibold">
                Glitter Glam Poetry
              </div>
            </div>

            <p className="text-[11px] sm:text-xs font-semibold text-white/75 uppercase tracking-widest pt-2">
              Pinpointed luxury in every glance.
            </p>

            <div className="flex items-center justify-center lg:justify-start gap-2 pt-2 flex-wrap">
              {gallerySlides.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentSlide(index)}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    index === currentSlide ? 'w-8 bg-[#C9A66B]' : 'w-2 bg-white/60'
                  }`}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>

            <div className="flex flex-col sm:flex-row justify-center lg:justify-start gap-4 pt-4">
              <button
                onClick={onExplore}
                className="bg-[#1D1D1D] text-[#FDFBF8] px-8 py-4 uppercase tracking-[0.2em] text-xs font-bold hover:bg-[#C9A66B] transition-all hover:shadow-[0_8px_20px_-4px_rgba(201,166,107,0.4)] cursor-pointer flex items-center justify-center gap-2 shadow-lg"
              >
                Shop Collection <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={onVisit}
                className="border border-[#C9A66B] text-white px-8 py-4 uppercase tracking-[0.2em] text-xs font-bold hover:bg-white/10 transition-all flex items-center justify-center gap-2 bg-white/5 backdrop-blur-md hover:shadow-md cursor-pointer"
              >
                Visit Our Showroom
              </button>
            </div>
          </div>

          <div className="lg:col-span-5 relative">
            <div className="relative mx-auto w-full max-w-[420px] aspect-[4/5] rounded-[2rem] overflow-hidden border border-white/25 shadow-[0_24px_80px_rgba(0,0,0,0.32)]">
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
