import { useState, useEffect, useRef, RefObject } from 'react';

interface UseIntersectionObserverOptions {
  threshold?: number | number[];
  root?: Element | null;
  rootMargin?: string;
  freezeOnceVisible?: boolean;
}

export function useIntersectionObserver<T extends Element>({
  threshold = 0,
  root = null,
  rootMargin = '0px',
  freezeOnceVisible = false,
}: UseIntersectionObserverOptions = {}): [RefObject<T>, boolean] {
  const ref = useRef<T>(null);
  const [isIntersecting, setIsIntersecting] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    if (freezeOnceVisible && isIntersecting) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting);
      },
      { threshold, root, rootMargin }
    );

    observer.observe(element);

    return () => {
      observer.unobserve(element);
    };
  }, [threshold, root, rootMargin, freezeOnceVisible, isIntersecting]);

  return [ref, isIntersecting];
}

/**
 * Hook for lazy loading images
 */
export function useLazyLoad<T extends HTMLImageElement>(): [RefObject<T>, boolean] {
  return useIntersectionObserver<T>({
    threshold: 0.1,
    rootMargin: '100px',
    freezeOnceVisible: true,
  });
}
