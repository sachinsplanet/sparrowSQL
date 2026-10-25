import { SparrowMascot } from "./SparrowMascot";
import { OfflineIndicator, PWAInstallButton } from "./PWAInstallButton";
import type { Theme } from "../hooks/useTheme";

export function Nav({
  // Kept optional in props for compatibility
  theme: _theme,
  onToggleTheme: _onToggleTheme,
}: {
  theme?: Theme;
  onToggleTheme?: () => void;
  onOpenAchievements?: () => void;
}) {
  return (
    <header
      id="top"
      className="sticky top-0 z-50 border-b border-[#26231f] bg-[#0e0c0a]/95 backdrop-blur-md"
    >
      <nav
        aria-label="Primary navigation"
        className="mx-auto flex h-[64px] max-w-[1600px] items-center justify-between gap-2 px-4 sm:gap-4 sm:px-6 lg:px-8 xl:px-10"
      >
        <a
          href="#book"
          className="flex min-h-[44px] items-center gap-2.5 text-[#f3efe6] transition-opacity hover:opacity-90"
          aria-label="sparrowsql — jump to 3D Interactive Book"
        >
          <SparrowMascot state="idle" size={32} className="-mb-1" />
          <span className="font-display text-[22px] font-light tracking-[-0.02em] text-[#f3efe6]">
            sparrow<span className="italic">sql</span>
          </span>
        </a>

        <div className="flex items-center gap-2 sm:gap-2.5">
          <OfflineIndicator />
          <PWAInstallButton />

          <a
            href="#book"
            className="hidden h-[36px] items-center gap-1.5 rounded-full border border-[#312d28] bg-[#181613] px-3.5 font-sans text-[13px] font-medium text-[#d5cfc4] transition-colors hover:border-[#464039] hover:bg-[#221f1b] hover:text-white sm:inline-flex"
          >
            <span>3D Book</span>
          </a>

          <a
            href="#lab"
            className="inline-flex h-[36px] items-center gap-1.5 rounded-full bg-[#e65100] px-4 font-sans text-[13px] font-semibold text-white shadow-sm transition-colors hover:bg-[#f5600f]"
          >
            <span>Live Lab</span>
            <span aria-hidden="true">↓</span>
          </a>
        </div>
      </nav>
    </header>
  );
}

