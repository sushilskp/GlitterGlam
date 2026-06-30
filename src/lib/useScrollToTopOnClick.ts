// Global click-to-top hook
// ============================================================================
// Listens for clicks bubbling up from anywhere inside a target root element
// and smoothly scrolls the window to the top in response. This satisfies
// the "every button click on every page should bring me to the top of the
// page" requirement across buttons that don't change the active tab
// (ProductCard, FAQ accordion, Policies sub-tabs, hero gallery arrows,
// offer-banner close, etc.).
//
// Use:
//   useScrollToTopOnClick(mainRef);         // any click inside <main>
//   useScrollToTopOnClick(sectionRef);      // any click inside a section
// ============================================================================

import { RefObject, useEffect } from "react";

export function useScrollToTopOnClick<T extends HTMLElement>(
  ref: RefObject<T>,
  enabled: boolean = true
) {
  useEffect(() => {
    if (!enabled) return;
    const root = ref.current;
    if (!root || typeof window === "undefined") return;

    const handleClick = (e: MouseEvent) => {
      // Only react to primary-button clicks inside the watched root.
      if (e.button !== 0) return;
      // Bail on modifier-key clicks (open-in-new-tab, etc.) so we don't
      // hijack the user's intent.
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      // Bail on right-click and non-left clicks already handled above.
      // (We also bail if the click target is inside an <a> with a download
      // attribute or a contenteditable; the user is editing text, they
      // don't want the page yanked to top.)
      const target = e.target as HTMLElement | null;
      if (!target) return;
      if (target.closest("a[download], [contenteditable='true'], input, textarea, select")) return;

      window.scrollTo({ top: 0, behavior: "smooth" });
    };

    root.addEventListener("click", handleClick);
    return () => root.removeEventListener("click", handleClick);
  }, [ref, enabled]);
}
