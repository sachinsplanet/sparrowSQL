import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { usePrefersReducedMotion } from "../hooks/usePrefersReducedMotion";
import { SparrowMascot } from "./SparrowMascot";
import type { SparrowState } from "../lib/types";

interface Slide {
  icon: string;
  title: string;
  body: string;
  sparrow: SparrowState;
}

const SLIDES: Slide[] = [
  {
    icon: "🐦",
    title: "Welcome to sparrowsql",
    body: "You learn SQL the way you learn to swim — in the water. This is a real SQLite database running right in your browser.",
    sparrow: "idle",
  },
  {
    icon: "🃏",
    title: "Start with flashcards",
    body: "Short, friendly cards teach the basics: SELECT, WHERE, JOIN and more. Answer a quick quiz to move ahead.",
    sparrow: "encouraging",
  },
  {
    icon: "🧪",
    title: "Then play in the sandbox",
    body: "Finish the deck and the Live Lab unlocks. Write queries against real tables and watch what happens.",
    sparrow: "happy",
  },
  {
    icon: "💡",
    title: "Sparrow coaches you",
    body: "Stuck? Sparrow explains mistakes in plain language, offers hints, and can walk you through a solution step by step.",
    sparrow: "thinking",
  },
];

export function Onboarding({
  open,
  onClose,
  onStart,
}: {
  open: boolean;
  onClose: () => void;
  onStart: () => void;
}) {
  const reduce = usePrefersReducedMotion();
  const [i, setI] = useState(0);
  const slide = SLIDES[i] ?? SLIDES[0];
  const last = i === SLIDES.length - 1;

  useEffect(() => {
    if (open) setI(0);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight" && !last) setI((n) => n + 1);
      if (e.key === "ArrowLeft" && i > 0) setI((n) => n - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, i, last, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={reduce ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[80] grid place-items-center bg-black/70 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label="Welcome to sparrowsql"
        >
          <motion.div
            initial={reduce ? false : { scale: 0.94, y: 16 }}
            animate={{ scale: 1, y: 0 }}
            exit={reduce ? { opacity: 0 } : { scale: 0.96, y: 10 }}
            transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 320, damping: 26 }}
            className="relative w-full max-w-lg overflow-hidden rounded-[22px] border border-line bg-surface p-6 shadow-[var(--glow)] sm:p-8"
          >
            <button
              type="button"
              onClick={onClose}
              aria-label="Skip onboarding"
              className="absolute right-4 top-4 rounded-full p-1.5 text-faint transition-colors hover:bg-surface-2 hover:text-ink"
            >
              <CloseIcon />
            </button>

            <div className="flex items-center gap-4">
              <div className="shrink-0">
                <SparrowMascot state={slide?.sparrow ?? "idle"} size={92} />
              </div>
              <div className="min-w-0">
                <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-accent">
                  Step {i + 1} of {SLIDES.length}
                </span>
                <h2 className="mt-1 font-display text-2xl font-semibold text-ink">
                  {slide?.title}
                </h2>
              </div>
            </div>

            <div className="mt-4 min-h-[4.5rem]">
              <AnimatePresence mode="wait">
                <motion.p
                  key={i}
                  initial={reduce ? false : { opacity: 0, x: 14 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={reduce ? { opacity: 0 } : { opacity: 0, x: -14 }}
                  transition={{ duration: reduce ? 0 : 0.28 }}
                  className="text-[15px] leading-relaxed text-muted"
                >
                  <span className="mr-2 align-middle text-xl">{slide?.icon}</span>
                  {slide?.body}
                </motion.p>
              </AnimatePresence>
            </div>

            {/* progress dots */}
            <div className="mt-5 flex items-center gap-1.5">
              {SLIDES.map((s, idx) => (
                <button
                  key={s.title}
                  type="button"
                  aria-label={`Go to step ${idx + 1}`}
                  onClick={() => setI(idx)}
                  className={`h-2 rounded-full transition-all ${
                    idx === i ? "w-6 bg-accent" : "w-2 bg-line-strong"
                  }`}
                />
              ))}
            </div>

            <div className="mt-6 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={onClose}
                className="text-[13px] font-medium text-faint transition-colors hover:text-ink"
              >
                Skip tour
              </button>
              <div className="flex gap-2">
                {i > 0 && (
                  <button
                    type="button"
                    onClick={() => setI((n) => n - 1)}
                    className="rounded-full border border-line px-4 py-2 text-sm font-semibold text-muted transition-colors hover:text-ink"
                  >
                    Back
                  </button>
                )}
                {last ? (
                  <button
                    type="button"
                    onClick={onStart}
                    className="rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-[color:var(--accent-ink)] shadow-[var(--shadow-accent)] transition-transform hover:-translate-y-[1px] active:scale-[0.98]"
                  >
                    Start learning
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setI((n) => Math.min(n + 1, SLIDES.length - 1))}
                    className="rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-[color:var(--accent-ink)] shadow-[var(--shadow-accent)] transition-transform hover:-translate-y-[1px] active:scale-[0.98]"
                  >
                    Next
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function CloseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
