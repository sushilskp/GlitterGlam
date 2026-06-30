import React, { useState, useEffect } from 'react';
import { Search, Menu, X, Settings2, ShoppingBag } from 'lucide-react';
import { HomeSettings } from '../types';
import siteLogo from '../../assets/logo.jpeg';
import { logUI } from '../lib/uiLogger';
import { useCartTotals } from '../lib/cartStore';

interface HeaderProps {
  settings: HomeSettings;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onSearch: (query: string) => void;
  onOpenAdmin: () => void;
  onOpenCart: () => void;
  currentUser: { name: string; email: string; role: string } | null;
}

export default function Header({
  settings,
  activeTab,
  setActiveTab,
  onSearch,
  onOpenAdmin,
  onOpenCart,
  currentUser
}: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchToggle, setSearchToggle] = useState(false);
  const [queryString, setQueryString] = useState("");
  const cart = useCartTotals();

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    logUI('search_submit', { query: queryString });
    onSearch(queryString);
    setActiveTab("shop");
    setSearchToggle(false);
    setQueryString("");
  };

  const openSearch = () => {
    logUI('search_open');
    setSearchToggle(true);
  };

  const openMobileMenu = () => {
    logUI('menu_open');
    setMobileMenuOpen(true);
  };

  const handleLogoClick = () => {
    logUI('logo_click', { storeName: settings.storeName || 'Glitter Glam' });
    setActiveTab('home');
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleNav = (tab: string) => {
    setActiveTab(tab);
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const navItems = [
    { id: "home", label: "Home" },
    { id: "shop", label: "Collections" },
    { id: "visit", label: "Visit Boutique" },
    { id: "faq", label: "Care & FAQs" },
    { id: "about", label: "Our Story" }
  ];

  return (
    <>
      {/* Top Banner Announcement */}
      <div className="bg-[#1D1D1D] text-[#FDFBF8] text-center text-[11px] sm:text-xs py-2 px-4 tracking-widest font-light transition-all shadow-sm relative z-50">
        {settings.announcementText}
      </div>

      {/* Main Luxury Nav */}
      <header className="sticky top-0 z-40 glass-nav transition-all duration-300">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-2 relative">

          {/* Logo Section — flex on all sizes so the text never overlaps
              the action icons or escapes the viewport. */}
          <button
            id="brand-logo-trigger"
            onClick={handleLogoClick}
            className="flex items-center gap-2 sm:gap-3 group text-left cursor-pointer focus:outline-none shrink-0"
            title={settings.storeName || "GLITTER GLAM"}
            aria-label="Go to home"
          >
            {/* Custom logo uploaded by the user */}
            <div className="logo-wrapper no-effect w-11 h-11 sm:w-14 sm:h-14 shadow-sm shadow-[#C9A66B]/20 border border-[#C9A66B]/30 transition-transform duration-500 group-hover:scale-105">
              <img
                src={settings.logoUrl || siteLogo}
                alt={`${settings.storeName || 'Glitter Glam'} Logo`}
                className="w-11 h-11 sm:w-14 sm:h-14"
                referrerPolicy="no-referrer"
              />
            </div>

            <div className="flex flex-col text-left min-w-0">
              <span className="font-serif text-base sm:text-2xl tracking-[0.15em] sm:tracking-[0.2em] text-[#C9A66B] font-semibold leading-none uppercase truncate max-w-[180px] sm:max-w-none">
                {settings.storeName || "GLITTER GLAM"}
              </span>
              <span className="hidden sm:block text-[8px] uppercase tracking-[0.38em] text-[#A67C52] mt-1 font-medium whitespace-nowrap">
                Affordable Luxury Boutique
              </span>
            </div>
          </button>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-10">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleNav(item.id)}
                className={`text-xs uppercase tracking-[0.18em] font-medium transition-all py-2 border-b-2 hover:text-[#C9A66B] cursor-pointer ${
                  activeTab === item.id
                    ? "text-[#C9A66B] border-[#C9A66B]"
                    : "text-[#1D1D1D] border-transparent hover:border-[#C9A66B]/30"
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>

          {/* Action Icons */}
          <div className="flex items-center space-x-1 sm:space-x-3 ml-auto z-20 relative shrink-0">
            
            {/* Search Trigger */}
            <div className="relative z-30">
              {searchToggle ? (
                <form onSubmit={handleSearchSubmit} className="absolute right-0 top-1/2 -translate-y-1/2 flex items-center bg-white border border-[#E9E6E1] px-2 py-1 shadow-lg w-64 sm:w-80 rounded-full transition-all">
                  <input
                    type="text"
                    required
                    placeholder="Search jhumka, choker..."
                    value={queryString}
                    onChange={(e) => setQueryString(e.target.value)}
                    className="w-full text-sm bg-transparent focus:outline-none text-[#1D1D1D] px-3 py-2 rounded-full"
                    autoFocus
                    aria-label="Search catalogue"
                  />
                  <button type="submit" className="text-[#C9A66B] p-2 rounded-full hover:bg-[#F4E6CF]/30 transition-colors" aria-label="Submit search">
                    <Search className="w-4 h-4" />
                  </button>
                  <button type="button" onClick={() => { logUI('search_close'); setSearchToggle(false); }} className="text-gray-400 p-2 hover:text-red-600 rounded-full" aria-label="Close search">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </form>
              ) : (
                <button
                  onClick={openSearch}
                  className="p-2.5 text-[#1D1D1D] hover:text-[#C9A66B] transition-colors cursor-pointer rounded-full hover:bg-[#F4E6CF]/15"
                  title="Search Catalogue"
                  aria-label="Open search"
                >
                  <Search className="w-5 h-5 stroke-[1.5]" />
                </button>
              )}
            </div>

            {/* Cart Trigger — opens the cart drawer with coupon + gift wrap. */}
            <button
              onClick={() => { logUI('cart_open'); onOpenCart(); }}
              className="relative p-2.5 text-[#1D1D1D] hover:text-[#C9A66B] transition-colors cursor-pointer rounded-full hover:bg-[#F4E6CF]/15"
              title="Open cart"
              aria-label="Open shopping cart"
            >
              <ShoppingBag className="w-5 h-5 stroke-[1.5]" />
              {cart.itemCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-[#C9A66B] text-white text-[9px] font-bold rounded-full min-w-[18px] h-[18px] px-1 flex items-center justify-center border border-white">
                  {cart.itemCount > 9 ? '9+' : cart.itemCount}
                </span>
              )}
            </button>

            {/* Logged in Admin Control Trigger */}
            {currentUser && (currentUser.role === 'Admin' || currentUser.role === 'SuperAdmin' || currentUser.role === 'Super Admin') && (
              <button
                onClick={() => { logUI('admin_open'); onOpenAdmin(); }}
                className="p-2.5 text-[#C9A66B] hover:text-[#A67C52] transition-colors relative cursor-pointer rounded-full bg-[#1D1D1D]/5 hover:bg-[#F4E6CF]/15 flex items-center gap-1.5"
                title="Admin Dashboard"
                aria-label="Open admin panel"
              >
                <Settings2 className="w-5 h-5 stroke-[1.5] animate-spin-slow" />
                <span className="text-[9px] uppercase tracking-wider hidden sm:inline font-bold">Admin</span>
              </button>
            )}

            {/* Mobile Menu Toggle */}
            <button
              onClick={openMobileMenu}
              className="lg:hidden p-2.5 text-[#1D1D1D] hover:text-[#C9A66B] cursor-pointer"
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Slider Menu Drawer Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden lg:hidden">
          <div className="absolute inset-0 bg-black/60 transition-opacity backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} />
          
          <div className="absolute inset-y-0 right-0 max-w-xs w-full bg-[#FDFBF8] shadow-2xl flex flex-col p-6 animate-[slideIn_0.3s_ease-out]">
            <div className="flex items-center justify-between pb-6 border-b border-[#C9A66B]/15">
              <span className="font-serif text-[#C9A66B] font-semibold text-lg tracking-wider">Glitter Menu</span>
              <button onClick={() => setMobileMenuOpen(false)} className="p-2 text-[#1D1D1D] hover:text-[#C9A66B]">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="flex flex-col space-y-5 pt-8 flex-1">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    handleNav(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`text-left font-serif text-lg tracking-wider py-2 border-l-2 pl-4 transition-all ${
                    activeTab === item.id
                      ? "text-[#C9A66B] border-[#C9A66B] font-semibold"
                      : "text-[#1D1D1D] border-transparent hover:text-[#C9A66B]"
                  }`}
                >
                  {item.label}
                </button>
              ))}

              <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenCart();
                  }}
                  className="text-left font-serif text-base tracking-wider py-3 border-l-2 pl-4 transition-all text-[#C9A66B] hover:text-[#A67C52] border-transparent flex items-center gap-2 cursor-pointer"
                >
                  <ShoppingBag className="w-5 h-5" />
                  <span>Cart {cart.itemCount > 0 && `(${cart.itemCount})`}</span>
                </button>

                {currentUser && (currentUser.role === 'Admin' || currentUser.role === 'SuperAdmin') && (
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenAdmin();
                  }}
                  className="text-left font-serif text-base tracking-wider py-3 border-l-2 pl-4 transition-all text-[#C9A66B] hover:text-[#A67C52] border-transparent flex items-center gap-2 mt-4 pt-4 border-t border-[#C9A66B]/15 cursor-pointer"
                >
                  <Settings2 className="w-5 h-5" />
                  <span>Admin Panel</span>
                </button>
              )}
            </div>

            <div className="pt-6 border-t border-[#C9A66B]/10 text-center space-y-4">
              <p className="text-xs uppercase tracking-widest text-[#A67C52] font-semibold">Flagship Showroom</p>
              <p className="text-[10px] text-gray-500 leading-relaxed">
                Near Anaj Mandi, Sector 22, Dera Bassi, Punjab
              </p>
              <a 
                href={`https://wa.me/${settings.whatsappContact.replace(/\D/g, '')}`} 
                target="_blank" 
                rel="noreferrer" 
                className="block bg-[#C9A66B] text-[#FDFBF8] text-center text-xs uppercase tracking-widest py-3 hover:bg-[#A67C52] font-semibold"
              >
                Inquire on WhatsApp
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
