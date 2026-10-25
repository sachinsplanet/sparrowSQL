import { motion } from "motion/react";
import { usePrefersReducedMotion } from "../hooks/usePrefersReducedMotion";
import { SectionHeading } from "./ui";

const STEPS = [
  { verb: "Learn", note: "A one-line definition, not a chapter of theory." },
  { verb: "Write", note: "Type a real query in the editor." },
  { verb: "Run", note: "Execute it against a live database." },
  { verb: "Mistake", note: "Get it wrong safely. Mistakes are the lesson." },
  { verb: "Understand", note: "Sparrow explains what actually happened." },
  { verb: "Fix", note: "Edit the query with a new idea." },
  { verb: "Master", note: "The result matches. Loop back, level up." },
];

export function LoopSection() {
  const reduce = usePrefersReducedMotion();

  return (
    <section id="loop" className="relative scroll-mt-[120px] border-y border-line bg-surface/25 py-20 sm:py-28">
      <div className="mx-auto max-w-[1600px] px-4 sm:px-8 lg:px-12">
        <SectionHeading
          eyebrow="The Loop"
          title="Mistakes are part of the method"
          lede="Every lesson runs the same seven-step loop. You are not reading about SQL, you are repeatedly doing it until it clicks."
        />

        <div className="mt-14">
          <ol className="grid grid-cols-1 gap-y-3 sm:grid-cols-2 lg:grid-cols-7 lg:gap-x-0">
            {STEPS.map((s, i) => (
              <motion.li
                key={s.verb}
                initial={reduce ? false : { opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.5 }}
                transition={{ duration: 0.5, delay: reduce ? 0 : i * 0.07, ease: [0.16, 1, 0.3, 1] }}
                className="group relative flex items-start gap-3 lg:flex-col lg:items-center lg:px-1 lg:text-center"
              >
                {/* connector (desktop) */}
                {i < STEPS.length - 1 && (
                  <span
                    className="absolute left-[calc(50%+26px)] top-[19px] hidden h-px w-[calc(100%-52px)] bg-gradient-to-r from-line-strong to-line lg:block"
                    aria-hidden="true"
                  />
                )}
                <span className="relative z-[1] grid h-[38px] w-[38px] shrink-0 place-items-center rounded-full border border-line bg-[var(--bg)] font-mono text-[13px] font-semibold text-accent transition-colors group-hover:border-accent lg:mx-auto">
                  {i + 1}
                </span>
                <span className="lg:mt-3">
                  <span className="block font-display text-[17px] font-semibold text-ink">
                    {s.verb}
                  </span>
                  <span className="mt-1 block max-w-[24ch] text-[12.5px] leading-relaxed text-muted lg:mx-auto">
                    {s.note}
                  </span>
                </span>
              </motion.li>
            ))}
          </ol>

          {/* loop-back cue */}
          <div className="mt-10 flex items-center justify-center gap-2 text-faint">
            <svg width="220" height="34" viewBox="0 0 220 34" fill="none" aria-hidden="true" className="text-accent/50">
              <motion.path
                d="M210 4 C 210 26, 10 26, 10 8"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                fill="none"
                initial={reduce ? false : { pathLength: 0 }}
                whileInView={{ pathLength: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 1.4, delay: 0.3, ease: "easeInOut" }}
              />
              <path d="M10 8 l-4 6 l8 0 z" fill="currentColor" />
            </svg>
            <span className="font-mono text-[12px] uppercase tracking-[0.18em] text-faint">
              repeat
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
