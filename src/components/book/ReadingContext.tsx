/**
 * What a page knows about the lesson it belongs to.
 *
 * A page is a list of blocks, and half of those blocks need the same surrounding
 * facts: which lesson, which starter database, whether the book is actually on screen,
 * and how to jump to another lesson. Passing all of that down as props would mean
 * every renderer taking five arguments it never renders. One context, typed, and the
 * renderers stay presentational.
 */

import { createContext, useContext } from "react";
import type { BookPage } from "../../lib/curriculum";
import type { Chapter, DatasetId, Lesson } from "../../lib/curriculum/types";
import type { LessonDatabase } from "./bookEngine";

export interface ReadingContext {
  lesson: Lesson;
  chapter?: Chapter;
  page: BookPage;
  /** The lesson's starter database, and how to put its factory rows back. */
  db: LessonDatabase;
  /**
   * False while the book is minimized. Interactive blocks refuse to run then, so a
   * backgrounded page cannot be quietly executing SQL the learner cannot see.
   */
  reading: boolean;
  /** Jump to another lesson — what a `link` block and Sparrow's prerequisites use. */
  goTo: (lessonId: string, page?: number) => void;
  /** Report that a statement changed data, so a later page can explain its own rows. */
  noteWrite: (dataset: DatasetId) => void;
  dataset: DatasetId;
}

const Reading = createContext<ReadingContext | null>(null);

export const ReadingProvider = Reading.Provider;

export function useReading(): ReadingContext {
  const value = useContext(Reading);
  if (!value) {
    // Only reachable by rendering a block outside a page, which is a programming
    // error, not a learner-facing state.
    throw new Error("Block renderers must be inside a <ReadingProvider>.");
  }
  return value;
}
