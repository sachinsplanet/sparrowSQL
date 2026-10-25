/**
 * An exercise the learner solves inside the page.
 *
 * The attempt is graded by the same `grade()` the test harness uses, against the real
 * engine, on the lesson's own starter database: a `SELECT` is marked on the rows it
 * returns and an `INSERT`/`UPDATE`/`DDL` task on the table state it leaves behind. The
 * text typed never matters — two different queries that produce the same rows are both
 * right.
 *
 * Answers are withheld deliberately. Hints come out one at a time and the worked
 * solution lives behind a button that says what it costs, so a learner who wants the
 * answer can still get it, but never sees it by accident.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { analyzeSQLError, explainSQLError, type WrongResultReason } from "../../lib/evaluator";
import { buildFeedback } from "../../lib/feedback";
import type { GradeOutcome } from "../../lib/curriculum/grade";
import type { Exercise } from "../../lib/curriculum/types";
import type { SparrowFeedback } from "../../lib/types";
import { bookStore } from "../../lib/bookStore";
import { DATASETS } from "../../lib/curriculum/datasets";
import { useBookState } from "../../hooks/useBookState";
import { ResultNotes, TableViewer } from "../lab/TableViewer";
import { SparrowMascot } from "../SparrowMascot";
import { Rich, SqlListing } from "./Rich";
import { useReading } from "./ReadingContext";
import { adoptInLab, copySql, reseedDataset, runBookExercise, writesData } from "./bookEngine";
import { useProgress } from "../../hooks/useProgress";

/** How the task will be judged, said out loud before the learner starts. */
function checkLabel(exercise: Exercise): string {
  switch (exercise.expected.type) {
    case "result-set":
      return exercise.expected.ordered
        ? "Checked on the rows and the order they come back in."
        : "Checked on the rows returned, in any order.";
    case "row-count":
      return `Checked on how many rows ${exercise.expected.tableName ?? "the table"} holds afterwards.`;
    case "table-exists":
      return `Checked on whether the table ${exercise.expected.tableName ?? "it names"} exists.`;
    default:
      return `Checked on what ${exercise.expected.tableName ?? "the table"} contains afterwards.`;
  }
}

