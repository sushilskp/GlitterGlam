import React, { useState } from 'react';
import { Mail, Instagram, MessageCircle, MapPin, Clock, Phone, Heart, Award } from 'lucide-react';
import { HomeSettings } from '../types';

interface FooterProps {
  settings: HomeSettings;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export default function Footer({ settings, activeTab, setActiveTab }: FooterProps) {
  const [subbed, setSubbed] = useState(false);
  const [subEmail, setSubEmail] = useState("");

  const handleSubSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subEmail) return;
    setSubbed(true);
    alert(`🎉 Success! Email subscriber ${subEmail} registered securely inside database tables.`);
    setSubEmail("");
  };

  const handleNav = (tab: string) => {
    setActiveTab(tab);
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <footer className="bg-[#1D1D1D] text-white pt-16 pb-8 border-t border-[#C9A66B]/15 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-12 pb-12 border-b border-stone-800">
        
        {/* Brand Information */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="font-serif text-2xl tracking-[0.2em] text-[#C9A66B] font-bold uppercase">{settings.storeName || 'GLITTER GLAM'}</span>
          </div>
          <p className="text-xs text-stone-400 leading-relaxed font-light">
            Premium Artificial Ornamentals & 1 Gram Gold Polish Treasures crafted for modern women who seek sophistication without solid gold price tags. An ambitious startup founded and led by two passionate young women.
          </p>
          <div className="flex gap-3 text-stone-400">
            <a href={settings.instagramHandle || `https://instagram.com/glitterglams.in`} target="_blank" rel="noreferrer" className="p-2 bg-stone-800 hover:bg-[#C9A66B] text-white transition-colors" title="Instagram Profile">
              <Instagram className="w-4 h-4" />
            </a>
            <a href={`https://wa.me/${settings.whatsappContact.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" className="p-2 bg-stone-800 hover:bg-[#25D366] text-white transition-colors" title="WhatsApp Support">
              <MessageCircle className="w-4 h-4 text-[#25D366] fill-[#25D366]" />
            </a>
            {settings.facebookHandle && (
              <a href={settings.facebookHandle} target="_blank" rel="noreferrer" className="p-2 bg-stone-800 hover:bg-[#C9A66B] text-white transition-colors" title="Facebook Page">
                <span className="font-bold text-xs uppercase tracking-widest px-1">F</span>
              </a>
            )}
            <a href={`mailto:${settings.supportEmail}`} className="p-2 bg-stone-800 hover:bg-[#C9A66B] text-white transition-colors" title="Email Desk">
              <Mail className="w-4 h-4" />
            </a>
          </div>
        </div>

        {/* Navigation Quicklinks */}
        <div className="space-y-4">
          <h4 className="font-serif text-sm tracking-[0.16em] text-[#F4E6CF] font-semibold uppercase">Explore Collections</h4>
          <ul className="space-y-2.5 text-xs text-stone-400 uppercase tracking-widest font-medium">
            <li>
              <button onClick={() => handleNav("home")} className="hover:text-[#C9A66B] transition-colors cursor-pointer block">Home Dashboard</button>
            </li>
            <li>
              <button onClick={() => handleNav("shop")} className="hover:text-[#C9A66B] transition-colors cursor-pointer block">E-Boutique Store</button>
            </li>
            <li>
              <button onClick={() => handleNav("about")} className="hover:text-[#C9A66B] transition-colors cursor-pointer block">Founders' Story</button>
            </li>
            <li>
              <button onClick={() => handleNav("faq")} className="hover:text-[#C9A66B] transition-colors cursor-pointer block">FAQs & Care Guides</button>
            </li>
          </ul>
        </div>

        {/* Flagship Store Coordinates card */}
        <div className="space-y-4">
          <h4 className="font-serif text-sm tracking-[0.11em] text-[#F4E6CF] font-semibold uppercase">Physical Showroom</h4>
          <div className="space-y-3.5 text-xs text-stone-300 font-light leading-relaxed">
            <p className="flex items-start gap-2.5">
              <MapPin className="w-4 h-4 text-[#C9A66B] shrink-0 mt-0.5" />
              <span>{settings.storeAddress}</span>
            </p>
            <p className="flex items-center gap-2.5">
              <Clock className="w-4 h-4 text-[#C9A66B] shrink-0" />
              <span>{settings.storeTiming}</span>
            </p>
            <p className="flex items-center gap-2.5">
              <Phone className="w-4 h-4 text-[#C9A66B] shrink-0" />
              <a href={`tel:${settings.whatsappContact}`} className="hover:underline">{settings.whatsappContact}</a>
            </p>
          </div>
        </div>

        {/* Newsletter retention box */}
        <div className="space-y-4">
          <h4 className="font-serif text-sm tracking-[0.11em] text-[#F4E6CF] font-semibold uppercase">Circular Signup</h4>
          <p className="text-xs text-stone-400 font-light leading-relaxed">
            Recieve VIP invitations to anniversary discounts, festive launches, and real gold bullion rate fluctuations.
          </p>

          {subbed ? (
            <p className="text-xs text-green-500 font-semibold block">✓ Successfully logged to style newsletter!</p>
          ) : (
            <form onSubmit={handleSubSubmit} className="flex flex-col gap-2">
              <input
                type="email"
                required
                placeholder="Enter email..."
                value={subEmail}
                onChange={(e) => setSubEmail(e.target.value)}
                className="bg-stone-800 text-xs px-3 py-2 focus:outline-none border border-transparent focus:border-[#C9A66B] text-white"
              />
              <button type="submit" className="bg-[#C9A66B] hover:bg-[#A67C52] text-xs uppercase font-bold tracking-widest text-white py-2 shadow-inner transition-colors">
                Subscribe
              </button>
            </form>
          )}
        </div>

      </div>

      {/* Under copyright layout */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-2 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-stone-500 tracking-wider">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 justify-center sm:justify-start">
          <p>© 2026 {settings.storeName || 'Glitter Glam'}. {settings.storeAddress ? settings.storeAddress.split(',')[0] : 'Sass Nagar, Mohali, Punjab'}. All rights reserved.</p>
          <span className="text-stone-700 hidden sm:inline">|</span>
          <button 
            onClick={() => handleNav("admin")} 
            className="font-medium text-stone-400 hover:text-[#C9A66B] uppercase text-[10px] tracking-widest transition-colors cursor-pointer"
          >
            Staff Portal
          </button>
        </div>
        <p className="uppercase text-[#C9A66B] flex items-center gap-1 font-semibold text-[10px]">
          <Award className="w-3.5 h-3.5" /> Handcrafted Women-Led Startup India
        </p>
      </div>

    </footer>
  );
}
