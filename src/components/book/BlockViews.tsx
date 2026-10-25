/**
 * The blocks a page is made of that do not talk to the engine: prose, headings,
 * lists, grammar boxes, reference tables, Sparrow's margin notes, mistakes, diagrams,
 * key terms and cross-links.
 *
 * Everything here is presentational and reads its lesson context only to answer
 * "which lesson is this link going to".
 */

import { chapterOfLesson, lessonById } from "../../lib/curriculum";
import type { Block } from "../../lib/curriculum/types";
import { openLesson } from "./bookBus";
import { Rich, SqlListing } from "./Rich";
import { useReading } from "./ReadingContext";
import { SparrowMascot } from "../SparrowMascot";

/* ------------------------------------------------------------------ text */

export function ProseBlock({ text }: { text: string }) {
  return (
    <p className="my-0 text-[15px] leading-[1.72] text-ink/[0.92] md:text-[15.5px]">
      <Rich text={text} />
    </p>
  );
}

export function HeadingBlock({ text, level = 3 }: { text: string; level?: 2 | 3 }) {
  const Tag = level === 2 ? "h2" : "h3";
  return (
    <Tag className="mt-1 mb-0.5 font-display text-[17px] font-bold leading-snug tracking-[-0.01em] text-ink md:text-[18px]">
      <Rich text={text} />
    </Tag>
  );
}

export function ListBlock({ items, ordered }: { items: string[]; ordered?: boolean }) {
  const Tag = ordered ? "ol" : "ul";
  return (
    <Tag
      className={`my-0 space-y-1.5 pl-5 text-[14.5px] leading-[1.65] text-ink/[0.9] md:text-[15px] ${
        ordered ? "list-decimal" : "list-disc"
      }`}
    >
      {items.map((item, index) => (
        <li key={index} className="marker:text-faint">
          <Rich text={item} />
        </li>
      ))}
    </Tag>
  );
}

/** Grammar, not a statement: what the clause *is*, in code type. */
export function SyntaxBlock({ code, caption }: { code: string; caption?: string }) {
  return (
    <div className="my-0 rounded-[12px] border border-line bg-surface/60 p-3">
      <div className="mb-2 flex items-center gap-2">
        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-faint">
          Syntax
        </span>
        <span className="h-px flex-1 bg-line" />
      </div>
      <SqlListing sql={code} compact />
      {caption && (
        <p className="mb-0 mt-2 text-[13px] leading-relaxed text-muted">
          <Rich text={caption} />
        </p>
      )}
    </div>
  );
}

/* ----------------------------------------------------------------- tables */

/** `null` is a value in SQL, so it is printed as one rather than as a blank cell. */
function formatCell(value: unknown): { text: string; tone: string } {
  if (value === null || value === undefined) return { text: "NULL", tone: "text-faint italic" };
  if (typeof value === "number") return { text: String(value), tone: "text-feather tabular-nums" };
  if (typeof value === "boolean") return { text: value ? "1" : "0", tone: "text-feather" };
  return { text: String(value), tone: "text-ink" };
}

