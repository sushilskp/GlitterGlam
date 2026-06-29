// Tiny IntersectionObserver hook so any element can opt into scroll-reveal
// animations by adding the `reveal` className. Once an element becomes
// visible it gets `is-visible` and stays visible (un-observed for perf).
import { useEffect } from 'react';

export function useScrollReveal(deps: ReadonlyArray<unknown> = []) {
  useEffect(() => {
    const els = Array.from(document.querySelectorAll<HTMLElement>('.reveal:not(.is-visible)'));
    if (els.length === 0) return;

    if (typeof IntersectionObserver === 'undefined') {
      // Fallback for very old browsers — just show everything.
      els.forEach(el => el.classList.add('is-visible'));
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            io.unobserve(entry.target);
          }
        }
      },
      { rootMargin: '0px 0px -10% 0px', threshold: 0.08 },
    );
    els.forEach(el => io.observe(el));
    return () => io.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}