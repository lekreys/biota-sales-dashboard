import { useEffect, useState } from 'react';

export function useHashTab<T extends string>(ids: readonly T[], fallback: T, enabled: boolean) {
  const [tab, setTab] = useState<T>(() => {
    const id = window.location.hash.slice(1) as T;
    return ids.includes(id) ? id : fallback;
  });

  useEffect(() => {
    if (enabled) history.replaceState(null, '', `#${tab}`);
  }, [tab, enabled]);

  return [tab, setTab] as const;
}
