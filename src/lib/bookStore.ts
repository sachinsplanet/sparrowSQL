/**
 * Reading progress for the interactive book.
 *
 * A second store beside `progressStore.ts`, on purpose. The journey store knows
 * about flashcards, the lab's eight guided exercises and badges; its hydrate step
 * filters ids against an allowlist, so a book exercise id (`m11-ex-window`) saved
 * there would be silently dropped on the next refresh. Keeping the book's own
 * records here means the curriculum can grow without ever invalidating stored
 * progress, and the two stores stay joined where it matters: XP and the streak
 * still go through `progressStore`, so finishing a lesson feeds the same bar the
 * rest of the site reads.
 *
 * Completion and mastery are separate numbers. Reading every page is completion;
 * getting the exercises and the chapter review right is mastery. A learner who
 * skims to the end of a module shows as 100% read and low mastery, which is the
 * honest picture the curriculum spec asked for.
 */

import { CHAPTERS, LESSONS, lessonById, pagesOfLesson } from "./curriculum";
import { XP_SOLUTION_REVEAL, progressStore } from "./progressStore";
import type { DatasetId } from "./curriculum/types";

const STORAGE_KEY = "sparrowsql-book-v1";

/** A place in the book: a lesson and a zero-based page inside it. */
export interface BookMark {
  lessonId: string;
  /** 0-based index into `pagesOfLesson`. */
  page: number;
}

export interface QuizRecord {
  /** Option index for choice/predict/diagnose, typed text for fill. */
  value: string;
  correct: boolean;
  attempts: number;
  at: string;
}

export interface ReviewRecord {
  correct: number;
  total: number;
  attempts: number;
  /** Best score across attempts, so a lucky first run is not erased by a retry. */
  best: number;
  at: string;
}

export interface BookState {
  version: 1;
  /** Where the learner last was. This is what "Resume reading" opens. */
  position: BookMark;
  /** An explicit bookmark, kept separate from position so jumping ahead is safe. */
  bookmark: (BookMark & { at: string }) | null;
  /** lessonId -> page indexes actually displayed. */
  seen: Record<string, number[]>;
  /** lessonId -> ISO timestamp the lesson was marked read. */
  completed: Record<string, string>;
  /** book exercise / capstone milestone id -> ISO timestamp it passed the checker. */
  exercisesSolved: Record<string, string>;
  /** exercise id -> how many hints were opened. */
  hints: Record<string, number>;
  /** exercise id -> the walk-through was revealed. */
  revealed: Record<string, string>;
  /**
   * exercise id -> SQL the learner typed and has not passed yet. Turning a page, or
   * closing the tab, must not throw a half-written query away.
   */
  drafts: Record<string, string>;
  /** quiz item id -> last answer. */
  quiz: Record<string, QuizRecord>;
  /** chapter id -> the mixed review's score. */
  reviews: Record<string, ReviewRecord>;
  /** dataset -> the lesson that last wrote to it, so a stale grid can be explained. */
  writes: Record<string, string>;
  /** The contents panel's expanded chapters, so reopening it is not a reset. */
  openChapters: string[];
  startedAt: string;
  updatedAt: string;
}

const LESSON_IDS = new Set(LESSONS.map((lesson) => lesson.id));
const CHAPTER_IDS = new Set(CHAPTERS.map((chapter) => chapter.id));
/** Every quiz item id in the book, lessons and chapter reviews together. */
const QUIZ_IDS = new Set<string>([
  ...LESSONS.flatMap((lesson) => lesson.quiz.map((item) => item.id)),
  ...CHAPTERS.flatMap((chapter) => chapter.review.map((item) => item.id)),
]);

/** XP for reading a lesson to its last page. Less than an exercise, deliberately. */
export const XP_LESSON_READ = 10;
/** XP for passing a chapter review at 80% or better. */
export const XP_REVIEW_PASS = 25;

function firstLesson(): BookMark {
  const id = LESSONS[0]?.id ?? "";
  return { lessonId: id, page: 0 };
}

function freshState(): BookState {
  const now = new Date().toISOString();
  return {
    version: 1,
    position: firstLesson(),
    bookmark: null,
    seen: {},
    completed: {},
    exercisesSolved: {},
    hints: {},
    revealed: {},
    drafts: {},
    quiz: {},
    reviews: {},
    writes: {},
    openChapters: CHAPTERS.slice(0, 1).map((chapter) => chapter.id),
    startedAt: now,
    updatedAt: now,
  };
}

/* ---------- safe persistence (never throws in private mode) ---------- */

