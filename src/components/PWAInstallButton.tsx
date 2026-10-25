import { useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    setIsInstalled(isStandalone);

    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIOSDevice);

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const install = async () => {
    if (!deferredPrompt) return false;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setIsInstalled(true);
      setDeferredPrompt(null);
      return true;
    }
    return false;
  };

  return {
    isInstallable: !!deferredPrompt,
    isInstalled,
    isIOS,
    install,
  };
}

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== "undefined" ? navigator.onLine : true,
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return isOnline;
}

export function PWAInstallButton() {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  if (isInstalled) {
    return null;
  }

  if (isInstallable) {
    return (
      <button
        type="button"
        onClick={install}
        aria-label="Install SparrowSQL app"
        className="inline-flex h-[36px] items-center gap-1.5 rounded-full border border-[#312d28] bg-[#1b1815] px-3.5 text-[12px] font-medium text-[#e7e2d8] transition-colors hover:border-[#464039] hover:bg-[#24201c] hover:text-white"
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="7 10 12 15 17 10" />
          <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
        <span className="hidden sm:inline">Install App</span>
      </button>
    );
  }

  if (isIOS) {
    return (
      <>
        <button
          type="button"
          onClick={() => setShowIOSGuide(true)}
          aria-label="Install SparrowSQL on iOS"
          className="inline-flex h-[36px] items-center gap-1.5 rounded-full border border-[#312d28] bg-[#1b1815] px-3 text-[12px] font-medium text-[#e7e2d8] transition-colors hover:border-[#464039] hover:bg-[#24201c] hover:text-white"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          <span className="hidden sm:inline">Install</span>
        </button>

        {showIOSGuide && (
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="ios-install-title"
            className="fixed inset-0 z-[120] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
            onClick={() => setShowIOSGuide(false)}
          >
            <div
              className="w-full max-w-sm rounded-[18px] border border-[#2d2924] bg-[#181613] p-5 text-[#f3efe6] shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 id="ios-install-title" className="text-[16px] font-semibold text-[#f3efe6]">
                Install SparrowSQL on iPhone / iPad
              </h3>
              <p className="mt-2.5 text-[13px] leading-[1.6] text-[#b8b1a6]">
                1. Tap the <strong className="text-[#f3efe6]">Share</strong> button in Safari&apos;s toolbar.
                <br />
                2. Scroll down and tap <strong className="text-[#f3efe6]">Add to Home Screen</strong>.
              </p>
              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="mt-4 w-full rounded-[10px] border border-[#312d28] bg-[#221f1b] py-2 text-[13px] font-medium text-[#f3efe6] transition-colors hover:bg-[#2c2823]"
              >
                Got it
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
}

export function OfflineIndicator() {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="inline-flex h-[30px] items-center gap-1.5 rounded-full border border-[#a16207]/50 bg-[#422006]/70 px-2.5 text-[11px] font-medium text-[#fde047]"
      title="Running offline using cached local SQLite WebAssembly engine"
    >
      <span className="h-1.5 w-1.5 rounded-full bg-[#facc15] animate-pulse" />
      <span>Offline Ready</span>
    </div>
  );
}
