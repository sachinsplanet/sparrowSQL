import { formatMySqlTable, formatResultFooter } from "../../lib/sql/terminalFormat";
import type { SqlRunResult } from "../../lib/types";

/**
 * The result as a MySQL client would print it: an ASCII grid plus the
 * `N rows in set (0.00 sec)` line. Some learners read output better when it looks
 * like the terminal in their textbook, and it is also the only view that shows
 * `NULL` and blob values exactly as the engine returned them.
 */
export function TerminalPanel({
  result,
  database,
  execMs,
  fillHeight = false,
}: {
  result: SqlRunResult | null;
  database: string;
  execMs: number;
  fillHeight?: boolean;
}) {
  if (!result) {
    return (
      <pre
        className={`overflow-auto overscroll-contain rounded-[14px] border border-line bg-[var(--bg-deep)] p-4 font-mono text-[12.5px] leading-[1.6] text-faint ${
          fillHeight ? "h-full" : ""
        }`}
      >
        {`mysql> -- connected to database \`${database}\`\n\nRun a query and its output appears here, exactly the way a terminal would print it.`}
      </pre>
    );
  }

  if (!result.success) {
    return (
      <pre
        className={`overflow-auto overscroll-contain rounded-[14px] border border-[color:var(--danger)]/40 bg-[var(--bg-deep)] p-4 font-mono text-[12.5px] leading-[1.6] text-danger ${
          fillHeight ? "h-full" : ""
        }`}
      >
        {`ERROR ${result.error?.code === "unsupported-command" ? "3000" : "1064"}: ${result.error?.message ?? "The statement did not run"}`}
      </pre>
    );
  }

  // SHOW / DESCRIBE answer with a real result set (`kind: "server"`), so they get
  // a grid too; USE / CREATE DATABASE answer with a status line and print none.
  const hasGrid =
    result.kind !== "status" && (result.columns.length > 0 || result.rows.length > 0);
  const grid = hasGrid ? formatMySqlTable(result.columns, result.rows) : "";
  const footer = formatResultFooter({
    rowCount: result.rows.length,
    totalRows: result.totalRows,
    truncated: result.truncated,
    affected: result.rowsAffected,
    durationMs: execMs,
    isQuery: hasGrid,
  });

  return (
    <div
      className={`overflow-hidden rounded-[14px] border border-line bg-[var(--bg-deep)] ${
        fillHeight ? "flex h-full flex-col" : ""
      }`}
    >
      <pre
        className={`overflow-auto overscroll-contain p-4 font-mono text-[12.5px] leading-[1.6] text-ink ${
          fillHeight ? "flex-1 min-h-0" : "max-h-[320px]"
        }`}
      >
        <span className="text-faint">{`mysql> `}</span>
        {hasGrid ? `${grid}\n` : `${result.statusMessage ?? "Query OK"}\n`}
        <span className="text-success">{footer}</span>
        {result.notes && result.notes.length > 0 && (
          <span className="text-feather">{`\n\n-- ${result.notes.join("\n-- ")}`}</span>
        )}
      </pre>
      <dl className="flex flex-wrap gap-x-6 gap-y-1 border-t border-line px-4 py-2 font-mono text-[11.5px] text-faint">
        <div className="flex gap-1.5">
          <dt>Database</dt>
          <dd className="text-muted">{database}</dd>
        </div>
        <div className="flex gap-1.5">
          <dt>Rows returned</dt>
          <dd className="text-muted">{result.rows.length}</dd>
        </div>
        <div className="flex gap-1.5">
          <dt>Execution time</dt>
          <dd className="text-muted">{execMs} ms</dd>
        </div>
        {(result.rowsAffected ?? 0) > 0 && (
          <div className="flex gap-1.5">
            <dt>Rows affected</dt>
            <dd className="text-muted">{result.rowsAffected}</dd>
          </div>
        )}
      </dl>
    </div>
  );
}