function read(): string | null {
  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function write(value: string): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, value);
  } catch {
    /* storage unavailable — reading progress lives for this session only */
  }
}

/* ---------- validation ---------- */

/**
 * A page index is only trusted while the lesson still has that many pages. Content
 * edits change pagination, so a stale record clamps to the last real page instead
 * of opening a blank sheet.
 */
function clampPage(lessonId: string, page: number): number {
  const lesson = lessonById(lessonId);
  if (!lesson) return 0;
  const count = pagesOfLesson(lesson).length;
  if (!Number.isFinite(page) || page < 0) return 0;
  return Math.min(Math.floor(page), Math.max(0, count - 1));
}

function keepMark(raw: unknown, fallback: BookMark): BookMark {
  if (!raw || typeof raw !== "object") return fallback;
  const value = raw as Partial<BookMark>;
  // A lesson renamed or deleted since the record was written must not strand the
  // learner, so an unknown id falls back rather than rendering an empty page.
  if (typeof value.lessonId !== "string" || !LESSON_IDS.has(value.lessonId)) return fallback;
  return { lessonId: value.lessonId, page: clampPage(value.lessonId, Number(value.page ?? 0)) };
}

/**
 * A bookmark whose lesson no longer exists is dropped rather than re-pointed at the
 * resume position: a pin that quietly moved is worse than no pin.
 */
function keepBookmark(raw: unknown): (BookMark & { at: string }) | null {
  if (!raw || typeof raw !== "object") return null;
  const value = raw as Partial<BookMark & { at: string }>;
  if (typeof value.lessonId !== "string" || !LESSON_IDS.has(value.lessonId)) return null;
  return {
    lessonId: value.lessonId,
    page: clampPage(value.lessonId, Number(value.page ?? 0)),
    at: typeof value.at === "string" ? value.at : "",
  };
}

function keepRecord<T>(
  raw: unknown,
  allowed: Set<string> | null,
  revive: (value: unknown) => T | null,
): Record<string, T> {
  const out: Record<string, T> = {};
  if (!raw || typeof raw !== "object") return out;
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    if (allowed && !allowed.has(key)) continue;
    const revived = revive(value);
    if (revived !== null) out[key] = revived;
  }
  return out;
}

function keepSeen(raw: unknown): Record<string, number[]> {
  const out: Record<string, number[]> = {};
  if (!raw || typeof raw !== "object") return out;
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    if (!LESSON_IDS.has(key) || !Array.isArray(value)) continue;
    const lesson = lessonById(key);
    if (!lesson) continue;
    const last = Math.max(0, pagesOfLesson(lesson).length - 1);
    const pages = [
      ...new Set(
        value
          .filter((n): n is number => typeof n === "number" && Number.isInteger(n))
          .filter((n) => n >= 0 && n <= last),
      ),
    ].sort((a, b) => a - b);
    if (pages.length) out[key] = pages;
  }
  return out;
}

function keepStrings(raw: unknown, allowed: Set<string> | null): Record<string, string> {
  return keepRecord(raw, allowed, (value) => (typeof value === "string" ? value : null));
}

/**
 * Typed SQL, kept short on purpose: a draft is a convenience, not an archive, and a
 * hand-edited payload should not be able to bloat the saved state.
 */
function keepDrafts(raw: unknown): Record<string, string> {
  const out: Record<string, string> = {};
  if (!raw || typeof raw !== "object") return out;
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    if (Object.keys(out).length >= 200) break;
    if (typeof value !== "string" || value.length > 4000) continue;
    out[key] = value;
  }
  return out;
}