export function DataTable({
  caption,
  columns,
  rows,
}: {
  caption?: string;
  columns: string[];
  rows: unknown[][];
}) {
  return (
    <figure className="my-0">
      {caption && (
        <figcaption className="mb-1.5 text-[12.5px] font-semibold uppercase tracking-[0.08em] text-faint">
          <Rich text={caption} />
        </figcaption>
      )}
      <div className="overflow-x-auto rounded-[10px] border border-line">
        <table className="w-full border-collapse text-left font-mono text-[12px] leading-relaxed">
          <thead>
            <tr className="bg-surface-2/80">
              {columns.map((column) => (
                <th
                  key={column}
                  scope="col"
                  className="border-b border-line px-2.5 py-1.5 font-semibold text-ink"
                >
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={Math.max(1, columns.length)} className="px-2.5 py-2 text-faint italic">
                  (empty set)
                </td>
              </tr>
            )}
            {rows.map((row, index) => (
              <tr key={index} className="odd:bg-surface/40">
                {row.map((cell, cellIndex) => {
                  const shown = formatCell(cell);
                  return (
                    <td
                      key={cellIndex}
                      className={`border-b border-line/60 px-2.5 py-1.5 whitespace-nowrap ${shown.tone}`}
                    >
                      {shown.text}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </figure>
  );
}

/* --------------------------------------------------------------- callouts */

const VOICE: Record<
  string,
  { ring: string; bg: string; chip: string; label: string; defaultTitle: string }
> = {
  sparrow: {
    ring: "border-accent/35",
    bg: "bg-accent-soft/60",
    chip: "text-accent",
    label: "Sparrow",
    defaultTitle: "Sparrow says",
  },
  warning: {
    ring: "border-[color:var(--warning)]/45",
    bg: "bg-[color:var(--warning)]/8",
    chip: "text-warning",
    label: "Careful",
    defaultTitle: "Careful",
  },
  tip: {
    ring: "border-[color:var(--success)]/40",
    bg: "bg-[color:var(--success)]/8",
    chip: "text-success",
    label: "Habit",
    defaultTitle: "Good habit",
  },
  dialect: {
    ring: "border-feather/40",
    bg: "bg-feather-soft/50",
    chip: "text-feather",
    label: "Dialect",
    defaultTitle: "MySQL vs SQLite",
  },
  "real-world": {
    ring: "border-line-strong",
    bg: "bg-surface-2/70",
    chip: "text-muted",
    label: "Production",
    defaultTitle: "In production",
  },
};

export function CalloutBlock({
  voice,
  title,
  text,
}: {
  voice: "sparrow" | "warning" | "tip" | "dialect" | "real-world";
  title?: string;
  text: string;
}) {
  const style = VOICE[voice] ?? VOICE.tip;
  return (
    <aside
      className={`my-0 flex gap-3 rounded-[12px] border ${style.ring} ${style.bg} px-3.5 py-3`}
    >
      {voice === "sparrow" ? (
        <span className="-mt-1 shrink-0" aria-hidden="true">
          <SparrowMascot state="idle" size={38} title="" />
        </span>
      ) : (
        <span className={`mt-[2px] shrink-0 ${style.chip}`} aria-hidden="true">
          {voice === "warning" ? <WarnGlyph /> : voice === "tip" ? <Lightbulb /> : <Switch />}
        </span>
      )}
      <div className="min-w-0">
        <p className={`m-0 font-mono text-[10.5px] uppercase tracking-[0.16em] ${style.chip}`}>
          {/* The label carries the speaker, so a screen reader hears "Sparrow" once. */}
          {voice === "sparrow" ? "Sparrow" : style.label}
        </p>
        <p className="mt-1 mb-0 text-[13.5px] font-semibold text-ink">
          {title ?? style.defaultTitle}
        </p>
        <p className="mt-1 mb-0 text-[13.5px] leading-[1.68] text-muted">
          <Rich text={text} />
        </p>
      </div>
    </aside>
  );
}

/**
 * The four-line mistake note: what was typed, what happened, why, and the fix. The
 * answer stays folded until it is asked for, because the point of the exercise is the
 * diagnosis, not the reading.
 */
export function MistakeBlock({
  wrong,
  symptom,
  why,
  fix,
}: {
  wrong: string;
  symptom: string;
  why: string;
  fix: string;
}) {
  return (
    <div className="my-0 rounded-[12px] border border-[color:var(--danger)]/35 bg-surface/60 p-3.5">
      <p className="m-0 font-mono text-[10.5px] uppercase tracking-[0.16em] text-danger">
        Mistake
      </p>
      <div className="mt-2">
        <SqlListing sql={wrong} compact />
      </div>
      <p className="mt-2 mb-0 text-[13px] leading-relaxed text-ink/[0.9]">
        <span className="font-semibold text-danger">What you see: </span>
        <Rich text={symptom} />
      </p>
      <details className="group mt-2 rounded-[9px] border border-line bg-[color:var(--bg-deep)]/60 px-3 py-2">
        <summary className="cursor-pointer list-none text-[12.5px] font-semibold text-accent marker:hidden">
          Why it happens, and the fix
        </summary>
        <p className="mt-2 mb-0 text-[13px] leading-relaxed text-muted">
          <span className="font-semibold text-ink">Why: </span>
          <Rich text={why} />
        </p>
        <p className="mt-1.5 mb-0 text-[13px] leading-relaxed text-muted">
          <span className="font-semibold text-success">Fix: </span>
          <Rich text={fix} />
        </p>
      </details>
    </div>
  );
}

/* -------------------------------------------------------------- key terms */

export function KeytermsBlock({ terms }: { terms: { term: string; def: string }[] }) {
  const { dataset } = useReading();
  return (
    <section className="my-0 rounded-[12px] border border-line bg-surface/50 p-3.5" aria-label="Key terms">
      <p className="m-0 font-mono text-[10.5px] uppercase tracking-[0.16em] text-faint">
        Key terms
      </p>
      <dl className="mt-2 grid gap-x-5 gap-y-2 sm:grid-cols-2">
        {terms.map((term) => (
          <div key={term.term} className="min-w-0">
            <dt className="text-[13px] font-semibold text-ink">
              <Rich text={term.term} />
            </dt>
            <dd className="mt-0.5 mb-0 text-[12.5px] leading-relaxed text-muted">
              <Rich text={term.def} />
              <span className="sr-only"> (dataset for this lesson: {dataset} database)</span>
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

/* ------------------------------------------------------------------ links */

export function LinkBlock({ lessonId, label }: { lessonId: string; label: string }) {
  const target = lessonById(lessonId);
  const chapter = target ? chapterOfLesson(lessonId) : undefined;
  if (!target) {
    // A renamed lesson must not become a dead link that silently does nothing.
    return (
      <p className="my-0 text-[12.5px] text-faint">
        Related page “{lessonId}” is not in this edition of the book.
      </p>
    );
  }
  return (
    <button
      type="button"
      onClick={() => openLesson(target.id)}
      className="my-0 flex w-full items-center gap-2.5 rounded-[10px] border border-line bg-surface/50 px-3 py-2.5 text-left transition-colors hover:border-accent/50 hover:bg-accent-soft/40"
    >
      <span className="text-accent" aria-hidden="true">
        <ArrowGlyph />
      </span>
      <span className="min-w-0">
        <span className="block text-[13px] font-semibold text-ink">{target.title}</span>
        <span className="block truncate text-[12px] text-muted">
          {chapter ? `Module ${chapter.number} · ` : ""}
          {label}
        </span>
      </span>
      <span className="ml-auto shrink-0 font-mono text-[10.5px] uppercase tracking-wide text-faint">
        jump
      </span>
    </button>
  );
}

/* --------------------------------------------------------------- diagrams */

/**
 * Small textbook diagrams, drawn with boxes and rules instead of an image or a
 * diagram library: they must inherit the theme, stay crisp at 390px, and cost nothing
 * to load. `shape` only decides the layout, the nodes stay the content's business.
 */
export function DiagramBlock({
  shape,
  caption,
  nodes,
}: {
  shape: "rows-columns" | "join-match" | "transaction-timeline" | "normalization" | "flow";
  caption: string;
  nodes: { label: string; note?: string; tone?: "default" | "accent" | "danger" }[];
}) {
  const tone = (value?: "default" | "accent" | "danger") =>
    value === "accent"
      ? "border-accent/50 bg-accent-soft/70 text-ink"
      : value === "danger"
        ? "border-[color:var(--danger)]/50 bg-[color:var(--danger)]/10 text-ink"
        : "border-line bg-surface-2/70 text-ink";

  const Box = ({ node }: { node: (typeof nodes)[number] }) => (
    <div
      className={`min-w-0 rounded-[9px] border px-2.5 py-1.5 text-center ${tone(node.tone)}`}
    >
      <span className="block font-mono text-[11.5px] font-semibold leading-tight">
        {node.label}
      </span>
      {node.note && (
        <span className="mt-0.5 block text-[10.5px] leading-snug text-muted">
          <Rich text={node.note} />
        </span>
      )}
    </div>
  );

  // A real table is rows of columns: draw both, so `rows-columns` is not just a list.
  if (shape === "rows-columns") {
    return (
      <figure className="my-0 rounded-[12px] border border-line bg-surface/50 p-3.5">
        <div className="flex items-stretch gap-3">
          <span className="grid place-items-center font-mono text-[10px] uppercase tracking-[0.14em] text-faint [writing-mode:vertical-rl]">
            rows
          </span>
          <div className="min-w-0 flex-1">
            <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
              {nodes.map((node) => (
                <Box key={node.label} node={node} />
              ))}
            </div>
            <div className="mt-1.5 grid grid-cols-2 gap-1.5 sm:grid-cols-4">
              {nodes.map((node) => (
                <span
                  key={`ghost-${node.label}`}
                  className="h-6 rounded-[9px] border border-dashed border-line bg-transparent"
                  aria-hidden="true"
                />
              ))}
            </div>
          </div>
        </div>
        <figcaption className="mt-2 mb-0 text-[12.5px] leading-relaxed text-muted">
          <Rich text={caption} />
        </figcaption>
      </figure>
    );
  }

  if (shape === "join-match") {
    const half = Math.ceil(nodes.length / 2);
    const left = nodes.slice(0, half);
    const right = nodes.slice(half);
    return (
      <figure className="my-0 rounded-[12px] border border-line bg-surface/50 p-3.5">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
          <div className="space-y-1.5">
            {left.map((node) => (
              <Box key={node.label} node={node} />
            ))}
          </div>
          <span className="px-1 font-mono text-[10px] uppercase tracking-[0.14em] text-accent [writing-mode:vertical-rl]">
            matched on key
          </span>
          <div className="space-y-1.5">
            {right.map((node) => (
              <Box key={node.label} node={node} />
            ))}
          </div>
        </div>
        <figcaption className="mt-2 mb-0 text-[12.5px] leading-relaxed text-muted">
          <Rich text={caption} />
        </figcaption>
      </figure>
    );
  }

  // flow / timeline / normalization are all "these, in this order".
  return (
    <figure className="my-0 rounded-[12px] border border-line bg-surface/50 p-3.5">
      <div className="flex flex-wrap items-stretch gap-1.5" role="list">
        {nodes.map((node, index) => (
          <div key={node.label} className="flex items-center gap-1.5" role="listitem">
            <Box node={node} />
            {index < nodes.length - 1 && (
              <span className="text-faint" aria-hidden="true">
                <ArrowRight />
              </span>
            )}
          </div>
        ))}
      </div>
      <figcaption className="mt-2 mb-0 text-[12.5px] leading-relaxed text-muted">
        <Rich text={caption} />
      </figcaption>
    </figure>
  );
}

/* ------------------------------------------------------------------ glyphs */

function WarnGlyph() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 4 2.8 20h18.4L12 4Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M12 10v4.5" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
      <circle cx="12" cy="17.4" r="1" fill="currentColor" />
    </svg>
  );
}
function Lightbulb() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M9 18h6M10 21h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path
        d="M12 3a6 6 0 0 0-3.5 10.9c.6.5.9 1.1 1 1.8l.1.3h4.8l.1-.3c.1-.7.4-1.3 1-1.8A6 6 0 0 0 12 3Z"
        stroke="currentColor"
        strokeWidth="1.7"
      />
    </svg>
  );
}
function Switch() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 8h10M18 8h2M4 16h4M12 16h8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="16" cy="8" r="2" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="10" cy="16" r="2" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}
function ArrowGlyph() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M5 12h13M13 6l6 6-6 6" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function ArrowRight() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M6 12h11M13 7l5 5-5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Narrow the union where a caller only wants the blocks that do not run anything. */
export type StaticBlock = Exclude<Block, { kind: "example" | "quiz" | "exercise" }>;
