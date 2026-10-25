import { useState } from "react";
import type { DatabaseInfo, TableSchema, TableColumnInfo } from "../../lib/types";

/**
 * Every database in the sandbox, not just the one in use.
 *
 * Clicking a database runs `USE`, clicking a table previews it and drops its
 * name into the editor. Columns carry the information a learner needs to write a
 * valid statement: type, whether NULL is allowed, the default, and where a
 * foreign key points.
 */
export function DatabaseExplorer({
  databases,
  schemasByDb,
  activeDb,
  onUseDatabase,
  onSelectTable,
  onCreateDatabase,
  onSelectColumn,
}: {
  databases: DatabaseInfo[];
  schemasByDb: Record<string, TableSchema[]>;
  activeDb: string;
  onUseDatabase: (name: string) => void;
  onSelectTable: (database: string, table: string) => void;
  onCreateDatabase: () => void;
  onSelectColumn?: (column: string) => void;
}) {
  const [open, setOpen] = useState<string | null>(null);
  const [openDb, setOpenDb] = useState<Record<string, boolean>>({});

  const toggleDb = (name: string) =>
    setOpenDb((current) => ({ ...current, [name]: !current[name] }));

  // The list is a snapshot that can lag a `USE` by one render, so the name the
  // lab holds wins over the flag on the row; the flag is only a fallback.
  const isActive = (name: string, flagged: boolean) =>
    name === activeDb || (flagged && !activeDb);

  return (
    <div className="rounded-[14px] border border-line bg-surface/50 p-3">
      <div className="flex items-center gap-2 px-1 pb-2">
        <FolderIcon />
        <span className="font-mono text-[12px] uppercase tracking-[0.14em] text-faint">
          Databases
        </span>
        <span className="ml-auto font-mono text-[11px] text-faint">
          {databases.length} · using {activeDb || "—"}
        </span>
      </div>

      <ul className="space-y-1">
        {databases.map((db) => {
          const tables = schemasByDb[db.name] ?? [];
          const active = isActive(db.name, db.active);
          const expanded = openDb[db.name] ?? active;
          return (
            <li
              key={db.name}
              className={`rounded-lg border transition-colors ${
                active ? "border-accent/40 bg-accent-soft/40" : "border-transparent"
              }`}
            >
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => toggleDb(db.name)}
                  aria-expanded={expanded}
                  className="shrink-0 rounded p-1 text-faint transition-colors hover:text-ink"
                  aria-label={expanded ? `Collapse ${db.name}` : `Expand ${db.name}`}
                >
                  <ChevronIcon open={expanded} />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (!active) onUseDatabase(db.name);
                    setOpenDb((current) => ({ ...current, [db.name]: true }));
                  }}
                  className="flex min-w-0 flex-1 items-center gap-2 rounded-lg px-1.5 py-1.5 text-left transition-colors hover:bg-surface-2"
                  aria-current={active ? "true" : undefined}
                  title={active ? "You are using this database" : `USE ${db.name}`}
                >
                  <DatabaseIcon active={active} />
                  <span
                    className={`truncate font-mono text-[13px] ${
                      active ? "text-accent" : "text-ink"
                    }`}
                  >
                    {db.name}
                  </span>
                  <span className="ml-auto shrink-0 font-mono text-[10px] text-faint">
                    {active ? "active" : `${tables.length} table${tables.length === 1 ? "" : "s"}`}
                  </span>
                </button>
              </div>

              {expanded && (
                <ul className="ml-4 mt-0.5 space-y-0.5 border-l border-line pl-2.5 pb-1.5">
                  {tables.length === 0 && (
                    <li className="px-1.5 py-1 text-[12px] text-faint">
                      {active
                        ? "No tables yet — CREATE TABLE students (...);"
                        : `Run USE ${db.name}; to work in this database.`}
                    </li>
                  )}
                  {tables.map((t) => {
                    const tableOpen = open === `${db.name}.${t.name}`;
                    return (
                      <li key={t.name}>
                        <button
                          type="button"
                          onClick={() => {
                            setOpen(tableOpen ? null : `${db.name}.${t.name}`);
                            if (active) onSelectTable(db.name, t.name);
                          }}
                          aria-expanded={tableOpen}
                          className="flex w-full items-center gap-2 rounded-md px-1.5 py-1 text-left transition-colors hover:bg-surface-2"
                        >
                          <ChevronIcon open={tableOpen} />
                          <TableIcon />
                          <span className="font-mono text-[12.5px] text-ink">{t.name}</span>
                          <span className="ml-auto rounded-full bg-surface-2 px-1.5 py-0.5 font-mono text-[10px] text-faint">
                            {t.rowCount}
                          </span>
                        </button>
                        {tableOpen && (
                          <ul className="ml-6 mt-0.5 space-y-0.5 border-l border-line pl-3">
                            {t.columns.map((c) => (
                              <ColumnRow key={c.name} column={c} onSelectColumn={onSelectColumn} />
                            ))}
                          </ul>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </li>
          );
        })}
      </ul>

      <button
        type="button"
        onClick={onCreateDatabase}
        className="mt-2 w-full rounded-lg border border-dashed border-line px-2 py-1.5 font-mono text-[11.5px] text-faint transition-colors hover:border-line-strong hover:text-ink"
      >
        + CREATE DATABASE
      </button>
    </div>
  );
}

function ColumnRow({
  column,
  onSelectColumn,
}: {
  column: TableColumnInfo;
  onSelectColumn?: (name: string) => void;
}) {
  const bits: string[] = [];
  if (!column.notnull && !column.pk) bits.push("NULL");
  if (column.defaultValue !== null && column.defaultValue !== "") {
    bits.push(`default ${column.defaultValue}`);
  }
  if (column.fk) bits.push(`→ ${column.fk.table}.${column.fk.column}`);

  return (
    <li className="py-[3px] font-mono text-[11.5px]">
      <div className="flex items-center gap-2">
        {column.pk ? <KeyIcon /> : <span className="inline-block h-1 w-1 rounded-full bg-faint/60" />}
        {onSelectColumn ? (
          <button
            type="button"
            onClick={() => onSelectColumn(column.name)}
            title={`Insert '${column.name}' at cursor`}
            className={`group inline-flex items-center gap-1 text-left transition-colors hover:text-accent focus-visible:outline-none focus-visible:underline ${
              column.pk ? "text-feather" : "text-muted"
            }`}
          >
            <span>{column.name}</span>
            <span
              className="opacity-0 group-hover:opacity-100 text-[10px] text-accent font-sans transition-opacity"
              aria-hidden="true"
            >
              +
            </span>
          </button>
        ) : (
          <span className={column.pk ? "text-feather" : "text-muted"}>{column.name}</span>
        )}
        <span className="ml-auto text-[10.5px] uppercase tracking-wide text-faint/80">
          {column.type || "any"}
        </span>
      </div>
      {bits.length > 0 && (
        <p className="mt-0.5 pl-5 text-[10.5px] leading-snug text-faint">
          {bits.join(" · ")}
        </p>
      )}
    </li>
  );
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      className={`shrink-0 text-faint transition-transform ${open ? "rotate-90" : ""}`}
      aria-hidden="true"
    >
      <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function FolderIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" className="text-feather" aria-hidden="true">
      <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
    </svg>
  );
}
function DatabaseIcon({ active }: { active: boolean }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      className={active ? "text-accent" : "text-faint"}
      aria-hidden="true"
    >
      <ellipse cx="12" cy="6.5" rx="7.5" ry="3" stroke="currentColor" strokeWidth="1.7" />
      <path d="M4.5 6.5v11c0 1.7 3.4 3 7.5 3s7.5-1.3 7.5-3v-11" stroke="currentColor" strokeWidth="1.7" />
      <path d="M4.5 12c0 1.7 3.4 3 7.5 3s7.5-1.3 7.5-3" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  );
}
function TableIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-accent" aria-hidden="true">
      <rect x="3.5" y="4.5" width="17" height="15" rx="2" stroke="currentColor" strokeWidth="1.7" />
      <path d="M3.5 9.5h17M9 9.5v10" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}
function KeyIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" className="shrink-0 text-feather" aria-hidden="true">
      <circle cx="8" cy="12" r="3.4" stroke="currentColor" strokeWidth="1.9" />
      <path d="M11.4 12H20m-3 0v3m-2.5-3v2.2" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
    </svg>
  );
}
