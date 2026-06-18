import React, { useState, useEffect, useRef } from 'react';
import { ArrowRight, Sparkles, Award, ShieldCheck, Heart } from 'lucide-react';
import { HomeSettings } from '../types';
import heroBannerImg from '../assets/images/hero_jewellery_banner_1781689221440.jpg';
import necklacesImg from '../assets/images/category_necklaces_1781689241269.jpg';
// Background video asset (auto-discovered in assets/)
const bgVideo = new URL('../../assets/background.mp4', import.meta.url).href;

interface HeroProps {
  settings: HomeSettings;
  onExplore: () => void;
  onVisit: () => void;
}

export default function Hero({ settings, onExplore, onVisit }: HeroProps) {
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = [
    {
      badge: "Festive Luxury Edition",
      title: settings.heroHeadline || "Jewellery That Makes Every Look Shine",
      subtitle: settings.heroSubtitle || "Breathtaking premium Artificial Ornamentals and meticulously heavy 1-Gram Gold pieces that exude pure traditional warmth.",
      image: settings.heroBannerImage || heroBannerImg,
      shayari: "\"Glitter Glam ki chamak se har andaaz nikhar jaaye,\nJo pehne ek baar, woh nazar sabki chura le jaaye.\"",
      tag: "Crafted in Punjab, adored nationwide."
    },
    {
      badge: "Founder's Rare Select",
      title: "Exquisite 1-Gram Gold Masterpieces",
      subtitle: "Handcrafted copper-infused structures with flawless gold plating guarantee, replicating the precious weight of 24k solid jewelry.",
      image: necklacesImg,
      shayari: "\"Chamkega roop tera jab gehne kundan sajenge,\nHar mehfil ki shaan mein bus hum hi hum thajenge.\"",
      tag: "Bespoke bridal sets and standard size customization available."
    }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 8000);
    return () => clearInterval(timer);
  }, [slides.length]);

  // Nested lazy-loading video component defined here to keep file scoped and simple
  function HeroBackgroundVideo({ poster }: { poster: string }) {
    const [loadVideo, setLoadVideo] = useState(false);
    const wrapperRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
      if (!wrapperRef.current) return;
      if (typeof IntersectionObserver === 'undefined') {
        // If no IO support, immediately load
        setLoadVideo(true);
        return;
      }
      const obs = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setLoadVideo(true);
            obs.disconnect();
          }
        });
      }, { rootMargin: '200px' });
      obs.observe(wrapperRef.current);
      return () => obs.disconnect();
    }, []);

    return (
      <div ref={wrapperRef} className="absolute inset-0 w-full h-full">
        {loadVideo ? (
          <video
            poster={poster}
            className="absolute inset-0 w-full h-full object-cover hidden sm:block"
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            src={bgVideo}
          />
        ) : (
          <img src={poster} alt="hero poster" className="absolute inset-0 w-full h-full object-cover" />
        )}
      </div>
    );
  }

  return (
    <section className="relative min-h-[85vh] flex items-center hero-gradient overflow-hidden border-b border-[#C9A66B]/15">
      {/* Absolute Ambient background video + shapes */}
      <div className="absolute inset-0 z-0">
        {/* Background video: lazy-load via IntersectionObserver to avoid heavy initial download on Vercel */}
        {/* Video will not set `src` until element is visible; poster remains as fallback. */}
        <HeroBackgroundVideo poster={heroBannerImg} />

        <div className="absolute top-10 left-12 w-72 h-72 bg-[#C9A66B]/8 rounded-full blur-3xl animate-[bounce_10s_infinite_alternate]" />
        <div className="absolute bottom-20 right-16 w-96 h-96 bg-[#A67C52]/8 rounded-full blur-3xl animate-[pulse_12s_infinite]" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Info Details Content */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left transition-all duration-700">
            <div className="inline-flex items-center gap-2 bg-[#C9A66B]/10 text-[#A67C52] text-[10px] sm:text-xs font-semibold uppercase tracking-[0.35em] px-3.5 py-1.5 rounded-full">
              <Sparkles className="w-3.5 h-3.5" />
              {slides[currentSlide].badge}
            </div>

            <h1 className="font-serif text-3xl sm:text-5xl lg:text-6xl text-[#1D1D1D] leading-[1.12] font-semibold tracking-tight">
              {slides[currentSlide].title}
            </h1>

            <p className="text-sm sm:text-base text-gray-600 max-w-xl mx-auto lg:mx-0 font-light leading-relaxed">
              {slides[currentSlide].subtitle}
            </p>

            {/* Classical Shayari */}
            <div className="relative border-l-2 border-[#C9A66B] pl-5 py-2 my-6 italic text-sm text-[#A67C52] max-w-lg mx-auto lg:mx-0 text-left bg-[#C9A66B]/5 rounded-r-md pr-4 shadow-sm animate-fade">
              <p className="whitespace-pre-line font-serif font-light leading-relaxed">
                {slides[currentSlide].shayari}
              </p>
              <div className="absolute -bottom-3 right-4 bg-[#FDFBF8] text-[9px] uppercase tracking-wider text-[#C9A66B] border border-[#C9A66B]/15 px-2 py-0.5 rounded-md font-semibold">
                ✧ Glitter Glam Poetry
              </div>
            </div>

            <p className="text-[11px] sm:text-xs font-semibold text-stone-500 uppercase tracking-widest pt-2">
              📍 {slides[currentSlide].tag}
            </p>

            <div className="flex flex-col sm:flex-row justify-center lg:justify-start gap-4 pt-4">
              <button
                onClick={onExplore}
                className="bg-[#1D1D1D] text-[#FDFBF8] px-8 py-4 uppercase tracking-[0.2em] text-xs font-bold hover:bg-[#C9A66B] transition-all hover:shadow-[0_8px_20px_-4px_rgba(201,166,107,0.4)] cursor-pointer flex items-center justify-center gap-2 shadow-lg"
              >
                Shop Collection <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={onVisit}
                className="border border-[#C9A66B] text-[#1D1D1D] px-8 py-4 uppercase tracking-[0.2em] text-xs font-bold hover:bg-[#FDFBF8] transition-all flex items-center justify-center gap-2 bg-white/40 backdrop-blur-md hover:border-[#1D1D1D] hover:shadow-md cursor-pointer"
              >
                Visit Our Showroom
              </button>
            </div>
          </div>
 
          {/* Luxury Imagery Preview Grid */}
          <div className="lg:col-span-5 flex justify-center relative">
            <div className="relative w-72 sm:w-80 lg:w-96 aspect-[4/5] glass-card p-4 transition-all duration-700 hover:scale-[1.02] hover:shadow-xl rounded-lg">
              
              <div className="w-full h-full bg-[#F4E6CF]/30 overflow-hidden relative group rounded-sm">
                <img
                  src={slides[currentSlide].image}
                  alt="Premium Glitter Glam Presentation Model"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-[4000ms] ease-out"
                  referrerPolicy="no-referrer"
                />
                
                {/* Embedded Glass Overlay */}
                <div className="absolute inset-x-4 bottom-4 bg-[#1D1D1D]/75 backdrop-blur-md p-4 text-white text-center border border-white/10 rounded-sm">
                  <p className="font-serif text-sm tracking-widest">Designed by founder</p>
                  <p className="text-[9px] text-[#C9A66B] uppercase tracking-[0.25em] mt-1">100% Quality Assurance Certificate Included</p>
                </div>
              </div>

              {/* Trust Badge overlay */}
              <div className="absolute -top-6 -right-6 bg-[#C9A66B] text-[#FDFBF8] p-4.5 rounded-full shadow-lg border border-[#F4E6CF] flex flex-col items-center justify-center text-center w-18 h-18 animate-pulse">
                <Sparkles className="w-4 h-4 text-[#FDFBF8] mb-0.5" />
                <span className="text-[8px] font-bold uppercase tracking-widest leading-none">1g Gold</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
