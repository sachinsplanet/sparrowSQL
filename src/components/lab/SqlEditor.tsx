import { useEffect, useMemo, useRef, useState } from "react";
import type { ErrorHighlight, TableSchema } from "../../lib/types";

interface Token {
  t: string;
  c?: string;
  /** Character offset of this token within the full SQL string. */
  s: number;
}

const KEYWORDS = new Set([
  "SELECT","FROM","WHERE","INSERT","INTO","VALUES","UPDATE","SET","DELETE",
  "CREATE","TABLE","DATABASE","ALTER","DROP","TRUNCATE","RENAME","DISTINCT",
  "ORDER","BY","GROUP","HAVING","LIMIT","OFFSET","JOIN","INNER","LEFT","RIGHT",
  "FULL","OUTER","ON","AND","OR","NOT","IN","BETWEEN","LIKE","AS","PRIMARY",
  "KEY","FOREIGN","UNIQUE","DEFAULT","CHECK","NULL","ASC","DESC","CASE","WHEN",
  "THEN","ELSE","END","UNION","ALL","WITH","INTEGER","VARCHAR","TEXT","REAL",
  "COUNT","SUM","AVG","MIN","MAX","IS","VIEW","TRANSACTION","COMMIT","ROLLBACK",
  "SAVEPOINT","GRANT","REVOKE","CASCADE","CROSS","EXCEPT","INTERSECT","BOOLEAN",
  "FLOAT","DOUBLE","DATE","TIME","YEAR",
]);

const RE = /(--[^\n]*)|('(?:[^']|'')*')|(\b\d+(?:\.\d+)?\b)|([A-Za-z_][A-Za-z0-9_]*)/g;