export function ExerciseBlock({ exercise }: { exercise: Exercise }) {
  const { db, noteWrite, reading } = useReading();
  const state = useBookState();
  const { progress } = useProgress();
  const solved = Boolean(state.exercisesSolved[exercise.id]);
  /** The task's own database: an exercise may practise on another lesson's data. */
  const whereName = DATASETS[exercise.dataset].database;
  const [sql, setSql] = useState(() => state.drafts[exercise.id] ?? exercise.starter ?? "");
  const [outcome, setOutcome] = useState<GradeOutcome | null>(null);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState<null | boolean>(null);
  const [hintsShown, setHintsShown] = useState(state.hints[exercise.id] ?? 0);
  const saveTimer = useRef<number | null>(null);

  // A different exercise (a page turn) must not inherit the last one's verdict.
  useEffect(() => {
    setOutcome(null);
    setSql(state.drafts[exercise.id] ?? exercise.starter ?? "");
    setHintsShown(state.hints[exercise.id] ?? 0);
    // Only when the exercise itself changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exercise.id]);

  useEffect(() => {
    if (copied === null) return;
    const timer = window.setTimeout(() => setCopied(null), 1800);
    return () => window.clearTimeout(timer);
  }, [copied]);

  // Debounced, because a JSON-cloned store on every keystroke would be silly.
  const saveDraft = useCallback(
    (value: string) => {
      if (saveTimer.current) window.clearTimeout(saveTimer.current);
      saveTimer.current = window.setTimeout(() => {
        bookStore.saveDraft(exercise.id, value);
      }, 700);
    },
    [exercise.id],
  );

  useEffect(() => {
    return () => {
      if (saveTimer.current) window.clearTimeout(saveTimer.current);
    };
  }, []);

  const submit = async () => {
    if (!reading || busy || sql.trim() === "") return;
    setBusy(true);
    try {
      const verdict = await runBookExercise(exercise, sql);
      setOutcome(verdict);
      if (verdict.correct) {
        bookStore.solveExercise(exercise.id, exercise.xp);
        bookStore.saveDraft(exercise.id, sql);
        if (writesData(sql)) noteWrite(exercise.dataset);
      } else {
        saveDraft(sql);
      }
    } catch (err) {
      setOutcome({
        correct: false,
        reason: "failed",
        result: {
          success: false,
          kind: "rows",
          database: whereName,
          columns: [],
          rows: [],
          error: { message: err instanceof Error ? err.message : String(err) },
        },
      });
    } finally {
      setBusy(false);
    }
  };

  const feedback = useMemo<SparrowFeedback | null>(() => {
    if (!outcome || outcome.correct) return null;
    if (outcome.reason === "failed") {
      const message = outcome.result.error?.message ?? "The engine refused this.";
      return buildFeedback({
        kind: "error",
        category: outcome.result.errorCategory ?? analyzeSQLError(message),
        message,
        sql,
      });
    }
    if (outcome.reason === "no-table") {
      // The checker's own failure mode, not one of the tutor's mistake buckets.
      return {
        state: "thinking",
        title: "Nothing to read back",
        message: `The statement ran, but no table called ${exercise.expected.tableName ?? "the one the task names"} could be found in ${whereName}. Check its spelling against the schema on this page.`,
        tone: "warning",
      };
    }
    return buildFeedback({
      kind: "wrong",
      reason: outcome.reason as WrongResultReason | undefined,
    });
  }, [outcome, sql]);

  const nextHint = hintsShown < exercise.hints.length ? exercise.hints[hintsShown] : null;

  return (
    <section
      className={`my-0 overflow-hidden rounded-[14px] border ${
        solved ? "border-[color:var(--success)]/45" : "border-accent/35"
      } bg-surface/60`}
      aria-label={
        exercise.mode === "guided" ? "Guided exercise" : "Exercise"
      }
    >
      <header className="flex flex-wrap items-center gap-2 border-b border-line bg-surface-2/60 px-3.5 py-2">
        <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-accent">
          {exercise.mode === "guided" ? "Type along" : "Your turn"}
        </span>
        <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-faint">
          +{exercise.xp} XP
        </span>
        <span className="ml-auto inline-flex items-center gap-1.5 font-mono text-[10.5px] text-muted">
          {solved ? (
            <span className="text-success">✓ solved</span>
          ) : (
            <span>{checkLabel(exercise)}</span>
          )}
                </span>
      </header>

      <div className="px-3.5 py-3">
        <p className="m-0 text-[14px] leading-[1.66] text-ink">
          <Rich text={exercise.prompt} />
        </p>

        {solved ? (
          <Solved exercise={exercise} outcome={outcome} />
        ) : (
          <>
            <label className="sr-only" htmlFor={`${exercise.id}-sql`}>
              Your SQL for this exercise
            </label>
            <textarea
              id={`${exercise.id}-sql`}
              value={sql}
              spellCheck={false}
              autoComplete="off"
              readOnly={!reading}
              rows={Math.min(12, Math.max(3, sql.split("\n").length + 1))}
              onChange={(event) => {
                setSql(event.target.value);
                saveDraft(event.target.value);
              }}
              onKeyDown={(event) => {
                if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
                  event.preventDefault();
                  void submit();
                }
              }}
              className="mt-2.5 w-full resize-y rounded-[10px] border border-line bg-[color:var(--bg-deep)]/80 px-3 py-2.5 font-mono text-[13px] leading-[1.7] text-ink outline-none transition-colors focus:border-accent/60"
            />

            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => void submit()}
                disabled={busy || !reading || sql.trim() === "" || db.status === "error"}
                className="inline-flex items-center gap-1.5 rounded-full bg-accent px-3.5 py-1.5 text-[12.5px] font-semibold text-[color:var(--accent-ink)] transition-transform hover:-translate-y-[1px] disabled:cursor-not-allowed disabled:opacity-55"
                title={`Runs in ${whereName} on the real engine and marks the result`}
              >
                {busy ? "running…" : "Run & check"}
              </button>

              <button
                type="button"
                onClick={async () => setCopied(await copySql(sql))}
                className="rounded-full border border-line px-3 py-1.5 font-mono text-[11.5px] text-muted hover:border-line-strong hover:text-ink"
              >
                {copied === true ? "copied" : copied === false ? "copy blocked" : "Copy"}
              </button>

              {progress.playgroundUnlocked && (
                <button
                  type="button"
                  onClick={() => adoptInLab(sql, whereName)}
                  className="rounded-full border border-line px-3 py-1.5 font-mono text-[11.5px] text-muted hover:border-accent/50 hover:text-accent"
                  title="Take this draft to the Live Lab editor, same database"
                >
                  Edit in Lab
                </button>
              )}

              {writesData(sql) && (
                <button
                  type="button"
                  onClick={() => void reseedDataset(exercise.dataset)}
                  className="rounded-full border border-line px-3 py-1.5 font-mono text-[11.5px] text-faint hover:text-ink"
                  title="Your attempt changed the data. Put the book's starter rows back and try again."
                >
                  reset sample data
                </button>
              )}
            </div>

            <AnimatePresence initial={false}>
              {outcome && !outcome.correct && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                  className="overflow-hidden"
                  role="status"
                  aria-live="polite"
                >
                  <div className="mt-2.5 flex gap-2.5 rounded-[10px] border border-[color:var(--danger)]/40 bg-[color:var(--danger)]/8 px-3 py-2.5">
                    <span className="-mt-1 shrink-0" aria-hidden="true">
                      <SparrowMascot state={feedback?.state ?? "thinking"} size={32} title="" />
                    </span>
                    <div className="min-w-0">
                      <p className="m-0 text-[13px] font-semibold text-ink">
                        {feedback?.title ?? "Not quite"}
                      </p>
                      <p className="mt-1 mb-0 text-[12.5px] leading-relaxed whitespace-pre-line text-muted">
                        {feedback?.message ?? ""}
                      </p>
                      {outcome.reason === "failed" && (
                        <p className="mt-1 mb-0 break-words font-mono text-[11.5px] text-danger">
                          {explainSQLError(outcome.result.error?.message ?? "")}
                        </p>
                      )}
                      {outcome.result.rows.length > 0 && (
                        <div className="mt-2">
                          <TableViewer
                            columns={outcome.result.columns}
                            rows={outcome.result.rows}
                            status={null}
                          />
                          <p className="mt-1 mb-0 text-[11.5px] text-faint">
                            This is what your statement actually returned.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}

        {/* Hints, one at a time. */}
        {!solved && exercise.hints.length > 0 && (
          <div className="mt-3 border-t border-line pt-2.5">
            <ul className="m-0 list-none space-y-1.5 p-0">
              {exercise.hints.slice(0, hintsShown).map((hint, index) => (
                <li key={index} className="text-[12.5px] leading-relaxed text-muted">
                  <span className="mr-1.5 font-mono text-[10.5px] uppercase text-accent">
                    hint {index + 1}
                  </span>
                  <Rich text={hint} />
                </li>
              ))}
            </ul>
            {nextHint ? (
              <button
                type="button"
                onClick={() => {
                  bookStore.useHint(exercise.id, exercise.hints.length);
                  setHintsShown((n) => n + 1);
                }}
                className="mt-1.5 rounded-full border border-line px-3 py-1 font-mono text-[11.5px] text-muted hover:border-accent/50 hover:text-accent"
              >
                {hintsShown === 0
                  ? "Stuck? show the first hint"
                  : `Show hint ${hintsShown + 1} of ${exercise.hints.length}`}
              </button>
            ) : (
              <p className="mt-1.5 mb-0 font-mono text-[11px] text-faint">
                that is every hint this page has.
              </p>
            )}
          </div>
        )}

        {/* The solution, only when it is asked for. */}
        {!solved && (
          <details
            className="group mt-2.5 rounded-[10px] border border-line bg-[color:var(--bg-deep)]/50 px-3 py-2"
            onToggle={(event) => {
              if (event.currentTarget.open) bookStore.revealSolution(exercise.id);
            }}
          >
            <summary className="cursor-pointer list-none text-[12.5px] font-semibold text-muted marker:hidden">
              Show the worked solution
              <span className="ml-2 font-mono text-[10.5px] uppercase tracking-[0.12em] text-faint">
                {state.revealed[exercise.id] ? "already opened" : "opens as you read the steps"}
              </span>
            </summary>
            <div className="mt-2">
              <SqlListing sql={exercise.solution} />
              <p className="mt-2 mb-0 text-[12.5px] leading-relaxed text-muted">
                <Rich text={exercise.success} />
              </p>
              <p className="mt-1.5 mb-0 text-[12px] leading-relaxed text-faint">
                Running it here would replace your own attempt, so the book leaves it as
                reading. Press <span className="font-mono">Edit in Lab</span> to type it out
                yourself in{" "}
                <span className="font-mono">{whereName}</span>.
              </p>
            </div>
          </details>
        )}

        {exercise.extend && (
          <div className="mt-2.5 rounded-[10px] border border-dashed border-line px-3 py-2">
            <p className="m-0 font-mono text-[10.5px] uppercase tracking-[0.14em] text-feather">
              Stretch
            </p>
            <p className="mt-1 mb-0 text-[12.5px] leading-relaxed text-muted">
              <Rich text={exercise.extend.prompt} />
            </p>
            {exercise.extend.solution && hintsShown >= exercise.hints.length && (
              <details className="mt-1.5">
                <summary className="cursor-pointer list-none font-mono text-[11px] text-accent marker:hidden">
                  one way to do it
                </summary>
                <div className="mt-1.5">
                  <SqlListing sql={exercise.extend.solution} compact />
                </div>
              </details>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

/** What a passed exercise looks like, including the grid that proved it. */
function Solved({ exercise, outcome }: { exercise: Exercise; outcome: GradeOutcome | null }) {
  const result = outcome?.result;
  return (
    <div className="mt-2.5 rounded-[10px] border border-[color:var(--success)]/40 bg-[color:var(--success)]/8 px-3 py-2.5">
      <p className="m-0 flex items-center gap-2 text-[13px] font-semibold text-ink">
        <span aria-hidden="true">
          <SparrowMascot state="celebrating" size={28} title="" />
        </span>
        Solved.
      </p>
      <p className="mt-1 mb-0 text-[12.5px] leading-relaxed text-muted">
        <Rich text={exercise.success} />
      </p>
      {result && result.rows.length > 0 && (
        <div className="mt-2">
          <TableViewer columns={result.columns} rows={result.rows} status={null} />
          <ResultNotes notes={result.notes} />
        </div>
      )}
    </div>
  );
}
