/**
 * The book's progress contract: reading is measured, records survive a refresh,
 * stale or hand-edited payloads are clamped instead of trusted, and rewards are
 * paid exactly once.
 *
 * `vitest` runs in a node environment, so the storage stub is installed before the
 * store module is imported — the store hydrates at import time, and importing it
 * eagerly would read `undefined`.
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import { CHAPTERS, LESSONS, lessonById, pagesOfLesson } from "./curriculum";
import type { BookState } from "./bookStore";

interface StoreModule {
  bookStore: {
    subscribe: (l: () => void) => () => void;
    getSnapshot: () => BookState;
    goto: (mark: { lessonId: string; page: number }) => void;
    gotoEndOf: (lessonId: string) => void;
    toggleChapter: (id: string) => void;
    setBookmark: () => void;
    clearBookmark: () => void;
    completeLesson: (id: string) => { awarded: number };
    solveExercise: (id: string, xp: number) => { awarded: number };
    useHint: (id: string, total: number) => void;
    revealSolution: (id: string) => void;
    recordQuiz: (id: string, value: string, correct: boolean) => void;
    recordReview: (chapterId: string, correct: number, total: number) => void;
    noteWrite: (dataset: string, lessonId: string) => void;
    clearWrite: (dataset: string) => void;
    resetAll: () => void;
  };
  lessonProgress: (s: BookState, id: string) => {
    pages: number;
    seenPages: number;
    fraction: number;
    completed: boolean;
    exercisesTotal: number;
    exercisesSolved: number;
    mastered: boolean;
  };
  chapterProgress: (
    s: BookState,
    id: string,
  ) => {
    lessons: number;
    read: number;
    completion: number;
    mastery: number;
    solvedExercises: number;
    totalExercises: number;
    review: { best: number; total: number; attempts: number } | null;
  };
  bookOverview: (s: BookState) => {
    lessons: number;
    read: number;
    reading: number;
    completion: number;
    mastery: number;
    pagesTotal: number;
    pagesSeen: number;
  };
  hasReadingHistory: (s: BookState) => boolean;
  XP_LESSON_READ: number;
  XP_REVIEW_PASS: number;
}

function memoryStorage(): Storage {
  const map = new Map<string, string>();
  return {
    getItem: (key: string) => map.get(key) ?? null,
    setItem: (key: string, value: string) => {
      map.set(key, value);
    },
    removeItem: (key: string) => {
      map.delete(key);
    },
    clear: () => map.clear(),
    key: (index: number) => [...map.keys()][index] ?? null,
    get length() {
      return map.size;
    },
  } as Storage;
}

let storage = memoryStorage();

async function loadStore(): Promise<StoreModule> {
  vi.resetModules();
  vi.stubGlobal("window", {
    localStorage: storage,
    // The journey store reads the same area under its own key, so XP and the
    // streak keep working exactly as they do in the browser.
    matchMedia: () => ({ matches: false, addEventListener: () => {}, removeEventListener: () => {} }),
  });
  return import("./bookStore") as unknown as Promise<StoreModule>;
}

const FIRST = LESSONS[0];
const SECOND = LESSONS[1];
/** A lesson long enough to have a middle, so page arithmetic in these tests is real. */
const LONG = LESSONS.find((lesson) => pagesOfLesson(lesson).length >= 4) ?? FIRST;
/** The first lesson that actually sets an exercise, wherever it is in the book. */
const WITH_EXERCISE =
  LESSONS.find((lesson) => lesson.blocks.some((block) => block.kind === "exercise")) ?? FIRST;

