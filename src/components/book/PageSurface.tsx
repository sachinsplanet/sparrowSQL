/**
 * One page of the book.
 *
 * A page is a column of blocks with a running header and a folio, exactly as a printed
 * page is. It owns two extra jobs: the first page of a lesson carries the lesson's own
 * opening (objectives, prerequisites, which database this lesson works in), and the last
 * page carries what the lesson asked you to remember, its check questions and, at the end
 * of a module, the mixed review.
 *
 * The shell decides whether this page is a left-hand or right-hand sheet of a spread;
 * the page only knows how wide to make its own measure so lines stay readable.
 */

import { DATASETS } from "../../lib/curriculum/datasets";
import { isLastLessonOfChapter, lessonById, nextLessonId, pagesOfLesson } from "../../lib/curriculum";
import type { Block } from "../../lib/curriculum/types";
import type { BookPage } from "../../lib/curriculum";
import { bookStore, lessonProgress } from "../../lib/bookStore";
import { useBookState } from "../../hooks/useBookState";
import { useReading } from "./ReadingContext";
import { ProseBlock, HeadingBlock, ListBlock, SyntaxBlock, DataTable, CalloutBlock, MistakeBlock, KeytermsBlock, LinkBlock, DiagramBlock } from "./BlockViews";
import { ExampleRunner } from "./ExampleRunner";
import { ExerciseBlock } from "./ExerciseBlock";
import { QuizSet } from "./QuizBlock";
import { Rich } from "./Rich";

export type PageVariant = "single" | "left" | "right";

export function PageSurface({ page, variant }: { page: BookPage; variant: PageVariant }) {
  const { lesson, reading, db } = useReading();
  const measure = variant === "single" ? "mx-auto max-w-[70ch]" : "max-w-[64ch]";

  return (
    <div
      className={`book-page flex h-full min-h-0 flex-col ${
        variant === "left" ? "book-page--left px-6 py-5 md:px-8 md:py-7" : ""
      } ${variant === "right" ? "book-page--right px-6 py-5 md:px-8 md:py-7" : ""} ${
        variant === "single" ? "px-5 py-5 sm:px-7" : ""
      }`}
      aria-label={`Page ${page.number} of ${page.of}, ${lesson.title}`}
    >
      <PageHead page={page} variant={variant} />

      <div className={`min-h-0 flex-1 overflow-y-auto overscroll-contain px-0.5 pb-3 ${measure}`}>
        {page.startsLesson && <LessonOpener />}
        <div className="space-y-4">
          {page.blocks.map((block, index) => (
            <BlockRenderer key={`${page.key}-b${index}`} block={block} />
          ))}
        </div>
        {page.endsLesson && <LessonClose />}
        {reading ? null : (
          <p className="mt-4 mb-0 rounded-[10px] border border-line bg-surface/60 px-3 py-2 text-[12.5px] text-faint">
            The book is set aside, so nothing on this page will run. Bring it back to
            keep reading or pressing Run.
          </p>
        )}
        {db.status === "error" && (
          <p className="mt-4 mb-0 text-[12.5px] text-danger" role="status">
            {db.error ?? "The SQL sandbox is unavailable right now."}{" "}
            <button
              type="button"
              onClick={db.retry}
              className="rounded-full border border-line px-2 py-0.5 text-[11.5px] text-muted hover:text-ink"
            >
              retry
            </button>
          </p>
        )}
      </div>

      <PageFoot page={page} variant={variant} />
    </div>
  );
}

/* ------------------------------------------------------------------ dispatch */

function BlockRenderer({ block }: { block: Block }) {
  switch (block.kind) {
    case "prose":
      return <ProseBlock text={block.text} />;
    case "heading":
      return <HeadingBlock text={block.text} level={block.level} />;
    case "list":
      return <ListBlock items={block.items} ordered={block.ordered} />;
    case "syntax":
      return <SyntaxBlock code={block.code} caption={block.caption} />;
    case "example":
      return (
        <ExampleRunner
          sql={block.sql}
          explain={block.explain}
          expected={block.expected}
          support={block.support}
          dialectNote={block.dialectNote}
          setup={block.setup}
          expectFailure={block.expectFailure}
          dataset={block.dataset}
        />
      );
    case "table":
      return <DataTable caption={block.caption} columns={block.columns} rows={block.rows} />;
    case "callout":
      return <CalloutBlock voice={block.voice} title={block.title} text={block.text} />;
    case "mistake":
      return (
        <MistakeBlock
          wrong={block.wrong}
          symptom={block.symptom}
          why={block.why}
          fix={block.fix}
        />
      );
    case "diagram":
      return <DiagramBlock shape={block.shape} caption={block.caption} nodes={block.nodes} />;
    case "keyterms":
      return <KeytermsBlock terms={block.terms} />;
    case "link":
      return <LinkBlock lessonId={block.lessonId} label={block.label} />;
    case "exercise":
      return <ExerciseBlock exercise={block.exercise} />;
    case "quiz":
      return (
        <QuizSet
          items={block.questions}
          title="Check as you go"
          blurb="Answer these before turning the page; the explanation appears either way."
        />
      );
    default:
      return null;
  }
}

