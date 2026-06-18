import { Product, HomeSettings } from '../types';
import { supabase, isSupabaseConfigured } from './supabaseClient';

export interface SyncState {
  status: 'loading' | 'connected' | 'disconnected' | 'error';
  message: string;
}

type SyncCallback = (state: SyncState) => void;

let currentSyncState: SyncState = { status: 'disconnected', message: 'Not configured.' };
const listeners: SyncCallback[] = [];

export const subscribeToSyncStatus = (callback: SyncCallback) => {
  listeners.push(callback);
  callback(currentSyncState);
  return () => {
    const index = listeners.indexOf(callback);
    if (index > -1) listeners.splice(index, 1);
  };
};

const updateSyncState = (status: SyncState['status'], message: string) => {
  currentSyncState = { status, message };
  listeners.forEach(cb => cb(currentSyncState));
};

const DEFAULT_DB_SETTINGS: HomeSettings = {
  announcementText: "Welcome to Glitter Glam!",
  heroHeadline: "Breathtaking Artistry",
  heroSubtitle: "Discover our premium collections.",
  instagramHandle: "@glitterglam",
  whatsappContact: "+91 98769 76655",
  supportEmail: "support@glitterglam.com",
  storeAddress: "Store Location",
  storeTiming: "10 AM - 8 PM"
};

const GLOBAL_SETTINGS_ID = '00000000-0000-0000-0000-000000000000';

const mapDbProductToApp = (dbProd: any): Product => ({
  id: dbProd.id,
  name: dbProd.name,
  sku: dbProd.sku,
  price: Number(dbProd.price),
  discountPrice: Number(dbProd.discount_price || dbProd.price),
  category: dbProd.category_name || 'Necklaces',
  type: dbProd.type as 'Artificial' | '1 Gram Gold',
  images: dbProd.images || [],
  description: dbProd.description || '',
  material: dbProd.material || '',
  plating: dbProd.plating || '',
  hallmark: dbProd.hallmark || '',
  sizeOptions: dbProd.size_options || ['Free Size'],
  weight: dbProd.weight || '',
  stock: Number(dbProd.stock || 10),
  careGuide: dbProd.care_guide || '',
  customOrderEnabled: Boolean(dbProd.custom_order_enabled),
  occasionTags: dbProd.occasion_tags || [],
  isFeatured: Boolean(dbProd.is_featured)
});

const mapAppProductToDb = (product: Product) => ({
  id: product.id,
  name: product.name,
  sku: product.sku,
  price: product.price,
  discount_price: product.discountPrice,
  category_name: product.category,
  type: product.type,
  images: product.images,
  description: product.description,
  material: product.material,
  plating: product.plating,
  hallmark: product.hallmark,
  size_options: product.sizeOptions,
  weight: product.weight,
  stock: product.stock,
  care_guide: product.careGuide,
  custom_order_enabled: product.customOrderEnabled,
  occasion_tags: product.occasionTags || [],
  is_featured: product.isFeatured || false
});

const mapDbSettingsToApp = (dbSet: any): HomeSettings => ({
  announcementText: dbSet.announcement_text || '',
  heroHeadline: dbSet.hero_headline || '',
  heroSubtitle: dbSet.hero_subtitle || '',
  heroBannerImage: dbSet.hero_banner_image || '',
  instagramHandle: dbSet.instagram_handle || '',
  facebookHandle: dbSet.facebook_handle || '',
  whatsappContact: dbSet.whatsapp_contact || '',
  supportEmail: dbSet.support_email || '',
  storeAddress: dbSet.store_address || '',
  storeTiming: dbSet.store_timing || '',
  googleAnalyticsId: dbSet.google_analytics_id || '',
  storeName: dbSet.store_name || '',
  logoUrl: dbSet.logo_url || '',
  aboutUsContent: dbSet.about_us_content || ''
});

const mapAppSettingsToDb = (settings: HomeSettings) => ({
  id: GLOBAL_SETTINGS_ID,
  announcement_text: settings.announcementText,
  hero_headline: settings.heroHeadline,
  hero_subtitle: settings.heroSubtitle,
  hero_banner_image: settings.heroBannerImage || '',
  instagram_handle: settings.instagramHandle,
  facebook_handle: settings.facebookHandle || '',
  whatsapp_contact: settings.whatsappContact,
  support_email: settings.supportEmail,
  store_address: settings.storeAddress,
  store_timing: settings.storeTiming,
  google_analytics_id: settings.googleAnalyticsId || '',
  store_name: settings.storeName || '',
  logo_url: settings.logoUrl || '',
  about_us_content: settings.aboutUsContent || ''
});

