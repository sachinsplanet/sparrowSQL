import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { usePrefersReducedMotion } from "../hooks/usePrefersReducedMotion";
import { BADGES } from "../lib/badges";
import { useProgress } from "../hooks/useProgress";

/** Modal that shows every badge and whether the learner has earned it yet. */
export function AchievementsPanel({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const reduce = usePrefersReducedMotion();
  const { progress, stats, actions } = useProgress();

  // Erasing a whole journey must never be a one-click accident, so the reset
  // button has to be armed before it can actually fire.
  const [confirming, setConfirming] = useState(false);

  // Closing the panel disarms a pending restart, and Escape backs out of the
  // confirmation first before dismissing the modal itself.
  useEffect(() => {
    if (!open) setConfirming(false);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (confirming) {
        setConfirming(false);
        return;
      }
      onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, confirming, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={reduce ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[75] grid place-items-center bg-black/65 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label="Achievements"
          onClick={onClose}
        >
          <motion.div
            initial={reduce ? false : { scale: 0.95, y: 14 }}
            animate={{ scale: 1, y: 0 }}
            exit={reduce ? { opacity: 0 } : { scale: 0.96, y: 10 }}
            transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 320, damping: 26 }}
            className="w-full max-w-2xl overflow-hidden rounded-[20px] border border-line bg-surface shadow-[var(--glow)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 border-b border-line px-6 py-4">
              <span className="text-xl" aria-hidden="true">
                🏆
              </span>
              <div>
                <h2 className="font-display text-lg font-semibold text-ink">Achievements</h2>
                <p className="font-mono text-[11.5px] text-faint">
                  {stats.badgesEarned} of {BADGES.length} earned · {progress.xp} XP · {progress.streak.current}🔥 (best {progress.streak.longest})
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close achievements"
                className="ml-auto rounded-full p-1.5 text-faint transition-colors hover:bg-surface-2 hover:text-ink"
              >
                <CloseIcon />
              </button>
            </div>

            <div className="grid max-h-[60vh] grid-cols-1 gap-3 overflow-y-auto p-6 sm:grid-cols-2">
              {BADGES.map((b) => {
                const earnedAt = progress.badges[b.id];
                return (
                  <div
                    key={b.id}
                    className={`flex items-start gap-3 rounded-[14px] border p-3.5 transition-colors ${
                      earnedAt
                        ? "border-[color:var(--accent)]/40 bg-accent-soft"
                        : "border-line bg-surface-2/40 opacity-70"
                    }`}
                  >
                    <span
                      className={`grid h-11 w-11 shrink-0 place-items-center rounded-full text-2xl ${
                        earnedAt ? "bg-surface" : "bg-surface-2 grayscale"
                      }`}
                      aria-hidden="true"
                    >
                      {earnedAt ? b.icon : "🔒"}
                    </span>
                    <div className="min-w-0">
                      <p className="font-display text-[15px] font-semibold text-ink">
                        {b.name}
                      </p>
                      <p className="mt-0.5 text-[12.5px] leading-relaxed text-muted">
                        {b.description}
                      </p>
                      {earnedAt && (
                        <p className="mt-1 font-mono text-[10.5px] text-success">
                          earned {new Date(earnedAt).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-6 py-4">
              {confirming ? (
                <div
                  role="alert"
                  className="flex w-full flex-wrap items-center justify-between gap-3"
                >
                  <p className="text-[12.5px] text-danger">
                    This erases XP, cards, solved exercises, badges and your
                    streak in this browser. There is no undo.
                  </p>
                  <span className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setConfirming(false)}
                      className="rounded-full border border-line px-4 py-2 text-[13px] font-semibold text-muted transition-colors hover:text-ink"
                    >
                      Keep my progress
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        actions.resetAll();
                        onClose();
                      }}
                      className="rounded-full bg-danger px-4 py-2 text-[13px] font-semibold text-white transition-transform hover:-translate-y-[1px] active:scale-[0.98]"
                    >
                      Yes, restart everything
                    </button>
                  </span>
                </div>
              ) : (
                <>
                  <p className="text-[12.5px] text-faint">
                    Progress lives in this browser — no account needed yet.
                  </p>
                  <button
                    type="button"
                    onClick={() => setConfirming(true)}
                    className="rounded-full border border-line px-4 py-2 text-[13px] font-semibold text-muted transition-colors hover:border-[color:var(--danger)] hover:text-ink"
                  >
                    Restart the journey
                  </button>
                </>
              )}
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
