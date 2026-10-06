import { useEffect } from "react";

/**
 * Registers the offline service worker (production builds only) and asks it to
 * cache every lesson, chapter and game page so the whole app works offline.
 */
export function RegisterServiceWorker() {
  useEffect(() => {
    if (!import.meta.env.PROD || !("serviceWorker" in navigator)) return;
    let cancelled = false;
    (async () => {
      try {
        await navigator.serviceWorker.register("/sw.js");
        const reg = await navigator.serviceWorker.ready;
        const { TRACKS } = await import("@/lib/curriculum");
        const urls: string[] = [];
        for (const t of TRACKS) {
          urls.push(`/learn/${t.id}`);
          for (const c of t.chapters) {
            urls.push(`/clash/${t.id}/${c.id}`);
            for (const l of c.lessons) urls.push(`/lesson/${t.id}/${c.id}/${l.id}`);
          }
        }
        if (!cancelled) reg.active?.postMessage({ type: "precache", urls });
      } catch {
        // Offline support is a bonus; the app works normally without it.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);
  return null;
}
