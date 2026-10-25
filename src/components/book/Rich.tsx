/**
 * The two pieces of typography every page needs: inline textbook formatting, and SQL
 * that reads like SQL.
 *
 * The curriculum is written as data with a little inline markup — `column`, **bold**,
 * *emphasis* — because authoring 48 lessons as JSX would bury the content in markup.
 * This is the whole renderer for that convention: no HTML injection, no markdown library.
 */

import { memo, useMemo } from "react";

/* --------------------------------------------------------------- inline text */

const INLINE = /(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*)/g;

type Chunk = { text: string; kind: "code" | "bold" | "em" | "plain" };

function split(text: string): Chunk[] {
  const out: Chunk[] = [];
  let last = 0;
  let match: RegExpExecArray | null;
  INLINE.lastIndex = 0;
  while ((match = INLINE.exec(text)) !== null) {
    if (match.index > last) out.push({ text: text.slice(last, match.index), kind: "plain" });
    const token = match[0];
    if (token.startsWith("`")) out.push({ text: token.slice(1, -1), kind: "code" });
    else if (token.startsWith("**")) out.push({ text: token.slice(2, -2), kind: "bold" });
    else out.push({ text: token.slice(1, -1), kind: "em" });
    last = match.index + token.length;
  }
  if (last < text.length) out.push({ text: text.slice(last), kind: "plain" });
  return out;
}

/** Body copy with inline `code`, **bold** and *emphasis*. */
export const Rich = memo(function Rich({ text }: { text: string }) {
  const chunks = useMemo(() => split(text), [text]);
  return (
    <>
      {chunks.map((chunk, index) => {
        switch (chunk.kind) {
          case "code":
            return (
              <Code key={index}>{chunk.text}</Code>
            );
          case "bold":
            return (
              <strong key={index} className="font-semibold text-ink">
                {chunk.text}
              </strong>
            );
          case "em":
            return (
              <em key={index} className="italic">
                {chunk.text}
              </em>
            );
          default:
            return <span key={index}>{chunk.text}</span>;
        }
      })}
    </>
  );
});

/** An inline identifier: `customers`, `order_items`. Wrapped in a readable box. */
export function Code({ children }: { children: string }) {
  return (
    <code className="rounded-[5px] border border-line bg-[color:var(--bg-deep)]/70 px-[5px] py-[1px] font-mono text-[0.86em] text-feather">
      {children}
    </code>
  );
}

/* --------------------------------------------------------------- sql blocks */

const KEYWORDS = new Set([
  "SELECT","FROM","WHERE","INSERT","INTO","VALUES","UPDATE","SET","DELETE","CREATE","TABLE",
  "DATABASE","ALTER","DROP","TRUNCATE","RENAME","DISTINCT","ORDER","BY","GROUP","HAVING",
  "LIMIT","OFFSET","JOIN","INNER","LEFT","RIGHT","FULL","OUTER","ON","AND","OR","NOT","IN",
  "BETWEEN","LIKE","AS","PRIMARY","KEY","FOREIGN","UNIQUE","DEFAULT","CHECK","NULL","IS",
  "ASC","DESC","CASE","WHEN","THEN","ELSE","END","UNION","ALL","WITH","OVER","PARTITION",
  "ROWS","RANGE","PRECEDING","FOLLOWING","CURRENT","ROW","BEGIN","COMMIT","ROLLBACK",
  "SAVEPOINT","TO","VIEW","INDEX","IF","EXISTS","GRANT","REVOKE","USER","TRIGGER",
  "INTEGER","VARCHAR","TEXT","REAL","DATE","BOOLEAN","AUTO_INCREMENT","ENGINE",
  "COUNT","SUM","AVG","MIN","MAX","CAST","ROUND","COALESCE","NULLIF","STRFTIME","JULIANDAY",
  "NOW","CURDATE","DATE_ADD","DATE_SUB","INTERVAL","DATEDIFF","CONCAT","SUBSTRING","SUBSTR",
  "LENGTH","UPPER","LOWER","TRIM","ABS","MOD","INSTR","LIKE","EXPLAIN","QUERY","PLAN",
]);

interface Token {
  text: string;
  tone: "keyword" | "string" | "number" | "comment" | "plain";
}

function tokenize(sql: string): Token[] {
  const out: Token[] = [];
  const pattern = /(--[^\n]*)|('(?:[^']|'')*')|(\b\d+(?:\.\d+)?\b)|([A-Za-z_][A-Za-z0-9_]*)/g;
  let last = 0;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(sql)) !== null) {
    if (match.index > last) out.push({ text: sql.slice(last, match.index), tone: "plain" });
    if (match[1]) out.push({ text: match[1], tone: "comment" });
    else if (match[2]) out.push({ text: match[2], tone: "string" });
    else if (match[3]) out.push({ text: match[3], tone: "number" });
    else
      out.push({
        text: match[4],
        tone: KEYWORDS.has(match[4].toUpperCase()) ? "keyword" : "plain",
      });
    last = match.index + match[0].length;
  }
  if (last < sql.length) out.push({ text: sql.slice(last), tone: "plain" });
  return out;
}

const TONE: Record<Token["tone"], string> = {
  keyword: "text-accent",
  string: "text-success",
  number: "text-feather",
  comment: "text-faint italic",
  plain: "text-ink",
};

/**
 * A read-only SQL listing. It scrolls sideways rather than wrapping: a query whose
 * alignment carries meaning (`JOIN … ON …` lined up under its tables) stops carrying
 * it once the lines fold.
 */
export function SqlListing({
  sql,
  caption,
  compact = false,
  blank = "____",
}: {
  sql: string;
  caption?: string;
  compact?: boolean;
  /** Blanks the learner must fill in are marked, not hidden. */
  blank?: string;
}) {
  const tokens = useMemo(() => tokenize(sql), [sql]);
  const hasBlank = sql.includes(blank);
  return (
    <figure className="my-0">
      <div
        className={`overflow-x-auto rounded-[10px] border border-line bg-[color:var(--bg-deep)] px-3.5 ${
          compact ? "py-2.5" : "py-3"
        }`}
      >
        <pre
          className={`m-0 whitespace-pre font-mono ${compact ? "text-[12px]" : "text-[12.5px]"} leading-[1.65]`}
          dir="ltr"
        >
          {tokens.map((token, index) =>
            token.tone === "plain" && token.text.includes(blank) ? (
              <span key={index} className="text-ink">
                {token.text.split(blank).map((part, i, all) => (
                  <span key={i}>
                    {part}
                    {i < all.length - 1 && (
                      <span className="rounded-[4px] border border-dashed border-accent/70 bg-accent-soft px-1 font-semibold text-accent">
                        {blank}
                      </span>
                    )}
                  </span>
                ))}
              </span>
            ) : (
              <span key={index} className={TONE[token.tone]}>
                {token.text}
              </span>
            ),
          )}
        </pre>
      </div>
      {caption || hasBlank ? (
        <figcaption className="mt-1.5 text-[12px] leading-relaxed text-faint">
          {caption ? <Rich text={caption} /> : null}
          {hasBlank && !caption ? (
            <span className="text-accent">Dashed blanks are what you fill in.</span>
          ) : null}
        </figcaption>
      ) : null}
    </figure>
  );
}
