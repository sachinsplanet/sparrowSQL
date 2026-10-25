import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { usePrefersReducedMotion } from "../../hooks/usePrefersReducedMotion";
import type { Exercise } from "../../lib/types";
import { useProgress } from "../../hooks/useProgress";

/**
 * The "Solution" affordance for a guided exercise. Revealing it records
 * progress (a small XP nudge + the Curious Mind badge) and walks the learner
 * through the corrected query one clause at a time, explaining each part.
 */
export function SolutionPanel({
  exercise,
  onAdopt,
}: {
  exercise: Exercise;
  onAdopt: (sql: string) => void;
}) {
  const reduce = usePrefersReducedMotion();
  const { progress, actions } = useProgress();
  const revealed = !!progress.solutionsRevealed[exercise.id];
  const [shown, setShown] = useState(0);

  // Reset the step counter when the exercise changes.
  useEffect(() => {
    setShown(0);
  }, [exercise.id]);

  const steps = exercise.solutionSteps ?? [
    {
      code: exercise.solution,
      why: "Here is one way to write the whole query. Read it left to right, clause by clause.",
    },
  ];

  const reveal = () => {
    actions.revealSolution(exercise.id);
    setShown(1);
  };

  if (!revealed) {
    return (
      <button
        type="button"
        onClick={reveal}
        className="inline-flex items-center gap-2 rounded-full border border-[color:var(--warning)]/50 px-3.5 py-1.5 text-[12.5px] font-semibold text-warning transition-colors hover:bg-[color:var(--warning)]/10"
      >
        <BulbIcon /> Solution
      </button>
    );
  }

  return (
    <div className="rounded-[14px] border border-[color:var(--warning)]/40 bg-[color:var(--warning)]/8 p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-warning">
          Guided solution
        </p>
        <button
          type="button"
          onClick={() => onAdopt(exercise.solution)}
          className="rounded-full border border-line px-2.5 py-1 text-[11.5px] font-semibold text-muted transition-colors hover:text-ink"
        >
          Load into editor
        </button>
      </div>

      <ol className="mt-3 space-y-2">
        <AnimatePresence initial={false}>
          {steps.slice(0, shown).map((s, idx) => (
            <motion.li
              key={idx}
              initial={reduce ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: reduce ? 0 : 0.25 }}
              className="rounded-[10px] bg-[var(--bg-deep)] p-3"
            >
              <div className="flex items-baseline gap-2">
                <span className="font-mono text-[11px] text-feather">
                  {idx + 1}
                </span>
                <code className="font-mono text-[13px] text-accent">{s.code}</code>
              </div>
              <p className="mt-1 pl-5 text-[12.5px] leading-relaxed text-muted">
                {s.why}
              </p>
            </motion.li>
          ))}
        </AnimatePresence>
      </ol>

      {shown < steps.length ? (
        <button
          type="button"
          onClick={() => setShown((n) => Math.min(n + 1, steps.length))}
          className="mt-3 rounded-full bg-accent px-3.5 py-1.5 text-[12.5px] font-semibold text-[color:var(--accent-ink)] transition-transform hover:-translate-y-[1px] active:scale-[0.98]"
        >
          Show next step ({steps.length - shown})
        </button>
      ) : (
        <p className="mt-3 text-[12.5px] text-faint">
          That's the whole query. Try re-typing it yourself before you move on —
          that's where it sticks.
        </p>
      )}
    </div>
  );
}

function BulbIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M9 18h6M10 21h4M12 3a6 6 0 0 0-4 10c1 1 1 2 1 3h6c0-1 0-2 1-3a6 6 0 0 0-4-10Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
