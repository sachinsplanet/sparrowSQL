import { useEffect, useState } from "react";

export interface VisualViewportState {
  /** Current visible height in px. */
  height: number;
  /** Estimated height of the soft keyboard in px (0 when closed). */
  keyboardHeight: number;
  /** True when the soft keyboard is likely open on a mobile/touch screen. */
  keyboardOpen: boolean;
}

/**
 * Tracks `window.visualViewport` so mobile toolbars and bottom sheets stay
 * above the iOS Safari / Android Chrome virtual keyboard.
 */
export function useVisualViewport(): VisualViewportState {
  const [state, setState] = useState<VisualViewportState>(() => ({
    height: typeof window !== "undefined" ? window.innerHeight : 800,
    keyboardHeight: 0,
    keyboardOpen: false,
  }));

  useEffect(() => {
    if (typeof window === "undefined") return;
    const vv = window.visualViewport;

    const update = () => {
      const layoutHeight = window.innerHeight;
      const visibleHeight = vv ? Math.round(vv.height) : layoutHeight;
      const diff = Math.max(0, layoutHeight - visibleHeight);
      const keyboardOpen = diff > 110;
      const keyboardHeight = keyboardOpen ? diff : 0;

      document.documentElement.style.setProperty("--vvh", `${visibleHeight}px`);
      document.documentElement.style.setProperty("--kb-inset", `${keyboardHeight}px`);

      setState((prev) =>
        prev.height === visibleHeight &&
        prev.keyboardHeight === keyboardHeight &&
        prev.keyboardOpen === keyboardOpen
          ? prev
          : { height: visibleHeight, keyboardHeight, keyboardOpen },
      );
    };

    update();
    if (vv) {
      vv.addEventListener("resize", update);
      vv.addEventListener("scroll", update);
    }
    window.addEventListener("resize", update);
    return () => {
      if (vv) {
        vv.removeEventListener("resize", update);
        vv.removeEventListener("scroll", update);
      }
      window.removeEventListener("resize", update);
    };
  }, []);

  return state;
}
