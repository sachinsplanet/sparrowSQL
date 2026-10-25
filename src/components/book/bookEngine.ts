/**
 * The book's connection to the real SQL sandbox.
 *
 * Three responsibilities, and one rule: nothing here invents an answer. An example
 * only shows a grid after `sqlEngine.run` produced it, a failed statement shows the
 * engine's own message, and a result the learner already produced is cached rather
 * than re-run — a cache of real output, never a substitute for running.
 *
 * Database ownership is the subtle part. Reading a lesson selects that lesson's
 * starter database so `SHOW TABLES` and the learner's own queries hit the tables the
 * page just described. The database the learner was standing in before the book
 * opened is remembered and put back when the book is put away, so opening the book
 * can never quietly move the Live Lab's ground. The one exception is "Open in Lab",
 * where keeping the lesson's database is the whole point.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { DATASETS } from "../../lib/curriculum/datasets";
import type { DatasetId, Exercise } from "../../lib/curriculum/types";
import { bookStore } from "../../lib/bookStore";
import { engineRunner, grade, type GradeOutcome } from "../../lib/curriculum/grade";
import { sqlEngine } from "../../lib/sqlEngine";
import type { SqlRunResult } from "../../lib/types";
import { minimizeBook } from "./bookBus";

/* ------------------------------------------------------------ result cache */

/**
 * Real results from this session, keyed by what produced them. Coming back to a page
 * should not re-run a query the learner already ran, and must not print a grid that
 * was never produced either, so the cache is the only thing that survives a page turn.
 */
const results = new Map<string, SqlRunResult>();

export function resultKey(lessonId: string, sql: string): string {
  return `${lessonId}|${sql.replace(/\s+/g, " ").trim()}`;
}

export function cachedResult(key: string): SqlRunResult | undefined {
  return results.get(key);
}

/** Only a real run may be remembered; nothing else ever enters this cache. */
export function remember(key: string, result: SqlRunResult): void {
  // A page can hold a dozen examples; the cap keeps a long reading session from
  // pinning every grid the learner ever ran.
  while (results.size > 240) {
    const oldest = results.keys().next().value;
    if (oldest) results.delete(oldest);
    else break;
  }
  results.set(key, result);
}

/** Every database change a lesson made invalidates the grids that came before it. */
export function forgetResults(lessonId: string): void {
  for (const key of [...results.keys()]) {
    if (key.startsWith(`${lessonId}|`)) results.delete(key);
  }
}

/* ------------------------------------------------------------------ running */

export interface RunOptions {
  dataset?: DatasetId;
  /** Statements that must be true first (a DDL example teaching its own table). */
  setup?: string;
  sql: string;
}

/**
 * Run a page's statement exactly as written, through the dialect and command router.
 * `setup` is replayed first because a few pages create the table they then query.
 */
export async function runBookScript(options: RunOptions): Promise<SqlRunResult> {
  if (options.dataset) {
    const meta = DATASETS[options.dataset];
    await sqlEngine.useDataset(meta.database, meta.seed);
  }
  if (options.setup) {
    // The setup is part of the page's claim, so a refusal here is reported like any
    // other failure rather than being assumed to have worked.
    const prepared = await sqlEngine.run(options.setup);
    if (!prepared.success) return prepared;
  }
  return sqlEngine.run(options.sql);
}

export async function runBookSql(sql: string): Promise<SqlRunResult> {
  return sqlEngine.run(sql);
}

/**
 * Mark a learner's attempt against an exercise or milestone, on the dataset the task
 * names. Grading uses the shared checker, so "the book says it is right" and "the
 * test harness says the printed solution is right" are the same statement.
 */
export async function runBookExercise(
  exercise: Pick<Exercise, "dataset" | "setup" | "expected">,
  sql: string,
): Promise<GradeOutcome> {
  const meta = DATASETS[exercise.dataset];
  await sqlEngine.useDataset(meta.database, meta.seed);
  if (exercise.setup) {
    const prepared = await sqlEngine.run(exercise.setup);
    if (!prepared.success) return { correct: false, result: prepared, reason: "failed" };
  }
  return grade(engineRunner(), sql, exercise.expected);
}

/** Does the statement change data? Used to warn that a page's rows may have moved. */
const WRITE = /\b(INSERT|UPDATE|DELETE|DROP|ALTER|CREATE|TRUNCATE|REPLACE|RENAME)\b/i;

export function writesData(sql: string): boolean {
  return WRITE.test(sql);
}

/* ------------------------------------------------------- lesson database hook */

export type DatasetStatus = "idle" | "opening" | "ready" | "error";

export interface LessonDatabase {
  /** The virtual database now selected, e.g. `shop_db`. */
  database: string;
  status: DatasetStatus;
  error: string | null;
  /** Factory rows again. The learner's own tables in that database are lost. */
  reset: () => Promise<void>;
  retry: () => void;
}

