// Local static slideshow assets that ship with the build. These are always
// available on every deploy (no Supabase storage required), so the Hero
// section never goes blank — even on a brand-new deployment with no
// cloud-uploaded images yet.
import heroJewelleryBanner from './images/hero_jewellery_banner_1781689221440.jpg';
import categoryNecklaces from './images/category_necklaces_1781689241269.jpg';
import categoryEarrings from './images/category_earrings_1781689256134.jpg';
import categoryRings from './images/category_rings_1781689269249.jpg';
import categoryBangles from './images/category_bangles_1781689284371.jpg';
import categoryBracelets from './images/category_bracelets_1781689309708.jpg';

export const LOCAL_HERO_GALLERY: string[] = [
  heroJewelleryBanner,
  categoryNecklaces,
  categoryEarrings,
  categoryRings,
  categoryBangles,
  categoryBracelets
];
