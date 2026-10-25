import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { usePrefersReducedMotion } from "../hooks/usePrefersReducedMotion";
import { SparrowMascot } from "./SparrowMascot";
import { SectionHeading } from "./ui";
import type { SparrowState } from "../lib/types";

const STATES: { state: SparrowState; label: string; line: string }[] = [
  { state: "idle", label: "Idle", line: "Perched and waiting for your next query." },
  { state: "thinking", label: "Thinking", line: "Head tilted while your query runs." },
  { state: "happy", label: "Happy", line: "A clean query that returned data." },
  { state: "confused", label: "Confused", line: "A syntax error it wants to help you read." },
  { state: "warning", label: "Warning", line: "Alert before a query that touches every row." },
  { state: "celebrating", label: "Celebrating", line: "You matched the result. Wing flap, confetti." },
  { state: "encouraging", label: "Encouraging", line: "A gentle nudge when the editor is empty." },
];

export function TutorSection() {
  const [active, setActive] = useState<SparrowState>("happy");
  const reduce = usePrefersReducedMotion();
  const current = STATES.find((s) => s.state === active) ?? STATES[0];

  return (
    <section
      id="tutor"
      className="relative scroll-mt-[120px] overflow-hidden border-y border-line bg-surface/25 py-20 sm:py-28"
    >
      <div className="mx-auto grid max-w-[1600px] grid-cols-1 items-center gap-12 px-4 sm:px-8 lg:grid-cols-[1.05fr_1fr] lg:px-12">
        {/* copy + state list */}
        <div>
          <SectionHeading
            eyebrow="Meet Sparrow"
            title="A tutor with seven expressions, not a chatbot bolted on"
            lede="Sparrow reacts to what your query actually did. Each state maps to a real moment in the loop, so feedback always matches the situation."
          />

          <div className="mt-8 flex flex-wrap gap-2">
            {STATES.map((s) => (
              <button
                key={s.state}
                type="button"
                onClick={() => setActive(s.state)}
                aria-pressed={active === s.state}
                className={`rounded-full border px-3.5 py-1.5 text-[13px] font-medium transition-all ${
                  active === s.state
                    ? "border-accent bg-accent-soft text-accent"
                    : "border-line text-muted hover:border-line-strong hover:text-ink"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>

          <div className="mt-6 min-h-[52px]">
            <AnimatePresence mode="wait">
              <motion.p
                key={current.state}
                initial={reduce ? false : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduce ? undefined : { opacity: 0, y: -8 }}
                transition={{ duration: 0.3 }}
                className="max-w-[46ch] text-[15px] leading-relaxed text-ink"
              >
                <span className="font-display font-semibold text-accent">{current.label}. </span>
                {current.line}
              </motion.p>
            </AnimatePresence>
          </div>
        </div>

        {/* mascot stage */}
        <div className="relative mx-auto grid w-full max-w-[420px] place-items-center">
          <div
            className="absolute inset-0 -z-[1] rounded-full blur-2xl"
            style={{
              background:
                "radial-gradient(circle at 50% 55%, var(--accent-soft), transparent 62%)",
            }}
            aria-hidden="true"
          />
          <div className="relative grid place-items-center rounded-[28px] border border-line bg-[var(--bg-deep)]/50 p-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={active}
                initial={reduce ? false : { opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={reduce ? undefined : { opacity: 0, scale: 0.94 }}
                transition={{ type: "spring", stiffness: 260, damping: 22 }}
              >
                <SparrowMascot state={active} size={240} />
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}
