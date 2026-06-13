import { useEffect, useState } from 'react';

/**
 * Returns a debounced version of `value`. Useful for the search box so we
 * don't fire a request on every keystroke.
 */
export default function useDebouncedValue(value, delay = 500) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}
