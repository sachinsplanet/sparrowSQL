/**
 * The contents panel.
 *
 * Everything the book contains, in the order it must be read, with two numbers per
 * module that mean different things: how much has been *read* and how much has been
 * *mastered*. Opening and closing this panel never touches the reading surface, so the
 * page you were on — with its open examples and half-answered quiz — is still there when
 * you put the contents away.
 *
 * Search covers lesson titles, their text and the glossary, because "where was the page
 * about NULL?" is a question a reader actually asks.
 */

import { useMemo, useState } from "react";
import { CHAPTERS, GLOSSARY, lessonById, pagesOfLesson, searchCurriculum } from "../../lib/curriculum";
import { bookOverview, bookStore, chapterProgress, lessonProgress, type BookState } from "../../lib/bookStore";
import { useBookState } from "../../hooks/useBookState";
import { Rich } from "./Rich";

interface Props {
  /** Jump the book to a lesson page. The shell closes the panel on a narrow screen. */
  onNavigate: (lessonId: string, page: number) => void;
  activeLessonId: string;
}

export function BookContents({ onNavigate, activeLessonId }: Props) {
  const state = useBookState();
  const [query, setQuery] = useState("");
  const [showGlossary, setShowGlossary] = useState(false);
  const overview = useMemo(() => bookOverview(state), [state]);
  const hits = useMemo(
    () => (query.trim().length >= 2 ? searchCurriculum(query) : []),
    [query],
  );

  return (
    <nav
      className="flex h-full min-h-0 flex-col gap-3 border-line bg-surface/70 md:border-r"
      aria-label="Book contents"
    >
      <header className="px-3.5 pt-3.5 pb-2">
        <p className="m-0 font-mono text-[10px] uppercase tracking-[0.2em] text-faint">
          Contents
        </p>
        <p className="mt-1.5 mb-0 text-[12.5px] leading-relaxed text-muted">
          {overview.read} of {overview.lessons} lessons read ·{" "}
          {Math.round(overview.reading * 100)}% of pages seen ·{" "}
          <span className="text-accent">{Math.round(overview.mastery * 100)}% mastered</span>{" "}
          · {overview.exercisesSolved}/{overview.exercisesTotal} exercises
        </p>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-line" role="presentation">
          <div
            className="h-full rounded-full bg-accent transition-[width] duration-500"
            style={{ width: `${Math.round(overview.reading * 100)}%` }}
          />
        </div>
        {state.bookmark && (
          <button
            type="button"
            onClick={() => onNavigate(state.bookmark!.lessonId, state.bookmark!.page)}
            className="mt-2 flex w-full items-center gap-2 rounded-[9px] border border-feather/40 bg-feather-soft/60 px-2.5 py-1.5 text-left text-[12.5px] text-ink hover:border-feather"
          >
            <span className="text-feather" aria-hidden="true">
              <BookmarkGlyph />
            </span>
            <span className="min-w-0 truncate">
              {lessonById(state.bookmark.lessonId)?.title ?? "Bookmark"} · page{" "}
              {state.bookmark.page + 1}
            </span>
            <span
              role="button"
              tabIndex={0}
              aria-label="Remove bookmark"
              onClick={(event) => {
                event.stopPropagation();
                bookStore.clearBookmark();
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  bookStore.clearBookmark();
                }
              }}
              className="ml-auto shrink-0 font-mono text-[10.5px] text-faint hover:text-danger"
            >
              clear
            </span>
          </button>
        )}
      </header>

      <div className="px-3.5">
        <label className="sr-only" htmlFor="book-search">
          Search the book
        </label>
        <input
          id="book-search"
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search lessons and terms…"
          className="w-full rounded-[9px] border border-line bg-[color:var(--bg-deep)]/70 px-3 py-2 text-[13px] text-ink outline-none placeholder:text-faint focus:border-accent/60"
        />
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-4">
        {hits.length > 0 ? (
          <SearchResults hits={hits} onNavigate={onNavigate} />
        ) : (
          <ol className="m-0 list-none space-y-1 p-0">
            {CHAPTERS.map((chapter) => (
              <ChapterRow
                key={chapter.id}
                chapter={chapter}
                state={state}
                activeLessonId={activeLessonId}
                onNavigate={onNavigate}
              />
            ))}
          </ol>
        )}

        {hits.length === 0 && (
          <div className="mt-3 border-t border-line px-1.5 pt-3">
            <button
              type="button"
              onClick={() => setShowGlossary((open) => !open)}
              aria-expanded={showGlossary}
              className="flex w-full items-center gap-2 rounded-[8px] px-2 py-1.5 text-left font-mono text-[10.5px] uppercase tracking-[0.16em] text-faint hover:text-ink"
            >
              <Chevron open={showGlossary} />
              Glossary · {GLOSSARY.length} terms
            </button>
            {showGlossary && <Glossary onNavigate={onNavigate} />}
          </div>
        )}

        <ResetReading />
      </div>
    </nav>
  );
}

