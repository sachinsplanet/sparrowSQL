/**
 * The curriculum registry.
 *
 * Two jobs. First, flatten the authored chapters into lookup tables the book can
 * navigate (lesson by id, chapter of a lesson, previous/next). Second, turn a
 * lesson's blocks into *pages*: a deterministic, weight-based pagination that the
 * InteractiveBook shell renders two at a time on a wide screen and one at a time on
 * a narrow one.
 *
 * Pagination is a function of content, not of measured layout, so a page break never
 * moves when the window is resized or when an example's result grows. Each page
 * scrolls internally as an overflow safety valve; capacity is set so that almost
 * every page fits a tall desktop without scrolling.
 */

import { GLOSSARY_SEED, type GlossaryEntry } from "./glossary";
import { CAPSTONE_CHAPTERS } from "./capstones";
import { MODULE_CHAPTERS } from "./modules";
import type { Block, Chapter, Lesson, QuizItem } from "./types";

/* ---------------------------------------------------------------- chapters */

export const CHAPTERS: Chapter[] = [...MODULE_CHAPTERS, ...CAPSTONE_CHAPTERS];

export const LESSONS: Lesson[] = CHAPTERS.flatMap((chapter) => chapter.lessons);

const LESSONS_BY_ID = new Map(LESSONS.map((lesson) => [lesson.id, lesson]));
const CHAPTERS_BY_ID = new Map(CHAPTERS.map((chapter) => [chapter.id, chapter]));
const CHAPTER_BY_NUMBER = new Map(CHAPTERS.map((chapter) => [chapter.number, chapter]));

export const LESSON_IDS: string[] = LESSONS.map((lesson) => lesson.id);

export function lessonById(id: string | null | undefined): Lesson | undefined {
  return id ? LESSONS_BY_ID.get(id) : undefined;
}

export function chapterById(id: string): Chapter | undefined {
  return CHAPTERS_BY_ID.get(id);
}

export function chapterByNumber(number: number): Chapter | undefined {
  return CHAPTER_BY_NUMBER.get(number);
}

export function chapterOfLesson(lessonId: string): Chapter | undefined {
  const lesson = LESSONS_BY_ID.get(lessonId);
  return lesson ? CHAPTER_BY_NUMBER.get(lesson.chapter) : undefined;
}

/** The chapter's mixed review questions, empty for a capstone. */
export function reviewOf(lessonId: string): QuizItem[] {
  return chapterOfLesson(lessonId)?.review ?? [];
}

export function isLastLessonOfChapter(lessonId: string): boolean {
  const chapter = chapterOfLesson(lessonId);
  return Boolean(chapter && chapter.lessons[chapter.lessons.length - 1]?.id === lessonId);
}

/** Linear navigation across the whole book, capstones included. */
export function nextLessonId(lessonId: string): string | null {
  const at = LESSON_IDS.indexOf(lessonId);
  return at < 0 || at + 1 >= LESSON_IDS.length ? null : LESSON_IDS[at + 1];
}

export function previousLessonId(lessonId: string): string | null {
  const at = LESSON_IDS.indexOf(lessonId);
  return at <= 0 ? null : LESSON_IDS[at - 1];
}

/** Lessons that list `lessonId` as a prerequisite, i.e. what it unlocks. */
export function lessonsNeeding(lessonId: string): Lesson[] {
  return LESSONS.filter((lesson) => lesson.prerequisites.includes(lessonId));
}

/* ------------------------------------------------------------------ pagination */

