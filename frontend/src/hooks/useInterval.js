import { useEffect, useRef } from 'react';

/**
 * Re-fires `callback` every `delay` ms. Pass `delay = null` to pause.
 * Stores the callback in a ref so callers don't need to memoize it.
 */
export default function useInterval(callback, delay) {
  const savedCallback = useRef(callback);

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    if (delay === null || delay === undefined) return undefined;
    const id = setInterval(() => savedCallback.current?.(), delay);
    return () => clearInterval(id);
  }, [delay]);
}