/* -------------------------------------------------------------------- chapter */

function ChapterRow({
  chapter,
  state,
  activeLessonId,
  onNavigate,
}: {
  chapter: (typeof CHAPTERS)[number];
  state: BookState;
  activeLessonId: string;
  onNavigate: (lessonId: string, page: number) => void;
}) {
  const open = state.openChapters.includes(chapter.id);
  const progress = chapterProgress(state, chapter.id);
  const here = chapter.lessons.some((lesson) => lesson.id === activeLessonId);

  return (
    <li>
      <div
        className={`rounded-[10px] px-1.5 py-1 ${here ? "bg-accent-soft/40" : ""}`}
        aria-current={here ? "true" : undefined}
      >
        <button
          type="button"
          onClick={() => bookStore.toggleChapter(chapter.id)}
          aria-expanded={open}
          className="flex w-full items-center gap-2 rounded-[8px] px-1.5 py-1.5 text-left hover:bg-surface-2/70"
        >
          <span className="text-faint" aria-hidden="true">
            <Chevron open={open} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[13px] font-semibold text-ink">
              {chapter.kind === "capstone" ? "" : `${chapter.number}. `}
              {chapter.title}
            </span>
            <span className="mt-0.5 block truncate font-mono text-[10.5px] text-faint">
              {chapter.kicker} · {chapter.lessons.length} lesson
              {chapter.lessons.length === 1 ? "" : "s"}
              {progress.read > 0 ? ` · ${progress.read} read` : ""}
            </span>
          </span>
          <span className="shrink-0" title={`${Math.round(progress.mastery * 100)}% mastered`}>
            <Dots done={progress.read} of={progress.lessons} mastery={progress.mastery} />
          </span>
        </button>

        {open && (
          <ol className="m-0 mt-1 list-none space-y-0.5 p-0 pl-3">
            {chapter.lessons.map((lesson) => {
              const mark = lessonProgress(state, lesson.id);
              const active = lesson.id === activeLessonId;
              return (
                <li key={lesson.id}>
                  <button
                    type="button"
                    onClick={() => onNavigate(lesson.id, active ? state.position.page : 0)}
                    aria-current={active ? "page" : undefined}
                    className={`flex w-full items-center gap-2 rounded-[8px] px-2 py-1.5 text-left transition-colors ${
                      active
                        ? "bg-accent/15 text-ink"
                        : "text-muted hover:bg-surface-2/60 hover:text-ink"
                    }`}
                  >
                    <span
                      className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                        mark.mastered
                          ? "bg-success"
                          : mark.completed
                            ? "bg-accent"
                            : mark.seenPages > 0
                              ? "bg-line-strong"
                              : "border border-line-strong bg-transparent"
                      }`}
                      aria-hidden="true"
                    />
                    <span className="min-w-0 flex-1 truncate text-[12.5px] leading-snug">
                      {lesson.title}
                    </span>
                    <span className="shrink-0 font-mono text-[10px] text-faint">
                      {pagesOfLesson(lesson).length}p
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>
        )}
      </div>
    </li>
  );
}

/** Tiny progress glyph: one dot per lesson, shaded by mastery. */
function Dots({ done, of, mastery }: { done: number; of: number; mastery: number }) {
  const shown = Math.min(of, 8);
  return (
    <span className="flex items-center gap-[3px]" aria-hidden="true">
      {Array.from({ length: shown }, (_, index) => (
        <span
          key={index}
          className={`h-[5px] w-[5px] rounded-full ${
            index < done ? (mastery > 0.79 ? "bg-success" : "bg-accent") : "bg-line"
          }`}
        />
      ))}
    </span>
  );
}

/**
 * The one destructive action in the book, deliberately two steps and labelled exactly:
 * reading records only. Databases, the playground and XP stay as they are.
 */
function ResetReading() {
  const [asking, setAsking] = useState(false);
  return (
    <div className="mt-4 border-t border-line px-2 pt-3 pb-2">
      {asking ? (
        <div className="rounded-[10px] border border-[color:var(--danger)]/45 bg-[color:var(--danger)]/8 px-3 py-2.5">
          <p className="m-0 text-[12.5px] leading-relaxed text-ink">
            Erase which pages you have read, the exercises you passed and your answers?
            The databases keep whatever you wrote into them.
          </p>
          <div className="mt-2 flex gap-2">
            <button
              type="button"
              onClick={() => {
                bookStore.resetAll();
                setAsking(false);
              }}
              className="rounded-full bg-[color:var(--danger)] px-3 py-1 text-[12px] font-semibold text-[color:var(--bg-deep)]"
            >
              Yes, start the book again
            </button>
            <button
              type="button"
              onClick={() => setAsking(false)}
              className="rounded-full border border-line px-3 py-1 text-[12px] text-muted hover:text-ink"
            >
              Keep my progress
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setAsking(true)}
          className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-faint underline underline-offset-2 hover:text-danger"
        >
          Start the book again
        </button>
      )}
    </div>
  );
}

/* --------------------------------------------------------------------- search */

function SearchResults({
  hits,
  onNavigate,
}: {
  hits: ReturnType<typeof searchCurriculum>;
  onNavigate: (lessonId: string, page: number) => void;
}) {
  return (
    <ul className="m-0 list-none space-y-1 p-0">
      {hits.map((hit) => (
        <li key={`${hit.kind}-${hit.id}`}>
          <button
            type="button"
            onClick={() => {
              if (hit.lessonId) onNavigate(hit.lessonId, 0);
            }}
            disabled={!hit.lessonId}
            className="w-full rounded-[9px] border border-line bg-surface/60 px-2.5 py-2 text-left hover:border-accent/50 disabled:opacity-50"
          >
            <span className="block truncate text-[12.5px] font-semibold text-ink">
              {hit.title}
            </span>
            <span className="mt-0.5 block truncate text-[11.5px] text-muted">
              {hit.detail}
            </span>
            <span className="mt-0.5 block font-mono text-[10px] uppercase tracking-[0.14em] text-faint">
              {hit.kind === "glossary" ? "glossary" : "lesson"}
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}

/* ------------------------------------------------------------------- glossary */

function Glossary({ onNavigate }: { onNavigate: (lessonId: string, page: number) => void }) {
  return (
    <dl className="m-0 mt-1 space-y-2 px-1.5">
      {GLOSSARY.map((entry) => (
        <div key={entry.term}>
          <dt className="text-[12.5px] font-semibold text-ink">{entry.term}</dt>
          <dd className="mt-0.5 mb-0 text-[12px] leading-relaxed text-muted">
            <Rich text={entry.def} />
            {(entry.lessons ?? []).length > 0 && (
              <span className="mt-0.5 flex flex-wrap gap-1.5">
                {(entry.lessons ?? []).slice(0, 3).map((lessonId) => (
                  <button
                    key={lessonId}
                    type="button"
                    onClick={() => onNavigate(lessonId, 0)}
                    className="rounded-full border border-line px-2 py-0.5 font-mono text-[10px] text-faint hover:text-accent"
                  >
                    {lessonById(lessonId)?.title ?? lessonId}
                  </button>
                ))}
              </span>
            )}
          </dd>
        </div>
      ))}
    </dl>
  );
}

/* --------------------------------------------------------------------- glyphs */

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      width="11"
      height="11"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`transition-transform duration-200 ${open ? "rotate-90" : ""}`}
      aria-hidden="true"
    >
      <path d="M9 6l6 6-6 6" />
    </svg>
  );
}

function BookmarkGlyph() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M6 3h12v18l-6-4-6 4Z" />
    </svg>
  );
}
