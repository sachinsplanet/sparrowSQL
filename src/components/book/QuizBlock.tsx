/**
 * The book's checking questions.
 *
 * Four kinds, all authored as data: `choice` (pick one), `predict` (say what this
 * statement returns), `fill` (complete the clause) and `diagnose` (read the engine's
 * error and name the cause). A `predict` question can be settled by the engine itself:
 * the "Run it and see" button sends the statement through the same sandbox as a worked
 * example, so the explanation after a wrong guess is a fact rather than an opinion.
 *
 * Answers live in `bookStore`, so turning a page and coming back keeps them. Nothing
 * here is graded on the exact wording typed for a fill-in blank: several spellings are
 * accepted, listed on the question itself.
 */

import { useMemo, useState } from "react";
import { motion } from "motion/react";
import { checkFill } from "../../lib/curriculum/grade";
import type { QuizItem } from "../../lib/curriculum/types";
import { bookStore, type QuizRecord } from "../../lib/bookStore";
import type { SqlRunResult } from "../../lib/types";
import { useBookState } from "../../hooks/useBookState";
import { ResultNotes, TableViewer } from "../lab/TableViewer";
import { SparrowMascot } from "../SparrowMascot";
import { Rich, SqlListing } from "./Rich";
import { useReading } from "./ReadingContext";
import { runBookScript } from "./bookEngine";

/** Was this item already answered correctly in an earlier sitting? */
function storedIsRight(record: QuizRecord | undefined): boolean {
  return Boolean(record?.correct);
}

export function QuizSet({
  items,
  title,
  blurb,
  chapterId,
}: {
  items: QuizItem[];
  title: string;
  blurb?: string;
  /** Set for a chapter review, which records a score as well as answers. */
  chapterId?: string;
}) {
  const state = useBookState();
  const [open, setOpen] = useState<Record<string, boolean>>({});

  const scored = useMemo(() => {
    let correct = 0;
    let answered = 0;
    for (const item of items) {
      const record = state.quiz[item.id];
      if (!record) continue;
      answered += 1;
      if (record.correct) correct += 1;
    }
    return { correct, answered, total: items.length };
  }, [items, state.quiz]);

  if (items.length === 0) return null;

  return (
    <section
      className={`my-0 rounded-[14px] border ${
        chapterId ? "border-accent/40 bg-accent-soft/25" : "border-line bg-surface/50"
      } p-3.5`}
      aria-label={title}
    >
      <header className="flex flex-wrap items-center gap-2">
        <h4 className="m-0 font-display text-[15px] font-bold text-ink">{title}</h4>
        <span className="ml-auto font-mono text-[10.5px] uppercase tracking-[0.14em] text-faint">
          {scored.correct}/{scored.total} correct
        </span>
      </header>
      {blurb && (
        <p className="mt-1.5 mb-0 text-[13px] leading-relaxed text-muted">
          <Rich text={blurb} />
        </p>
      )}

      <ol className="mt-3 list-none space-y-3 p-0">
        {items.map((item, index) => (
          <li key={item.id}>
            <QuizItemCard
              item={item}
              index={index}
              record={state.quiz[item.id]}
              open={Boolean(open[item.id])}
              onToggle={(next) => setOpen((draft) => ({ ...draft, [item.id]: next }))}
            />
          </li>
        ))}
      </ol>

      {chapterId && (
        <ReviewFooter
          chapterId={chapterId}
          items={items}
          correct={scored.correct}
          total={scored.total}
          answered={scored.answered}
        />
      )}

      {!chapterId && scored.total > 0 && scored.correct === scored.total && (
        <p className="mt-3 mb-0 flex items-center gap-2 rounded-[10px] bg-[color:var(--success)]/10 px-3 py-2 text-[13px] text-ink">
          <span aria-hidden="true">
            <SparrowMascot state="happy" size={26} title="" />
          </span>
          Every question on this page is right. Turn the page when you are.
        </p>
      )}
    </section>
  );
}

/* ------------------------------------------------------------------ one item */

