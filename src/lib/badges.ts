import type { BadgeDef, BadgeId, ProgressState } from "./types";

/**
 * Static badge catalogue. Kept declarative so it can drive the achievements
 * modal, unlock toasts and analytics without hard-coded UI copy elsewhere.
 */
export const BADGES: BadgeDef[] = [
  {
    id: "first-query",
    name: "First Query",
    description: "Ran your very first query in the sandbox.",
    icon: "🐣",
  },
  {
    id: "flashcard-rookie",
    name: "Flashcard Rookie",
    description: "Completed every flashcard in the basics deck.",
    icon: "🃏",
  },
  {
    id: "table-builder",
    name: "Table Builder",
    description: "Created a table of your own in the playground.",
    icon: "🧱",
  },
  {
    id: "join-explorer",
    name: "Join Explorer",
    description: "Combined data from two tables with a JOIN.",
    icon: "🔗",
  },
  {
    id: "daily-first",
    name: "Daily Dev",
    description: "Finished your first Daily Challenge.",
    icon: "📅",
  },
  {
    id: "solution-solver",
    name: "Curious Mind",
    description: "Opened a guided solution and learned step by step.",
    icon: "💡",
  },
  {
    id: "streak-3",
    name: "On a Roll",
    description: "Practiced 3 days in a row.",
    icon: "🔥",
  },
  {
    id: "streak-7",
    name: "Week Warrior",
    description: "Kept a 7-day practice streak alive.",
    icon: "⚡",
  },
  {
    id: "xp-100",
    name: "Century Club",
    description: "Earned 100 XP.",
    icon: "⭐",
  },
  {
    id: "perfectionist",
    name: "Perfectionist",
    description: "Solved every exercise without revealing a solution.",
    icon: "🎯",
  },
  {
    id: "bootcamp-grad",
    name: "Bootcamp Grad",
    description: "Finished the flashcards and every guided exercise.",
    icon: "🎓",
  },
];

export const BADGE_BY_ID: Record<BadgeId, BadgeDef> = BADGES.reduce(
  (acc, b) => {
    acc[b.id] = b;
    return acc;
  },
  {} as Record<BadgeId, BadgeDef>,
);

export interface BadgeTotals {
  flashcards: number;
  exercises: number;
}

function countTrue(map: Record<string, boolean>): number {
  let n = 0;
  for (const k in map) if (map[k]) n += 1;
  return n;
}

/**
 * Evaluate the count/threshold based badges from a progress snapshot. Event
 * badges (first-query, table-builder, join-explorer, daily-first) are awarded
 * imperatively elsewhere and simply carried forward here.
 */
export function evaluateBadges(
  progress: ProgressState,
  totals: BadgeTotals,
): BadgeId[] {
  const earned: BadgeId[] = [];
  const flashcardsDone = countTrue(progress.flashcards);
  const exercisesDone = countTrue(progress.exercises);
  const solutionsUsed = countTrue(progress.solutionsRevealed);

  // Keep badges that were already earned (event badges live only in state).
  for (const id of Object.keys(progress.badges) as BadgeId[]) earned.push(id);

  if (totals.flashcards > 0 && flashcardsDone >= totals.flashcards) {
    earned.push("flashcard-rookie");
  }
  if (progress.streak.longest >= 3) earned.push("streak-3");
  if (progress.streak.longest >= 7) earned.push("streak-7");
  if (progress.xp >= 100) earned.push("xp-100");
  if (solutionsUsed > 0) earned.push("solution-solver");
  if (
    totals.exercises > 0 &&
    exercisesDone >= totals.exercises &&
    solutionsUsed === 0
  ) {
    earned.push("perfectionist");
  }
  if (
    totals.exercises > 0 &&
    totals.flashcards > 0 &&
    exercisesDone >= totals.exercises &&
    flashcardsDone >= totals.flashcards &&
    progress.playgroundUnlocked
  ) {
    earned.push("bootcamp-grad");
  }

  return Array.from(new Set(earned));
}
