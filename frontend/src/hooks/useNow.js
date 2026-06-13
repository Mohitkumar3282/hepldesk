import { useEffect, useState } from 'react';

/**
 * Returns the current Date, refreshed every `intervalMs` ms. Used for live
 * SLA countdowns / relative timestamps without re-fetching from the server.
 */
export default function useNow(intervalMs = 1000) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}