function QuizItemCard({
  item,
  index,
  record,
  open,
  onToggle,
}: {
  item: QuizItem;
  index: number;
  record: QuizRecord | undefined;
  open: boolean;
  onToggle: (next: boolean) => void;
}) {
  const [draft, setDraft] = useState<string>(record?.value ?? "");
  const [checked, setChecked] = useState(Boolean(record));
  const right = storedIsRight(record);

  const choose = (value: string) => {
    if (right) return;
    setDraft(value);
    setChecked(false);
  };

  const submit = () => {
    const correct = answerIsRight(item, draft);
    if (draft.trim() === "") return;
    bookStore.recordQuiz(item.id, draft, correct);
    setChecked(true);
    onToggle(correct ? false : true);
  };

  const selected = record && !right ? record.value : draft;

  return (
    <fieldset className="m-0 rounded-[11px] border border-line bg-[color:var(--bg-deep)]/40 px-3 py-2.5">
      <legend className="sr-only">{`Question ${index + 1} of the check`}</legend>
      <p className="m-0 text-[13.5px] font-semibold leading-snug text-ink">
        <span className="mr-1.5 font-mono text-[11px] text-faint">{index + 1}.</span>
        <Rich text={item.prompt} />
      </p>

      {item.kind === "fill" ? (
        <FillRow
          before={item.before}
          after={item.after}
          value={draft}
          disabled={right}
          onChange={setDraft}
          onCheck={submit}
          checked={checked}
          correct={Boolean(record?.correct)}
        />
      ) : (
        <>
          {(item.kind === "predict" || item.kind === "diagnose") && (
            <div className="mt-2">
              <SqlListing sql={item.sql} compact />
            </div>
          )}
          {item.kind === "diagnose" && (
            <p className="mt-1.5 mb-0 break-words rounded-[8px] border border-[color:var(--danger)]/35 bg-[color:var(--danger)]/8 px-2.5 py-1.5 font-mono text-[11.5px] leading-relaxed text-danger">
              {item.error}
            </p>
          )}
          {item.kind === "predict" && <PredictRun item={item} />}

          <div className="mt-2 space-y-1.5">
            {item.options.map((option, optionIndex) => {
              const value = String(optionIndex);
              const isPicked = selected === value;
              const isAnswer = optionIndex === item.answerIndex;
              return (
                <label
                  key={option}
                  className={`flex cursor-pointer items-start gap-2.5 rounded-[9px] border px-2.5 py-1.5 text-[13px] leading-relaxed transition-colors ${
                    isPicked
                      ? checked && isAnswer
                        ? "border-[color:var(--success)]/60 bg-[color:var(--success)]/8 text-ink"
                        : checked
                          ? "border-[color:var(--danger)]/50 bg-[color:var(--danger)]/8 text-ink"
                          : "border-accent/60 bg-accent-soft/50 text-ink"
                      : "border-line bg-surface/50 text-muted hover:border-line-strong hover:text-ink"
                  } ${right ? "cursor-default opacity-90" : ""}`}
                >
                  <input
                    type="radio"
                    name={item.id}
                    className="mt-[3px] accent-[color:var(--accent)]"
                    checked={isPicked}
                    disabled={right}
                    onChange={() => choose(value)}
                  />
                  <span className="min-w-0">
                    <Rich text={option} />
                  </span>
                </label>
              );
            })}
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-2">
            {!right && (
              <button
                type="button"
                onClick={submit}
                disabled={selected.trim() === ""}
                className="rounded-full bg-accent px-3 py-1.5 text-[12.5px] font-semibold text-[color:var(--accent-ink)] transition-transform hover:-translate-y-[1px] disabled:cursor-not-allowed disabled:opacity-50"
              >
                Check
              </button>
            )}
            {right && (
              <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-success">
                ✓ correct
              </span>
            )}
            {checked && !right && record && (
              <button
                type="button"
                onClick={() => {
                  setChecked(false);
                  onToggle(false);
                }}
                className="rounded-full border border-line px-3 py-1.5 font-mono text-[11.5px] text-muted hover:text-ink"
              >
                try again
              </button>
            )}
          </div>
        </>
      )}

      <AnimateFeedback show={right || (checked && open)} explain={item.explain} right={right} />
    </fieldset>
  );
}

/** Fill-in-the-clause: the statement around the blank, then one input. */
function FillRow({
  before,
  after,
  value,
  disabled,
  onChange,
  onCheck,
  checked,
  correct,
}: {
  before: string;
  after: string;
  value: string;
  disabled: boolean;
  onChange: (next: string) => void;
  onCheck: () => void;
  checked: boolean;
  correct: boolean;
}) {
  return (
    <div className="mt-2">
      <div className="rounded-[9px] border border-line bg-surface/60 px-3 py-2.5 font-mono text-[12.5px] leading-[1.9] text-ink">
        <Rich text={before} />
        <input
          type="text"
          value={value}
          disabled={disabled}
          spellCheck={false}
          autoComplete="off"
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              onCheck();
            }
          }}
          aria-label="The missing clause"
          className={`mx-1 inline-block w-[9ch] rounded-[5px] border-b-2 bg-[color:var(--bg-deep)]/70 px-1.5 py-0.5 text-center align-middle outline-none transition-colors focus:border-accent ${
            checked ? (correct ? "border-success" : "border-danger") : "border-dashed border-line-strong"
          }`}
          placeholder="____"
        />
        <Rich text={after} />
      </div>
      {!disabled && (
        <button
          type="button"
          onClick={onCheck}
          disabled={value.trim() === ""}
          className="mt-2 rounded-full bg-accent px-3 py-1.5 text-[12.5px] font-semibold text-[color:var(--accent-ink)] disabled:cursor-not-allowed disabled:opacity-50"
        >
          Check
        </button>
      )}
    </div>
  );
}

