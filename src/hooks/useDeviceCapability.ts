import { useCallback, useEffect, useState } from "react";
import { usePrefersReducedMotion } from "./usePrefersReducedMotion";

const LITE_STORAGE_KEY = "sparrowsql-lite-mode-v1";
const LITE_EVENT = "sparrowsql:lite-mode";

function detectWebGL(): boolean {
  if (typeof window === "undefined" || typeof document === "undefined") return false;
  try {
    const canvas = document.createElement("canvas");
    const gl =
      canvas.getContext("webgl2") ||
      canvas.getContext("webgl") ||
      canvas.getContext("experimental-webgl");
    return Boolean(gl);
  } catch {
    return false;
  }
}

function detectLowEndDevice(): boolean {
  if (typeof navigator === "undefined") return false;
  const nav = navigator as Navigator & {
    deviceMemory?: number;
    connection?: { saveData?: boolean; effectiveType?: string };
  };
  if (nav.connection?.saveData) return true;
  if (typeof nav.deviceMemory === "number" && nav.deviceMemory <= 2) return true;
  if (typeof nav.hardwareConcurrency === "number" && nav.hardwareConcurrency <= 2) {
    return true;
  }
  return false;
}

function readStoredLiteMode(): boolean | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(LITE_STORAGE_KEY);
    if (raw === "true") return true;
    if (raw === "false") return false;
    return null;
  } catch {
    return null;
  }
}

export interface DeviceCapability {
  /** Whether Lite Mode (no WebGL / heavy 3D motion) is active. */
  liteMode: boolean;
  /** Toggle Lite Mode and persist the learner's preference. */
  toggleLiteMode: () => void;
  /** Active visual depth tier: 1 (CSS elevation only), 2 (2.5D tilt), 3 (Full WebGL + 3D). */
  tier: 1 | 2 | 3;
  /** True when viewport is < 900px. */
  isMobile: boolean;
  /** True when WebGL is supported by the browser/GPU. */
  hasWebGL: boolean;
  /** Trigger a subtle haptic tap on supported mobile devices when motion is allowed. */
  haptic: (ms?: number) => void;
}

export function useDeviceCapability(): DeviceCapability {
  const reducedMotion = usePrefersReducedMotion();
  const [hasWebGL] = useState<boolean>(() => detectWebGL());
  const [isLowEnd] = useState<boolean>(() => detectLowEndDevice());
  const [userLite, setUserLite] = useState<boolean | null>(() => readStoredLiteMode());
  const [isMobile, setIsMobile] = useState<boolean>(() =>
    typeof window !== "undefined"
      ? window.matchMedia("(max-width: 899px)").matches
      : false,
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mql = window.matchMedia("(max-width: 899px)");
    const onChange = () => setIsMobile(mql.matches);
    onChange();
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const onSync = () => setUserLite(readStoredLiteMode());
    window.addEventListener(LITE_EVENT, onSync);
    window.addEventListener("storage", onSync);
    return () => {
      window.removeEventListener(LITE_EVENT, onSync);
      window.removeEventListener("storage", onSync);
    };
  }, []);

  const liteMode = userLite !== null ? userLite : reducedMotion || isLowEnd || !hasWebGL;

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.dataset.lite = liteMode ? "true" : "false";
    }
  }, [liteMode]);

  const toggleLiteMode = useCallback(() => {
    const next = !liteMode;
    setUserLite(next);
    try {
      window.localStorage.setItem(LITE_STORAGE_KEY, String(next));
    } catch {
      /* ignore quota / private mode */
    }
    window.dispatchEvent(new CustomEvent(LITE_EVENT));
  }, [liteMode]);

  const haptic = useCallback(
    (ms = 8) => {
      if (reducedMotion || liteMode) return;
      try {
        if (typeof navigator !== "undefined" && "vibrate" in navigator) {
          navigator.vibrate(ms);
        }
      } catch {
        /* ignore unsupported vibrate */
      }
    },
    [reducedMotion, liteMode],
  );

  const tier: 1 | 2 | 3 =
    liteMode || reducedMotion ? 1 : hasWebGL ? 3 : 2;

  return {
    liteMode,
    toggleLiteMode,
    tier,
    isMobile,
    hasWebGL,
    haptic,
  };
}
