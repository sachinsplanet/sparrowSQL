import { useEffect, useState } from "react";

const QUERY = "(prefers-reduced-motion: reduce)";

function read(): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return false;
  }
  return window.matchMedia(QUERY).matches;
}

/**
 * True when the visitor has asked their OS to limit non-essential motion.
 *
 * Unlike a `useMemo`-cached `matchMedia` read (and unlike motion's own
 * `useReducedMotion`, which only samples the setting when the component first
 * mounts), this subscribes to the media query: flipping the OS switch while the
 * page is open immediately stops the 3D loops and animations.
 */
export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState<boolean>(read);

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
      return;
    }
    const mq = window.matchMedia(QUERY);
    const onChange = () => setReduced(mq.matches);
    onChange(); // pick up anything that changed between render and effect
    if (typeof mq.addEventListener === "function") {
      mq.addEventListener("change", onChange);
      return () => mq.removeEventListener("change", onChange);
    }
    // Legacy Safari only exposes the deprecated listener pair.
    mq.addListener(onChange);
    return () => mq.removeListener(onChange);
  }, []);

  return reduced;
}
