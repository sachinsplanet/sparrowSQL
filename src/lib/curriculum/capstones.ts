/**
 * The three capstone projects.
 *
 * A capstone is authored as *data* — problem, brief, schema, starter rows,
 * milestones with hints and success criteria — and turned into book lessons by
 * `capstoneToLessons()`. That keeps the three projects the same shape, and lets the
 * verification harness execute every milestone solution exactly like a learner's.
 *
 * Every milestone solution is self-contained (it creates what it needs with
 * `IF NOT EXISTS`), because the harness reseeds a dataset before each check while a
 * learner keeps their own progress. Both paths must pass.
 */

import { capstoneMilestoneLessonShape } from "./capstoneLesson";
import { CAPSTONES } from "./capstoneData";
import type { Chapter, Lesson } from "./types";

/**
 * Each capstone becomes one chapter: a brief lesson followed by one lesson per
 * milestone. The generator lives in `capstoneLesson.ts` so the data files stay
 * readable; this file only assembles chapters.
 */
export const CAPSTONE_CHAPTERS: Chapter[] = CAPSTONES.map((capstone, index) => {
  const lessons: Lesson[] = [
    capstoneMilestoneLessonShape.brief(capstone),
    ...capstone.milestones.map((milestone, i) =>
      capstoneMilestoneLessonShape.milestone(capstone, milestone, i),
    ),
  ];
  lessons.forEach((lesson, i) => {
    lesson.order = i + 1;
    lesson.chapter = 13 + index;
  });
  return {
    number: 13 + index,
    id: capstone.id,
    title: capstone.title,
    kicker: `Capstone project ${capstone.number}`,
    blurb: capstone.problem,
    module: 0,
    kind: "capstone" as const,
    lessons,
    review: capstoneMilestoneLessonShape.review(capstone),
  };
});

export { CAPSTONES };
