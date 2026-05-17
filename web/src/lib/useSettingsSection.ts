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
        const d = res.data;
        // L'API renvoie {} quand la section n'existe pas encore → garder les defaults
        const isEmpty = d !== null && d !== undefined && typeof d === 'object'
          && !Array.isArray(d) && Object.keys(d).length === 0;
        if (isEmpty || d === null || d === undefined) return;

        // Pour les tableaux : ne remplacer que par un tableau valide
        if (Array.isArray(defaults)) {
          if (Array.isArray(d)) setData(d as T);
          // sinon garder defaults (type mismatch côté API)
          return;
        }

        // Pour les objets plats : defaults < prev < API
        // Ainsi les nouveaux champs absents de la sauvegarde reçoivent toujours leur valeur par défaut
        if (typeof d === 'object' && !Array.isArray(d) &&
            typeof latestData.current === 'object' && !Array.isArray(latestData.current)) {
          setData(prev => ({
            ...(defaults as object),
            ...(prev as object),
            ...(d as object),
          } as T));
        } else {
          setData(d as T);
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
