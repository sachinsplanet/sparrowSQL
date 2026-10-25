import { useEffect } from "react";
import { Nav } from "./components/Nav";
import { InteractiveBook } from "./components/book/InteractiveBook";
import { LiveLab } from "./components/LiveLab";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { useTheme } from "./hooks/useTheme";
import { useProgress } from "./hooks/useProgress";
import { useVisualViewport } from "./hooks/useVisualViewport";

export function App() {
  const { theme, toggle } = useTheme();
  const { actions } = useProgress();
  useVisualViewport();

  // Roll the daily streak once per visit (idempotent within the same day).
  useEffect(() => {
    actions.touchVisit();
  }, [actions]);

  return (
    <ErrorBoundary>
      <div className="relative min-h-[100dvh] bg-[#0e0c0a] text-[#f3efe6]">
        <a
          href="#book"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[120] focus:rounded-full focus:bg-[#e65100] focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white"
        >
          Skip to 3D Interactive Book
        </a>
        <a
          href="#lab"
          className="sr-only focus:not-sr-only focus:fixed focus:left-64 focus:top-4 focus:z-[120] focus:rounded-full focus:bg-[#e65100] focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white"
        >
          Skip to Live SQL Lab
        </a>

        {/* 1. Header */}
        <Nav theme={theme} onToggleTheme={toggle} />

        <main className="relative z-[1]">
          {/* 2. 3D Flip Book */}
          <InteractiveBook />

          {/* 3. Live Lab */}
          <LiveLab />
        </main>
      </div>
    </ErrorBoundary>
  );
}

