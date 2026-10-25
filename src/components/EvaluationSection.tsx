import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { usePrefersReducedMotion } from "../hooks/usePrefersReducedMotion";
import { SectionHeading } from "./ui";

const K = ({ children }: { children: React.ReactNode }) => (
  <span className="text-accent">{children}</span>
);

function QueryA() {
  return (
    <pre className="font-mono text-[12.5px] leading-[1.75] text-ink">
      <K>SELECT</K> name{"\n"}
      <K>FROM</K> students{"\n"}
      <K>WHERE</K> marks &gt; 80;
    </pre>
  );
}
function QueryB() {
  return (
    <pre className="font-mono text-[12.5px] leading-[1.75] text-ink">
      <K>SELECT</K> students.name{"\n"}
      <K>FROM</K> students{"\n"}
      <K>WHERE</K> students.marks &gt; 80;
    </pre>
  );
}

export function EvaluationSection() {
  const [compareResult, setCompareResult] = useState(true);
  const reduce = usePrefersReducedMotion();

  return (
    <section id="evaluation" className="relative scroll-mt-[120px] py-20 sm:py-28">
      <div className="mx-auto max-w-[1600px] px-4 sm:px-8 lg:px-12">
        <SectionHeading
          eyebrow="Fair grading"
          title="Let the database judge the query"
          lede="Two learners can write different SQL and both be right. sparrowsql compares the result your query produces, never the exact characters you typed."
          align="center"
        />

        {/* `overflow-x-clip` keeps the two cards' slide-in offset (they start 20 px
            off-centre) from widening the page on a phone. */}
        <div className="mt-14 grid grid-cols-1 items-center gap-6 overflow-x-clip lg:grid-cols-[1fr_auto_1fr]">
          {/* Query A */}
          <motion.div
            initial={reduce ? false : { opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.55 }}
            className="rounded-[16px] border border-line bg-surface/60 p-5"
          >
            <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-faint">
              Learner A
            </span>
            <div className="mt-3">
              <QueryA />
            </div>
          </motion.div>

          {/* verdict switch */}
          <div className="flex flex-col items-center gap-3">
            <div className="inline-flex rounded-full border border-line bg-surface/60 p-1">
              <button
                type="button"
                onClick={() => setCompareResult(false)}
                className={`rounded-full px-3 py-1.5 text-[12px] font-semibold transition-colors ${
                  !compareResult ? "bg-danger text-white" : "text-muted hover:text-ink"
                }`}
              >
                SQL text
              </button>
              <button
                type="button"
                onClick={() => setCompareResult(true)}
                className={`rounded-full px-3 py-1.5 text-[12px] font-semibold transition-colors ${
                  compareResult ? "bg-accent text-[color:var(--accent-ink)]" : "text-muted hover:text-ink"
                }`}
              >
                Result set
              </button>
            </div>
            <AnimatePresence mode="wait">
              <motion.div
                key={compareResult ? "pass" : "fail"}
                initial={reduce ? false : { opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={reduce ? undefined : { opacity: 0, scale: 0.94 }}
                transition={{ type: "spring", stiffness: 300, damping: 24 }}
                className={`flex items-center gap-2 rounded-full border px-4 py-2 text-[13px] font-semibold ${
                  compareResult
                    ? "border-[color:var(--success)]/40 bg-[color:var(--success)]/10 text-success"
                    : "border-[color:var(--danger)]/40 bg-[color:var(--danger)]/10 text-danger"
                }`}
              >
                {compareResult ? <CheckIcon /> : <CrossIcon />}
                {compareResult ? "Both correct" : "False negative"}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Query B */}
          <motion.div
            initial={reduce ? false : { opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.55 }}
            className="rounded-[16px] border border-line bg-surface/60 p-5"
          >
            <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-faint">
              Learner B
            </span>
            <div className="mt-3">
              <QueryB />
            </div>
          </motion.div>
        </div>

        {/* shared result */}
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.55, delay: 0.1 }}
          className="mx-auto mt-8 max-w-md"
        >
          <div className="rounded-[16px] border border-line bg-[var(--bg-deep)]/60 p-5">
            <p className="text-center font-mono text-[11px] uppercase tracking-[0.16em] text-faint">
              Same result set
            </p>
            <table className="mx-auto mt-3 border-collapse">
              <thead>
                <tr>
                  <th className="border-b border-line px-6 py-1.5 font-mono text-[12px] font-semibold uppercase text-accent">
                    name
                  </th>
                </tr>
              </thead>
              <tbody>
                {["Anjali", "Priya"].map((n) => (
                  <tr key={n}>
                    <td className="border-b border-line/60 px-6 py-1.5 text-center font-mono text-[13px] text-ink">
                      {n}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="mt-4 text-center text-[13px] leading-relaxed text-muted">
              {compareResult
                ? "Grading the output accepts every valid way to write the query."
                : "Matching raw text would wrongly reject a correct answer. We never do that."}
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function CheckIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function CrossIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  );
}
