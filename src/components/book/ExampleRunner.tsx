/**
 * A runnable worked example.
 *
 * The contract with the learner is narrow and absolute: pressing Run sends the
 * statement to the same sql.js engine the Live Lab uses, and what appears below it is
 * whatever that engine returned — rows, a status line, a MySQL-layer answer, or the
 * error text. The grid the page *claims* is kept visible only as a promise to compare
 * against, and if the two ever disagree (because an earlier lesson's data changed) the
 * page says so and offers the factory rows back rather than quietly showing the
 * expected answer.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { evaluateResultSet, explainSQLError, analyzeSQLError } from "../../lib/evaluator";
import { buildFeedback } from "../../lib/feedback";
import { sqlEngine } from "../../lib/sqlEngine";
import type { SqlRunResult } from "../../lib/types";
import { DATASETS } from "../../lib/curriculum/datasets";
import type { DatasetId, Support } from "../../lib/curriculum/types";
import { ResultNotes, TableViewer } from "../lab/TableViewer";
import { SparrowMascot } from "../SparrowMascot";
import { Rich, SqlListing } from "./Rich";
import { useReading } from "./ReadingContext";
import {
  adoptInLab,
  cachedResult,
  copySql,
  remember,
  reseedDataset,
  resultKey,
  runBookScript,
  writesData,
} from "./bookEngine";
import { useProgress } from "../../hooks/useProgress";

const SUPPORT_LABEL: Record<Support, { text: string; tone: string }> = {
  both: { text: "Runs as written", tone: "text-success" },
  mysql: { text: "MySQL command · answered by the router", tone: "text-feather" },
  sqlite: { text: "SQLite spelling", tone: "text-muted" },
  rewritten: { text: "Rewritten for SQLite", tone: "text-accent" },
  "server-only": { text: "Server-only · will be refused here", tone: "text-danger" },
};

export function ExampleRunner({
  sql,
  explain,
  expected,
  support,
  dialectNote,
  setup,
  expectFailure,
  dataset: atDataset,
}: {
  sql: string;
  explain: string;
  expected?: { columns: string[]; rows: unknown[][]; ordered?: boolean };
  support?: Support;
  dialectNote?: string;
  setup?: string;
  expectFailure?: boolean;
  /** Some pages show a statement against another lesson's data. */
  dataset?: DatasetId;
}) {
  const { lesson, db, reading, dataset, noteWrite } = useReading();
  const { progress } = useProgress();
  const where = atDataset ?? dataset;
  const whereName = DATASETS[where].database;
  const key = resultKey(lesson.id, sql);
  const [result, setResult] = useState<SqlRunResult | null>(() => cachedResult(key) ?? null);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState<null | boolean>(null);
  const [ranHere, setRanHere] = useState(Boolean(cachedResult(key)));
  /** Table names, refreshed only when a statement moved the learner elsewhere. */
  const [tables, setTables] = useState<string[]>([]);

  useEffect(() => {
    // Coming back to a page shows the result that page already produced — never a
    // re-run, and never a remembered grid from a different lesson.
    setResult(cachedResult(key) ?? null);
    setRanHere(Boolean(cachedResult(key)));
  }, [key]);

  useEffect(() => {
    if (copied === null) return;
    const timer = window.setTimeout(() => setCopied(null), 1800);
    return () => window.clearTimeout(timer);
  }, [copied]);

  const run = useCallback(async () => {
    if (!reading || busy) return;
    setBusy(true);
    try {
      const outcome = await runBookScript({ dataset: where, setup, sql });
      setResult(outcome);
      setRanHere(true);
      // A real run is worth remembering: it is the only thing the cache stores.
      if (outcome.success) remember(key, outcome);
      if (writesData(sql) && outcome.success) noteWrite(where);
      // The schema may have changed (a CREATE TABLE example), so refresh the label
      // the page shows for where the statement ran.
      if (outcome.database && outcome.database !== whereName) {
        const names = await sqlEngine.getTables().catch(() => []);
        setTables(names);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setResult({
        success: false,
        kind: "rows",
        database: whereName,
        columns: [],
        rows: [],
        error: { message },
      });
      setRanHere(true);
    } finally {
      setBusy(false);
    }
  }, [busy, key, noteWrite, reading, setup, sql, where]);

  const verdict = useMemo(() => {
    if (!result || !result.success || !expected) return null;
    if (expected.rows.length === 0 && result.rows.length === 0) return "match" as const;
    return evaluateResultSet(result, {
      type: "result-set",
      columns: expected.columns,
      rows: expected.rows,
      ordered: expected.ordered,
    }).correct
      ? ("match" as const)
      : ("different" as const);
  }, [expected, result]);

  const label = SUPPORT_LABEL[support ?? "both"];
  const failed = result !== null && !result.success;

  return (
    <figure className="my-0 overflow-hidden rounded-[12px] border border-line bg-surface/55">
      <figcaption className="flex flex-wrap items-center gap-x-2.5 gap-y-1 border-b border-line bg-surface-2/60 px-3 py-1.5">
        <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-faint">
          Example
        </span>
        <span className={`font-mono text-[10px] uppercase tracking-[0.12em] ${label.tone}`}>
          {label.text}
        </span>
        <span className="ml-auto inline-flex items-center gap-1 font-mono text-[10.5px] text-accent">
          <span className="h-1.5 w-1.5 rounded-full bg-success" aria-hidden="true" />
          {whereName}
        </span>
      </figcaption>

      <div className="px-3 pt-3">
        <SqlListing sql={sql} />
      </div>

      {/* What the page teaches about the answer, before the answer. */}
      <p className="mx-3 mt-2 mb-0 rounded-[9px] bg-[color:var(--bg-deep)]/60 px-3 py-2 text-[12.5px] leading-[1.62] text-muted">
        <span className="font-semibold text-ink">What to notice: </span>
        <Rich text={explain} />
      </p>

      <div className="flex flex-wrap items-center gap-1.5 px-3 pt-2.5">
        <button
          type="button"
          onClick={() => void run()}
          disabled={busy || !reading || db.status === "error"}
          className="inline-flex items-center gap-1.5 rounded-full bg-accent px-3.5 py-1.5 text-[12.5px] font-semibold text-[color:var(--accent-ink)] transition-transform hover:-translate-y-[1px] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-55"
          title={
            reading
              ? `Run this statement in ${whereName} on the real SQLite engine`
              : "The book is put aside; bring it back to run this"
          }
        >
          {busy ? (
            <span className="inline-flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[color:var(--accent-ink)]" />
              running…
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5">
              <PlayGlyph /> Run
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={async () => setCopied(await copySql(sql))}
          className="rounded-full border border-line px-3 py-1.5 font-mono text-[11.5px] text-muted transition-colors hover:border-line-strong hover:text-ink"
        >
          {copied === true ? "copied" : copied === false ? "copy blocked" : "Copy"}
        </button>

        {progress.playgroundUnlocked && (
          <button
            type="button"
            onClick={() => adoptInLab(sql, whereName)}
            className="rounded-full border border-line px-3 py-1.5 font-mono text-[11.5px] text-muted transition-colors hover:border-accent/50 hover:text-accent"
            title={`Opens the Live Lab with this query, still using ${whereName}`}
          >
            Edit in Lab
          </button>
        )}

        <button
          type="button"
          onClick={() => void reseedDataset(where)}
          className="ml-auto rounded-full px-2 py-1.5 font-mono text-[11px] text-faint transition-colors hover:text-ink"
          title={`Replace ${whereName} with the starter rows the book wrote this page against`}
        >
          reset sample data
        </button>
      </div>

      <AnimatePresence initial={false}>
        {result && (
          <motion.div
            key={ranHere ? "shown" : "cached"}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <div className="mt-2.5 border-t border-line px-3 py-2.5">
              {failed ? (
                <ErrorReadout result={result} sql={sql} expectedFailure={expectFailure} />
              ) : (
                <>
                  <TableViewer
                    columns={result.columns}
                    rows={result.rows}
                    status={result.kind === "rows" ? null : (result.statusMessage ?? null)}
                  />
                  <ResultNotes notes={result.notes} />
                  {dialectNote && (
                    <p className="mt-1.5 mb-0 text-[12px] leading-relaxed text-feather">
                      <Rich text={dialectNote} />
                    </p>
                  )}
                  {verdict === "different" && (
                    <p className="mt-2 mb-0 rounded-[9px] border border-[color:var(--warning)]/40 bg-[color:var(--warning)]/8 px-2.5 py-2 text-[12px] leading-relaxed text-ink/90">
                      These rows are not the grid the page printed. Something has changed
                      this data — usually an exercise in an earlier lesson. Press
                      <span className="font-mono text-[11.5px]"> reset sample data </span>
                      above to get the book’s starter rows back.
                    </p>
                  )}
                  {verdict === "match" && expected && (
                    <p className="mt-1.5 mb-0 font-mono text-[11px] text-success">
                      ✓ matches the {expected.rows.length} row
                      {expected.rows.length === 1 ? "" : "s"} the page describes
                    </p>
                  )}
                  {result.kind === "rows" &&
                    result.columns.length === 0 &&
                    result.rows.length === 0 && (
                      <p className="mt-1.5 mb-0 text-[12px] text-faint">
                        The statement ran and returned no rows. An empty answer is still an
                        answer — “nothing matches this condition” is what it means.
                      </p>
                    )}
                  {tables.length > 0 && (
                    <p className="mt-1.5 mb-0 font-mono text-[10.5px] text-faint">
                      {whereName}: {tables.slice(0, 8).join(", ")}
                      {tables.length > 8 ? ` +${tables.length - 8} more` : ""}
                    </p>
                  )}
                </>
              )}
            </div>
          </motion.div>
        )}
        {!result && (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="mt-2 border-t border-line px-3 py-2.5"
          >
            <p className="m-0 text-[12px] leading-relaxed text-faint">
              Not run yet. {expectFailure
                ? "This one is here to be refused — press Run and read what the engine says."
                : `Press Run to execute it in ${whereName}.`}
            </p>
            {db.status === "opening" && (
              <p className="mt-1 mb-0 font-mono text-[11px] text-accent">
                opening {whereName}…
              </p>
            )}
            {db.status === "error" && (
              <p className="mt-1 mb-0 font-mono text-[11px] text-danger" role="status">
                {db.error ?? "The sandbox is unavailable."}
                <button
                  type="button"
                  onClick={db.retry}
                  className="ml-2 rounded-full border border-line px-2 py-0.5 text-[11px] text-muted hover:text-ink"
                >
                  retry
                </button>
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </figure>
  );
}

/**
 * Sparrow's read of a failure. The message is the engine's, the classification is the
 * same one the Live Lab uses, and nothing here is a guess about what went wrong.
 */
function ErrorReadout({
  result,
  sql,
  expectedFailure,
}: {
  result: SqlRunResult;
  sql: string;
  expectedFailure?: boolean;
}) {
  const message = result.error?.message ?? "The engine refused this statement.";
  const category = result.errorCategory ?? analyzeSQLError(message);
  const feedback = buildFeedback({ kind: "error", category, message, sql });
  const raw = explainSQLError(message);
  return (
    <div
      className={`flex gap-2.5 rounded-[10px] border px-3 py-2.5 ${
        expectedFailure
          ? "border-[color:var(--warning)]/45 bg-[color:var(--warning)]/8"
          : "border-[color:var(--danger)]/45 bg-[color:var(--danger)]/8"
      }`}
    >
      <span className="-mt-1 shrink-0" aria-hidden="true">
        <SparrowMascot state={expectedFailure ? "thinking" : "confused"} size={32} title="" />
      </span>
      <div className="min-w-0">
        <p className="m-0 font-mono text-[10.5px] uppercase tracking-[0.14em] text-danger">
          {expectedFailure ? "Refused, as this page said it would be" : "Error"}
        </p>
        <p className="mt-1 mb-0 break-words font-mono text-[11.5px] leading-relaxed text-danger">
          {message}
        </p>
        {raw !== message && (
          <p className="mt-1 mb-0 text-[12.5px] leading-relaxed text-muted">
            <Rich text={raw} />
          </p>
        )}
        <p className="mt-1 mb-0 text-[12.5px] leading-relaxed text-ink/85">
          <Rich text={feedback.message} />
        </p>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ glyphs */

function PlayGlyph() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M8 5.5v13l11-6.5-11-6.5Z" />
    </svg>
  );
}
