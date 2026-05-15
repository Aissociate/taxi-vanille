import { useState, useEffect, useRef, Dispatch, SetStateAction } from 'react';
import { api } from './api';

export function useSettingsSection<T>(section: string, defaults: T): [T, Dispatch<SetStateAction<T>>] {
  const [data, setData] = useState<T>(defaults);
  const loaded = useRef(false);
  const latestData = useRef<T>(data);
  latestData.current = data;

  // Load from API on mount; flush save on unmount
  useEffect(() => {
    loaded.current = false;
    api.get(`/settings/${section}`)
      .then(res => {
        if (res.data !== null && res.data !== undefined) {
          // For plain objects (not arrays), merge with defaults so new fields added
          // after initial save don't become undefined.
          if (
            res.data && typeof res.data === 'object' && !Array.isArray(res.data) &&
            latestData.current && typeof latestData.current === 'object' && !Array.isArray(latestData.current)
          ) {
            setData(prev => ({ ...(prev as object), ...(res.data as object) } as T));
          } else {
            setData(res.data as T);
          }
        }
      })
      .catch(() => {})
      .finally(() => { loaded.current = true; });

    return () => {
      // Flush: if data was loaded, save immediately on unmount (covers key-prop remounts)
      if (loaded.current) {
        api.put(`/settings/${section}`, latestData.current).catch(() => {});
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [section]);

  // Debounced auto-save (800 ms) whenever data changes post-load
  useEffect(() => {
    if (!loaded.current) return;
    const timer = setTimeout(() => {
      api.put(`/settings/${section}`, latestData.current).catch(() => {});
    }, 800);
    return () => clearTimeout(timer);
  }, [data, section]);

  return [data, setData];
}