/* -------------------------------------------------------------------- furniture */

function PageHead({ page, variant }: { page: BookPage; variant: PageVariant }) {
  const { lesson, chapter } = useReading();
  if (variant === "single") return null;
  return (
    <div className="mb-3 flex items-baseline gap-2 border-b border-line/70 pb-1.5 font-mono text-[10px] uppercase tracking-[0.16em] text-faint">
      <span className="truncate">
        {chapter ? `${chapter.kicker || `Module ${chapter.number}`} · ` : ""}
        {lesson.title}
      </span>
      <span className="ml-auto shrink-0">
        {page.number}/{page.of}
      </span>
    </div>
  );
}

function PageFoot({ page, variant }: { page: BookPage; variant: PageVariant }) {
  // A real book prints the folio on the outside edge of each sheet.
  return (
    <div
      className={`mt-2 flex items-center gap-2 pt-1.5 font-mono text-[10.5px] text-faint ${
        variant === "right" ? "justify-end" : variant === "left" ? "justify-start" : "justify-center"
      }`}
    >
      <span>{page.number}</span>
    </div>
  );
}

/* ---------------------------------------------------------------- lesson open */

function LessonOpener() {
  const { lesson, chapter, goTo } = useReading();
  const state = useBookState();
  const meta = lesson.dataset ? DATASETS[lesson.dataset] : null;
  const read = lessonProgress(state, lesson.id);

  return (
    <header className="mb-5">
      <p className="m-0 font-mono text-[10.5px] uppercase tracking-[0.2em] text-accent">
        {chapter
          ? `${chapter.kind === "capstone" ? "Capstone" : `Module ${chapter.number}`} · lesson ${lesson.order}`
          : "Lesson"}
      </p>
      <h2 className="mt-1.5 mb-0 font-display text-[26px] font-bold leading-[1.12] tracking-[-0.015em] text-balance text-ink md:text-[28px]">
        {lesson.title}
      </h2>
      <p className="mt-2 mb-0 text-[14.5px] leading-[1.7] text-muted">
        <Rich text={lesson.summary} />
      </p>

      <p className="mt-2.5 mb-0 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[11px] text-faint">
        <span>{lesson.minutes} min read</span>
        <span className="capitalize">{lesson.difficulty}</span>
        {read.seenPages > 0 && (
          <span className="text-accent">
            {Math.round(read.fraction * 100)}% read
          </span>
        )}
      </p>

      {lesson.objectives.length > 0 && (
        <div className="mt-4 rounded-[12px] border border-line bg-surface/50 px-3.5 py-3">
          <p className="m-0 font-mono text-[10px] uppercase tracking-[0.18em] text-faint">
            After this page you can
          </p>
          <ul className="mt-1.5 mb-0 space-y-1 pl-4 text-[13.5px] leading-relaxed text-ink/90 marker:text-accent">
            {lesson.objectives.map((objective) => (
              <li key={objective}>
                <Rich text={objective} />
              </li>
            ))}
          </ul>
        </div>
      )}

      {lesson.prerequisites.length > 0 && (
        <Prerequisites ids={lesson.prerequisites} goTo={goTo} />
      )}

      {meta && (
        <div className="mt-3 rounded-[12px] border border-line bg-[color:var(--bg-deep)]/50 px-3.5 py-3">
          <p className="m-0 font-mono text-[10px] uppercase tracking-[0.18em] text-faint">
            This lesson works in
          </p>
          <p className="mt-1 mb-0 font-mono text-[12.5px] text-accent">{meta.database}</p>
          <p className="mt-1 mb-0 text-[12.5px] leading-relaxed text-muted">
            <Rich text={meta.blurb} />
          </p>
          <p className="mt-1.5 mb-0 font-mono text-[11px] leading-relaxed text-faint">
            {meta.tables.map((table) => table.name).join(", ")}
          </p>
        </div>
      )}
    </header>
  );
}

