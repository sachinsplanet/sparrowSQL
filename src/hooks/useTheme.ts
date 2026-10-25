import { useCallback, useEffect, useState } from "react";

export type Theme = "dark" | "light";

function getInitialTheme(): Theme {
  if (typeof window === "undefined") return "light";
  // Safari private mode and blocked-storage settings make localStorage throw.
  let stored: string | null = null;
  try {
    stored = window.localStorage.getItem("sparrowsql-theme-editorial");
  } catch {
    stored = null;
  }
  if (stored === "light" || stored === "dark") return stored;
  // Default to the Quiet Editorial light canvas (#f5f5f5).
  return "light";
}

export function useTheme() {
  const [theme] = useState<Theme>("dark");

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", "dark");
    try {
      window.localStorage.setItem("sparrowsql-theme-editorial", "dark");
    } catch {
      /* ignore storage errors in private mode */
    }
  }, []);

  const toggle = useCallback(() => {
    document.documentElement.setAttribute("data-theme", "dark");
  }, []);

  return { theme, toggle };
}

/** Reads the live CSS variable values so the 3D scene matches the theme. */
export function useThemeColors(theme: Theme) {
  const [colors, setColors] = useState(() => readColors());
  useEffect(() => {
    // Give the DOM a frame to apply the new data-theme before reading vars.
    const id = requestAnimationFrame(() => setColors(readColors()));
    return () => cancelAnimationFrame(id);
  }, [theme]);
  return colors;
}

function readColors() {
  const cs = getComputedStyle(document.documentElement);
  const get = (name: string, fallback: string) =>
    cs.getPropertyValue(name).trim() || fallback;
  return {
    accent: get("--accent", "#292524"),
    feather: get("--feather", "#777169"),
    ink: get("--ink", "#0c0a09"),
    bg: get("--bg", "#f5f5f5"),
    surface: get("--surface", "#ffffff"),
    muted: get("--muted", "#4e4e4e"),
    success: get("--success", "#16a34a"),
  };
}
