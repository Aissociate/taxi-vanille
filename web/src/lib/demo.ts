'use client';
import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'taxivanille_demo_mode';
const EVENT_NAME  = 'taxivanille:demo_changed';

/** Lit le mode en localStorage (SSR-safe). Par défaut : demo = true. */
function readDemo(): boolean {
  if (typeof window === 'undefined') return true;
  return localStorage.getItem(STORAGE_KEY) !== 'false';
}

/**
 * Hook partagé par tous les composants.
 * Le toggle émet un CustomEvent pour que toutes les instances
 * (sidebar + pages) se synchronisent sans context global.
 */
export function useDemoMode() {
  const [demo, setDemo] = useState<boolean>(true);

  // Hydrate côté client
  useEffect(() => {
    setDemo(readDemo());
    const onEvent = (e: Event) => setDemo((e as CustomEvent<boolean>).detail);
    window.addEventListener(EVENT_NAME, onEvent);
    return () => window.removeEventListener(EVENT_NAME, onEvent);
  }, []);

  const toggle = useCallback(() => {
    const next = !readDemo();
    localStorage.setItem(STORAGE_KEY, String(next));
    window.dispatchEvent(new CustomEvent<boolean>(EVENT_NAME, { detail: next }));
  }, []);

  return { demo, toggle };
}
