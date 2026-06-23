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
