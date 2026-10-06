import { useEffect, useState } from "react";
import { useApp } from "@/lib/store";

export function useHydrated() {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    const unsub = useApp.persist.onFinishHydration(() => setHydrated(true));
    if (useApp.persist.hasHydrated()) setHydrated(true);
    return unsub;
  }, []);
  return hydrated;
}
