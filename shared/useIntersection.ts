import type { RefObject } from 'react';
import { useEffect, useState } from 'react';

type Options = {
  rootMargin?: string;
  threshold?: number;
};

export function useIntersection(
  ref: RefObject<Element | null>,
  { rootMargin = '0px', threshold = 0 }: Options = {},
): IntersectionObserverEntry | null {
  const [entry, setEntry] = useState<IntersectionObserverEntry | null>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element || typeof IntersectionObserver !== 'function') return;

    const observer = new IntersectionObserver((entries) => setEntry(entries[0] ?? null), { rootMargin, threshold });
    observer.observe(element);

    return () => {
      setEntry(null);
      observer.disconnect();
    };
  }, [ref, rootMargin, threshold]);

  return entry;
}