/** Rough reading weight of one block, in the same units as PAGE_CAPACITY. */
export function blockWeight(block: Block): number {
  switch (block.kind) {
    case "prose":
      return 2 + Math.ceil(block.text.length / 260);
    case "heading":
      return 1.5;
    case "list":
      return 1.5 + block.items.length * 0.8;
    case "syntax":
      return 2 + block.code.split("\n").length * 0.9;
    case "example": {
      const lines = block.sql.split("\n").length;
      const rows = block.expected?.rows.length ?? 0;
      return 5 + lines * 0.8 + rows * 0.6 + (block.explain.length > 160 ? 1 : 0);
    }
    case "table":
      return 3 + block.rows.length * 0.9;
    case "callout":
      return 3 + Math.ceil(block.text.length / 300);
    case "mistake":
      return 5;
    case "diagram":
      return 3 + block.nodes.length * 0.7;
    case "exercise":
      return 8;
    case "quiz":
      return 3 + block.questions.length * 4;
    case "keyterms":
      return 2 + block.terms.length * 1.1;
    case "link":
      return 1.5;
    default:
      return 2;
  }
}

/**
 * Weight a single page carries. Chosen so a page is roughly 45-60 vertical
 * centimetres of textbook: enough to be worth reading, short enough that a
 * learner never has to scroll inside a page on a laptop.
 */
export const PAGE_CAPACITY = 30;

export interface BookPage {
  /** Stable key for React: lesson id + page ordinal. */
  key: string;
  lessonId: string;
  /** 1-based inside the lesson. */
  number: number;
  /** Total pages in the lesson. */
  of: number;
  blocks: Block[];
  /** True for the right-hand page of a spread (front of a leaf). */
  isFront: boolean;
  /** The lesson's own summary line, shown on the first page of a lesson. */
  startsLesson: boolean;
  endsLesson: boolean;
}

const pageCache = new Map<string, BookPage[]>();

/** Split one lesson into pages. Deterministic and cached. */
export function pagesOfLesson(lesson: Lesson): BookPage[] {
  const cached = pageCache.get(lesson.id);
  if (cached) return cached;

  const chunks: Block[][] = [];
  let current: Block[] = [];
  let weight = 0;
  for (const block of lesson.blocks) {
    const cost = blockWeight(block);
    // Never orphan a block on a page of its own unless it alone exceeds capacity.
    if (current.length > 0 && weight + cost > PAGE_CAPACITY) {
      chunks.push(current);
      current = [];
      weight = 0;
    }
    current.push(block);
    weight += cost;
  }
  if (current.length) chunks.push(current);

  // A lesson that ends with a stub page reads badly; fold it back when tiny.
  if (chunks.length > 1 && chunks[chunks.length - 1].length === 1) {
    const last = chunks[chunks.length - 1];
    if (blockWeight(last[0]) < 4) {
      chunks.pop();
      chunks[chunks.length - 1].push(last[0]);
    }
  }

  const pages: BookPage[] = chunks.map((blocks, index) => ({
    key: `${lesson.id}-p${index}`,
    lessonId: lesson.id,
    number: index + 1,
    of: chunks.length,
    blocks,
    isFront: index % 2 === 0,
    startsLesson: index === 0,
    endsLesson: index === chunks.length - 1,
  }));
  pageCache.set(lesson.id, pages);
  return pages;
}

/**
 * The leaf pairs the book turns. A leaf is one physical sheet: its front page and
 * its back page. An odd final page leaves the back of the last leaf blank, exactly
 * as a real book's final page does.
 */
export interface BookLeaf {
  key: string;
  front: BookPage;
  back: BookPage | null;
}

const leafCache = new Map<string, BookLeaf[]>();

export function leavesOfLesson(lesson: Lesson): BookLeaf[] {
  const cached = leafCache.get(lesson.id);
  if (cached) return cached;
  const pages = pagesOfLesson(lesson);
  const leaves: BookLeaf[] = [];
  for (let i = 0; i < pages.length; i += 2) {
    leaves.push({
      key: `${lesson.id}-leaf${i / 2}`,
      front: pages[i],
      back: pages[i + 1] ?? null,
    });
  }
  leafCache.set(lesson.id, leaves);
  return leaves;
}

export function pageCount(lesson: Lesson): number {
  return pagesOfLesson(lesson).length;
}

/* ------------------------------------------------------------------- search */

export interface SearchHit {
  kind: "lesson" | "glossary";
  id: string;
  title: string;
  detail: string;
  lessonId?: string;
}

