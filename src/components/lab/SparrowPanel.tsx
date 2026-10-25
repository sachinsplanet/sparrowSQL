import { useState } from "react";
import { SparrowMascot } from "../SparrowMascot";
import { sqlDefinitions } from "../../lib/definitions";
import type { SparrowFeedback } from "../../lib/types";

const GLOSSARY = [
  "SELECT",
  "WHERE",
  "INSERT",
  "UPDATE",
  "DELETE",
  "ORDER BY",
  "GROUP BY",
  "LIMIT",
  "JOIN",
  "COUNT",
  // The MySQL-layer commands the sandbox answers itself, so a learner who
  // copies `USE db;` out of a tutorial can ask what it did.
  "USE",
  "DATABASE",
  "SHOW DATABASES",
  "SHOW TABLES",
  "DESCRIBE",
  "PRIMARY KEY",
  "FOREIGN KEY",
  "HAVING",
  "LIKE",
  "UNION",
  "ALTER TABLE",
  "TRUNCATE",
  "VIEW",
  "TRANSACTION",
];

const toneRing: Record<SparrowFeedback["tone"], string> = {
  neutral: "border-line",
  success: "border-[color:var(--success)]/40",
  warning: "border-[color:var(--warning)]/40",
  danger: "border-[color:var(--danger)]/40",
};

export function SparrowPanel({
  feedback,
  busy,
  hints,
  hintsRevealed,
  onRevealHint,
  solved,
}: {
  feedback: SparrowFeedback;
  busy: boolean;
  hints: string[];
  hintsRevealed: number;
  onRevealHint: () => void;
  solved: boolean;
}) {
  const [term, setTerm] = useState<string | null>(null);
  const state = busy ? "thinking" : feedback.state;

  return (
    <div className="flex h-full flex-col gap-4">
      <div className="flex items-start gap-3">
        <div className="shrink-0">
          <SparrowMascot state={state} size={78} />
        </div>
        {/* The tutor's replies are the point of the whole lab, so screen
            readers must announce title and body without the learner asking. */}
        <div
          className={`relative flex-1 rounded-[14px] rounded-tl-sm border bg-surface/60 px-4 py-3 ${toneRing[feedback.tone]}`}
          aria-live="polite"
          aria-atomic="true"
        >
          <p className="font-display text-[15px] font-semibold text-ink">
            {busy ? "Running your query..." : feedback.title}
          </p>
          <p className="mt-1 whitespace-pre-line text-[13.5px] leading-relaxed text-muted">
            {busy
              ? "Sparrow is reading the result and checking it against the task."
              : feedback.message}
          </p>
        </div>
      </div>

      {/* progressive hints */}
      {hints.length > 0 && !solved && (
        <div className="rounded-[14px] border border-line bg-surface/40 p-3">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-faint">
              Hints {hintsRevealed}/{hints.length}
            </span>
            <button
              type="button"
              onClick={onRevealHint}
              disabled={hintsRevealed >= hints.length}
              className="rounded-full border border-line px-3 py-1 text-[12px] font-semibold text-accent transition-colors hover:bg-accent-soft disabled:cursor-not-allowed disabled:border-line disabled:text-faint"
            >
              {hintsRevealed >= hints.length ? "No more hints" : "Show hint"}
            </button>
          </div>
          <ul className="mt-2 space-y-1.5">
            {hints.slice(0, hintsRevealed).map((h, i) => (
              <li key={i} className="flex gap-2 text-[13px] leading-relaxed text-muted">
                <span className="mt-[1px] font-mono text-[11px] text-feather">{i + 1}</span>
                <span>{h}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* glossary / definitions */}
      <div className="mt-auto rounded-[14px] border border-line bg-surface/40 p-3">
        <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-faint">
          Tap a keyword
        </span>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {GLOSSARY.map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => setTerm(term === k ? null : k)}
              aria-expanded={term === k}
              aria-controls="sparrow-definition"
              className={`rounded-md border px-2 py-[3px] font-mono text-[11.5px] transition-colors ${
                term === k
                  ? "border-accent bg-accent-soft text-accent"
                  : "border-line text-muted hover:border-line-strong hover:text-ink"
              }`}
            >
              {k}
            </button>
          ))}
        </div>
        {term && sqlDefinitions[term] && (
          <div
            id="sparrow-definition"
            role="region"
            aria-label={`${term} definition`}
            className="mt-2.5 rounded-lg bg-[var(--bg-deep)] p-3"
          >
            <p className="font-mono text-[12px] font-semibold text-accent">{term}</p>
            <p className="mt-1 text-[13px] leading-relaxed text-muted">
              {sqlDefinitions[term].short}
            </p>
            <pre className="mt-2 overflow-x-auto font-mono text-[11.5px] text-feather">
              {sqlDefinitions[term].example}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
