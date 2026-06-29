export interface Review {
  id: string;
  productSku: string; // or productId
  name: string;
  rating: number; // 1-5
  comment: string;
  location?: string;
  verified?: boolean; // admin-verified
  approved?: boolean; // admin-approved for public display
  createdAt: string;
}

export interface VideoReview {
  id: string;
  productSku: string;
  title: string;
  // YouTube, Instagram reel, or direct video URL
  url: string;
  // Optional cover/thumbnail override
  thumbnail?: string;
  createdAt: string;
}

export interface Product {
  id: string;
  name: string;
  price: number; // Regular/Original price (MRP)
  discountPrice: number; // Discounted/Selling price
  category: string; // Refers to the category name/slug
  type: 'Artificial' | '1 Gram Gold';
  images: string[];
  description: string;
  material: string;
  plating?: string;
  hallmark?: string;
  sizeOptions: string[];
  weight?: string;
  stock: number;
  sku: string;
  careGuide: string;
  customOrderEnabled: boolean;
  occasionTags?: string[];
  isFeatured?: boolean;
  // Marketing / display
  highlights?: string[]; // bullet points shown on detail page
  tags?: string[]; // search/filter tags
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  image: string;
}

export interface Offer {
  id: string;
  title: string;
  bannerImage: string;
  discount: string;
  startDate: string;
  endDate: string;
  status: 'Active' | 'Expired' | 'Draft';
}

export interface HomeSettings {
  id?: string;
  announcementText: string;
  heroHeadline: string;
  heroSubtitle: string;
  heroBannerImage?: string;
  heroGalleryImages?: string[];
  instagramHandle: string;
  facebookHandle?: string;
  whatsappContact: string; // The number for orders
  supportEmail: string;
  storeAddress: string;
  storeTiming: string;
  totalOrders?: number;
  totalIncome?: number;
  googleAnalyticsId?: string;
  storeName?: string;
  logoUrl?: string;
  aboutUsContent?: string;
  trustPartners?: { name: string; logoUrl: string; href?: string }[];
  reviews?: { id: string; name: string; rating: number; text: string; source?: string }[];
}

// ---------- E-commerce growth features (localStorage-backed) ----------

export interface Coupon {
  id: string;
  code: string;            // e.g. "GLAM10"
  description: string;
  discountType: 'percent' | 'flat';
  discountValue: number;   // 10 = 10% or ₹10
  minCartValue: number;    // minimum cart subtotal required
  active: boolean;
  expiresAt?: string;      // ISO date
  createdAt: string;
}

export interface Feedback {
  id: string;
  name: string;
  email?: string;
  rating: number;          // 1-5
  message: string;
  page?: string;           // which page they were on
  createdAt: string;
}

export interface GiftWrapOption {
  id: string;
  name: string;            // "Royal Velvet Box"
  description: string;
  price: number;           // added per order
  image?: string;          // optional cover image
  active: boolean;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt: string;
  // Optional product references returned by the assistant so the chat bubble
  // can render rich product cards inside the conversation.
  productRefs?: string[];  // product SKUs the assistant mentioned
}