/* --------------------------------------------------- run it and see (predict) */

function PredictRun({ item }: { item: Extract<QuizItem, { kind: "predict" }> }) {
  const { dataset, reading, db } = useReading();
  const [result, setResult] = useState<SqlRunResult | null>(null);
  const [busy, setBusy] = useState(false);

  const run = async () => {
    if (!reading || busy) return;
    setBusy(true);
    try {
      setResult(await runBookScript({ dataset: item.dataset ?? dataset, setup: item.setup, sql: item.sql }));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mt-2">
      <button
        type="button"
        onClick={() => void run()}
        disabled={!reading || busy || db.status === "error"}
        className="rounded-full border border-line px-2.5 py-1 font-mono text-[11.5px] text-muted transition-colors hover:border-accent/50 hover:text-accent disabled:opacity-50"
        title={`Guess first, then check by running it in ${db.database}`}
      >
        {busy ? "running…" : result ? "run it again" : "guess, then run it and see"}
      </button>
      {result && (
        <div className="mt-2 rounded-[9px] border border-line bg-surface/60 px-2.5 py-2">
          {result.success ? (
            <>
              <TableViewer
                columns={result.columns}
                rows={result.rows}
                status={result.kind === "rows" ? null : (result.statusMessage ?? null)}
              />
              <ResultNotes notes={result.notes} />
            </>
          ) : (
            <p className="m-0 break-words font-mono text-[11.5px] text-danger">
              {result.error?.message ?? "The engine refused this."}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ feedback */

function AnimateFeedback({
  show,
  explain,
  right,
}: {
  show: boolean;
  explain: string;
  right: boolean;
}) {
  if (!show) return null;
  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
      className="overflow-hidden"
      role="status"
      aria-live="polite"
    >
      <p
        className={`mt-2.5 mb-0 rounded-[9px] border px-3 py-2 text-[13px] leading-[1.65] ${
          right
            ? "border-[color:var(--success)]/40 bg-[color:var(--success)]/8 text-ink/90"
            : "border-[color:var(--warning)]/40 bg-[color:var(--warning)]/8 text-ink/90"
        }`}
      >
        <span className={`font-semibold ${right ? "text-success" : "text-warning"}`}>
          {right ? "Right — " : "Not yet — "}
        </span>
        <Rich text={explain} />
      </p>
    </motion.div>
  );
}

/** Grade one answer with the same rules the harness uses. */
function answerIsRight(item: QuizItem, value: string): boolean {
  if (item.kind === "fill") return checkFill(item, value);
  return Number(value) === item.answerIndex;
}

/* -------------------------------------------------------------- review score */

function ReviewFooter({
  chapterId,
  items,
  correct,
  total,
  answered,
}: {
  chapterId: string;
  items: QuizItem[];
  correct: number;
  total: number;
  answered: number;
}) {
  const state = useBookState();
  const record = state.reviews[chapterId];
  const done = answered === total;

  return (
    <div className="mt-3 rounded-[11px] border border-line bg-surface/60 px-3 py-2.5">
      <p className="m-0 text-[13px] leading-relaxed text-muted">
        {done ? (
          <>
            <span className="font-semibold text-ink">{correct} of {total}</span> right
            {record ? ` · best so far ${record.best} of ${record.total}` : ""}. Eight in ten
            counts as mastered.
          </>
        ) : (
          <>
            {answered} of {total} answered. Answer every question to record a score for this
            module.
          </>
        )}
      </p>
      {done && (
        <button
          type="button"
          onClick={() => bookStore.recordReview(chapterId, correct, total)}
          className="mt-2 rounded-full bg-accent px-3.5 py-1.5 text-[12.5px] font-semibold text-[color:var(--accent-ink)] transition-transform hover:-translate-y-[1px]"
        >
          {record ? "Record this score again" : "Record my score"}
        </button>
      )}
      {record && (
        <p className="mt-2 mb-0 font-mono text-[11px] text-faint">
          attempts {record.attempts} · best {record.best}/{record.total}
        </p>
      )}
      <p className="mt-2 mb-0 text-[12px] leading-relaxed text-faint">
        Questions missed here come back later in the journey&rsquo;s spaced review, so a
        retry is worth taking before moving on. ({items.length} in this set.)
      </p>
    </div>
  );
}