function tokenize(sql: string): Token[] {
  const out: Token[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  RE.lastIndex = 0;
  while ((m = RE.exec(sql)) !== null) {
    if (m.index > last) out.push({ t: sql.slice(last, m.index), s: last });
    if (m[1]) out.push({ t: m[1], c: "#78726a", s: m.index });
    else if (m[2]) out.push({ t: m[2], c: "var(--success)", s: m.index });
    else if (m[3]) out.push({ t: m[3], c: "var(--feather)", s: m.index });
    else if (m[4])
      out.push({
        t: m[4],
        c: KEYWORDS.has(m[4].toUpperCase()) ? "#f3efe6" : undefined,
        s: m.index,
      });
    last = m.index + m[0].length;
  }
  if (last < sql.length) out.push({ t: sql.slice(last), s: last });
  return out;
}

const shared =
  "font-mono text-[16px] sm:text-[13.5px] leading-[1.65] sm:leading-[1.7] tracking-normal whitespace-pre-wrap break-words p-3.5 sm:p-4 m-0 border-0";

const MOBILE_SYMBOLS: Array<{ label: string; insert: string; kind: "kw" | "sym" }> = [
  { label: "SELECT", insert: "SELECT ", kind: "kw" },
  { label: "FROM", insert: "FROM ", kind: "kw" },
  { label: "WHERE", insert: "WHERE ", kind: "kw" },
  { label: "JOIN", insert: "JOIN ", kind: "kw" },
  { label: "ON", insert: "ON ", kind: "kw" },
  { label: "GROUP BY", insert: "GROUP BY ", kind: "kw" },
  { label: "ORDER BY", insert: "ORDER BY ", kind: "kw" },
  { label: "LIMIT", insert: "LIMIT ", kind: "kw" },
  { label: "*", insert: "*", kind: "sym" },
  { label: "=", insert: " = ", kind: "sym" },
  { label: "!=", insert: " != ", kind: "sym" },
  { label: ",", insert: ", ", kind: "sym" },
  { label: "'", insert: "''", kind: "sym" },
  { label: "(", insert: "(", kind: "sym" },
  { label: ")", insert: ")", kind: "sym" },
  { label: ";", insert: ";", kind: "sym" },
];

/* ---------------------------------------------------------------- completions */

/**
 * Words worth offering before the learner has typed a name: statement starters
 * and the clauses that sit in the middle of a query. `FROM` belongs here as
 * well — a learner typing `SELECT * FRO` wants the keyword, not `DELETE FROM`.
 */
const COMMANDS = [
  "SELECT",
  "FROM",
  "INSERT INTO",
  "UPDATE",
  "SET",
  "DELETE FROM",
  "CREATE TABLE",
  "CREATE DATABASE",
  "DROP TABLE",
  "DROP DATABASE",
  "ALTER TABLE",
  "TRUNCATE TABLE",
  "SHOW DATABASES",
  "SHOW TABLES",
  "SHOW COLUMNS",
  "DESCRIBE",
  "USE",
  "WHERE",
  "ORDER BY",
  "GROUP BY",
  "HAVING",
  "LIMIT",
  "JOIN",
  "LEFT JOIN",
  "INNER JOIN",
  "ON",
  "AS",
  "DISTINCT",
  "LIKE",
  "BETWEEN",
  "PRIMARY KEY",
  "FOREIGN KEY",
  "CREATE VIEW",
  "START TRANSACTION",
  "COMMIT",
  "ROLLBACK",
  "SAVEPOINT",
  "CROSS JOIN",
  "UNION ALL",
  "INTERSECT",
  "EXCEPT",
];

/** Clauses after which only table names make sense. */
const TABLE_CONTEXT = new Set([
  "from",
  "into",
  "join",
  "inner",
  "left",
  "right",
  "full",
  "update",
  "table",
  "describe",
  "desc",
]);

/** Clauses after which column names are the useful suggestion. */
const COLUMN_CONTEXT = new Set(["by", "where", "set", "on", "having", "and", "or", "select"]);

export interface Completion {
  label: string;
  /** Right-aligned hint: table · type, or what the word does in a statement. */
  detail: string;
  /** Text written into the editor. */
  insert: string;
  kind: "table" | "column" | "keyword" | "database";
}

export interface CompletionSuggestion {
  /** Fragment being completed. */
  prefix: string;
  /** Caret offset where the replacement starts. */
  start: number;
  items: Completion[];
}

const MAX_SUGGESTIONS = 7;

function escapeRe(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function rank(pool: Completion[], prefix: string): Completion[] {
  const p = prefix.toLowerCase();
  if (!p) return pool.slice(0, MAX_SUGGESTIONS);
  const starts: Completion[] = [];
  const contains: Completion[] = [];
  for (const item of pool) {
    const label = item.label.toLowerCase();
    if (label.startsWith(p)) starts.push(item);
    else if (label.includes(p)) contains.push(item);
  }
  return [...starts, ...contains].slice(0, MAX_SUGGESTIONS);
}

function tableCompletions(tables: TableSchema[]): Completion[] {
  return tables.map((t) => ({
    label: t.name,
    detail: `${t.columns.length} col${t.columns.length === 1 ? "" : "s"} · ${t.rowCount} row${
      t.rowCount === 1 ? "" : "s"
    }`,
    insert: t.name,
    kind: "table" as const,
  }));
}

function columnCompletions(tables: TableSchema[]): Completion[] {
  const seen = new Set<string>();
  const out: Completion[] = [];
  for (const table of tables) {
    for (const column of table.columns) {
      const key = column.name.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      out.push({
        label: column.name,
        detail: `${table.name}${column.pk ? " · PK" : column.fk ? " · FK" : ""}`,
        insert: column.name,
        kind: "column" as const,
      });
    }
  }
  return out;
}

/**
 * Schema-aware completions for the fragment in front of the caret.
 *
 * Exported pure so the ranking rules are testable without a DOM: `students.`
 * narrows to that table's columns, `FROM ` narrows to tables, `USE ` narrows to
 * databases, and anything else offers columns of the tables already mentioned in
 * the statement before commands.
 */
export function suggestCompletions(
  before: string,
  tables: TableSchema[],
  databases: string[] = [],
): CompletionSuggestion {
  const qualified = /([A-Za-z_][A-Za-z0-9_]*)\.([A-Za-z_]*)$/.exec(before);
  if (qualified) {
    const tableName = (qualified[1] ?? "").toLowerCase();
    const prefix = qualified[2] ?? "";
    const table = tables.find((t) => t.name.toLowerCase() === tableName);
    if (!table) return { prefix, start: before.length - prefix.length, items: [] };
    const items = rank(
      table.columns.map((c) => ({
        label: c.name,
        detail: c.type || "column",
        insert: c.name,
        kind: "column" as const,
      })),
      prefix,
    );
    return { prefix, start: before.length - prefix.length, items };
  }

  const word = /[A-Za-z_][A-Za-z0-9_]*$/.exec(before);
  const prefix = word?.[0] ?? "";
  const start = before.length - prefix.length;
  const rest = before.slice(0, start);
  const prevWord =
    /([A-Za-z_][A-Za-z0-9_]*)[\s(]*$/i.exec(rest)?.[1]?.toLowerCase() ?? "";

  if (prefix === "") return { prefix, start, items: [] };

  if (prevWord === "use") {
    const items = rank(
      databases.map((name) => ({
        label: name,
        detail: "database",
        insert: name,
        kind: "database" as const,
      })),
      prefix,
    );
    if (items.length > 0) return { prefix, start, items };
  }

  if (TABLE_CONTEXT.has(prevWord)) {
    const items = rank(tableCompletions(tables), prefix);
    if (items.length > 0) return { prefix, start, items };
  }

  // Columns of the tables this statement already mentions, else every table.
  const mentioned = tables.filter((t) =>
    new RegExp(`\\b${escapeRe(t.name)}\\b`, "i").test(rest),
  );
  const scoped = COLUMN_CONTEXT.has(prevWord)
    ? (mentioned.length > 0 ? mentioned : tables)
    : (mentioned.length > 0 ? mentioned : []);

  const pool: Completion[] = [
    ...columnCompletions(scoped),
    ...(prevWord === "select" ? [] : tableCompletions(tables)),
    ...COMMANDS.map((c) => ({
      label: c,
      detail: "keyword",
      insert: c,
      kind: "keyword" as const,
    })),
  ];
  return { prefix, start, items: rank(pool, prefix) };
}

interface Menu {
  items: Completion[];
  index: number;
  start: number;
}

export function SqlEditor({
  value,
  onChange,
  onRun,
  disabled,
  errorRange,
  tables,
  databases,
  insert,
  focusOffset,
  fillHeight = false,
  onEditorFocus,
}: {
  value: string;
  onChange: (v: string) => void;
  onRun: () => void;
  disabled?: boolean;
  /** Span to underline as the likely source of the current error. */
  errorRange?: ErrorHighlight | null;
  /** Schema of the database in use, for table + column completion. */
  tables?: TableSchema[];
  /** Database names, for `USE`. */
  databases?: string[];
  /** Bump `nonce` to drop `value` into the editor at the caret. */
  insert?: { value: string; nonce: number } | null;
  /** Bump `nonce` to focus the editor at a specific character offset (e.g., error jump). */
  focusOffset?: { offset: number; nonce: number } | null;
  /** When true, stretches to fill available vertical space with internal scroll */
  fillHeight?: boolean;
  /** Optional callback fired when the SQL editor textarea receives focus */
  onEditorFocus?: () => void;
}) {
  const ta = useRef<HTMLTextAreaElement>(null);
  const pre = useRef<HTMLPreElement>(null);
  const gutter = useRef<HTMLDivElement>(null);
  const undoStack = useRef<string[]>([]);
  const tokens = useMemo(() => tokenize(value), [value]);
  const lineCount = value.split("\n").length;
  const [caret, setCaret] = useState(0);
  /** Which row of the open list is highlighted, tied to the fragment it is for. */
  const [selection, setSelection] = useState<{ sig: string; index: number }>({
    sig: "",
    index: 0,
  });
  /** Fragment the learner dismissed with Esc (or blurred away); stays shut. */
  const [dismissedSig, setDismissedSig] = useState<string | null>(null);
  const latest = useRef({ value, onChange });
  latest.current = { value, onChange };

  const recordAndChange = (next: string) => {
    const prev = latest.current.value;
    if (prev !== next) {
      undoStack.current.push(prev);
      if (undoStack.current.length > 40) undoStack.current.shift();
    }
    latest.current.onChange(next);
  };

  const handleUndo = () => {
    const prev = undoStack.current.pop();
    if (prev === undefined) return;
    latest.current.onChange(prev);
    requestAnimationFrame(() => {
      const input = ta.current;
      if (!input) return;
      input.focus();
      const pos = prev.length;
      input.selectionStart = input.selectionEnd = pos;
      setCaret(pos);
    });
  };

  const schemaTables = tables ?? [];
  const schemaDatabases = databases ?? [];

  // The list is derived, never stored: an effect that wrote menu state would
  // re-run on every render and loop.
  const suggestion = useMemo(
    () =>
      disabled
        ? { prefix: "", start: 0, items: [] as Completion[] }
        : suggestCompletions(
            value.slice(0, Math.min(caret, value.length)),
            schemaTables,
            schemaDatabases,
          ),
    [value, caret, disabled, schemaTables, schemaDatabases],
  );

  const sig = `${suggestion.start}:${suggestion.prefix}`;
  const visible = !disabled && suggestion.items.length > 0 && dismissedSig !== sig;
  const index =
    selection.sig === sig
      ? Math.min(selection.index, Math.max(0, suggestion.items.length - 1))
      : 0;
  const menu: Menu | null = visible
    ? { items: suggestion.items, index, start: suggestion.start }
    : null;

  const insertAtCaret = (snippet: string, placeInsideQuotes = false) => {
    const el = ta.current;
    const current = latest.current.value;
    const start = el && typeof el.selectionStart === "number" ? el.selectionStart : current.length;
    const end = el && typeof el.selectionEnd === "number" ? el.selectionEnd : start;
    const next = `${current.slice(0, start)}${snippet}${current.slice(end)}`;
    recordAndChange(next);
    const pos = placeInsideQuotes ? start + 1 : start + snippet.length;
    requestAnimationFrame(() => {
      const input = ta.current;
      if (!input) return;
      input.focus();
      input.selectionStart = input.selectionEnd = pos;
      setCaret(pos);
    });
  };

  // Clicking a table in the explorer drops its name in where the caret sits.
  useEffect(() => {
    const request = insert;
    if (!request) return;
    insertAtCaret(request.value);
    // Only re-run when a new insertion is asked for.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [insert?.nonce]);

  // Jumping to an error offset focuses the textarea and places the caret there.
  useEffect(() => {
    if (!focusOffset) return;
    const el = ta.current;
    if (!el) return;
    const pos = Math.max(0, Math.min(focusOffset.offset, latest.current.value.length));
    el.focus();
    el.selectionStart = el.selectionEnd = pos;
    setCaret(pos);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusOffset?.nonce]);

  const acceptCompletion = (item: Completion) => {
    if (!menu) return;
    const el = ta.current;
    const at = el ? (el.selectionStart ?? caret) : caret;
    const safeStart = Math.min(menu.start, at);
    const next = `${value.slice(0, safeStart)}${item.insert}${value.slice(at)}`;
    recordAndChange(next);
    const pos = safeStart + item.insert.length;
    setDismissedSig(`${pos}:`);
    requestAnimationFrame(() => {
      if (!el) return;
      el.focus();
      el.selectionStart = el.selectionEnd = pos;
      setCaret(pos);
    });
  };

  const overlaps = (tk: Token): boolean =>
    !!errorRange && tk.s < errorRange.end && tk.s + tk.t.length > errorRange.start;

  const syncScroll = () => {
    if (pre.current && ta.current) {
      pre.current.scrollTop = ta.current.scrollTop;
      pre.current.scrollLeft = ta.current.scrollLeft;
    }
    if (gutter.current && ta.current) gutter.current.scrollTop = ta.current.scrollTop;
  };

  const trackCaret = () => {
    const el = ta.current;
    if (el) setCaret(el.selectionStart);
  };

  const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Ctrl/Cmd + Enter runs the query
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      onRun();
      return;
    }
    if (menu) {
      const last = menu.items.length - 1;
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelection({ sig, index: menu.index >= last ? 0 : menu.index + 1 });
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelection({ sig, index: menu.index <= 0 ? last : menu.index - 1 });
        return;
      }
      if (e.key === "Escape") {
        e.preventDefault();
        setDismissedSig(sig);
        return;
      }
      if (e.key === "Tab" || (e.key === "Enter" && !e.shiftKey)) {
        e.preventDefault();
        const item = menu.items[menu.index];
        if (item) acceptCompletion(item);
        return;
      }
    }
    // Tab inserts two spaces
    if (e.key === "Tab") {
      e.preventDefault();
      const el = e.currentTarget;
      const s = el.selectionStart;
      const next = value.slice(0, s) + "  " + value.slice(el.selectionEnd);
      recordAndChange(next);
      setDismissedSig(null);
      requestAnimationFrame(() => {
        el.selectionStart = el.selectionEnd = s + 2;
        setCaret(s + 2);
      });
    }
  };

  return (
    <div
      className={`flex flex-col overflow-hidden rounded-[12px] border border-[#26231f] bg-[#11100e] ${
        fillHeight ? "h-full min-h-[160px]" : ""
      }`}
    >
      <div
        className={`relative flex overflow-hidden ${
          fillHeight ? "h-full flex-1 min-h-0" : "h-[230px] sm:h-[260px]"
        }`}
      >
        {/* gutter */}
        <div
          ref={gutter}
          className="w-10 shrink-0 select-none overflow-hidden border-r border-[#221f1c] bg-[#13110f] py-3.5 text-right sm:w-12 sm:py-4"
          aria-hidden="true"
        >
          {Array.from({ length: lineCount }).map((_, i) => (
            <div
              key={i}
              className="pr-2.5 font-mono text-[13px] leading-[1.65] text-[#6d675f] sm:pr-3.5 sm:text-[13.5px] sm:leading-[1.7]"
            >
              {i + 1}
            </div>
          ))}
        </div>

        <div className="relative flex-1">
          <pre
            ref={pre}
            aria-hidden="true"
            className={`${shared} pointer-events-none absolute inset-0 overflow-auto text-[#f3efe6]`}
          >
            {tokens.map((tk, i) =>
              tk.c ? (
                <span
                  key={i}
                  style={{
                    color: tk.c,
                    fontStyle: tk.t.startsWith("--") ? "italic" : undefined,
                    textDecoration:
                      overlaps(tk) && !tk.t.startsWith("--")
                        ? "underline wavy var(--danger) 2px"
                        : undefined,
                    textUnderlineOffset: "3px",
                  }}
                >
                  {tk.t}
                </span>
              ) : (
                <span
                  key={i}
                  style={{
                    textDecoration: overlaps(tk)
                      ? "underline wavy var(--danger) 2px"
                      : undefined,
                    textUnderlineOffset: "3px",
                  }}
                >
                  {tk.t}
                </span>
              ),
            )}
            {"\n"}
          </pre>
          <textarea
            ref={ta}
            value={value}
            disabled={disabled}
            onChange={(e) => {
              recordAndChange(e.target.value);
              setCaret(e.target.selectionStart);
            }}
            onScroll={syncScroll}
            onKeyDown={handleKey}
            onKeyUp={trackCaret}
            onClick={trackCaret}
            onSelect={trackCaret}
            onFocus={() => onEditorFocus?.()}
            onBlur={() => setDismissedSig(sig)}
            spellCheck={false}
            autoCapitalize="off"
            autoCorrect="off"
            aria-label="SQL editor"
            aria-expanded={menu !== null}
            aria-controls="sql-completions"
            aria-autocomplete="list"
            role="combobox"
            aria-activedescendant={
              menu ? `sql-completion-${menu.index}` : undefined
            }
            className={`${shared} absolute inset-0 h-full w-full resize-none overflow-auto overscroll-contain bg-transparent text-transparent caret-[color:var(--accent)] outline-none disabled:opacity-60`}
            style={{ WebkitTextFillColor: "transparent" }}
          />
        </div>

        {menu && (
          <div
            id="sql-completions"
            role="listbox"
            aria-label="Completions"
            className="absolute inset-x-2 bottom-2 z-20 overflow-hidden rounded-[12px] border border-line bg-[var(--bg-deep)]/95 shadow-[var(--glow)] backdrop-blur-sm"
          >
            <ul className="max-h-[172px] overflow-auto py-1">
              {menu.items.map((item, i) => (
                <li
                  key={`${item.kind}-${item.label}`}
                  id={`sql-completion-${i}`}
                  role="option"
                  aria-selected={i === menu.index}
                  onMouseEnter={() => setSelection({ sig, index: i })}
                  onMouseDown={(e) => {
                    // Keep the textarea's selection alive until the insert runs.
                    e.preventDefault();
                    acceptCompletion(item);
                  }}
                  className={`flex min-h-[38px] cursor-pointer items-center gap-2 px-3 py-1.5 font-mono text-[12.5px] ${
                    i === menu.index ? "bg-accent-soft text-accent" : "text-muted"
                  }`}
                >
                  <span className="truncate">{item.label}</span>
                  <span className="ml-auto shrink-0 text-[10.5px] uppercase tracking-wide text-faint">
                    {item.detail}
                  </span>
                </li>
              ))}
            </ul>
            <p className="border-t border-line px-3 py-1 font-mono text-[10.5px] text-faint">
              ↑↓ choose · Tab / Enter insert · Esc dismiss
            </p>
          </div>
        )}
      </div>

      {/* Mobile & Touch Quick-Insert SQL Symbol Bar */}
      <div
        role="toolbar"
        aria-label="Quick SQL keywords and symbols"
        className="no-scrollbar flex items-center gap-1.5 overflow-x-auto border-t border-line bg-surface/80 px-2.5 py-2 lg:hidden"
      >
        <span className="shrink-0 pr-1 font-mono text-[10px] uppercase tracking-wider text-faint">
          Insert
        </span>
        {MOBILE_SYMBOLS.map((sym) => (
          <button
            key={sym.label}
            type="button"
            disabled={disabled}
            onPointerDown={(e) => {
              // Keep virtual keyboard open on touch devices
              e.preventDefault();
            }}
            onClick={() => insertAtCaret(sym.insert, sym.label === "'")}
            className={`min-h-[36px] shrink-0 rounded-lg border px-2.5 py-1 font-mono text-[12px] font-semibold transition-transform active:scale-95 disabled:opacity-40 ${
              sym.kind === "kw"
                ? "border-accent/30 bg-accent-soft/70 text-accent hover:border-accent/60"
                : "border-line bg-surface-2 text-ink hover:border-line-strong"
            }`}
          >
            {sym.label}
          </button>
        ))}
        <button
          type="button"
          disabled={disabled}
          onPointerDown={(e) => e.preventDefault()}
          onClick={handleUndo}
          title="Undo last edit"
          aria-label="Undo last edit"
          className="ml-auto min-h-[36px] shrink-0 rounded-lg border border-line bg-surface-2 px-2.5 py-1 font-mono text-[11.5px] text-muted transition-colors hover:text-ink active:scale-95 disabled:opacity-40"
        >
          ↶ Undo
        </button>
      </div>
    </div>
  );
}
