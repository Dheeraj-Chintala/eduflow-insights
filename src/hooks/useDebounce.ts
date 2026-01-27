import { useState, useEffect } from 'react';

/**
 * Custom hook that debounces a value
 * @param value - The value to debounce
 * @param delay - The delay in milliseconds
 * @returns The debounced value
 */
export function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Custom hook that throttles a value
 * @param value - The value to throttle
 * @param limit - The throttle limit in milliseconds
 * @returns The throttled value
 */
export function useThrottle<T>(value: T, limit: number = 300): T {
  const [throttledValue, setThrottledValue] = useState<T>(value);
  const [lastRan, setLastRan] = useState<number>(Date.now());

  useEffect(() => {
    const now = Date.now();
    if (now - lastRan >= limit) {
      setThrottledValue(value);
      setLastRan(now);
    } else {
      const timer = setTimeout(() => {
        setThrottledValue(value);
        setLastRan(Date.now());
      }, limit - (now - lastRan));

      return () => clearTimeout(timer);
    }
  }, [value, limit, lastRan]);

  return throttledValue;
}