function hydrate(): BookState {
  const raw = read();
  if (!raw) return freshState();
  try {
    const parsed = JSON.parse(raw) as Partial<BookState>;
    const base = freshState();
    const position = keepMark(parsed.position, base.position);
    return {
      version: 1,
      position,
      bookmark: keepBookmark(parsed.bookmark),
      seen: keepSeen(parsed.seen),
      completed: keepStrings(parsed.completed, LESSON_IDS),
      exercisesSolved: keepStrings(parsed.exercisesSolved, null),
      hints: keepRecord(parsed.hints, null, (value) =>
        typeof value === "number" && Number.isFinite(value) && value >= 0
          ? Math.floor(value)
          : null,
      ),
      revealed: keepStrings(parsed.revealed, null),
      drafts: keepDrafts(parsed.drafts),
      quiz: keepRecord(parsed.quiz, QUIZ_IDS, (value) => {
        if (!value || typeof value !== "object") return null;
        const item = value as Partial<QuizRecord>;
        if (typeof item.value !== "string" || typeof item.correct !== "boolean") return null;
        return {
          value: item.value,
          correct: item.correct,
          attempts: numberOr(item.attempts, 1),
          at: typeof item.at === "string" ? item.at : "",
        };
      }),
      reviews: keepRecord(parsed.reviews, CHAPTER_IDS, (value) => {
        if (!value || typeof value !== "object") return null;
        const item = value as Partial<ReviewRecord>;
        const total = numberOr(item.total, 0);
        const correct = numberOr(item.correct, 0);
        if (total <= 0 || correct > total) return null;
        return {
          correct,
          total,
          attempts: numberOr(item.attempts, 1),
          best: Math.max(numberOr(item.best, correct), correct),
          at: typeof item.at === "string" ? item.at : "",
        };
      }),
      writes: keepStrings(parsed.writes, null),
      openChapters: Array.isArray(parsed.openChapters)
        ? parsed.openChapters.filter(
            (id): id is string => typeof id === "string" && CHAPTER_IDS.has(id),
          )
        : base.openChapters,
      startedAt: typeof parsed.startedAt === "string" ? parsed.startedAt : base.startedAt,
      updatedAt: typeof parsed.updatedAt === "string" ? parsed.updatedAt : base.updatedAt,
    };
  } catch {
    return freshState();
  }
}

function numberOr(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0
    ? Math.floor(value)
    : fallback;
}

/* ---------- reactive core ---------- */

let state: BookState = hydrate();
const listeners = new Set<() => void>();

function emit(next: BookState): void {
  state = next;
  write(JSON.stringify(next));
  for (const listener of listeners) listener();
}

function mutate(updater: (draft: BookState) => void): void {
  const draft: BookState = JSON.parse(JSON.stringify(state)) as BookState;
  updater(draft);
  draft.updatedAt = new Date().toISOString();
  emit(draft);
}

/* ---------- public API ---------- */