describe("book store", () => {
  beforeEach(() => {
    storage = memoryStorage();
  });

  it("opens on the first page of the first lesson", async () => {
    const { bookStore } = await loadStore();
    const state = bookStore.getSnapshot();
    expect(state.position).toEqual({ lessonId: FIRST.id, page: 0 });
    expect(state.bookmark).toBeNull();
    expect(state.seen).toEqual({});
  });

  it("counts a page as seen only when it is displayed", async () => {
    const { bookStore, lessonProgress } = await loadStore();
    const last = pagesOfLesson(LONG).length - 1;
    bookStore.goto({ lessonId: LONG.id, page: 1 });
    bookStore.goto({ lessonId: LONG.id, page: last });
    const mark = lessonProgress(bookStore.getSnapshot(), LONG.id);
    // Two jumps record two pages, not the span between them: skipping ahead is not
    // reading, and a progress bar that counts it as reading flatters everyone.
    expect(mark.seenPages).toBe(2);
    expect(mark.pages).toBe(last + 1);
    expect(mark.fraction).toBeLessThan(1);
  });

  it("refuses a lesson id that is not in the curriculum", async () => {
    const { bookStore } = await loadStore();
    bookStore.goto({ lessonId: "does-not-exist", page: 0 });
    expect(bookStore.getSnapshot().position.lessonId).toBe(FIRST.id);
  });

  it("clamps a page past the end of a lesson", async () => {
    const { bookStore } = await loadStore();
    const last = pagesOfLesson(FIRST).length - 1;
    bookStore.goto({ lessonId: FIRST.id, page: last + 40 });
    expect(bookStore.getSnapshot().position.page).toBe(last);
    bookStore.goto({ lessonId: FIRST.id, page: -3 });
    expect(bookStore.getSnapshot().position.page).toBe(0);
  });

  it("steps back into the previous lesson at its last page", async () => {
    const { bookStore } = await loadStore();
    bookStore.gotoEndOf(SECOND.id);
    expect(bookStore.getSnapshot().position).toEqual({
      lessonId: SECOND.id,
      page: pagesOfLesson(SECOND).length - 1,
    });
  });

  it("keeps a bookmark apart from the current position", async () => {
    const { bookStore } = await loadStore();
    bookStore.goto({ lessonId: FIRST.id, page: 2 });
    bookStore.setBookmark();
    bookStore.goto({ lessonId: SECOND.id, page: 0 });
    const state = bookStore.getSnapshot();
    expect(state.bookmark?.lessonId).toBe(FIRST.id);
    expect(state.position.lessonId).toBe(SECOND.id);
    bookStore.clearBookmark();
    expect(bookStore.getSnapshot().bookmark).toBeNull();
  });

  it("pays lesson XP once, however often the lesson is finished", async () => {
    const { bookStore, XP_LESSON_READ } = await loadStore();
    const first = bookStore.completeLesson(FIRST.id);
    const again = bookStore.completeLesson(FIRST.id);
    expect(first.awarded).toBe(XP_LESSON_READ);
    expect(again.awarded).toBe(0);
    expect(bookStore.getSnapshot().completed[FIRST.id]).toBeTruthy();
  });

  it("pays exercise XP once and records the solve", async () => {
    const { bookStore } = await loadStore();
    const block = WITH_EXERCISE.blocks.find((b) => b.kind === "exercise");
    expect(block?.kind).toBe("exercise");
    const id = block?.kind === "exercise" ? block.exercise.id : "none";
    expect(id).not.toBe("none");
    expect(bookStore.solveExercise(id, 30).awarded).toBe(30);
    expect(bookStore.solveExercise(id, 30).awarded).toBe(0);
    expect(bookStore.getSnapshot().exercisesSolved[id]).toBeTruthy();
  });

  it("counts hints without going past the list", async () => {
    const { bookStore } = await loadStore();
    bookStore.useHint("m-x", 2);
    bookStore.useHint("m-x", 2);
    bookStore.useHint("m-x", 2);
    expect(bookStore.getSnapshot().hints["m-x"]).toBe(2);
  });

  it("ignores quiz answers for ids the book never asked", async () => {
    const { bookStore } = await loadStore();
    bookStore.recordQuiz("invented-question", "0", true);
    expect(bookStore.getSnapshot().quiz["invented-question"]).toBeUndefined();
    const real = FIRST.quiz[0];
    bookStore.recordQuiz(real.id, "1", false);
    expect(bookStore.getSnapshot().quiz[real.id]).toMatchObject({
      value: "1",
      correct: false,
      attempts: 1,
    });
  });

  it("keeps the best review score across retries", async () => {
    const { bookStore, XP_REVIEW_PASS } = await loadStore();
    const chapter = CHAPTERS[0];
    const total = chapter.review.length;
    bookStore.recordReview(chapter.id, 1, total);
    bookStore.recordReview(chapter.id, total, total);
    const record = bookStore.getSnapshot().reviews[chapter.id];
    expect(record).toMatchObject({ best: total, total, attempts: 2, correct: total });
    // The pass bonus is paid when the best score crosses 80%, not twice.
    expect(record.best / record.total).toBe(1);
    expect(XP_REVIEW_PASS).toBeGreaterThan(0);
  });

  it("separates completion from mastery", async () => {
    const { bookStore, chapterProgress } = await loadStore();
    // A chapter with both exercises and a review, so the two halves are measurable.
    const chapter =
      CHAPTERS.find(
        (candidate) =>
          candidate.review.length > 0 &&
          candidate.lessons.some((lesson) =>
            lesson.blocks.some((block) => block.kind === "exercise"),
          ),
      ) ?? CHAPTERS[0];
    for (const lesson of chapter.lessons) bookStore.completeLesson(lesson.id);
    const readOnly = chapterProgress(bookStore.getSnapshot(), chapter.id);
    expect(readOnly.completion).toBe(1);
    // Every lesson read but nothing solved or reviewed is a skim, and reports one.
    expect(readOnly.mastery).toBe(0);

    for (const lesson of chapter.lessons) {
      for (const block of lesson.blocks) {
        if (block.kind === "exercise") bookStore.solveExercise(block.exercise.id, block.exercise.xp);
      }
    }
    const worked = chapterProgress(bookStore.getSnapshot(), chapter.id);
    expect(worked.mastery).toBeGreaterThan(0);
    expect(worked.solvedExercises).toBe(worked.totalExercises);
  });

  it("measures the whole book in pages and lessons", async () => {
    const { bookStore, bookOverview } = await loadStore();
    bookStore.goto({ lessonId: FIRST.id, page: 0 });
    const overview = bookOverview(bookStore.getSnapshot());
    expect(overview.lessons).toBe(LESSONS.length);
    expect(overview.pagesTotal).toBe(
      LESSONS.reduce((sum, lesson) => sum + pagesOfLesson(lesson).length, 0),
    );
    expect(overview.pagesSeen).toBe(1);
    expect(overview.reading).toBeGreaterThan(0);
    expect(overview.reading).toBeLessThan(0.1);
  });

  it("survives a refresh", async () => {
    const { bookStore } = await loadStore();
    bookStore.goto({ lessonId: SECOND.id, page: 1 });
    bookStore.completeLesson(FIRST.id);
    bookStore.recordQuiz(FIRST.quiz[0].id, "0", true);
    bookStore.setBookmark();
    const raw = storage.getItem("sparrowsql-book-v1");
    expect(raw).toBeTruthy();

    // Same storage, new module instance: exactly the behaviour of a page refresh.
    const reloaded = await loadStore();
    expect(reloaded.bookStore.getSnapshot().position).toEqual({ lessonId: SECOND.id, page: 1 });
    expect(reloaded.bookStore.getSnapshot().completed[FIRST.id]).toBeTruthy();
    expect(reloaded.bookStore.getSnapshot().quiz[FIRST.quiz[0].id]?.correct).toBe(true);
  });

  it("drops hand-edited or stale records instead of trusting them", async () => {
    const ghostLesson = "a-lesson-that-was-renamed";
    storage.setItem(
      "sparrowsql-book-v1",
      JSON.stringify({
        version: 1,
        position: { lessonId: ghostLesson, page: 99 },
        bookmark: { lessonId: ghostLesson, page: 4, at: "x" },
        seen: { [ghostLesson]: [0, 1, 2], [LONG.id]: [0, 1, 999, "zero", -1, 1.5, 2] },
        completed: { [ghostLesson]: "yesterday" },
        quiz: { made_up: { value: "0", correct: true, attempts: 9 } },
        reviews: { made_up_chapter: { correct: 9, total: 1 } },
        hints: { "m-x": -5 },
        openChapters: ["made_up_chapter"],
      }),
    );
    const { bookStore, lessonProgress } = await loadStore();
    const state = bookStore.getSnapshot();
    expect(state.position.lessonId).toBe(FIRST.id);
    expect(state.position.page).toBe(0);
    expect(state.bookmark).toBeNull();
    expect(Object.keys(state.completed)).toHaveLength(0);
    expect(state.quiz["made_up"]).toBeUndefined();
    expect(state.reviews["made_up_chapter"]).toBeUndefined();
    expect(state.hints["m-x"]).toBeUndefined();
    expect(state.openChapters).toEqual([]);
    // The only surviving `seen` entry is the real lesson, with its real pages: the
    // out-of-range, fractional and negative page numbers are gone.
    expect(state.seen[LONG.id]).toEqual([0, 1, 2]);
    expect(lessonProgress(state, LONG.id).seenPages).toBe(3);
  });

  it("keeps a valid page number when content grew", async () => {
    const last = pagesOfLesson(FIRST).length - 1;
    storage.setItem(
      "sparrowsql-book-v1",
      JSON.stringify({
        version: 1,
        position: { lessonId: FIRST.id, page: last },
        seen: { [FIRST.id]: [0, last] },
      }),
    );
    const { bookStore } = await loadStore();
    expect(bookStore.getSnapshot().position.page).toBe(last);
  });

  it("tracks which lesson last changed a starter database", async () => {
    const { bookStore } = await loadStore();
    bookStore.noteWrite("shop", FIRST.id);
    expect(bookStore.getSnapshot().writes["shop"]).toBe(FIRST.id);
    bookStore.clearWrite("shop");
    expect(bookStore.getSnapshot().writes["shop"]).toBeUndefined();
  });

  it("remembers which chapters the contents panel had open", async () => {
    const { bookStore } = await loadStore();
    const chapter = CHAPTERS[1];
    bookStore.toggleChapter(chapter.id);
    expect(bookStore.getSnapshot().openChapters).toContain(chapter.id);
    bookStore.toggleChapter(chapter.id);
    expect(bookStore.getSnapshot().openChapters).not.toContain(chapter.id);
  });

  it("resets only when asked", async () => {
    const { bookStore, hasReadingHistory } = await loadStore();
    bookStore.goto({ lessonId: FIRST.id, page: 1 });
    bookStore.completeLesson(FIRST.id);
    expect(hasReadingHistory(bookStore.getSnapshot())).toBe(true);
    bookStore.resetAll();
    const wiped = bookStore.getSnapshot();
    expect(wiped.completed).toEqual({});
    expect(wiped.seen).toEqual({});
    expect(wiped.position).toEqual({ lessonId: FIRST.id, page: 0 });
    expect(hasReadingHistory(wiped)).toBe(false);
  });

  it("notifies subscribers, so React re-renders on any record", async () => {
    const { bookStore } = await loadStore();
    const seen = vi.fn();
    const unsubscribe = bookStore.subscribe(seen);
    bookStore.goto({ lessonId: FIRST.id, page: 1 });
    expect(seen).toHaveBeenCalled();
    unsubscribe();
    bookStore.goto({ lessonId: FIRST.id, page: 2 });
    expect(seen).toHaveBeenCalledTimes(1);
  });

  it("gives every lesson a page list the book can turn", () => {
    for (const lesson of LESSONS) {
      const pages = pagesOfLesson(lesson);
      expect(pages.length).toBeGreaterThan(0);
      expect(pages[0].startsLesson).toBe(true);
      expect(pages[pages.length - 1].endsLesson).toBe(true);
      // A page break must never land a block on two pages.
      const flat = pages.flatMap((page) => page.blocks);
      expect(flat.length).toBe(lesson.blocks.length);
      expect(lessonById(lesson.id)?.id).toBe(lesson.id);
    }
  });
});
