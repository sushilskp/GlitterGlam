import React from 'react';
import necklacesImg from '../assets/images/category_necklaces_1781689241269.jpg';
import earringsImg from '../assets/images/category_earrings_1781689256134.jpg';
import earringsBg from '../../assets/Ear rings.jpeg';
import ringsBg from '../../assets/ring.jpeg';
import braceletsImg from '../assets/images/category_bracelets_1781689309708.jpg';
import banglesBg from '../../assets/Bengles.jpeg';
import forAllImg from '../../assets/for all.jpeg';
import necklacesBg from '../../assets/Neakless.jpeg';

interface CategoryNavProps {
  onSelectCategory: (category: string) => void;
  activeCategory: string;
}

export default function CategoryNav({ onSelectCategory, activeCategory }: CategoryNavProps) {
  const categories = [
    {
      name: "All",
      tagline: "Full Catalogue",
      image: forAllImg
    },
    {
      name: "Necklaces",
      tagline: "Chokers, Choirs & Sets",
      image: necklacesBg
    },
    {
      name: "Earrings",
      tagline: "Jhumkas & Chandbalis",
      image: earringsBg
    },
    {
      name: "Rings",
      tagline: "Bands & Crown Solitaires",
      image: ringsBg
    },
    {
      name: "Bracelets",
      tagline: "Cuffs & Fine Crystals",
      image: braceletsImg
    },
    {
      name: "Bangles",
      tagline: "Traditional Kadas",
      image: banglesBg
    }
  ];

  return (
    <div className="py-10 sm:py-12 bg-[#FDFBF8]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Short Header */}
        <div className="text-center max-w-xl mx-auto mb-8 sm:mb-10">
          <span className="text-[10px] uppercase tracking-[0.35em] text-[#A67C52] font-semibold">Exquisite Classifications</span>
          <h2 className="font-serif text-2xl sm:text-3xl text-[#1D1D1D] mt-2 leading-none">Browse Boutique Categories</h2>
          <div className="w-12 h-[1.5px] bg-[#C9A66B] mx-auto mt-4" />
        </div>

        {/* Categories circles grid */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 sm:gap-6 lg:gap-10 max-w-md sm:max-w-none mx-auto">
          {categories.map((cat) => {
            const isActive = activeCategory === cat.name;
            return (
              <button
                key={cat.name}
                onClick={() => onSelectCategory(cat.name)}
                className="flex flex-col items-center group cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#C9A66B]/20 p-1 sm:p-2 rounded-lg transition-transform hover:-translate-y-1 duration-300"
              >
                {/* Outlined circular frame - Styled under category-circle layout with glass/gold elements */}
                <div className={`relative w-16 h-16 sm:w-24 sm:h-24 rounded-full p-1 transition-all duration-300 ${
                  isActive 
                    ? "border-2 border-[#C9A66B] bg-white scale-105 shadow-md" 
                    : "border border-[#C9A66B]/30 bg-white/20 hover:border-[#C9A66B]"
                }`}>
                  <div className="w-full h-full rounded-full overflow-hidden relative bg-stone-100">
                    <img
                      src={cat.image || 'https://via.placeholder.com/150'}
                      alt={cat.name}
                      className="w-full h-full object-cover grayscale-[15%] group-hover:grayscale-0 group-hover:scale-110 transition-all duration-500"
                      referrerPolicy="no-referrer"
                      onError={(e) => { e.currentTarget.src = 'https://via.placeholder.com/150?text=Category'; }}
                    />
                    {/* Dark gradient gloss */}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#1D1D1D]/30 to-transparent" />
                  </div>
                </div>

                <span className={`font-serif text-[12px] sm:text-sm mt-2 sm:mt-3 tracking-wide transition-colors text-center leading-tight ${
                  isActive ? "text-[#C9A66B] font-bold" : "text-[#1D1D1D] group-hover:text-[#C9A66B]"
                }`}>
                  {cat.name}
                </span>

                <span className="text-[9px] uppercase tracking-wider text-gray-400 mt-1 hidden sm:block">
                  {cat.tagline}
                </span>
              </button>
            );
          })}
        </div>

      </div>
    </div>
  );
}