export const bookStore = {
  subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  getSnapshot(): BookState {
    return state;
  },

  /**
   * Move to a page. Every page shown is also marked seen, so the progress bar
   * measures reading rather than jumping.
   */
  goto(mark: BookMark): void {
    const lesson = lessonById(mark.lessonId);
    if (!lesson) return;
    const page = clampPage(mark.lessonId, mark.page);
    mutate((draft) => {
      draft.position = { lessonId: lesson.id, page };
      const seen = new Set(draft.seen[lesson.id] ?? []);
      seen.add(page);
      draft.seen[lesson.id] = [...seen].sort((a, b) => a - b);
    });
  },

  /** The last page of a lesson, used by "previous lesson" and by resumes. */
  gotoEndOf(lessonId: string): void {
    const lesson = lessonById(lessonId);
    if (!lesson) return;
    this.goto({ lessonId, page: pagesOfLesson(lesson).length - 1 });
  },

  toggleChapter(chapterId: string): void {
    if (!CHAPTER_IDS.has(chapterId)) return;
    mutate((draft) => {
      draft.openChapters = draft.openChapters.includes(chapterId)
        ? draft.openChapters.filter((id) => id !== chapterId)
        : [...draft.openChapters, chapterId];
    });
  },

  /** Drop a pin. Resume-from-bookmark survives further reading. */
  setBookmark(): void {
    mutate((draft) => {
      draft.bookmark = { ...draft.position, at: new Date().toISOString() };
    });
  },

  clearBookmark(): void {
    if (!state.bookmark) return;
    mutate((draft) => {
      draft.bookmark = null;
    });
  },

  /**
   * Acknowledge finishing a lesson. XP is only paid the first time, because the
   * store used to re-award on every revisit in an earlier draft of this feature and
   * a learner rereading a hard page should not farm points.
   */
  completeLesson(lessonId: string): { awarded: number } {
    const lesson = lessonById(lessonId);
    if (!lesson || state.completed[lessonId]) return { awarded: 0 };
    mutate((draft) => {
      draft.completed[lessonId] = new Date().toISOString();
      const last = pagesOfLesson(lesson).length - 1;
      draft.seen[lessonId] = Array.from({ length: last + 1 }, (_, index) => index);
    });
    progressStore.addXp(XP_LESSON_READ);
    return { awarded: XP_LESSON_READ };
  },

  /** An exercise or milestone passed the real checker. */
  solveExercise(id: string, xp: number): { awarded: number } {
    if (state.exercisesSolved[id]) return { awarded: 0 };
    mutate((draft) => {
      draft.exercisesSolved[id] = new Date().toISOString();
    });
    // `progressStore.completeExercise` filters against the lab's exercise ids, so
    // the book pays XP directly instead of having the record dropped at hydrate.
    progressStore.addXp(Math.max(0, Math.floor(xp)));
    return { awarded: xp };
  },

  useHint(exerciseId: string, total: number): void {
    mutate((draft) => {
      draft.hints[exerciseId] = Math.min((draft.hints[exerciseId] ?? 0) + 1, total);
    });
    progressStore.useHint();
  },

  revealSolution(exerciseId: string): void {
    if (state.revealed[exerciseId]) return;
    mutate((draft) => {
      draft.revealed[exerciseId] = new Date().toISOString();
    });
    // The lab's `revealSolution` records are filtered against its own exercise ids,
    // so the book keeps the record above and pays only the reward here.
    progressStore.addXp(XP_SOLUTION_REVEAL);
  },

  recordQuiz(id: string, value: string, correct: boolean): void {
    if (!QUIZ_IDS.has(id)) return;
    mutate((draft) => {
      const previous = draft.quiz[id];
      draft.quiz[id] = {
        value,
        correct,
        attempts: (previous?.attempts ?? 0) + 1,
        at: new Date().toISOString(),
      };
    });
  },

  recordReview(chapterId: string, correct: number, total: number): void {
    if (!CHAPTER_IDS.has(chapterId) || total <= 0) return;
    mutate((draft) => {
      const previous = draft.reviews[chapterId];
      const next: ReviewRecord = {
        correct,
        total,
        attempts: (previous?.attempts ?? 0) + 1,
        best: Math.max(previous?.best ?? 0, correct),
        at: new Date().toISOString(),
      };
      draft.reviews[chapterId] = next;
      const passedFirstTime =
        next.best / total >= 0.8 && (previous?.best ?? 0) / total < 0.8;
      if (passedFirstTime) progressStore.addXp(XP_REVIEW_PASS);
    });
  },

  /**
   * Keep the learner's unfinished SQL. The editor debounces this, so a page turn or
   * a refresh never throws away a query that has not passed yet.
   */
  saveDraft(exerciseId: string, sql: string): void {
    if (state.drafts[exerciseId] === sql) return;
    mutate((draft) => {
      if (sql.trim() === "") delete draft.drafts[exerciseId];
      else draft.drafts[exerciseId] = sql;
    });
  },

  /**
   * Record that a lesson changed a starter database. The next lesson that claims a
   * grid of rows uses this to explain why its example might print something else,
   * and to offer the factory rows again.
   */
  noteWrite(dataset: DatasetId, lessonId: string): void {
    if (state.writes[dataset] === lessonId) return;
    mutate((draft) => {
      draft.writes[dataset] = lessonId;
    });
  },

  /** A sample-data reset makes the previous write note untrue again. */
  clearWrite(dataset: DatasetId): void {
    if (!(dataset in state.writes)) return;
    mutate((draft) => {
      delete draft.writes[dataset];
    });
  },

  /** The intentional wipe the curriculum spec asked for. Reading progress only. */
  resetAll(): void {
    emit(freshState());
  },
};

/* ---------- selectors ---------- */

export interface LessonProgress {
  pages: number;
  seenPages: number;
  /** 0-1, based on pages displayed, not time on page. */
  fraction: number;
  completed: boolean;
  quizAnswered: number;
  quizCorrect: number;
  quizTotal: number;
  exercisesTotal: number;
  exercisesSolved: number;
  /** A lesson is "done" when read, exercised and quizzed — not merely scrolled. */
  mastered: boolean;
}

export function lessonProgress(stateValue: BookState, lessonId: string): LessonProgress {
  const lesson = lessonById(lessonId);
  const pages = lesson ? pagesOfLesson(lesson).length : 0;
  const seenPages = Math.min(stateValue.seen[lessonId]?.length ?? 0, pages);
  const quizTotal = lesson?.quiz.length ?? 0;
  const quizAnswered = (lesson?.quiz ?? []).filter(
    (item) => stateValue.quiz[item.id]?.value !== undefined,
  ).length;
  const quizCorrect = (lesson?.quiz ?? []).filter(
    (item) => stateValue.quiz[item.id]?.correct,
  ).length;
  const exerciseIds = (lesson?.blocks ?? [])
    .filter((block) => block.kind === "exercise")
    .map((block) => (block.kind === "exercise" ? block.exercise.id : ""));
  const exercisesSolved = exerciseIds.filter((id) => stateValue.exercisesSolved[id]).length;
  const completed = Boolean(stateValue.completed[lessonId]);
  return {
    pages,
    seenPages,
    fraction: pages === 0 ? 0 : seenPages / pages,
    completed,
    quizAnswered,
    quizCorrect,
    quizTotal,
    exercisesTotal: exerciseIds.length,
    exercisesSolved,
    mastered:
      completed &&
      exercisesSolved === exerciseIds.length &&
      exerciseIds.length > 0 &&
      quizTotal > 0 &&
      quizCorrect === quizTotal,
  };
}

