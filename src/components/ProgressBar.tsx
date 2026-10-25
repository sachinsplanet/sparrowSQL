import { AnimatePresence, motion } from "motion/react";
import { usePrefersReducedMotion } from "../hooks/usePrefersReducedMotion";
import { useProgress } from "../hooks/useProgress";

/**
 * The persistent "learning journey" bar. It reads from the shared progress
 * store, so it re-renders in real time after every flashcard passed, exercise
 * solved, XP award, or streak change. Opens the achievements modal too.
 */
export function ProgressBar({
  onOpenAchievements,
}: {
  onOpenAchievements: () => void;
}) {
  const reduce = usePrefersReducedMotion();
  const { progress, stats } = useProgress();

  const totalSteps = stats.flashcardsTotal + stats.exercisesTotal;
  const stepsDone = stats.flashcardsDone + stats.exercisesDone;
  const pct = totalSteps > 0 ? Math.round((stepsDone / totalSteps) * 100) : 0;

  const stage =
    stepsDone === 0
      ? "Say hello to Sparrow"
      : !progress.playgroundUnlocked
        ? "Learning the basics"
        : stats.exercisesDone >= stats.exercisesTotal &&
            stats.flashcardsDone >= stats.flashcardsTotal
          ? "SQL graduate 🎓"
          : "Practising in the lab";

  return (
    <div className="relative z-30 border-y border-line bg-bg/80 backdrop-blur">
      <div className="mx-auto flex max-w-[1600px] flex-wrap items-center gap-x-4 gap-y-2 px-4 py-2.5 sm:px-8 lg:px-12">
        {/* journey track */}
        <div className="flex min-w-[180px] flex-1 items-center gap-3">
          <div
            className="relative h-2 flex-1 overflow-hidden rounded-full bg-surface-2"
            role="progressbar"
            aria-label="Learning journey"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={pct}
            aria-valuetext={`${pct}% — ${stepsDone} of ${totalSteps} steps done`}
          >
            <motion.div
              className="absolute inset-y-0 left-0 rounded-full bg-accent"
              initial={false}
              animate={{ width: `${pct}%` }}
              transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 120, damping: 20 }}
            />
          </div>
          <span className="font-mono text-[11px] text-faint">{pct}%</span>
        </div>

        <span className="hidden font-mono text-[11px] uppercase tracking-[0.14em] text-muted sm:inline">
          {stage}
        </span>

        {/* metric chips — they wrap instead of pushing the bar past a phone width */}
        <div className="flex max-w-full flex-wrap items-center gap-2">
          <Chip
            label="Cards"
            value={`${stats.flashcardsDone}/${stats.flashcardsTotal}`}
            tone="accent"
          />
          <Chip
            label="Solved"
            value={`${stats.exercisesDone}/${stats.exercisesTotal}`}
            tone="success"
          />
          <Chip label="XP" value={`${progress.xp}`} tone="feather" />
          <Chip
            label="Streak"
            value={`${progress.streak.current}🔥`}
            tone="warning"
          />
          <button
            type="button"
            onClick={onOpenAchievements}
            className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface/60 px-3 py-1 font-mono text-[11.5px] text-ink transition-colors hover:border-accent hover:text-accent"
            aria-label={`Open achievements. ${stats.badgesEarned} earned`}
          >
            🏆 {stats.badgesEarned}
          </button>
        </div>
      </div>

      {/* XP gain toast is handled by store-driven animation on the bar itself */}
      <AnimatePresence>
        {progress.playgroundUnlocked && pct === 100 && (
          <motion.div
            initial={reduce ? false : { opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            role="status"
            className="overflow-hidden bg-[color:var(--success)]/12 text-center font-mono text-[11.5px] text-success"
          >
            You completed the whole journey. Beautifully done. 🐦
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Chip({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "accent" | "success" | "feather" | "warning";
}) {
  const toneClass = {
    accent: "text-accent",
    success: "text-success",
    feather: "text-feather",
    warning: "text-warning",
  }[tone];
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface/60 px-2.5 py-1 font-mono text-[11.5px]">
      <span className="text-faint">{label}</span>
      <span className={`font-semibold ${toneClass}`}>{value}</span>
    </span>
  );
}
