import { useEffect, useState } from "react";

const PAGE_SIZE = 100;

/**
 * The grid and mobile card view of a SQL query result.
 * Includes Table vs. Card view toggle, sticky headers/row-index column,
 * pagination for large result sets, and tap-to-inspect cell details for long values.
 */
export function TableViewer({
  columns,
  rows,
  status,
  notes,
  fillHeight = false,
}: {
  columns: string[];
  rows: unknown[][];
  /** MySQL-shaped OK line for a statement with no result set. */
  status?: string | null;
  /** Learner-facing notes from the router / dialect layer. */
  notes?: string[];
  fillHeight?: boolean;
}) {
  const [copied, setCopied] = useState<null | "md" | "csv">(null);
  const [layout, setLayout] = useState<"table" | "cards">("table");
  const [visibleLimit, setVisibleLimit] = useState(PAGE_SIZE);
  const [inspectedCell, setInspectedCell] = useState<{
    rowIndex: number;
    column: string;
    value: string;
  } | null>(null);

  // Reset pagination and cell inspector when a new result arrives
  useEffect(() => {
    setVisibleLimit(PAGE_SIZE);
    setInspectedCell(null);
  }, [columns, rows]);

  const copyAsMarkdown = () => {
    if (columns.length === 0 || rows.length === 0) return;
    const header = `| ${columns.join(" | ")} |`;
    const divider = `| ${columns.map(() => "---").join(" | ")} |`;
    const body = rows
      .map((r) => `| ${r.map((v) => (v === null ? "NULL" : String(v))).join(" | ")} |`)
      .join("\n");
    void navigator.clipboard.writeText(`${header}\n${divider}\n${body}`);
    setCopied("md");
    setTimeout(() => setCopied(null), 2000);
  };

  const copyAsCSV = () => {
    if (columns.length === 0 || rows.length === 0) return;
    const header = columns.map((c) => `"${c.replace(/"/g, '""')}"`).join(",");
    const body = rows
      .map((r) =>
        r
          .map((v) => (v === null ? "NULL" : `"${String(v).replace(/"/g, '""')}"`))
          .join(","),
      )
      .join("\n");
    void navigator.clipboard.writeText(`${header}\n${body}`);
    setCopied("csv");
    setTimeout(() => setCopied(null), 2000);
  };

  if (columns.length === 0) {
    return (
      <div
        className={`rounded-[14px] border border-dashed border-line px-6 py-8 text-center ${
          fillHeight
            ? "flex h-full min-h-[140px] flex-col items-center justify-center"
            : ""
        }`}
      >
        {status ? (
          <p className="font-mono text-[13px] text-success">{status}</p>
        ) : (
          <p className="text-sm text-muted">
            No result set to show. Run a{" "}
            <span className="font-mono text-accent">SELECT</span> query, or run a
            statement that changes the database.
          </p>
        )}
        {notes && notes.length > 0 && (
          <ul className="mx-auto mt-3 max-w-[60ch] space-y-1 text-left">
            {notes.map((note, i) => (
              <li key={i} className="text-[12.5px] leading-relaxed text-feather">
                ℹ️ {note}
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  }

  const visibleRows = rows.slice(0, visibleLimit);
  const remainingRows = Math.max(0, rows.length - visibleRows.length);

  return (
    <div
      className={`overflow-hidden rounded-[14px] border border-line bg-surface/30 ${
        fillHeight ? "flex h-full flex-col" : ""
      }`}
    >
      {rows.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line bg-surface-2/40 px-3.5 py-2 font-mono text-[11px] text-faint">
          <div className="flex items-center gap-2">
            <span className="tabular-nums">
              {rows.length} row{rows.length === 1 ? "" : "s"} · {columns.length} col
              {columns.length === 1 ? "" : "s"}
            </span>
            <div
              role="group"
              aria-label="Result layout"
              className="inline-flex rounded-full border border-line bg-surface/80 p-0.5"
            >
              <button
                type="button"
                onClick={() => setLayout("table")}
                aria-pressed={layout === "table"}
                className={`rounded-full px-2.5 py-0.5 text-[10.5px] font-semibold transition-colors ${
                  layout === "table"
                    ? "bg-accent text-[color:var(--accent-ink)]"
                    : "text-muted hover:text-ink"
                }`}
              >
                Table
              </button>
              <button
                type="button"
                onClick={() => setLayout("cards")}
                aria-pressed={layout === "cards"}
                className={`rounded-full px-2.5 py-0.5 text-[10.5px] font-semibold transition-colors ${
                  layout === "cards"
                    ? "bg-accent text-[color:var(--accent-ink)]"
                    : "text-muted hover:text-ink"
                }`}
              >
                Cards
              </button>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={copyAsMarkdown}
              className="min-h-[28px] rounded-full border border-line/60 px-2.5 py-0.5 text-[10.5px] transition-colors hover:border-line hover:bg-surface-2 hover:text-ink active:scale-95"
              title="Copy result grid as Markdown table"
            >
              {copied === "md" ? "✓ Copied MD" : "Copy MD"}
            </button>
            <button
              type="button"
              onClick={copyAsCSV}
              className="min-h-[28px] rounded-full border border-line/60 px-2.5 py-0.5 text-[10.5px] transition-colors hover:border-line hover:bg-surface-2 hover:text-ink active:scale-95"
              title="Copy result grid as CSV"
            >
              {copied === "csv" ? "✓ Copied CSV" : "Copy CSV"}
            </button>
          </div>
        </div>
      )}

      {inspectedCell && (
        <div
          role="region"
          aria-label="Cell value inspector"
          className="flex items-start justify-between gap-3 border-b border-accent/30 bg-accent-soft/40 px-3.5 py-2.5 font-mono text-[12px]"
        >
          <div className="min-w-0">
            <span className="text-[10.5px] uppercase tracking-wider text-accent">
              Row #{inspectedCell.rowIndex + 1} · {inspectedCell.column}
            </span>
            <p className="mt-0.5 break-all text-ink">{inspectedCell.value}</p>
          </div>
          <button
            type="button"
            onClick={() => setInspectedCell(null)}
            className="shrink-0 rounded-md border border-line px-2 py-0.5 text-[11px] text-muted hover:text-ink"
            aria-label="Close cell inspector"
          >
            ✕
          </button>
        </div>
      )}

      {layout === "cards" ? (
        <div
          className={`divide-y divide-line overflow-auto overscroll-contain p-3 ${
            fillHeight ? "flex-1 min-h-0" : "max-h-[380px]"
          }`}
        >
          {visibleRows.map((row, ri) => (
            <article
              key={ri}
              className="rounded-xl border border-line/70 bg-surface/60 p-3 mb-2.5 last:mb-0"
            >
              <div className="mb-1.5 flex items-center justify-between border-b border-line/60 pb-1 font-mono text-[11px] text-faint">
                <span>Row #{ri + 1}</span>
                <span>{columns.length} fields</span>
              </div>
              <dl className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                {columns.map((col, ci) => {
                  const val = row[ci];
                  return (
                    <div
                      key={col}
                      className="flex items-baseline justify-between gap-2 rounded-lg bg-surface-2/40 px-2.5 py-1.5 font-mono text-[12px]"
                    >
                      <dt className="shrink-0 text-[11px] font-semibold uppercase tracking-wide text-accent">
                        {col}
                      </dt>
                      <dd className="min-w-0 truncate text-right text-ink tabular-nums">
                        {val === null ? (
                          <span className="italic text-faint/70">NULL</span>
                        ) : (
                          String(val)
                        )}
                      </dd>
                    </div>
                  );
                })}
              </dl>
            </article>
          ))}
          {rows.length === 0 && (
            <p className="py-6 text-center text-sm text-muted">
              Query returned 0 rows.
            </p>
          )}
        </div>
      ) : (
        <div
          className={`overflow-auto overscroll-contain ${
            fillHeight ? "flex-1 min-h-0" : "max-h-[380px]"
          }`}
        >
          <table className="min-w-full border-collapse text-sm">
            <caption className="sr-only">
              Query results: {columns.length} column{columns.length === 1 ? "" : "s"},{" "}
              {rows.length} row{rows.length === 1 ? "" : "s"} shown.
            </caption>
            <thead className="sticky top-0 z-10 bg-surface-2/95 shadow-sm backdrop-blur-sm">
              <tr>
                <th
                  scope="col"
                  className="sticky left-0 z-20 w-10 bg-surface-2/95 px-3 py-2 text-right font-mono text-[11px] font-medium text-faint tabular-nums"
                >
                  #
                </th>
                {columns.map((c) => (
                  <th
                    key={c}
                    scope="col"
                    className="whitespace-nowrap px-4 py-2 text-left font-mono text-[12px] font-semibold uppercase tracking-wide text-accent"
                  >
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visibleRows.map((row, ri) => (
                <tr
                  key={ri}
                  className={`border-t border-line transition-colors hover:bg-accent-soft/40 ${
                    ri % 2 === 1 ? "bg-surface-2/15" : ""
                  }`}
                >
                  <td className="sticky left-0 z-10 bg-surface/95 px-3 py-1.5 text-right font-mono text-[11px] text-faint/70 tabular-nums">
                    {ri + 1}
                  </td>
                  {row.map((v, ci) => {
                    const str = v === null ? "NULL" : String(v);
                    const isLong = str.length > 36;
                    return (
                      <td
                        key={ci}
                        onClick={() => {
                          if (isLong) {
                            setInspectedCell({
                              rowIndex: ri,
                              column: columns[ci] ?? `col_${ci + 1}`,
                              value: str,
                            });
                          }
                        }}
                        title={isLong ? "Tap to inspect full value" : undefined}
                        className={`max-w-[260px] truncate whitespace-nowrap px-4 py-1.5 font-mono text-[13px] text-ink tabular-nums ${
                          isLong ? "cursor-pointer underline decoration-dotted decoration-accent/50" : ""
                        }`}
                      >
                        {v === null ? (
                          <span className="italic text-faint/70">NULL</span>
                        ) : (
                          str
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td
                    colSpan={columns.length + 1}
                    className="px-4 py-6 text-center text-sm text-muted"
                  >
                    Query returned 0 rows.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {remainingRows > 0 && (
        <div className="flex items-center justify-between border-t border-line bg-surface-2/40 px-3.5 py-2 font-mono text-[11.5px] text-muted">
          <span>
            Showing {visibleRows.length} of {rows.length} rows
          </span>
          <button
            type="button"
            onClick={() => setVisibleLimit((n) => n + PAGE_SIZE)}
            className="rounded-full border border-accent/40 bg-accent-soft/60 px-3 py-1 text-[11px] font-semibold text-accent transition-colors hover:bg-accent hover:text-[color:var(--accent-ink)]"
          >
            Load next {Math.min(PAGE_SIZE, remainingRows)} rows
          </button>
        </div>
      )}
    </div>
  );
}

/** Notes attached to a result that did produce rows. */
export function ResultNotes({ notes }: { notes?: string[] }) {
  if (!notes || notes.length === 0) return null;
  return (
    <ul className="space-y-1 rounded-[14px] border border-line bg-surface/40 p-3">
      {notes.map((note, i) => (
        <li key={i} className="flex gap-2 text-[12.5px] leading-relaxed text-muted">
          <span className="mt-[1px] shrink-0 text-feather" aria-hidden="true">
            ℹ️
          </span>
          <span>{note}</span>
        </li>
      ))}
    </ul>
  );
}
