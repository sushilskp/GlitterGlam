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
  | "notFound"
  | "product";

export interface ProductPath {
  kind: "product";
  id: string;       // product id
  slug: string;     // product slug (used in the URL)
}

export type ParsedPath =
  | { kind: "tab"; tab: TabKey }
  | { kind: "product"; product: ProductPath }
  | { kind: "unknown" };

export const ROUTES: Record<TabKey, string> = {
  home: "/",
  shop: "/shop",
  visit: "/visit",
  faq: "/faq",
  about: "/about",
  admin: "/admin",
  notFound: "/404",
  product: "/product",
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
  if (PATH_TO_TAB[trimmed]) return PATH_TO_TAB[trimmed];
  if (trimmed === "/product" || trimmed.startsWith("/product/") || trimmed.startsWith("/p/")) {
    return "product";
  }
  return "notFound";
}

/**
 * Parses a URL path into either a tab route or a product route.
 *   /shop              -> tab "shop"
 *   /product/abc-123   -> product { id: "abc-123" }
 *   /p/abc-123-my-ring -> product { id: "abc-123" }
 */
export function parsePath(path: string, products?: { id: string; name: string }[]): ParsedPath {
  const clean = (path || "/").split("?")[0].split("#")[0];
  const trimmed = clean.length > 1 ? clean.replace(/\/+$/, "") : clean;

  if (trimmed.startsWith("/product/")) {
    const tail = trimmed.slice("/product/".length);
    return { kind: "product", product: decodeProductTail(tail, products) };
  }
  if (trimmed.startsWith("/p/")) {
    const tail = trimmed.slice("/p/".length);
    return { kind: "product", product: decodeProductTail(tail, products) };
  }

  if (PATH_TO_TAB[trimmed]) return { kind: "tab", tab: PATH_TO_TAB[trimmed] };
  return { kind: "unknown" };
}

function decodeProductTail(tail: string, products?: { id: string; name: string }[]): ProductPath {
  // Two supported formats:
  //   "<id>"                                 -> just the id
  //   "<id>-<slug>"                          -> id + slug for SEO
  // We try the full tail as an id first, then strip a slug suffix.
  if (products && products.length > 0) {
    const exact = products.find(p => p.id === tail);
    if (exact) return { id: exact.id, slug: slugify(exact.name) };
  }
  const dashIndex = tail.indexOf("-");
  if (dashIndex > 0) {
    const id = tail.slice(0, dashIndex);
    const slug = tail.slice(dashIndex + 1);
    return { id, slug };
  }
  return { id: tail, slug: "" };
}

/** Build a friendly product URL: /product/<id>-<slug> */
export function productPath(id: string, name: string): string {
  return `/product/${id}-${slugify(name)}`;
}

/** Lightweight slugifier — lowercases, strips diacritics, replaces non-alnum with `-`. */
export function slugify(input: string): string {
  return (input || "")
    .toString()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
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