/**
 * Select the lesson's starter database while the book is being read, and hand back
 * whatever database was selected before it was opened.
 *
 * `enabled` is false while the book is minimized or closed, which is what triggers
 * the restore.
 */
export function useLessonDatabase(
  dataset: DatasetId | undefined,
  enabled: boolean,
  /** Skips the restore when the learner has deliberately stayed in this database. */
  keep?: boolean,
): LessonDatabase {
  const meta = dataset ? DATASETS[dataset] : null;
  const [status, setStatus] = useState<DatasetStatus>(meta && enabled ? "opening" : "idle");
  const [error, setError] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);
  /** The database to return to, captured the first time the book takes control. */
  const previous = useRef<string | null>(null);
  const keepRef = useRef(keep ?? false);
  keepRef.current = keep ?? false;

  useEffect(() => {
    let cancelled = false;
    if (!enabled || !meta) {
      // Put away: give the sandbox back the way the learner left it.
      const restore = previous.current;
      previous.current = null;
      if (restore && !keepRef.current) {
        void sqlEngine.use(restore).catch(() => undefined);
      }
      setStatus("idle");
      return;
    }
    setStatus("opening");
    setError(null);
    (async () => {
      try {
        if (previous.current === null) previous.current = await sqlEngine.currentDatabase();
        const outcome = await sqlEngine.useDataset(meta.database, meta.seed);
        if (cancelled) return;
        if (outcome.ok) {
          setStatus("ready");
        } else {
          setStatus("error");
          setError(outcome.message);
        }
      } catch (err) {
        if (cancelled) return;
        setStatus("error");
        setError(err instanceof Error ? err.message : String(err));
      }
    })();
    return () => {
      cancelled = true;
    };
    // `meta` is derived from `dataset`, and `nonce` is the retry button.
  }, [dataset, enabled, nonce, meta]);

  const reset = useCallback(async () => {
    if (!meta) return;
    setStatus("opening");
    try {
      const outcome = await sqlEngine.useDataset(meta.database, meta.seed, true);
      setStatus(outcome.ok ? "ready" : "error");
      setError(outcome.ok ? null : outcome.message);
      // The starter rows are back, so no earlier lesson's writes explain this page.
      bookStore.clearWrite(meta.id);
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : String(err));
    }
  }, [meta]);

  const retry = useCallback(() => setNonce((n) => n + 1), []);
  return {
    database: meta?.database ?? "",
    status,
    error,
    reset,
    retry,
  };
}

/**
 * Put one dataset back to its factory rows, whoever owns the page asking for it. An
 * exercise may name a different dataset than its lesson, so this cannot go through the
 * lesson hook.
 */
export async function reseedDataset(dataset: DatasetId): Promise<void> {
  const meta = DATASETS[dataset];
  await sqlEngine.useDataset(meta.database, meta.seed, true);
  bookStore.clearWrite(dataset);
}

/* ------------------------------------------------------------ copy + adoption */

/** Clipboard, with a synchronous fallback for browsers that refuse `writeText`. */
export async function copySql(sql: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(sql);
    return true;
  } catch {
    try {
      const area = document.createElement("textarea");
      area.value = sql;
      area.setAttribute("readonly", "");
      area.style.position = "fixed";
      area.style.opacity = "0";
      document.body.appendChild(area);
      area.select();
      const ok = document.execCommand("copy");
      area.remove();
      return ok;
    } catch {
      return false;
    }
  }
}

/**
 * Hand a query to the Live Lab. The book is minimized rather than closed so its
 * reading position, opened examples and half-answered quizzes are all still there when
 * the learner comes back, and the lesson's database stays selected so the query they
 * are about to run has the tables the page described.
 */
export function adoptInLab(sql: string, database: string): void {
  window.dispatchEvent(
    new CustomEvent("sparrowsql:lab", { detail: { sql, database } }),
  );
  // `true`: this is the one path where leaving the lesson's database selected is the
  // point, because the query is about to be run against it in the editor.
  minimizeBook(true);
  const lab = document.getElementById("lab");
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  lab?.scrollIntoView({ behavior: reduce ? "auto" : "smooth" });
}

/** Where the learner's own writes came from, for the "sample data has changed" note. */
export function staleDatasets(state: { writes: Record<string, string> }, lessonId: string) {
  const stale: DatasetId[] = [];
  for (const [dataset, writer] of Object.entries(state.writes)) {
    if (writer !== lessonId) stale.push(dataset as DatasetId);
  }
  return stale;
}

export function noteLessonWrite(dataset: DatasetId, lessonId: string): void {
  bookStore.noteWrite(dataset, lessonId);
}
