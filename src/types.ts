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
  announcementText: string;
  heroHeadline: string;
  heroSubtitle: string;
  heroBannerImage?: string;
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