/** Prerequisites Sparrow links to, but only when they are genuinely unread. */
function Prerequisites({
  ids,
  goTo,
}: {
  ids: string[];
  goTo: (lessonId: string, page?: number) => void;
}) {
  const state = useBookState();
  const missing = ids
    .map((id) => lessonById(id))
    .filter((lesson): lesson is NonNullable<typeof lesson> => Boolean(lesson))
    .filter((lesson) => !state.completed[lesson.id]);
  if (missing.length === 0) return null;
  return (
    <div className="mt-3 rounded-[12px] border border-[color:var(--warning)]/35 bg-[color:var(--warning)]/8 px-3.5 py-2.5">
      <p className="m-0 font-mono text-[10px] uppercase tracking-[0.18em] text-warning">
        Worth reading first
      </p>
      <ul className="mt-1.5 mb-0 list-none space-y-1 p-0">
        {missing.map((lesson) => (
          <li key={lesson.id}>
            <button
              type="button"
              onClick={() => goTo(lesson.id, 0)}
              className="text-left text-[13px] leading-snug text-ink underline decoration-[color:var(--warning)]/50 underline-offset-2 hover:decoration-warning"
            >
              {lesson.title}
              <span className="ml-1.5 font-mono text-[11px] text-faint">
                {lesson.minutes} min
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ------------------------------------------------------------------- lesson end */

function LessonClose() {
  const { lesson, chapter, goTo } = useReading();
  const state = useBookState();
  const progress = lessonProgress(state, lesson.id);
  const pages = pagesOfLesson(lesson);
  const unread = pages.length - progress.seenPages;
  const reviewChapter = chapter && isLastLessonOfChapter(lesson.id) ? chapter : null;

  return (
    <footer className="mt-6 border-t border-dashed border-line-strong/60 pt-4">
      {lesson.recap.length > 0 && (
        <div className="rounded-[12px] border border-line bg-surface/50 px-3.5 py-3">
          <p className="m-0 font-mono text-[10px] uppercase tracking-[0.18em] text-faint">
            Take with you
          </p>
          <ul className="mt-1.5 mb-0 space-y-1 pl-4 text-[13.5px] leading-relaxed text-ink/90 marker:text-feather">
            {lesson.recap.map((line) => (
              <li key={line}>
                <Rich text={line} />
              </li>
            ))}
          </ul>
        </div>
      )}

      <QuizSet
        items={lesson.quiz}
        title="Check your understanding"
        blurb="Guess first, then check: the explanation appears either way, and a wrong answer is the useful kind."
      />

      {reviewChapter && reviewChapter.review.length > 0 && (
        <QuizSet
          items={reviewChapter.review}
          title={`Module ${reviewChapter.number} review`}
          blurb="Mixed questions from the whole module, deliberately out of order — this is the set that decides whether the module is mastered, not merely read."
          chapterId={reviewChapter.id}
        />
      )}

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => bookStore.completeLesson(lesson.id)}
          disabled={progress.completed}
          className="rounded-full bg-accent px-3.5 py-1.5 text-[12.5px] font-semibold text-[color:var(--accent-ink)] transition-transform hover:-translate-y-[1px] disabled:opacity-45"
        >
          {progress.completed ? "✓ lesson marked read" : "Mark this lesson read"}
        </button>
        {progress.completed && (
          <span className="font-mono text-[11px] text-faint">
            {progress.mastered
              ? "exercises and questions all right — mastered"
              : `read · ${progress.exercisesSolved}/${progress.exercisesTotal} exercises · ${progress.quizCorrect}/${progress.quizTotal} questions`}
          </span>
        )}
        {!progress.completed && unread > 0 && (
          <span className="font-mono text-[11px] text-faint">
            {unread} page{unread === 1 ? "" : "s"} of this lesson still unseen
          </span>
        )}
        <PageTurnHint goTo={goTo} />
      </div>
    </footer>
  );
}

/** Where the next page of the book is, whether that is a page or a lesson. */
function PageTurnHint({ goTo }: { goTo: (lessonId: string, page?: number) => void }) {
  const { lesson } = useReading();
  const pages = pagesOfLesson(lesson);
  const state = useBookState();
  if (pages.length > 1 && (state.seen[lesson.id]?.length ?? 0) < pages.length) return null;
  const next = nextLessonId(lesson.id);
  if (!next) return null;
  const target = lessonById(next);
  return (
    <button
      type="button"
      onClick={() => goTo(next, 0)}
      className="ml-auto rounded-full border border-line px-3 py-1.5 text-[12.5px] text-muted hover:border-accent/50 hover:text-accent"
    >
      Next: {target?.title ?? "the following lesson"}
    </button>
  );
}
