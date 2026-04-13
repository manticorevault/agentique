import { useEffect, useRef } from "react";

/**
 * Attaches a staggered fade-in-up reveal to the direct children of a list container.
 * Children get the .fade-in-up class automatically; .visible is added when each
 * enters the viewport (IntersectionObserver, threshold 0.15).
 *
 * Respects prefers-reduced-motion — the CSS handles the no-op case.
 */
export function useFadeInList<T extends HTMLElement = HTMLUListElement>(
  staggerMs = 60,
) {
  const ref = useRef<T>(null);

  useEffect(() => {
    const container = ref.current;
    if (!container) return;

    const items = Array.from(container.children) as HTMLElement[];
    const observers: IntersectionObserver[] = [];

    items.forEach((item, i) => {
      item.classList.add("fade-in-up");
      item.style.transitionDelay = `${i * staggerMs}ms`;

      const obs = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            item.classList.add("visible");
            obs.unobserve(item);
          }
        },
        { threshold: 0.15 },
      );

      obs.observe(item);
      observers.push(obs);
    });

    return () => {
      observers.forEach((o) => o.disconnect());
    };
  }, [staggerMs]);

  return ref;
}
