import React, { useState, useEffect } from 'react';
import { Product, HomeSettings } from './types';
import Header from './components/Header';
import Hero from './components/Hero';
import CategoryNav from './components/CategoryNav';
import ProductCard from './components/ProductCard';
import ProductDetailModal from './components/ProductDetailModal';
import Policies from './components/Policies';
import FaqSection from './components/FaqSection';
import Footer from './components/Footer';
import AdminPanel from './components/AdminPanel';
import { MessageSquare, ShieldCheck, Store, MapPin, Clock, Phone, Filter } from 'lucide-react';
import { cloudDb, subscribeToSyncStatus, SyncState } from './lib/supabaseSync';
import { supabase, isSupabaseConfigured, UserRole } from './lib/supabaseClient';
import AdminAuth from './components/AdminAuth';
import founderPoojaImg from '../assets/founder.jpeg';
import cofounderPranitaImg from '../assets/co-founder.jpeg';
import visitingBg from '../assets/Neakless.jpeg';

export default function App() {
  // Database States
  // Initial settings: read synchronously from localStorage so the Header /
  // Hero / announcement bar all render on the FIRST paint, without waiting
  // for the Supabase round-trip. This eliminates the "page is empty until
  // data loads" problem users see when they open the site or refresh.
  const [products, setProducts] = useState<Product[]>(() => {
    try {
      const raw = localStorage.getItem('backup_products');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });
  const [settings, setSettings] = useState<HomeSettings>(() => {
    try {
      const raw = localStorage.getItem('backup_settings');
      if (raw) return JSON.parse(raw);
    } catch { /* fall through */ }
    return {
      announcementText: "Welcome to Glitter Glam!",
      heroHeadline: "Breathtaking Artistry",
      heroSubtitle: "Discover our premium collections.",
      heroGalleryImages: [],
      instagramHandle: "@glitterglam",
      whatsappContact: "+91 98769 76655",
      supportEmail: "support@glitterglam.com",
      storeAddress: "Store Location",
      storeTiming: "10 AM - 8 PM"
    };
  });

  // Supabase Syncing States
  const [syncState, setSyncState] = useState<SyncState>({ status: 'loading', message: 'Checking data store...' });
  const [isCloudLoading, setIsCloudLoading] = useState(false);

  // Navigation & Filtering States
  const [activeTab, setActiveTabState] = useState<string>(() => {
    const path = window.location.pathname;
    if (path === '/admin' || path === '/admin/') {
      return "admin";
    }
    return "home";
  });

  const setActiveTab = (tab: string) => {
    setActiveTabState(tab);
    if (tab === 'admin') {
      if (window.location.pathname !== '/admin') {
        window.history.pushState({}, '', '/admin');
      }
    } else {
      if (window.location.pathname !== '/') {
        window.history.pushState({}, '', '/');
      }
    }
  };

  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname;
      if (path === '/admin' || path === '/admin/') {
        setActiveTabState("admin");
      } else {
        setActiveTabState("home");
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  const [authSession, setAuthSession] = useState<{ id: string; name: string; email: string; role: UserRole } | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    const fetchPersistedSession = async () => {
      setCheckingAuth(true);
      if (isSupabaseConfigured && supabase) {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user) {
            let uName = session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'User';
            let uRole: UserRole = (session.user.user_metadata?.role as UserRole) || 'Customer';

            const { data: dbProfile } = await supabase
              .from('user_profiles')
              .select('*')
              .eq('id', session.user.id)
              .maybeSingle();
            if (dbProfile) {
              uRole = (dbProfile.role as UserRole) || 'Customer';
              uName = dbProfile.name || uName;
            }

            setAuthSession({ id: session.user.id, name: uName, email: session.user.email || '', role: uRole });
          } else {
            setAuthSession(null);
          }
        } catch (err) {
          console.warn("Auth initial session fetch skip:", err);
          setAuthSession(null);
        }
      } else {
        setAuthSession(null);
      }
      setCheckingAuth(false);
    };

    fetchPersistedSession();

    if (isSupabaseConfigured && supabase) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (session?.user) {
          let uName = session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'User';
          let uRole: UserRole = (session.user.user_metadata?.role as UserRole) || 'Customer';

          try {
            const { data: dbProfile } = await supabase
              .from('user_profiles')
              .select('*')
              .eq('id', session.user.id)
              .maybeSingle();
            if (dbProfile) {
              uRole = (dbProfile.role as UserRole) || 'Customer';
              uName = dbProfile.name || uName;
            }
          } catch (dbErr) {
            console.warn("Auth changed db mapping fetch error:", dbErr);
          }

          setAuthSession({ id: session.user.id, name: uName, email: session.user.email || '', role: uRole });
        } else {
          setAuthSession(null);
        }
      });

      return () => {
        subscription.unsubscribe();
      };
    }
  }, []);

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Shop Filter States
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedMaterial, setSelectedMaterial] = useState<string>("All");
  const [selectedPlating, setSelectedPlating] = useState<string>("All");
  const [maxPrice, setMaxPrice] = useState<number>(7000);

  // Load initial baseline assets, then try to sync live Supabase PostgreSQL
  useEffect(() => {
    // Subscribe to live Supabase connection status updates
    const unsubscribe = subscribeToSyncStatus((state) => {
      setSyncState(state);
    });

    async function loadCloudDatabase() {
      setIsCloudLoading(true);
      const data = await cloudDb.testAndLoad();
      if (data) {
        if (data.products && data.products.length > 0) setProducts(data.products);
        else {
          const localProds = localStorage.getItem('backup_products');
          if (localProds) setProducts(JSON.parse(localProds));
        }

        // Settings resolution: cloud is the source of truth when it has
        // meaningful content, BUT we must not blow away locally-cached
        // hero gallery images when the cloud row happens to be empty
        // (e.g. a freshly-seeded row, or an old DB that pre-dates the
        // `hero_gallery_images` column).
        const localSetsRaw = localStorage.getItem('backup_settings');
        const localSets: HomeSettings | null = localSetsRaw ? JSON.parse(localSetsRaw) : null;
        const localGalleryCount = localSets?.heroGalleryImages?.length ?? 0;
        const cloudGalleryCount = data.settings?.heroGalleryImages?.length ?? 0;

        if (data.settings && data.settings.id) {
          if (cloudGalleryCount >= localGalleryCount) {
            setSettings(data.settings);
            localStorage.setItem('backup_settings', JSON.stringify(data.settings));
          } else if (localSets) {
            // Local cache has more slideshow photos than the cloud — prefer
            // the local copy, then push it back up so the cloud catches up.
            const merged: HomeSettings = { ...data.settings, ...localSets, id: data.settings.id };
            setSettings(merged);
            localStorage.setItem('backup_settings', JSON.stringify(merged));
            // Fire-and-forget: write the merged state to the cloud.
            try { await cloudDb.updateSettings(merged); } catch (e) { /* logged in updateSettings */ }
          }
        } else if (localSets) {
          setSettings(localSets);
        }
      }
      setIsCloudLoading(false);
    }

    loadCloudDatabase();

    return () => {
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (settings.googleAnalyticsId && !document.getElementById('ga-script')) {
      const scriptText = document.createElement('script');
      scriptText.id = 'ga-script';
      scriptText.innerHTML = `
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', '${settings.googleAnalyticsId}');
      `;

      const gtmScript = document.createElement('script');
      gtmScript.id = 'gtm-script';
      gtmScript.async = true;
      gtmScript.src = `https://www.googletagmanager.com/gtag/js?id=${settings.googleAnalyticsId}`;

      document.head.appendChild(gtmScript);
      document.head.appendChild(scriptText);
    }
  }, [settings.googleAnalyticsId]);

  // Update state and shadow-write to active Supabase Cloud.
  // The localStorage write is the recovery fallback for offline / single-device
  // dev — the Supabase upsert is the source of truth for everyone else.
  const syncProducts = async (newProds: Product[]) => {
    setProducts(newProds);
    localStorage.setItem('backup_products', JSON.stringify(newProds));
  };

  const syncSettings = async (newSets: HomeSettings) => {
    setSettings(newSets);
    try {
      localStorage.setItem('backup_settings', JSON.stringify(newSets));
    } catch (lsErr) {
      console.warn('Local settings backup write failed (quota?):', lsErr);
    }
    try {
      await cloudDb.updateSettings(newSets);
    } catch (err) {
      console.warn('Cloud settings write failed, localStorage kept as fallback:', err);
    }
  };

  const handleAddProduct = async (prod: Product) => {
    setProducts(prev => {
      const newProds = [prod, ...prev];
      localStorage.setItem('backup_products', JSON.stringify(newProds));
      return newProds;
    });
    try {
      await cloudDb.upsertProduct(prod);
    } catch (err) {
      console.warn("Silent ignore: cloud product write failed.", err);
    }
  };

  const handleEditProduct = async (editedProd: Product) => {
    setProducts(prev => {
      const newProds = prev.map(p => p.id === editedProd.id ? editedProd : p);
      localStorage.setItem('backup_products', JSON.stringify(newProds));
      return newProds;
    });
    try {
      await cloudDb.upsertProduct(editedProd);
    } catch (err) {
      console.warn("Silent ignore: cloud product write failed.", err);
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    setProducts(prev => {
      const newProds = prev.filter(p => p.id !== productId);
      localStorage.setItem('backup_products', JSON.stringify(newProds));
      return newProds;
    });
    try {
      if (cloudDb.deleteProduct) {
        await cloudDb.deleteProduct(productId);
      }
    } catch (err) {
      console.warn("Silent ignore: cloud product delete failed.", err);
    }
  };

  // Backup & Import
  const handleRestoreDb = (jsonStr: string) => {
    try {
      const parsedObj = JSON.parse(jsonStr);
      if (parsedObj.products) setProducts(parsedObj.products);
      if (parsedObj.settings) setSettings(parsedObj.settings);
      return true;
    } catch (e) {
      console.error("Backup restoration error:", e);
      return false;
    }
  };

  const handleResetDb = () => {
    alert("Database restore is temporarily disabled.");
  };

  // Filter products lists
  const filteredProducts = products.filter(p => {
    const matchesCategory = selectedCategory === "All" || p.category === selectedCategory;
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.sku.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesMaterial = selectedMaterial === "All" || p.material.toLowerCase().includes(selectedMaterial.toLowerCase());
    
    let matchesPlating = true;
    if (selectedPlating !== "All") {
      if (selectedPlating === "1 Gram") {
        matchesPlating = p.type === '1 Gram Gold';
      } else {
        matchesPlating = p.type === 'Artificial';
      }
    }
    const matchesPrice = p.discountPrice <= maxPrice;

    return matchesCategory && matchesSearch && matchesMaterial && matchesPlating && matchesPrice;
  });

  return (
    <div id="full-scope-view-wrapper" className="min-h-screen flex flex-col justify-between bg-[#FDFBF8] font-sans text-[#1D1D1D] selection:bg-[#C9A66B]/30 tracking-wide antialiased">
      
      {/* 1. Header Navigation — always rendered on customer pages so the menu
          appears instantly on first paint. Announcement bar is hidden only
          when the text is truly empty (cosmetic), not the whole header. */}
      {activeTab === 'admin' ? (
        <div id="admin-workspace-header" className="bg-[#1D1D1D] border-b border-[#C9A66B]/30 py-4 px-6 flex items-center justify-between sticky top-0 z-50 backdrop-blur-md bg-opacity-95 text-[#FDFBF8]">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#C9A66B]/15 rounded text-[#C9A66B] font-mono text-base font-bold">
              Ã¢Å¡â„¢Ã¯Â¸Â
            </div>
            <div>
              <h1 className="font-serif text-lg tracking-wider text-[#C9A66B] font-bold leading-none uppercase">Glitter Glam Back-Office</h1>
              <span className="text-[9px] uppercase tracking-widest text-[#A67C52] font-mono mt-1 block">Administrative Engine Room Control</span>
            </div>
          </div>
          <button
            onClick={() => setActiveTab("home")}
            className="bg-stone-800 hover:bg-[#C9A66B] text-white hover:text-[#1D1D1D] px-4 py-2 text-xs tracking-wider uppercase font-bold flex items-center gap-2 transition-all cursor-pointer border border-[#C9A66B]/20"
          >
            Ã¢â€ Â Back to Customer Boutique
          </button>
        </div>
      ) : (
        <Header
          settings={settings}
          activeTab={activeTab}
          setActiveTab={(tab) => {
            setActiveTab(tab);
          }}
          onSearch={(q) => {
            setSearchQuery(q);
          }}
          onOpenAdmin={() => {
            setActiveTab("admin");
          }}
          currentUser={authSession}
        />
      )}

      {/* 2. Main Page Content views */}
      <main className="flex-1 w-full">

        {/* TAB A: HOMEPAGE OVERVIEW */}
        {activeTab === 'home' && (
          <div className="space-y-16">
            <Hero 
              settings={settings}
              onExplore={() => setActiveTab("shop")}
              onVisit={() => setActiveTab("visit")}
            />
            
            <CategoryNav 
              activeCategory={selectedCategory}
              onSelectCategory={(cat) => {
                setSelectedCategory(cat);
                setActiveTab("shop");
              }}
            />

            {/* Curated Best Sellers highlight sections */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
              <div className="text-center max-w-xl mx-auto mb-12">
                <span className="text-[10px] uppercase tracking-[0.4em] text-[#A67C52] font-semibold">Featured Ornaments</span>
                <h2 className="font-serif text-3xl text-[#1D1D1D] mt-2 font-bold leading-normal">The Founders' Select Favorites</h2>
                <div className="w-12 h-[1.5px] bg-[#C9A66B] mx-auto mt-4" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                {(() => {
                  const featuredList = products.filter(p => p.isFeatured);
                  return featuredList.map((prod) => (
                    <ProductCard
                      key={prod.id}
                      product={prod}
                      onViewDetails={(p) => setSelectedProduct(p)}
                      whatsappContact={settings.whatsappContact}
                    />
                  ));
                })()}
              </div>
            </div>

            {/* In-Person Store Reassurance banner */}
            <div className="bg-[#1D1D1D] text-white py-16 relative overflow-hidden border-y border-[#C9A66B]/20">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
                <div className="lg:col-span-8 space-y-4 text-center lg:text-left">
                  <span className="text-[10px] text-[#C9A66B] uppercase tracking-[0.35em] font-extrabold flex items-center justify-center lg:justify-start gap-2">
                    <Store className="w-4 h-4" /> EXPERIENCE EXQUISITE LUXURY IN PERSON
                  </span>
                  <h3 className="font-serif text-2xl sm:text-3xl text-[#F4E6CF] font-light">
                    Visit Our SAS Nagar Showroom in Punjab
                  </h3>
                  <p className="text-xs text-stone-400 font-light max-w-2xl leading-relaxed">
                    Come feel the realistic weight, sparkle, and flawless hallmark shine of our complete 1-Gram gold bridal lineup and premium chocker necklaces. Located near Anaj Mandi, Dera Bassi, SAS Nagar, Punjab. Open daily from 9:00 AM to 10:00 PM.
                  </p>
                </div>
                <div className="lg:col-span-4 text-center lg:text-right">
                  <button 
                    onClick={() => setActiveTab("visit")}
                    className="bg-[#C9A66B] hover:bg-[#A67C52] text-white px-8 py-3.5 text-xs font-bold uppercase tracking-widest shadow-md transition-colors"
                  >
                    Get Directions Maps
                  </button>
                </div>
              </div>
            </div>

            {/* Trust Policies banner blocks */}
            <Policies />

          </div>
        )}

        {/* TAB B: SHOP / COLLECTIONS CATALOG */}
        {activeTab === 'shop' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 animate-fade">
            
            {/* Header section of catalogue */}
            <div className="border-b pb-6 mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div>
                <span className="text-[10px] uppercase tracking-[0.3em] text-[#A67C52] font-bold">
                  BOUTIQUE CATALOGUE
                </span>
                <h1 className="font-serif text-3xl text-[#1D1D1D] mt-1 font-bold">
                  Browse Our Entire Selection
                </h1>
                <p className="text-xs text-gray-400 mt-1">
                  Filtering {filteredProducts.length} high-end ornaments out of SAS Nagar, Punjab
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                
                {/* Advanced filters Sidebar (3 cols width) */}
                <div className="lg:col-span-3 glass-card p-5 rounded-lg space-y-6">
                  <div className="flex items-center gap-2 border-b pb-2 mb-4">
                    <Filter className="w-4 h-4 text-[#C9A66B]" />
                    <span className="font-serif text-sm font-extrabold uppercase text-[#1D1D1D] tracking-wider">Advanced Filters</span>
                  </div>

                  {/* Search query modifier */}
                  <div className="space-y-1.5 flex flex-col">
                    <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Keyword Search</label>
                    <input 
                      type="text" 
                      placeholder="E.g. choker, ruby, ball..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="border p-2 text-xs focus:border-[#C9A66B] focus:outline-none rounded bg-stone-50 font-mono"
                    />
                    {searchQuery && (
                      <button onClick={() => setSearchQuery("")} className="text-left text-[9px] text-[#C9A66B] hover:underline uppercase font-bold">
                        Clear Search query
                      </button>
                    )}
                  </div>

                  {/* Plating types filters */}
                  <div className="space-y-1.5 flex flex-col">
                    <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Type Plating Style</label>
                    <select 
                      value={selectedPlating}
                      onChange={(e) => setSelectedPlating(e.target.value)}
                      className="border p-2 text-xs bg-stone-50 focus:outline-none"
                    >
                      <option value="All">All Plating Styles</option>
                      <option value="1 Gram">1 Gram Heavy Gold Guarantee</option>
                      <option value="Artificial">Premium Artificial Polish</option>
                    </select>
                  </div>

                  {/* Material alloy filter */}
                  <div className="space-y-1.5 flex flex-col">
                    <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Material Base Element</label>
                    <select 
                      value={selectedMaterial}
                      onChange={(e) => setSelectedMaterial(e.target.value)}
                      className="border p-2 text-xs bg-stone-50 focus:outline-none"
                    >
                      <option value="All">All Base Materials</option>
                      <option value="Copper">Solid Red-Copper Matrix</option>
                      <option value="Brass">Artisanal Yellow Brass</option>
                      <option value="Kundan">Classic Royal Kundan katori</option>
                      <option value="Zirconia">refractive cz crystals</option>
                    </select>
                  </div>

                  {/* Category select filter */}
                  <div className="space-y-1.5 flex flex-col">
                    <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Category Circle</label>
                    <select 
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="border p-2 text-xs bg-stone-50 focus:outline-none"
                    >
                      <option value="All">All Categories</option>
                      <option value="Necklaces">Necklaces (Chokers/Sets)</option>
                      <option value="Earrings">Earrings (Jhumkis)</option>
                      <option value="Rings">Rings (Adjustable bands)</option>
                      <option value="Bracelets">Bracelets (CZ Crystals)</option>
                      <option value="Bangles">Bangles (Symmetric Kadas)</option>
                    </select>
                  </div>

                  {/* Price range filters slider */}
                  <div className="space-y-2 flex flex-col">
                    <div className="flex justify-between text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                      <span>Price Range Limit</span>
                      <span className="text-[#C9A66B]">Under Ã¢â€šÂ¹{maxPrice.toLocaleString('en-IN')}</span>
                    </div>
                    <input 
                      type="range"
                      min={800}
                      max={7000}
                      step={100}
                      value={maxPrice}
                      onChange={(e) => setMaxPrice(Number(e.target.value))}
                      className="w-full accent-[#C9A66B] cursor-pointer"
                    />
                    <div className="flex justify-between text-[9px] text-stone-400 font-mono">
                      <span>Min: Ã¢â€šÂ¹800</span>
                      <span>Max: Ã¢â€šÂ¹7,000</span>
                    </div>
                  </div>

                  {/* Clear All parameters */}
                  <button
                    onClick={() => {
                      setSelectedCategory("All");
                      setSelectedMaterial("All");
                      setSearchQuery("");
                      setSelectedPlating("All");
                      setMaxPrice(7000);
                    }}
                    className="w-full bg-[#1D1D1D] hover:bg-[#C9A66B] text-white text-[10px] py-2.5 uppercase tracking-widest font-bold"
                  >
                    Reset All Filters
                  </button>

                </div>

                {/* Right side catalog grids (9 cols wid) */}
                <div className="lg:col-span-9 space-y-6">
                  {filteredProducts.length === 0 ? (
                    <div className="text-center py-20 bg-stone-50 rounded border">
                      <p className="font-serif italic text-sm text-gray-400">No beautiful pieces match your current active filter queries.</p>
                      <button 
                        onClick={() => {
                          setSelectedCategory("All");
                          setSelectedMaterial("All");
                          setSearchQuery("");
                          setSelectedPlating("All");
                          setMaxPrice(7000);
                        }}
                        className="text-xs text-[#C9A66B] font-bold underline mt-2 block"
                      >
                        Reset current filter state
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      {filteredProducts.map((p) => (
                        <ProductCard
                          key={p.id}
                          product={p}
                          onViewDetails={(prod) => setSelectedProduct(prod)}
                          whatsappContact={settings.whatsappContact}
                        />
                      ))}
                    </div>
                  )}
                </div>

              </div>

          </div>
        )}

        {/* TAB C: VISIT BOUTIQUE SHOWROOM / GOOGLE MAPS */}
        {activeTab === 'visit' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-12 animate-fade">
            <div className="text-center max-w-xl mx-auto mb-8">
              <span className="text-[10px] uppercase tracking-[0.35em] text-[#A67C52] font-semibold">Flagship Showroom Experience</span>
              <h1 className="font-serif text-3xl sm:text-4xl text-[#1D1D1D] mt-2 font-bold">Visit Our Dhanoni Road Showroom</h1>
              <div className="w-12 h-[1.5px] bg-[#C9A66B] mx-auto mt-4" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
              
              {/* Info column removed as requested */}

              {/* Visiting card: shape-led premium layout */}
              <div className="lg:col-span-12 min-h-[400px] flex items-center justify-center">
                <div className="premium-card max-w-4xl w-full m-6">
                  <div className="premium-card__glow premium-card__glow--left" />
                  <div className="premium-card__glow premium-card__glow--right" />
                  <div className="premium-card__frame">
                    <div className="premium-card__top">
                      <div>
                        <p className="premium-card__eyebrow">Glitter Glam</p>
                        <h2 className="font-serif text-3xl sm:text-4xl font-bold leading-tight text-[#F6E8D1]">
                          Boutique Flagship
                        </h2>
                        <p className="premium-card__subhead">SAS Nagar, Punjab</p>
                      </div>
                      <div className="premium-card__badge">
                        Premium
                        <span>Visiting Card</span>
                      </div>
                    </div>

                    <div className="premium-card__center">
                      <div className="premium-card__orb premium-card__orb--large" />
                      <div className="premium-card__orb premium-card__orb--small" />
                      <div className="premium-card__ring" />
                      <div className="premium-card__panel">
                        <p className="premium-card__intro">
                          Founded by Pooja and Pranita. Handcrafted Indian karigar heritage, micro-fusion finish, and premium-looking jewelry at accessible prices.
                        </p>

                        <div className="premium-card__details">
                          <div>
                            <span>Address</span>
                            <strong>{settings.storeAddress}</strong>
                          </div>
                          <div>
                            <span>Hours</span>
                            <strong>{settings.storeTiming}</strong>
                          </div>
                          <div>
                            <span>Call</span>
                            <strong>{settings.whatsappContact}</strong>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="premium-card__footer">
                      <span>Premium bridal and festive collections in-store</span>
                      <span>Visit, feel, and choose in person</span>
                    </div>
                  </div>
                </div>
              </div>

            </div>

            {/* In-Store collection highlights carousel/grid */}
            <div className="bg-white p-6 sm:p-10 border border-[#C9A66B]/10 rounded-sm text-center max-w-4xl mx-auto space-y-4">
              <h3 className="font-serif text-lg text-gray-800 font-bold uppercase tracking-wider">What's Special in SAS Nagar Flagship?</h3>
              <p className="text-stone-500 text-xs sm:text-sm leading-relaxed max-w-2xl mx-auto font-light">
                Our brick-and-mortar showroom offers rare, heavy bridal sets custom configured on location. Meet with the founders directly, match jewelry beads to your customized bridal lehengas, and access physical quality appraisal certificates instantly.
              </p>
            </div>
          </div>
        )}

        {/* TAB D: FAQS / COMPLAINTS & TICKETS LOGGING */}
        {activeTab === 'faq' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 animate-fade">
            <div className="text-center max-w-xl mx-auto mb-8">
               <span className="text-[10px] uppercase tracking-[0.35em] text-[#A67C52] font-semibold">Self-Care &amp; Resolution Center</span>
              <h1 className="font-serif text-3xl sm:text-4xl text-[#1D1D1D] mt-2 font-bold">Boutique Support Desk</h1>
              <div className="w-12 h-[1.5px] bg-[#C9A66B] mx-auto mt-4" />
            </div>

            <div className="text-center py-6 mb-12 max-w-2xl mx-auto bg-stone-50 rounded-sm border border-[#C9A66B]/15">
               <p className="text-stone-600 mb-4 text-xs sm:text-sm font-light px-4">
                 For direct human queries, order tracking, and complaints, please WhatsApp our active care desk.
               </p>
               <a 
                 href={`https://wa.me/${settings.whatsappContact.replace(/\D/g, '')}?text=${encodeURIComponent("Hello Glitter Glam Boutique Support, I need help with an order/inquiry.")}`}
                 target="_blank"
                 rel="noreferrer"
                 className="inline-block bg-[#1D1D1D] hover:bg-[#C9A66B] text-white px-8 py-3 text-xs uppercase tracking-widest font-bold transition-all shadow-md"
               >
                 Contact Support via WhatsApp
               </a>
            </div>

            {/* Interactive FAQs Accordion (Separated as requested: Payments separate from Shipping/Care) */}
            <div className="mb-12">
              <div className="text-center mb-6">
                <h3 className="font-serif text-xl sm:text-2xl text-[#1D1D1D] font-bold">Frequently Asked Questions</h3>
                <p className="text-stone-500 text-xs sm:text-sm font-light mt-1">Tap a category tab below to view responses related to payments, delivery, or product care.</p>
              </div>
              <FaqSection />
            </div>

            <div className="my-16 border-t border-[#C9A66B]/15" />

            {/* Render interactive Policy Tabs for instant access to Terms, Shipping, and Returns */}
            <Policies />
          </div>
        )}

        {/* TAB E: OUR STORY / ABOUT THE FOUNDERS */}
        {activeTab === 'about' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-16 animate-fade">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              
              {/* Story content */}
              <div className="space-y-8">
                <div className="space-y-4">
                  <span className="text-[10px] uppercase tracking-[0.35em] text-[#A67C52] font-bold block">The Founders' Dream</span>
                  <h1 className="font-serif text-3xl sm:text-5xl text-[#1D1D1D] leading-tight font-bold">Innovation &amp; Luxury<br />Redefined.</h1>
                  <div className="w-16 h-[1.5px] bg-[#C9A66B]" />
                </div>
                
                {/* Section 1: About Glitter Glam */}
                <div className="space-y-2">
                  <h3 className="font-serif text-lg font-bold text-[#1D1D1D] flex items-center gap-2">
                    <span className="text-[#C9A66B]">Ã¢Å“Â¦</span> About <span className="font-sans font-bold uppercase tracking-wider text-xs px-2 py-0.5 bg-[#C9A66B]/10 rounded text-[#A67C52]">Glitter Glam</span>
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-600 leading-relaxed font-light">
                    Founded by design Founder <strong className="font-medium text-[#1D1D1D]">Pooja</strong> and Manager <strong className="font-medium text-[#1D1D1D]">Pranita</strong>, <strong className="font-medium text-[#1D1D1D]">Glitter Glam</strong> is a contemporary luxury brand redefining access to premium Indian craftsmanship.
                  </p>
                </div>

                {/* Section 2: The Luxury Gap */}
                <div className="space-y-2">
                  <h3 className="font-serif text-lg font-bold text-[#1D1D1D] flex items-center gap-2">
                    <span className="text-[#C9A66B]">Ã¢Å“Â¦</span> The <span className="font-sans font-bold uppercase tracking-wider text-xs px-2 py-0.5 bg-[#C9A66B]/10 rounded text-[#A67C52]">Luxury Gap</span>
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-600 leading-relaxed font-light">
                    For too long, the jewelry market forced consumers to choose between prohibitively expensive fine gold and poorly finished, short-lived fashion jewelry. <strong className="font-medium text-[#1D1D1D]">Glitter Glam</strong> was established to eliminate this compromise.
                  </p>
                </div>

                {/* Section 3: Our Innovation */}
                <div className="space-y-2">
                  <h3 className="font-serif text-lg font-bold text-[#1D1D1D] flex items-center gap-2">
                    <span className="text-[#C9A66B]">Ã¢Å“Â¦</span> Our <span className="font-sans font-bold uppercase tracking-wider text-xs px-2 py-0.5 bg-[#C9A66B]/10 rounded text-[#A67C52]">Innovation</span>
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-600 leading-relaxed font-light">
                    We specialize in an advanced <strong className="font-medium text-[#1D1D1D]">micro-fusion process</strong>, crafting high-quality copper alloy bases with dense, premium artificial jewelry coatings and exceptional hallmark-grade polishes. The result is an exquisite collection that looks, feels, and endures like fine luxury jewelryÃ¢â‚¬â€offered at a minimal, highly accessible price point. <strong className="font-medium text-[#1D1D1D]">Glitter Glam</strong> is designed for the modern woman who demands exceptional quality, intelligent design, and affordable luxury for all.
                  </p>
                </div>

                {/* Handcrafted Punjabi rhyme of quality and trust */}
                <div className="bg-[#C9A66B]/5 p-5 border-l-4 border-[#C9A66B] rounded-r font-serif italic text-xs text-[#A67C52] space-y-1 shadow-sm">
                  <p>"Glitter Glam ki chamak se har pal roshan ho jaaye,</p>
                  <p>Har muskaan mein sona sa noor nazar aaye."</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3">
                  <div className="border border-[#C9A66B]/15 p-4 rounded-sm">
                    <h4 className="font-serif text-sm text-[#C9A66B] font-bold"><i className="mr-1">Ã¢Å“Â§</i> Authentic Polish</h4>
                    <p className="text-[11px] text-gray-500 mt-1">Multi-layered gold-microplating ensuring long-standing tarnish-resistant luster.</p>
                  </div>
                  <div className="border border-[#C9A66B]/15 p-4 rounded-sm">
                    <h4 className="font-serif text-sm text-[#C9A66B] font-bold"><i className="mr-1">Ã¢Å“Â§</i> Handcrafted Heritage</h4>
                    <p className="text-[11px] text-gray-500 mt-1">Sourced from master Indian karigars and hand-polished with utmost care.</p>
                  </div>
                </div>
              </div>

              {/* Founders photos section */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-start lg:mt-0 mt-8">
                {/* Founder Pooja */}
                <div className="space-y-3 text-center sm:text-left">
                  <div className="w-full aspect-[1/1] overflow-hidden rounded-lg shadow-xl border border-[#C9A66B]/10 bg-stone-50 relative group">
                    <img 
                      src={founderPoojaImg} 
                      alt="Pooja - Founder of Glitter Glam" 
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute top-2 left-2 bg-[#1C1C1C]/90 text-white text-[9px] uppercase tracking-widest px-2.5 py-1 rounded border border-white/5 font-semibold">
                      Founder
                    </div>
                  </div>
                  <div>
                    <h4 className="font-serif text-base font-bold text-[#1D1D1D]">Pooja</h4>
                    <p className="text-[11px] text-[#A67C52] tracking-wider uppercase font-medium">Design Founder</p>
                    <p className="text-xs text-gray-500 mt-1">Glitter Glam SAS Nagar Boutique Director</p>
                  </div>
                </div>

                {/* Manager Pranita */}
                <div className="space-y-3 text-center sm:text-left sm:mt-8">
                  <div className="w-full aspect-[1/1] overflow-hidden rounded-lg shadow-xl border border-[#C9A66B]/10 bg-stone-50 relative group">
                    <img 
                      src={cofounderPranitaImg} 
                      alt="Pranita - Manager of Glitter Glam" 
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute top-2 left-2 bg-[#1C1C1C]/90 text-white text-[9px] uppercase tracking-widest px-2.5 py-1 rounded border border-white/5 font-semibold">
                      Manager
                    </div>
                  </div>
                  <div>
                    <h4 className="font-serif text-base font-bold text-[#1D1D1D]">Pranita</h4>
                    <p className="text-[11px] text-[#A67C52] tracking-wider uppercase font-medium">Manager</p>
                    <p className="text-xs text-gray-500 mt-1">Bespoke Curation &amp; Operations</p>
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* TAB F: AUTHORISED CONTROL PANEL */}
        {activeTab === 'admin' && (
          checkingAuth ? (
            <div className="min-h-screen bg-[#FDFBF8] py-20 flex flex-col items-center justify-center text-stone-500 font-mono text-xs gap-3">
              <div className="w-8 h-8 border-2 border-[#C9A66B] border-t-transparent rounded-full animate-spin" />
              Verifying active operator privilege clearings...
            </div>
          ) : !authSession ? (
            <div className="min-h-screen bg-stone-950/95 py-12 flex items-center justify-center px-4">
              <AdminAuth onSuccess={(user) => setAuthSession(user)} />
            </div>
          ) : !(authSession.role === 'Super Admin' || authSession.role === 'Admin') ? (
            <div className="min-h-screen bg-[#FDFBF8] py-20 flex items-center justify-center px-4">
              <div className="max-w-md w-full text-center bg-white border border-red-200 shadow-xl rounded-2xl p-8 space-y-5">
                <div className="w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto border border-red-100">
                  <ShieldCheck className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="font-serif text-lg font-bold text-stone-900">Access Privileges Restricted</h3>
                  <p className="text-xs text-stone-500 mt-2 leading-relaxed">
                    Account <span className="font-bold font-mono text-stone-800">{authSession.email}</span> carries role <span className="font-bold underline text-red-700">{authSession.role}</span>.
                  </p>
                  <p className="text-xs text-stone-500 mt-2 leading-relaxed">
                    The administrative Glitter Glam panel room has restricted clearance. Operators must have Admin authorization.
                  </p>
                </div>
                <div className="flex gap-3 justify-center pt-2">
                  <button
                    onClick={async () => {
                      if (isSupabaseConfigured && supabase) {
                        await supabase.auth.signOut();
                      }
                      setAuthSession(null);
                    }}
                    className="px-4 py-2 border border-stone-200 hover:border-stone-400 font-semibold rounded-lg text-xs tracking-wider transition-all cursor-pointer"
                  >
                    Disconnect Profile / Sign Out
                  </button>
                  <button
                    onClick={() => setActiveTab('home')}
                    className="px-4 py-2 bg-[#C9A66B] hover:bg-[#A67C52] text-[#1D1D1D] font-bold rounded-lg text-xs tracking-wider transition-all cursor-pointer"
                  >
                    Go Back to Storefront
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="relative">
              {/* Signed-in user banner toolbar */}
              <div className="bg-[#1D1D1D] text-stone-300 py-2.5 px-4 sm:px-6 lg:px-8 border-b border-[#C9A66B]/25 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full animate-ping" />
                  <span>Logged in as: <strong className="text-stone-100">{authSession.name}</strong> ({authSession.email})</span>
                  <span className="bg-stone-800 text-[#C9A66B] font-mono font-bold text-[9px] uppercase px-2 py-0.5 rounded border border-[#C9A66B]/20">{authSession.role}</span>
                </div>
                <div className="flex gap-3">
                  <button 
                    onClick={() => setActiveTab('home')}
                    className="text-stone-400 hover:text-white font-medium"
                  >
                    Ã¢â€ Â Browse Storefront
                  </button>
                  <span className="text-stone-700">|</span>
                  <button
                    onClick={async () => {
                      if (isSupabaseConfigured && supabase) {
                        await supabase.auth.signOut();
                      }
                      setAuthSession(null);
                      alert("Successfully detached session clearings.");
                    }}
                    className="text-[#C9A66B] hover:text-red-300 font-bold"
                  >
                    Logout Operator
                  </button>
                </div>
              </div>

              <AdminPanel 
                products={products}
                onAddProduct={handleAddProduct}
                onEditProduct={handleEditProduct}
                onDeleteProduct={handleDeleteProduct}
                settings={settings}
                onUpdateSettings={syncSettings}
                onRestoreDb={handleRestoreDb}
                onResetDb={handleResetDb}
                syncState={syncState}
                isCloudLoading={isCloudLoading}
              />
            </div>
          )
        )}

      </main>

      {/* 3. Product Details Modal display */}
      {selectedProduct && (
        <ProductDetailModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          whatsappContact={settings.whatsappContact}
        />
      )}

      {/* 4. Persistent Floating WhatsApp Chat Widget (Logistics & Customer Support requirements) */}
      {activeTab !== 'admin' && (
        <a
          href={`https://wa.me/${settings.whatsappContact.replace(/\D/g, '')}?text=${encodeURIComponent("Hello Glitter Glam Boutique! I am inquiring about your premium artificial and 1-Gram gold jewelry collections. Can you guide me for a custom order?")}`}
          target="_blank"
          rel="noreferrer"
          className="fixed bottom-6 right-6 z-40 bg-[#25D366] hover:bg-[#128C7E] text-white p-3.5 rounded-full shadow-2xl transition-all hover:scale-110 flex items-center justify-center group"
          title={`Chat on WhatsApp ${settings.whatsappContact}`}
        >
          {/* Pulsing indicator block */}
          <span className="absolute inset-0 bg-[#25D366]/40 rounded-full animate-ping z-0" />
          <span className="relative z-10 flex items-center gap-1.5 text-xs font-bold font-serif uppercase tracking-wider">
            <MessageSquare className="w-5 h-5 fill-current" />
            <span className="max-w-0 overflow-hidden group-hover:max-w-[140px] transition-all duration-300">WhatsApp Help</span>
          </span>
        </a>
      )}

      {/* 6. Footer coordinates cards */}
      {activeTab !== 'admin' && settings.announcementText && (
        <Footer 
          settings={settings}
          activeTab={activeTab}
          setActiveTab={(tab) => {
            setActiveTab(tab);
          }}
        />
      )}

    </div>
  );
}
