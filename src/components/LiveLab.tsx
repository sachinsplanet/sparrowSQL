import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { LESSON_DB, MAX_RESULT_ROWS, PLAYGROUND_DB, sqlEngine } from "../lib/sqlEngine";
import {
  analyzeSQLError,
  evaluateDatabaseState,
  evaluateResultSet,
  explainSQLError,
  isDangerous,
  locateSQLError,
} from "../lib/evaluator";
import { buildFeedback, dangerousFeedback } from "../lib/feedback";
import { exercises, getExercise, PLAYGROUND_SEED } from "../lib/exercises";
import { getDailyChallenge } from "../lib/progressStore";
import { useProgress } from "../hooks/useProgress";
import { createBrowserHistoryStore, type HistoryStore } from "../lib/sql/historyStore";
import type {
  DatabaseInfo,
  ErrorHighlight,
  QueryHistoryItem,
  SparrowFeedback,
  SqlRunResult,
  TableSchema,
} from "../lib/types";
import { SqlEditor } from "./lab/SqlEditor";
import { ResultNotes, TableViewer } from "./lab/TableViewer";
import { TerminalPanel } from "./lab/TerminalPanel";
import { SparrowMascot } from "./SparrowMascot";

type Mode = "learn" | "playground" | "daily";
type ResultView = "table" | "terminal" | "history";

const LEARN_IDLE: SparrowFeedback = {
  state: "idle",
  title: "Ready when you are!",
  message: "Ready when you are!\nWrite the query, then\npress Run. I'll tell you\nwhat happened.",
  tone: "neutral",
};

const PLAY_IDLE: SparrowFeedback = {
  state: "idle",
  title: "Free playground",
  message:
    "This is a real SQLite database. Create tables, insert rows, query them. Nothing is permanent, so reset any time.",
  tone: "neutral",
};

const DAILY_IDLE: SparrowFeedback = {
  state: "idle",
  title: "Today's challenge",
  message:
    "A fresh problem every day. Solve it for a bonus XP streak — everyone gets the same puzzle today.",
  tone: "neutral",
};

const PLAYGROUND_DRAFT = "SELECT * FROM students;";

const SQL_KEYWORDS = [
  "SELECT",
  "FROM",
  "WHERE",
  "INSERT",
  "UPDATE",
  "DELETE",
  "ORDER BY",
  "GROUP BY",
  "LIMIT",
  "JOIN",
  "USE",
  "SHOW TABLES",
  "DESCRIBE",
] as const;

function withNotes(fb: SparrowFeedback, notes?: string[]): SparrowFeedback {
  if (!notes || notes.length === 0) return fb;
  return {
    ...fb,
    message: `${fb.message}\n\n${notes.map((note) => `ℹ️ ${note}`).join("\n")}`,
  };
}

function serverCommandMessage(res: SqlRunResult): string {
  const db = res.database;
  if (res.rows.length === 0) {
    return res.statusMessage ?? "It ran, and nothing came back.";
  }
  const names = res.rows.map((row) => String(row[0] ?? "")).join(", ");
  const plural = res.rows.length === 1 ? "" : "s";
  switch (res.command) {
    case "SHOW DATABASES":
      return `This sandbox holds ${res.rows.length} database${plural}: ${names}. Your next query runs against \`${db}\`.`;
    case "SHOW TABLES":
      return `\`${db}\` holds ${res.rows.length} table${plural}: ${names}.`;
    case "DESCRIBE":
    case "SHOW COLUMNS":
      return `${names.split(", ").length} column${names.split(", ").length === 1 ? "" : "s"}: ${res.rows
        .map(
          (row) =>
            `${row[0]} (${row[1]}, ${
              row[3] === "PRI" ? "primary key" : row[2] === "NO" ? "NOT NULL" : "nullable"
            })`,
        )
        .join("; ")}.`;
    default:
      return `${res.rows.length} row${plural} came back: ${names}.`;
  }
}

function tutorContext(
  fb: SparrowFeedback,
  ex: { topic: string; title: string },
  detail: string,
): SparrowFeedback {
  return {
    ...fb,
    message: `${fb.message}\n\n📖 Lesson “${ex.title}” (${ex.topic}). ${detail}`,
  };
}

function renderTaskDescription(exerciseId: string, fallbackPrompt: string) {
  switch (exerciseId) {
    case "select-001":
      return (
        <>
          Write a query to show all the records from the{" "}
          <span className="font-semibold text-[#f3efe6]">students</span> table.
        </>
      );
    case "where-001":
      return (
        <>
          Write a query to return <span className="font-semibold text-[#f3efe6]">name</span> and{" "}
          <span className="font-semibold text-[#f3efe6]">marks</span> for students scoring above 80.
        </>
      );
    case "orderby-001":
      return (
        <>
          Return the top 3 students ordered by{" "}
          <span className="font-semibold text-[#f3efe6]">marks</span> descending.
        </>
      );
    case "groupby-001":
      return (
        <>
          Group rows by <span className="font-semibold text-[#f3efe6]">city</span> and count
          students in each city as <span className="font-semibold text-[#f3efe6]">total</span>.
        </>
      );
    case "insert-001":
      return (
        <>
          Insert the new student record into the{" "}
          <span className="font-semibold text-[#f3efe6]">students</span> table.
        </>
      );
    case "join-001":
      return (
        <>
          Join <span className="font-semibold text-[#f3efe6]">enrollments</span>,{" "}
          <span className="font-semibold text-[#f3efe6]">students</span>, and{" "}
          <span className="font-semibold text-[#f3efe6]">courses</span>.
        </>
      );
    case "update-001":
      return (
        <>
          Add 5 bonus marks to every student in{" "}
          <span className="font-semibold text-[#f3efe6]">Data Science</span>.
        </>
      );
    default:
      return fallbackPrompt;
  }
}