export interface ChapterProgress {
  lessons: number;
  read: number;
  /** Completion, 0-1: how much of the chapter has been finished. */
  completion: number;
  /** Mastery, 0-1: exercises passed plus the review score. */
  mastery: number;
  solvedExercises: number;
  totalExercises: number;
  review: ReviewRecord | null;
}

export function chapterProgress(stateValue: BookState, chapterId: string): ChapterProgress {
  const chapter = CHAPTERS.find((candidate) => candidate.id === chapterId);
  if (!chapter) {
    return {
      lessons: 0,
      read: 0,
      completion: 0,
      mastery: 0,
      solvedExercises: 0,
      totalExercises: 0,
      review: null,
    };
  }
  const marks = chapter.lessons.map((lesson) => lessonProgress(stateValue, lesson.id));
  const read = marks.filter((mark) => mark.completed).length;
  const solvedExercises = marks.reduce((sum, mark) => sum + mark.exercisesSolved, 0);
  const totalExercises = marks.reduce((sum, mark) => sum + mark.exercisesTotal, 0);
  const review = stateValue.reviews[chapter.id] ?? null;
  // Mastery weights the exercises and the review half and half, so a chapter with
  // no review questions still reports something meaningful.
  const exerciseShare = totalExercises === 0 ? 0 : solvedExercises / totalExercises;
  const reviewShare = review ? review.best / review.total : 0;
  const mastery = review ? exerciseShare * 0.5 + reviewShare * 0.5 : exerciseShare;
  return {
    lessons: chapter.lessons.length,
    read,
    completion: chapter.lessons.length === 0 ? 0 : read / chapter.lessons.length,
    mastery,
    solvedExercises,
    totalExercises,
    review,
  };
}

export interface BookOverview {
  lessons: number;
  read: number;
  /** Pages displayed across the whole book, as a percentage. */
  reading: number;
  /** Lessons completed, as a percentage. */
  completion: number;
  /** Weighted mastery across chapters that have any content. */
  mastery: number;
  exercisesSolved: number;
  exercisesTotal: number;
  xpFromBook: number;
  pagesTotal: number;
  pagesSeen: number;
}

export function bookOverview(stateValue: BookState): BookOverview {
  let pagesTotal = 0;
  let pagesSeen = 0;
  for (const lesson of LESSONS) {
    const count = pagesOfLesson(lesson).length;
    pagesTotal += count;
    pagesSeen += Math.min(stateValue.seen[lesson.id]?.length ?? 0, count);
  }
  const marks = LESSONS.map((lesson) => lessonProgress(stateValue, lesson.id));
  const read = marks.filter((mark) => mark.completed).length;
  const chapters = CHAPTERS.map((chapter) => chapterProgress(stateValue, chapter.id));
  const mastery =
    chapters.reduce((sum, chapter) => sum + chapter.mastery, 0) / Math.max(1, chapters.length);
  const solved = marks.reduce((sum, mark) => sum + mark.exercisesSolved, 0);
  const total = marks.reduce((sum, mark) => sum + mark.exercisesTotal, 0);
  return {
    lessons: LESSONS.length,
    read,
    reading: pagesTotal === 0 ? 0 : pagesSeen / pagesTotal,
    completion: LESSONS.length === 0 ? 0 : read / LESSONS.length,
    mastery,
    exercisesSolved: solved,
    exercisesTotal: total,
    xpFromBook: read * XP_LESSON_READ,
    pagesTotal,
    pagesSeen,
  };
}

/** Where reading left off, for the "Resume reading" label. */
export function resumePoint(stateValue: BookState): BookMark {
  return stateValue.position;
}

/** True once the learner has seen a page, so the site can offer "Start" or "Resume". */
export function hasReadingHistory(stateValue: BookState): boolean {
  // `{}` is truthy, so these two are counted, not tested for presence.
  return (
    Object.keys(stateValue.seen).length > 0 || Object.keys(stateValue.completed).length > 0
  );
}

export { STORAGE_KEY as BOOK_STORAGE_KEY };
