"use client";

import { useEffect, useRef, useState, type RefObject } from "react";

interface UseInViewOnceOptions {
  threshold?: number;
  rootMargin?: string;
}

// Fires once when the target first scrolls into view, then disconnects —
// for one-time scroll-reveal animations that shouldn't re-trigger every
// time the user scrolls the element in and out of the viewport.
export function useInViewOnce<T extends HTMLElement>(
  options: UseInViewOnceOptions = {}
): [RefObject<T | null>, boolean] {
  const { threshold = 0.25, rootMargin = "0px" } = options;
  const ref = useRef<T | null>(null);
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    const node = ref.current;

    if (!node || isInView) {
      return;
    }

    if (typeof IntersectionObserver === "undefined") {
      const timeoutId = setTimeout(() => setIsInView(true), 0);
      return () => clearTimeout(timeoutId);
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(node);

    return () => observer.disconnect();
  }, [isInView, threshold, rootMargin]);

  return [ref, isInView];
}