export function LiveLab() {
  const { actions } = useProgress();

  const [mode, setMode] = useState<Mode>("learn");
  const [index, setIndex] = useState(0);
  const [sql, setSql] = useState(exercises[0]?.starter ?? "");
  const [result, setResult] = useState<SqlRunResult | null>(null);
  const [feedback, setFeedback] = useState<SparrowFeedback>(LEARN_IDLE);
  const [busy, setBusy] = useState(true);
  const [execMs, setExecMs] = useState(0);
  const [hintsRevealed, setHintsRevealed] = useState(0);
  const [databases, setDatabases] = useState<DatabaseInfo[]>([]);
  const [schemasByDb, setSchemasByDb] = useState<Record<string, TableSchema[]>>({});
  const [activeDb, setActiveDb] = useState<string>(LESSON_DB);
  const [history, setHistory] = useState<QueryHistoryItem[]>([]);
  const [view, setView] = useState<ResultView>("table");
  const [insert, setInsert] = useState<{ value: string; nonce: number } | null>(null);
  const [focusOffset, setFocusOffset] = useState<{ offset: number; nonce: number } | null>(null);
  const [dangerSql, setDangerSql] = useState<string | null>(null);
  const [engineError, setEngineError] = useState<string | null>(null);
  const [errorRange, setErrorRange] = useState<ErrorHighlight | null>(null);

  // Collapsible sections & dropdown states matching the reference UI
  const [schemaSectionOpen, setSchemaSectionOpen] = useState(true);
  const [expandedDbs, setExpandedDbs] = useState<Record<string, boolean>>({
    [PLAYGROUND_DB]: false,
    [LESSON_DB]: true,
  });
  const [expandedTables, setExpandedTables] = useState<Record<string, boolean>>({
    [`${LESSON_DB}.students`]: true,
  });
  const [keywordsOpen, setKeywordsOpen] = useState(true);
  const [dbMenuOpen, setDbMenuOpen] = useState(false);
  const [isFitScreen, setIsFitScreen] = useState(false);

  // Lock outer page scroll and allow Escape to exit when Fit Screen mode is active
  useEffect(() => {
    if (!isFitScreen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !dangerSql) {
        setIsFitScreen(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isFitScreen, dangerSql]);

  const playgroundHome = useRef<string | null>(null);
  const pendingAdopt = useRef<{ sql: string; database?: string } | null>(null);
  const historyStore = useRef<HistoryStore | null>(null);
  const getHistory = useCallback((): HistoryStore => {
    if (!historyStore.current) historyStore.current = createBrowserHistoryStore();
    return historyStore.current;
  }, []);

  const daily = useMemo(() => getDailyChallenge(), []);
  const exercise = useMemo(
    () =>
      getExercise(
        mode === "daily" ? daily.exerciseId : (exercises[index]?.id ?? ""),
      ),
    [mode, daily, index],
  );
  const guided = mode !== "playground";
  const targetDb = guided ? LESSON_DB : PLAYGROUND_DB;
  const activeTables = useMemo(
    () => schemasByDb[activeDb] ?? [],
    [schemasByDb, activeDb],
  );
  const databaseNames = useMemo(() => databases.map((d) => d.name), [databases]);

  // Order databases so college_db is listed first, then lesson_db, matching screenshot
  const orderedDatabases = useMemo(() => {
    const order = (name: string) => {
      if (name === PLAYGROUND_DB) return 0;
      if (name === LESSON_DB) return 1;
      return 2;
    };
    return [...databases].sort((a, b) => order(a.name) - order(b.name));
  }, [databases]);

  const refreshAll = useCallback(async () => {
    const dbs = await sqlEngine.getDatabases();
    const schemas = await Promise.all(dbs.map((d) => sqlEngine.getSchemas(d.name)));
    setDatabases(dbs);
    setSchemasByDb(
      Object.fromEntries(schemas.map((s) => [s.name, s.tables] as const)),
    );
    const active = dbs.find((d) => d.active)?.name;
    if (active) setActiveDb(active);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setBusy(true);
      try {
        await sqlEngine.initialize();
        if (guided) {
          if (playgroundHome.current === null) {
            playgroundHome.current = await sqlEngine.currentDatabase();
          }
          try {
            await sqlEngine.use(LESSON_DB);
          } catch {
            /* ignore */
          }
          await sqlEngine.reset(exercise.seed);
        } else if (playgroundHome.current) {
          const home = playgroundHome.current;
          playgroundHome.current = null;
          try {
            await sqlEngine.use(home);
          } catch {
            /* ignore */
          }
        }
        const adopt = pendingAdopt.current;
        pendingAdopt.current = null;
        if (adopt?.database) {
          try {
            await sqlEngine.use(adopt.database);
          } catch {
            /* ignore */
          }
        }
        if (!cancelled) {
          setSql(adopt?.sql ?? (guided ? exercise.starter : PLAYGROUND_DRAFT));
          setResult(null);
          setErrorRange(null);
          setFeedback(
            adopt?.sql
              ? {
                  state: "happy",
                  title: "Brought over from the book",
                  message: `This is the query from the page. Press Run to execute it here, or edit it first.`,
                  tone: "success",
                }
              : mode === "daily"
                ? DAILY_IDLE
                : guided
                  ? LEARN_IDLE
                  : PLAY_IDLE,
          );
          if (guided) setHintsRevealed(0);
        }
        await refreshAll();
        if (!cancelled) setEngineError(null);
      } catch (err) {
        if (!cancelled) {
          const msg = err instanceof Error ? err.message : String(err);
          setEngineError(msg);
          setFeedback({
            state: "confused",
            title: "The sandbox could not start",
            message:
              "sparrowsql runs a real SQLite engine in your browser. It failed to load just now. Try reloading the page.",
            tone: "danger",
          });
        }
      } finally {
        if (!cancelled) setBusy(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [mode, guided, exercise, targetDb, refreshAll]);

  useEffect(() => {
    let cancelled = false;
    void getHistory()
      .load()
      .then((items) => {
        if (!cancelled) setHistory(items);
      });
    return () => {
      cancelled = true;
    };
  }, [getHistory]);

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail ?? {};
      if (typeof detail.sql === "string" && detail.sql.trim()) {
        pendingAdopt.current = {
          sql: detail.sql,
          database: typeof detail.database === "string" ? detail.database : undefined,
        };
        setMode("playground");
        return;
      }
      const m = detail.mode;
      if (m === "learn" || m === "playground" || m === "daily") {
        setMode(m);
      }
    };
    window.addEventListener("sparrowsql:lab", handler);
    return () => window.removeEventListener("sparrowsql:lab", handler);
  }, []);

  const awardRunBadges = useCallback(
    (statement: string) => {
      actions.awardEventBadge("first-query");
      if (/CREATE\s+TABLE/i.test(statement)) actions.awardEventBadge("table-builder");
      if (/\bJOIN\b/i.test(statement)) actions.awardEventBadge("join-explorer");
    },
    [actions],
  );

  const pushHistory = useCallback(
    async (item: {
      sql: string;
      success: boolean;
      database: string;
      errorCategory?: QueryHistoryItem["errorCategory"];
      errorMessage?: string;
    }) => {
      const list = await getHistory().add({
        ...item,
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        executedAt: Date.now(),
      });
      setHistory(list);
    },
    [getHistory],
  );

  const runNow = useCallback(
    async (sqlToRun: string) => {
      setBusy(true);
      try {
        const started = performance.now();
        const res = await sqlEngine.run(sqlToRun);
        const ms = Math.max(1, Math.round(performance.now() - started));
        setResult(res);
        setExecMs(ms);
        if (res.database) setActiveDb(res.database);

        const category = res.success
          ? undefined
          : res.errorCategory ?? analyzeSQLError(res.error?.message ?? "");
        void pushHistory({
          sql: sqlToRun.trim(),
          success: res.success,
          database: res.database || targetDb,
          errorCategory: category,
          errorMessage: res.success ? undefined : res.error?.message,
        });

        setErrorRange(null);
        if (!res.success) {
          const msg = res.error?.message ?? "Unknown error";
          const explained = res.errorCategory ? msg : explainSQLError(msg);
          setErrorRange(locateSQLError(sqlToRun, msg));
          setFeedback(
            withNotes(
              buildFeedback({
                kind: "error",
                category: category ?? "syntax-error",
                message: explained,
                sql: sqlToRun,
              }),
              res.notes,
            ),
          );
          await refreshAll();
          return;
        }
        awardRunBadges(sqlToRun);
        await refreshAll();

        if (mode === "playground") {
          const changed = res.rowsAffected ?? 0;
          const base: SparrowFeedback =
            res.kind === "rows" && res.columns.length > 0
              ? {
                  state: "happy",
                  title: `Returned ${res.rows.length} row${res.rows.length === 1 ? "" : "s"}`,
                  message: `Returned ${res.rows.length} row${res.rows.length === 1 ? "" : "s"} from \`${res.database}\`. Edit the query and run again to explore.`,
                  tone: "success",
                }
              : res.kind === "server"
                ? {
                    state: "happy",
                    title: `${res.command ?? "Command"} ran`,
                    message: serverCommandMessage(res),
                    tone: "success",
                  }
                : {
                    state: "happy",
                    title: "Statement executed",
                    message:
                      changed > 0
                        ? `${changed} row${changed === 1 ? "" : "s"} changed in \`${res.database}\`.`
                        : res.statusMessage ?? "Done. No rows were returned by this statement.",
                    tone: "success",
                  };
          setFeedback(withNotes(base, res.notes));
          return;
        }

        const ex = exercise;
        if (res.kind === "server") {
          setFeedback(
            withNotes(
              {
                state: "happy",
                title: `${res.command ?? "Command"} ran`,
                message: serverCommandMessage(res),
                tone: "success",
              },
              res.notes,
            ),
          );
          return;
        }

        let correct = false;
        if (ex.expected.type === "result-set") {
          const ev = evaluateResultSet(res, ex.expected);
          correct = ev.correct;
          if (!correct)
            setFeedback(
              withNotes(
                tutorContext(
                  buildFeedback({ kind: "wrong", reason: ev.reason }),
                  ex,
                  `Expected ${ex.expected.rows?.length ?? "a"} row${
                    ex.expected.rows?.length === 1 ? "" : "s"
                  }, you returned ${res.rows.length}.`,
                ),
                res.notes,
              ),
            );
        } else {
          const table = ex.expected.tableName ?? "";
          const preview = table
            ? await sqlEngine.preview(table, MAX_RESULT_ROWS, res.database)
            : null;
          correct =
            table.length > 0 &&
            preview !== null &&
            evaluateDatabaseState(
              { success: true, columns: preview.columns, rows: preview.rows },
              ex.expected,
            );
          if (!correct)
            setFeedback(
              withNotes(
                tutorContext(
                  buildFeedback({ kind: "wrong", reason: "wrong-rows" }),
                  ex,
                  `The ${ex.expected.tableName} table should hold ${ex.expected.rowCount ?? ""} rows once your change is right.`,
                ),
                res.notes,
              ),
            );
        }

        if (correct) {
          const snapshot = actions.getSnapshot();
          const newXp = !snapshot.exercises[ex.id];
          const newDaily =
            mode === "daily" && !snapshot.dailyCompleted.includes(daily.date);
          actions.completeExercise(ex.id, ex.xp);
          if (mode === "daily") {
            actions.completeDailyChallenge(daily.date, daily.xpBonus);
          }
          const earned =
            (newXp ? ex.xp : 0) + (newDaily ? daily.xpBonus : 0);
          setFeedback(
            withNotes(
              earned > 0
                ? buildFeedback({ kind: "correct", xp: earned, note: ex.successNote })
                : {
                    state: "celebrating",
                    title: "Correct again!",
                    message: `${ex.successNote}\n\nYou already banked the XP for this one — this time it was pure practice.`,
                    tone: "success",
                  },
              res.notes,
            ),
          );
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        setEngineError(msg);
        setFeedback({
          state: "confused",
          title: "That did not run",
          message: "The sandbox hit an unexpected problem running your query. Try reloading the page.",
          tone: "danger",
        });
      } finally {
        setBusy(false);
      }
    },
    [actions, awardRunBadges, daily, exercise, mode, pushHistory, refreshAll, targetDb],
  );

  const handleRun = useCallback(() => {
    if (!sql.trim()) {
      setFeedback(buildFeedback({ kind: "empty" }));
      return;
    }
    if (isDangerous(sql)) {
      setFeedback(dangerousFeedback());
      setDangerSql(sql);
      return;
    }
    void runNow(sql);
  }, [runNow, sql]);

  const handleSqlChange = useCallback((next: string) => {
    setSql(next);
    setErrorRange(null);
  }, []);

  const handleJumpToError = useCallback(() => {
    if (!errorRange) return;
    setFocusOffset({ offset: errorRange.start, nonce: Date.now() });
  }, [errorRange]);

  const useDatabase = useCallback(
    async (name: string) => {
      setDbMenuOpen(false);
      setBusy(true);
      try {
        await sqlEngine.use(name);
        setActiveDb(name);
        setExpandedDbs((prev) => ({ ...prev, [name]: true }));
        await refreshAll();
        setFeedback({
          state: "happy",
          title: `Now using \`${name}\``,
          message: `Switched active database to \`${name}\`. Queries you run now execute against \`${name}\`.`,
          tone: "success",
        });
      } catch (err) {
        setFeedback({
          state: "confused",
          title: "Could not switch database",
          message: err instanceof Error ? err.message : String(err),
          tone: "danger",
        });
      } finally {
        setBusy(false);
      }
    },
    [refreshAll],
  );

  const selectTable = useCallback(
    async (database: string, table: string) => {
      const preview = await sqlEngine.preview(table, 50, database);
      setResult({
        success: true,
        kind: "rows",
        database,
        statement: `SELECT * FROM ${table};`,
        columns: preview.columns,
        rows: preview.rows,
        totalRows: preview.totalRows,
        truncated: preview.totalRows > preview.rows.length,
        notes:
          database === activeDb
            ? []
            : [`This is a preview of \`${database}\`. Run USE ${database}; to query it yourself.`],
      });
      setView("table");
    },
    [activeDb],
  );

  const handlePreviewData = useCallback(() => {
    const firstTable = activeTables[0]?.name ?? "students";
    void selectTable(activeDb, firstTable);
  }, [activeDb, activeTables, selectTable]);

  const toggleDbExpand = (dbName: string) => {
    setExpandedDbs((prev) => ({
      ...prev,
      [dbName]: !(prev[dbName] ?? dbName === activeDb),
    }));
  };

  const toggleTableExpand = (dbName: string, tableName: string) => {
    const key = `${dbName}.${tableName}`;
    setExpandedTables((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  return (
    <section
      id="lab"
      aria-label="Live SQL Lab"
      className={
        isFitScreen
          ? "fixed inset-0 z-[90] flex h-[100dvh] w-[100vw] flex-col overflow-hidden bg-[#0e0c0a] p-3 sm:p-4 lg:p-5 text-[#f3efe6]"
          : "relative scroll-mt-[64px] bg-[#0e0c0a] py-6 sm:py-8 lg:py-6 text-[#f3efe6]"
      }
    >
      <div
        className={
          isFitScreen
            ? "mx-auto flex h-full w-full max-w-[1600px] min-h-0 flex-1 flex-col"
            : "mx-auto max-w-[1480px] px-4 sm:px-6 lg:px-8"
        }
      >
        {engineError && (
          <div
            role="alert"
            className="mb-4 flex shrink-0 items-center justify-between gap-3 rounded-[14px] border border-[color:var(--danger)]/40 bg-[color:var(--danger)]/10 px-4 py-3 text-xs text-[#f3efe6]"
          >
            <span>The SQL sandbox encountered an error: {engineError}</span>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="rounded-lg border border-[#38332d] bg-[#181613] px-3 py-1 font-mono text-[11px]"
            >
              Reload
            </button>
          </div>
        )}

        {/* 3-COLUMN BENTO GRID MATCHING REFERENCE SCREENSHOT */}
        <div
          className={`grid grid-cols-1 gap-4 lg:grid-cols-[315px_minmax(0,1fr)_325px] xl:grid-cols-[335px_minmax(0,1fr)_345px] lg:items-stretch ${
            isFitScreen
              ? "min-h-0 flex-1 overflow-y-auto lg:h-full lg:overflow-hidden"
              : "lg:h-[calc(100dvh-96px)] lg:min-h-[640px] lg:max-h-[860px]"
          }`}
        >
          {/* ================================================================
              LEFT COLUMN: Exercise Prompt, Task, Prev/Next, Schema & Preview
             ================================================================ */}
          <div className="flex min-h-0 flex-col overflow-hidden rounded-[20px] border border-[#26231f] bg-[#141210] p-5">
            {/* Top Meta Row: [SQL] BEGINNER   1 / 7 */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="rounded-[6px] border border-[#6e5626] bg-[#241c0e] px-2 py-0.5 font-mono text-[11px] font-semibold text-[#eab308]">
                  SQL
                </span>
                <span className="font-mono text-[11.5px] uppercase tracking-[0.06em] text-[#8c857b]">
                  {exercise.difficulty}
                </span>
              </div>
              <span className="font-mono text-[12px] text-[#8c857b]">
                {index + 1} / {exercises.length}
              </span>
            </div>

            {/* Lesson Title & Description */}
            <h2 className="mt-3.5 font-mono text-[16px] font-semibold tracking-[-0.01em] text-[#f3efe6]">
              {exercise.title}
            </h2>
            <p className="mt-2.5 font-mono text-[12.5px] leading-[1.65] text-[#9c958c]">
              {exercise.prompt}
            </p>

            {/* "Your task" Box */}
            <div className="mt-4 rounded-[14px] border border-[#26231f] bg-[#181613] p-3.5">
              <div className="flex items-center gap-2.5">
                <TargetIcon />
                <span className="font-mono text-[13px] font-semibold text-[#f3efe6]">
                  Your task
                </span>
              </div>
              <p className="mt-2 pl-[26px] font-mono text-[12px] leading-[1.6] text-[#9c958c]">
                {renderTaskDescription(exercise.id, exercise.prompt)}
              </p>
            </div>

            {/* Prev / Next Buttons */}
            <div className="mt-3.5 grid grid-cols-2 gap-2.5">
              <button
                type="button"
                disabled={index === 0}
                onClick={() => {
                  setIndex((i) => Math.max(0, i - 1));
                  if (mode !== "learn") setMode("learn");
                }}
                className="h-[38px] rounded-[10px] border border-[#26231f] bg-[#181613] font-mono text-[12.5px] text-[#8c857b] transition-colors hover:border-[#38332d] hover:text-[#f3efe6] disabled:opacity-45 disabled:pointer-events-none"
              >
                ← Prev
              </button>
              <button
                type="button"
                disabled={index === exercises.length - 1}
                onClick={() => {
                  setIndex((i) => Math.min(exercises.length - 1, i + 1));
                  if (mode !== "learn") setMode("learn");
                }}
                className="h-[38px] rounded-[10px] border border-[#332f29] bg-[#181613] font-mono text-[12.5px] font-medium text-[#f3efe6] transition-colors hover:border-[#4a443c] hover:bg-[#1f1c18] disabled:opacity-45 disabled:pointer-events-none"
              >
                Next →
              </button>
            </div>

            {/* Horizontal Divider */}
            <div className="my-4 border-t border-[#221f1c]" />

            {/* Database Schema Section */}
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
              <button
                type="button"
                onClick={() => setSchemaSectionOpen((o) => !o)}
                aria-expanded={schemaSectionOpen}
                className="flex w-full shrink-0 items-center justify-between py-1 text-left"
              >
                <div className="flex items-center gap-2.5">
                  <DatabaseCylinderIcon className="text-[#9c958c]" />
                  <span className="font-mono text-[12.5px] text-[#b8b1a7]">
                    Database Schema
                  </span>
                </div>
                <ChevronUpDownIcon open={schemaSectionOpen} />
              </button>

              {schemaSectionOpen && (
                <div className="mt-2.5 min-h-0 flex-1 space-y-2 overflow-y-auto overscroll-contain pr-0.5">
                  {orderedDatabases.map((db) => {
                    const tables = schemasByDb[db.name] ?? [];
                    const isActive = db.name === activeDb;
                    const isDbOpen = expandedDbs[db.name] ?? isActive;

                    if (!isDbOpen) {
                      return (
                        <div
                          key={db.name}
                          className="flex items-center gap-2.5 rounded-[12px] border border-[#26231f] bg-[#171512] px-3 py-2.5 transition-colors hover:border-[#38332d]"
                        >
                          <button
                            type="button"
                            onClick={() => toggleDbExpand(db.name)}
                            aria-label={`Expand ${db.name}`}
                            className="text-[#8c857b] hover:text-[#f3efe6]"
                          >
                            <SmallChevronRight open={false} />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              toggleDbExpand(db.name);
                              if (!isActive) void useDatabase(db.name);
                            }}
                            className="flex flex-1 items-center gap-2 text-left"
                          >
                            <TableGridSmallIcon className="text-[#9c958c]" />
                            <span className="font-mono text-[12.5px] text-[#e6e0d6]">
                              {db.name}
                            </span>
                            <span className="ml-auto font-mono text-[12px] text-[#8c857b]">
                              {isActive
                                ? "active"
                                : `${tables.length} table${tables.length === 1 ? "" : "s"}`}
                            </span>
                          </button>
                        </div>
                      );
                    }

                    return (
                      <div
                        key={db.name}
                        className="rounded-[14px] border border-[#26231f] bg-[#161412] p-2.5"
                      >
                        <div className="flex items-center gap-2.5 px-1 py-1">
                          <button
                            type="button"
                            onClick={() => toggleDbExpand(db.name)}
                            aria-label={`Collapse ${db.name}`}
                            className="text-[#8c857b] hover:text-[#f3efe6]"
                          >
                            <SmallChevronRight open={true} />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (!isActive) void useDatabase(db.name);
                            }}
                            className="flex flex-1 items-center gap-2 text-left"
                          >
                            <TableGridSmallIcon className="text-[#9c958c]" />
                            <span className="font-mono text-[12.5px] text-[#e6e0d6]">
                              {db.name}
                            </span>
                            <span className="ml-auto font-mono text-[12px] text-[#8c857b]">
                              {isActive
                                ? "active"
                                : `${tables.length} table${tables.length === 1 ? "" : "s"}`}
                            </span>
                          </button>
                        </div>

                        <div className="mt-2 space-y-2">
                          {tables.map((t) => {
                            const tKey = `${db.name}.${t.name}`;
                            const isTableOpen = expandedTables[tKey] ?? false;
                            return (
                              <div
                                key={t.name}
                                className="rounded-[10px] border border-[#26231f] bg-[#1a1815] p-2.5"
                              >
                                <button
                                  type="button"
                                  onClick={() => toggleTableExpand(db.name, t.name)}
                                  className="flex w-full items-center gap-2 text-left"
                                >
                                  <SmallChevronRight open={false} />
                                  <TableGridSmallIcon className="text-[#b8b1a7]" />
                                  <span className="font-mono text-[12.5px] font-semibold text-[#f3efe6]">
                                    {t.name}
                                  </span>
                                  <span className="ml-auto font-mono text-[12px] text-[#9c958c]">
                                    {t.rowCount} row{t.rowCount === 1 ? "" : "s"}
                                  </span>
                                </button>

                                {isTableOpen && (
                                  <div className="mt-2.5 space-y-1.5 pl-1 font-mono text-[12px]">
                                    {t.columns.map((c) => (
                                      <button
                                        key={c.name}
                                        type="button"
                                        onClick={() =>
                                          setInsert({ value: c.name, nonce: Date.now() })
                                        }
                                        className="grid w-full grid-cols-[1fr_76px_28px] items-center text-left transition-colors hover:text-[#f3efe6]"
                                      >
                                        <span className="truncate text-[#a8a196]">
                                          {c.name}
                                        </span>
                                        <span className="uppercase text-[#78726a]">
                                          {c.type || "TEXT"}
                                        </span>
                                        <span className="text-right text-[#78726a]">
                                          {c.pk ? "PK" : ""}
                                        </span>
                                      </button>
                                    ))}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Bottom "Preview data" Button */}
            <button
              type="button"
              onClick={handlePreviewData}
              className="mt-3 flex w-full items-center justify-between rounded-[12px] border border-[#26231f] bg-[#171512] px-3.5 py-2.5 font-mono text-[12.5px] text-[#b8b1a7] transition-colors hover:border-[#38332d] hover:text-[#f3efe6]"
            >
              <span className="flex items-center gap-2.5">
                <DatabaseCylinderIcon className="text-[#8c857b]" />
                <span>Preview data</span>
              </span>
              <SmallChevronRight open={false} />
            </button>
          </div>

          {/* ================================================================
              CENTER COLUMN: Stacked SQL Editor Card + Results Card
             ================================================================ */}
          <div className="flex min-h-0 min-w-0 flex-col gap-3.5">
            {/* TOP CARD: SQL Editor */}
            <div className="flex min-h-[260px] flex-col rounded-[20px] border border-[#26231f] bg-[#141210] p-4 lg:basis-[46%]">
              {/* Editor Top Bar */}
              <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 pb-3.5">
                <div className="flex items-center gap-3.5">
                  <button
                    type="button"
                    onClick={handleRun}
                    disabled={busy}
                    className="inline-flex h-[38px] items-center gap-2 rounded-full bg-[#f3efe6] px-4 font-mono text-[13px] font-semibold text-[#141210] shadow-sm transition-transform hover:bg-white active:scale-[0.98] disabled:opacity-50"
                  >
                    <PlayTriangleIcon />
                    <span>Run query</span>
                  </button>
                  <span className="hidden font-mono text-[12px] text-[#6d675f] sm:inline">
                    Ctrl / Cmd + Enter
                  </span>
                </div>

                {/* Right: Active Database Selector Pill + Fit Screen Button */}
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setDbMenuOpen((o) => !o)}
                      aria-expanded={dbMenuOpen}
                      className="inline-flex h-[36px] items-center gap-2 rounded-full border border-[#26231f] bg-[#181613] px-3.5 font-mono text-[12.5px] text-[#e6e0d6] transition-colors hover:border-[#38332d]"
                    >
                      <DatabaseCylinderIcon className="text-[#9c958c]" />
                      <span>{activeDb}</span>
                      <span
                        className="h-2 w-2 rounded-full bg-[#22c55e]"
                        aria-hidden="true"
                      />
                      <ChevronUpDownIcon open={false} />
                    </button>

                    {dbMenuOpen && (
                      <div className="absolute right-0 top-[42px] z-30 min-w-[180px] rounded-[12px] border border-[#2e2a24] bg-[#181613] p-1.5 shadow-xl">
                        {orderedDatabases.map((db) => (
                          <button
                            key={db.name}
                            type="button"
                            onClick={() => void useDatabase(db.name)}
                            className={`flex w-full items-center justify-between rounded-[8px] px-3 py-2 font-mono text-[12px] transition-colors ${
                              db.name === activeDb
                                ? "bg-[#24201b] text-[#f3efe6]"
                                : "text-[#9c958c] hover:bg-[#1f1c18] hover:text-[#f3efe6]"
                            }`}
                          >
                            <span>{db.name}</span>
                            {db.name === activeDb && (
                              <span className="h-2 w-2 rounded-full bg-[#22c55e]" />
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsFitScreen((f) => !f)}
                    aria-pressed={isFitScreen}
                    title={
                      isFitScreen
                        ? "Exit fit screen mode (Esc)"
                        : "Fit Live Lab to full screen"
                    }
                    className={`inline-flex h-[36px] items-center gap-2 rounded-full border px-3.5 font-mono text-[12.5px] transition-colors ${
                      isFitScreen
                        ? "border-[#f3efe6] bg-[#f3efe6] font-semibold text-[#141210]"
                        : "border-[#26231f] bg-[#181613] text-[#e6e0d6] hover:border-[#38332d] hover:text-white"
                    }`}
                  >
                    {isFitScreen ? <ExitFitScreenIcon /> : <FitScreenIcon />}
                    <span>{isFitScreen ? "Exit fit" : "Fit screen"}</span>
                  </button>
                </div>
              </div>

              {/* SQL Code Editor */}
              <div className="min-h-[190px] flex-1">
                <SqlEditor
                  value={sql}
                  onChange={handleSqlChange}
                  onRun={handleRun}
                  disabled={busy}
                  errorRange={errorRange}
                  tables={activeTables}
                  databases={databaseNames}
                  insert={insert}
                  focusOffset={focusOffset}
                  fillHeight={true}
                />
              </div>
            </div>

            {/* BOTTOM CARD: Results (Table / Messages / History) */}
            <div className="flex min-h-[260px] flex-1 flex-col overflow-hidden rounded-[20px] border border-[#26231f] bg-[#141210] p-4 lg:basis-[54%]">
              {/* Tabs Header */}
              <div
                role="tablist"
                aria-label="Query results view"
                className="flex items-center gap-2 border-b border-[#221f1c] pb-3.5"
              >
                {(
                  [
                    { id: "table", label: "Table" },
                    { id: "terminal", label: "Messages" },
                    { id: "history", label: `History (${history.length})` },
                  ] as const
                ).map((tab) => {
                  const active = view === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      role="tab"
                      aria-selected={active}
                      onClick={() => setView(tab.id)}
                      className={
                        active
                          ? "rounded-full bg-[#f3efe6] px-4 py-1.5 font-mono text-[12.5px] font-semibold text-[#141210]"
                          : "rounded-full border border-[#26231f] bg-[#181613] px-4 py-1.5 font-mono text-[12.5px] text-[#8c857b] transition-colors hover:border-[#38332d] hover:text-[#e6e0d6]"
                      }
                    >
                      {tab.label}
                    </button>
                  );
                })}
              </div>

              {/* Inner Results Container */}
              <div className="mt-3.5 flex flex-1 flex-col overflow-hidden">
                {view === "terminal" ? (
                  <TerminalPanel
                    result={result}
                    database={activeDb}
                    execMs={execMs}
                    fillHeight={true}
                  />
                ) : view === "history" ? (
                  <div className="flex flex-1 flex-col rounded-[14px] border border-dashed border-[#26231f] bg-[#12110f]/60 p-4">
                    {history.length === 0 ? (
                      <div className="flex flex-1 flex-col items-center justify-center py-10 text-center">
                        <p className="font-mono text-[13px] text-[#9c958c]">
                          No query history yet.
                        </p>
                        <p className="mt-1 font-mono text-[12.5px] text-[#78726a]">
                          Queries you run will be saved here for quick reuse.
                        </p>
                      </div>
                    ) : (
                      <ul className="space-y-2 overflow-y-auto">
                        {history.map((h) => (
                          <li key={h.id}>
                            <button
                              type="button"
                              onClick={() => {
                                handleSqlChange(h.sql);
                                setView("table");
                              }}
                              className="flex w-full items-center gap-2.5 rounded-[10px] border border-[#26231f] bg-[#181613] px-3 py-2 text-left font-mono text-[12px] text-[#e6e0d6] transition-colors hover:border-[#38332d]"
                            >
                              <span
                                className={`h-2 w-2 shrink-0 rounded-full ${
                                  h.success ? "bg-[#22c55e]" : "bg-[color:var(--danger)]"
                                }`}
                              />
                              <span className="flex-1 truncate">
                                {h.sql.replace(/\s+/g, " ")}
                              </span>
                              <span className="text-[11px] text-[#78726a]">
                                {h.database}
                              </span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ) : !result || !result.success || result.columns.length === 0 ? (
                  <div className="flex flex-1 flex-col items-center justify-center rounded-[14px] border border-dashed border-[#26231f] bg-[#12110f]/60 px-6 py-12 text-center">
                    <EmptyTableIcon />
                    {result && !result.success ? (
                      <>
                        <p className="mt-3.5 font-mono text-[13px] text-[color:var(--danger)]">
                          {result.error?.message ?? "Query failed to execute."}
                        </p>
                        {errorRange && (
                          <button
                            type="button"
                            onClick={handleJumpToError}
                            className="mt-3 rounded-full border border-[color:var(--danger)]/40 bg-[color:var(--danger)]/10 px-3.5 py-1 font-mono text-[11.5px] text-[color:var(--danger)]"
                          >
                            Jump to error in editor
                          </button>
                        )}
                      </>
                    ) : result?.statusMessage ? (
                      <p className="mt-3.5 font-mono text-[13px] text-[#22c55e]">
                        {result.statusMessage}
                      </p>
                    ) : (
                      <>
                        <p className="mt-3.5 font-mono text-[13px] text-[#9c958c]">
                          No result set to show.
                        </p>
                        <p className="mt-1.5 font-mono text-[13px] leading-[1.65] text-[#8c857b]">
                          Run a SELECT query, or a statement
                          <br />
                          that changes the database.
                        </p>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-1 flex-col overflow-hidden">
                    <TableViewer
                      columns={result.columns}
                      rows={result.rows}
                      status={result.statusMessage}
                      notes={result.notes}
                      fillHeight={true}
                    />
                    {result.notes && result.notes.length > 0 && (
                      <div className="mt-2 shrink-0">
                        <ResultNotes notes={result.notes} />
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ================================================================
              RIGHT COLUMN: Sparrow Mascot, Progressive Hints & SQL Keywords
             ================================================================ */}
          <div className="flex min-h-0 flex-col gap-3.5 overflow-y-auto overscroll-contain rounded-[20px] border border-[#26231f] bg-[#141210] p-4 lg:self-start lg:max-h-full">
            {/* Top: Mascot + Speech Bubble */}
            <div className="flex items-center gap-3">
              <div className="shrink-0">
                <SparrowMascot
                  state={busy ? "thinking" : feedback.state}
                  size={82}
                />
              </div>
              <div
                aria-live="polite"
                aria-atomic="true"
                className="relative flex-1 rounded-[14px] border border-[#26231f] bg-[#181613] px-4 py-3.5"
              >
                {/* Left-pointing triangle pointer */}
                <span
                  aria-hidden="true"
                  className="absolute -left-[6px] top-1/2 h-3 w-3 -translate-y-1/2 rotate-45 border-b border-l border-[#26231f] bg-[#181613]"
                />
                <p className="whitespace-pre-line font-sans text-[12.5px] leading-[1.55] text-[#b8b1a7]">
                  {busy
                    ? "Running your query and checking the result..."
                    : feedback.message}
                </p>
              </div>
            </div>

            {/* Middle: Hints Card */}
            <div className="rounded-[14px] border border-[#26231f] bg-[#181613] px-3.5 py-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <LightbulbIcon />
                  <span className="font-mono text-[12.5px] text-[#e6e0d6]">
                    Hints{" "}
                    <span className="text-[#78726a]">
                      {hintsRevealed}/{exercise.hints.length}
                    </span>
                  </span>
                </div>
                <button
                  type="button"
                  disabled={hintsRevealed >= exercise.hints.length}
                  onClick={() => {
                    if (guided) actions.useHint();
                    setHintsRevealed((n) => Math.min(n + 1, exercise.hints.length));
                  }}
                  className="rounded-[10px] border border-[#2e2a24] bg-[#1d1a16] px-3 py-1.5 font-mono text-[12px] font-medium text-[#e6e0d6] transition-colors hover:border-[#423c34] hover:bg-[#25211c] disabled:opacity-45 disabled:pointer-events-none"
                >
                  Show hint
                </button>
              </div>

              {hintsRevealed > 0 && (
                <ul className="mt-3 space-y-2 border-t border-[#24211d] pt-2.5 font-mono text-[12px] leading-relaxed text-[#9c958c]">
                  {exercise.hints.slice(0, hintsRevealed).map((h, i) => (
                    <li key={i} className="flex gap-2">
                      <span className="text-[#eab308]">{i + 1}.</span>
                      <span>{h}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Bottom: SQL Keywords Card */}
            <div className="rounded-[14px] border border-[#26231f] bg-[#181613] p-3.5">
              <button
                type="button"
                onClick={() => setKeywordsOpen((o) => !o)}
                aria-expanded={keywordsOpen}
                className={`flex w-full items-center justify-between text-left ${
                  keywordsOpen ? "border-b border-[#24211d] pb-3" : ""
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <KeyboardIcon />
                  <span className="font-mono text-[12.5px] text-[#a8a196]">
                    SQL Keywords
                  </span>
                </div>
                <ChevronUpDownIcon open={!keywordsOpen} />
              </button>

              {keywordsOpen && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {SQL_KEYWORDS.map((kw) => (
                    <button
                      key={kw}
                      type="button"
                      onClick={() =>
                        setInsert({ value: `${kw} `, nonce: Date.now() })
                      }
                      className="rounded-[8px] border border-[#26231f] bg-[#1d1a16] px-3 py-1.5 font-mono text-[11.5px] text-[#d6d0c4] transition-colors hover:border-[#3d3730] hover:bg-[#25211c] hover:text-white"
                    >
                      {kw}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Unguarded UPDATE/DELETE confirmation dialog */}
      <AnimatePresence>
        {dangerSql && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] grid place-items-center bg-black/60 p-4 backdrop-blur-sm"
            role="dialog"
            aria-modal="true"
            aria-label="Confirm running an unguarded query"
            onClick={() => setDangerSql(null)}
          >
            <motion.div
              initial={{ scale: 0.94, y: 12 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.96, y: 8 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md rounded-[18px] border border-[#38332d] bg-[#181613] p-6 shadow-2xl"
            >
              <h3 className="font-mono text-base font-semibold text-[#f3efe6]">
                Run this query?
              </h3>
              <p className="mt-2 font-mono text-[12.5px] leading-relaxed text-[#9c958c]">
                It can change or delete every row because it has no WHERE clause.
              </p>
              <pre className="mt-3 overflow-x-auto rounded-lg bg-[#11100e] p-3 font-mono text-[12px] text-[color:var(--danger)]">
                {dangerSql.trim()}
              </pre>
              <div className="mt-5 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setDangerSql(null)}
                  className="rounded-full border border-[#2e2a24] px-4 py-1.5 font-mono text-xs text-[#9c958c] hover:text-[#f3efe6]"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const q = dangerSql;
                    setDangerSql(null);
                    if (q) void runNow(q);
                  }}
                  className="rounded-full bg-[color:var(--danger)] px-4 py-1.5 font-mono text-xs font-semibold text-white"
                >
                  Run anyway
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

/* ============================================================================
   ICONS (Matching the Reference Screenshot)
   ============================================================================ */

function TargetIcon() {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      className="shrink-0 text-[#d99b43]"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.7" />
      <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.7" />
      <path
        d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

function DatabaseCylinderIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      className={`shrink-0 ${className}`}
      aria-hidden="true"
    >
      <ellipse cx="12" cy="5" rx="8" ry="3" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M4 5v14c0 1.66 3.58 3 8 3s8-1.34 8-3V5"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M4 12c0 1.66 3.58 3 8 3s8-1.34 8-3"
        stroke="currentColor"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function TableGridSmallIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      className={`shrink-0 ${className}`}
      aria-hidden="true"
    >
      <rect
        x="3"
        y="4"
        width="18"
        height="16"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path d="M3 9h18M9 9v11" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

function EmptyTableIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      className="text-[#9c958c]"
      aria-hidden="true"
    >
      <rect
        x="3"
        y="4"
        width="18"
        height="16"
        rx="2.5"
        stroke="currentColor"
        strokeWidth="1.7"
      />
      <path d="M3 9.5h18M9.5 9.5V20" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  );
}

function PlayTriangleIcon() {
  return (
    <svg
      width="11"
      height="11"
      viewBox="0 0 16 16"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M4 2.5v11l9-5.5-9-5.5Z" />
    </svg>
  );
}

function ChevronUpDownIcon({ open }: { open: boolean }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      className={`shrink-0 text-[#8c857b] transition-transform ${
        open ? "rotate-180" : ""
      }`}
      aria-hidden="true"
    >
      <path
        d="M6 9l6 6 6-6"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SmallChevronRight({ open }: { open: boolean }) {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      className={`shrink-0 text-[#8c857b] transition-transform ${
        open ? "rotate-90" : ""
      }`}
      aria-hidden="true"
    >
      <path
        d="M9 6l6 6-6 6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function LightbulbIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      className="shrink-0"
      aria-hidden="true"
    >
      <path
        d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.8 10.6c.5.4.8 1 .8 1.7V16h6v-.7c0-.7.3-1.3.8-1.7A6 6 0 0 0 12 3Z"
        fill="#f5b841"
        stroke="#f5b841"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function KeyboardIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      className="shrink-0 text-[#8c857b]"
      aria-hidden="true"
    >
      <rect
        x="2.5"
        y="5"
        width="19"
        height="14"
        rx="2.5"
        stroke="currentColor"
        strokeWidth="1.7"
      />
      <path
        d="M6.5 9h1M10 9h1M13.5 9h1M17 9h.5M6.5 12.5h1M10 12.5h1M13.5 12.5h1M17 12.5h.5M8 16h8"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

function FitScreenIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="shrink-0"
      aria-hidden="true"
    >
      <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
    </svg>
  );
}

function ExitFitScreenIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="shrink-0"
      aria-hidden="true"
    >
      <path d="M4 14h6m0 0v6m0-6-7 7m17-11h-6m0 0V4m0 6 7-7" />
    </svg>
  );
}