/** Whole-book search for the contents panel. */
export function searchCurriculum(query: string): SearchHit[] {
  const needle = query.trim().toLowerCase();
  if (needle.length < 2) return [];
  const hits: SearchHit[] = [];
  for (const lesson of LESSONS) {
    const haystack = [
      lesson.title,
      lesson.summary,
      ...lesson.objectives,
      ...lesson.recap,
      ...lesson.blocks.flatMap((b) => textOf(b)),
    ]
      .join(" ")
      .toLowerCase();
    if (haystack.includes(needle)) {
      hits.push({
        kind: "lesson",
        id: lesson.id,
        title: lesson.title,
        detail: `Module ${lesson.chapter} · ${lesson.minutes} min`,
        lessonId: lesson.id,
      });
    }
  }
  for (const entry of GLOSSARY) {
    if (`${entry.term} ${entry.def}`.toLowerCase().includes(needle)) {
      hits.push({
        kind: "glossary",
        id: entry.term,
        title: entry.term,
        detail: entry.def,
        lessonId: entry.lessons?.[0],
      });
    }
  }
  return hits.slice(0, 24);
}

function textOf(block: Block): string[] {
  switch (block.kind) {
    case "prose":
    case "heading":
    case "callout":
      return [block.text];
    case "list":
      return block.items;
    case "example":
      return [block.sql, block.explain];
    case "syntax":
      return [block.code];
    case "mistake":
      return [block.wrong, block.symptom, block.why, block.fix];
    case "keyterms":
      return block.terms.flatMap((t) => [t.term, t.def]);
    case "quiz":
      return block.questions.map((q) => q.prompt);
    case "exercise":
      return [block.exercise.prompt, ...block.exercise.hints];
    default:
      return [];
  }
}

/* ------------------------------------------------------------------ glossary */

/** The seed list plus every key term taught in a lesson, alphabetised. */
export const GLOSSARY: GlossaryEntry[] = (() => {
  const byTerm = new Map<string, GlossaryEntry>();
  for (const entry of GLOSSARY_SEED) {
    byTerm.set(entry.term.toLowerCase(), { ...entry, term: entry.term, lessons: [] });
  }
  for (const lesson of LESSONS) {
    for (const block of lesson.blocks) {
      if (block.kind !== "keyterms") continue;
      for (const t of block.terms) {
        const key = t.term.toLowerCase();
        const existing = byTerm.get(key);
        if (existing) {
          existing.lessons = [...new Set([...(existing.lessons ?? []), lesson.id])];
        } else {
          byTerm.set(key, { term: t.term, def: t.def, lessons: [lesson.id] });
        }
      }
    }
  }
  return [...byTerm.values()].sort((a, b) => a.term.localeCompare(b.term));
})();

/* -------------------------------------------------------------------- stats */

export const CURRICULUM_STATS = {
  chapters: CHAPTERS.length,
  modules: CHAPTERS.filter((c) => c.kind === "module").length,
  capstones: CHAPTERS.filter((c) => c.kind === "capstone").length,
  lessons: LESSONS.length,
  minutes: LESSONS.reduce((sum, lesson) => sum + lesson.minutes, 0),
  examples: LESSONS.reduce(
    (sum, lesson) =>
      sum + lesson.blocks.filter((b) => b.kind === "example" && b.expectFailure !== true).length,
    0,
  ),
  exercises: LESSONS.reduce(
    (sum, lesson) => sum + lesson.blocks.filter((b) => b.kind === "exercise").length,
    0,
  ),
  quizItems: LESSONS.reduce((sum, lesson) => sum + lesson.quiz.length, 0),
  xp: LESSONS.reduce(
    (sum, lesson) =>
      sum +
      lesson.blocks.reduce(
        (inner, b) => inner + (b.kind === "exercise" ? b.exercise.xp : 0),
        0,
      ),
    0,
  ),
};

export type { BookLeaf as Leaf };
export { CHAPTERS as TABLE_OF_CONTENTS };
