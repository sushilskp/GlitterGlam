// Lightweight URL <-> tab router. Maps friendly paths to the existing
// `activeTab` values used throughout the app so every section opens as its
// own shareable URL (and refreshes correctly).
//
// Valid routes:
//   /             -> home
//   /shop         -> shop (Collections)
//   /visit        -> visit (Visit Boutique)
//   /faq          -> faq (Care & FAQs)
//   /about        -> about (Our Story)
//   /admin        -> admin
//   /cart         -> home (cart opens as a drawer, not a page)
//   anything else -> notFound (handled by App.tsx)
//
// We deliberately avoid adding a full router library; the rest of the app
// is built around a single `activeTab` state and the Express/Vite server
// already serves `index.html` for every path.

export type TabKey =
  | "home"
  | "shop"
  | "visit"
  | "faq"
  | "about"
  | "admin"
  | "notFound";

export const ROUTES: Record<TabKey, string> = {
  home: "/",
  shop: "/shop",
  visit: "/visit",
  faq: "/faq",
  about: "/about",
  admin: "/admin",
  notFound: "/404",
};

const PATH_TO_TAB: Record<string, TabKey> = {
  "/": "home",
  "/shop": "shop",
  "/collections": "shop",
  "/visit": "visit",
  "/boutique": "visit",
  "/faq": "faq",
  "/care": "faq",
  "/about": "about",
  "/story": "about",
  "/admin": "admin",
};

export function pathToTab(path: string): TabKey {
  // Normalize: drop trailing slash, ignore query/hash
  const clean = (path || "/").split("?")[0].split("#")[0];
  const trimmed = clean.length > 1 ? clean.replace(/\/+$/, "") : clean;
  return PATH_TO_TAB[trimmed] ?? "notFound";
}

export function tabToPath(tab: string): string {
  switch (tab) {
    case "home":
      return "/";
    case "shop":
      return "/shop";
    case "visit":
      return "/visit";
    case "faq":
      return "/faq";
    case "about":
      return "/about";
    case "admin":
      return "/admin";
    default:
      return "/";
  }
}