export const cloudDb = {
  testAndLoad: async (): Promise<{ products?: Product[], settings?: HomeSettings } | null> => {
    if (!isSupabaseConfigured || !supabase) {
      updateSyncState('disconnected', 'Supabase not configured.');
      return { products: [], settings: DEFAULT_DB_SETTINGS };
    }

    try {
      updateSyncState('loading', 'Consulting cloud backend...');
      
      const { data: productsData, error: productsError } = await supabase.from('products').select('*').order('created_at', { ascending: false });
      if (productsError) {
        console.error("Products query failed:", productsError);
      }

      const { data: settingsData, error: settingsError } = await supabase.from('settings').select('*').limit(1).maybeSingle();
      if (settingsError) {
        console.error("Settings query failed:", settingsError);
      }

      let activeSettings = settingsData;

      // Automatically create settings record if empty
      if (!activeSettings && !settingsError) {
        const dbSettingsPayload = mapAppSettingsToDb(DEFAULT_DB_SETTINGS);
        const { error: insertError } = await supabase.from('settings').insert(dbSettingsPayload);
        if (insertError) {
          console.error("Settings auto-insert failed (missing columns expected; map subset):", insertError);
          // Retry with absolute bare minimum columns that exist in basic settings table migration
          const barePayload = {
            id: GLOBAL_SETTINGS_ID,
            announcement_text: DEFAULT_DB_SETTINGS.announcementText,
            hero_headline: DEFAULT_DB_SETTINGS.heroHeadline,
            hero_subtitle: DEFAULT_DB_SETTINGS.heroSubtitle,
            whatsapp_contact: DEFAULT_DB_SETTINGS.whatsappContact,
            store_address: DEFAULT_DB_SETTINGS.storeAddress,
            store_timing: DEFAULT_DB_SETTINGS.storeTiming,
            support_email: DEFAULT_DB_SETTINGS.supportEmail,
            instagram_handle: DEFAULT_DB_SETTINGS.instagramHandle
          };
          await supabase.from('settings').insert(barePayload);
        }
        activeSettings = dbSettingsPayload;
      }

      updateSyncState('connected', 'Live Store connected.');
      
      return {
        products: productsData && productsData.length > 0 ? productsData.map(mapDbProductToApp) : [],
        settings: activeSettings ? mapDbSettingsToApp(activeSettings) : DEFAULT_DB_SETTINGS
      };
    } catch (err) {
      console.error("Critical testAndLoad exception catches:", err);
      updateSyncState('error', 'Cloud sync failed.');
      return { products: [], settings: DEFAULT_DB_SETTINGS };
    }
  },

  upsertProduct: async (product: Product) => {
    if (!isSupabaseConfigured || !supabase) return;
    try {
      const dbProduct = mapAppProductToDb(product);
      const { error } = await supabase.from('products').upsert(dbProduct);
      if (error) {
        console.error("Product upsert error details:", error);
        // If is_featured column fails because it does not exist, retry without is_featured
        if (error.code === '42703' && error.message.includes('is_featured')) {
          console.warn("Retrying query without is_featured column mapping...");
          const { is_featured, ...bareProduct } = dbProduct as any;
          const { error: retryError } = await supabase.from('products').upsert(bareProduct);
          if (retryError) throw retryError;
        } else {
          throw error;
        }
      }
    } catch (err) {
      console.error("Product cloud upsert failed:", err);
    }
  },

  deleteProduct: async (productId: string) => {
    if (!isSupabaseConfigured || !supabase) return;
    try {
      const { error } = await supabase.from('products').delete().eq('id', productId);
      if (error) throw error;
    } catch (err) {
      console.error("Product cloud deletion failed:", err);
    }
  },

  updateSettings: async (settings: HomeSettings) => {
    if (!isSupabaseConfigured || !supabase) return;
    try {
      const dbSettings = mapAppSettingsToDb(settings);
      const { error } = await supabase.from('settings').upsert(dbSettings);
      if (error) {
        console.error("Settings upsert failed, retrying map subset:", error);
        // Try bare subset of columns from original migration
        const bareSettings = {
          id: GLOBAL_SETTINGS_ID,
          announcement_text: settings.announcementText,
          hero_headline: settings.heroHeadline,
          hero_subtitle: settings.heroSubtitle,
          whatsapp_contact: settings.whatsappContact,
          store_address: settings.storeAddress,
          store_timing: settings.storeTiming,
          support_email: settings.supportEmail,
          instagram_handle: settings.instagramHandle
        };
        const { error: retryError } = await supabase.from('settings').upsert(bareSettings);
        if (retryError) throw retryError;
      }
    } catch (err) {
      console.error("Settings cloud upsert failed:", err);
    }
  }
};
