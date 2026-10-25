import { useSyncExternalStore } from "react";
import { progressSelectors, progressStore } from "../lib/progressStore";
import type { ProgressState } from "../lib/types";

/**
 * Binds the framework-agnostic progress store to React via
 * `useSyncExternalStore`. Every component that reads progress re-renders
 * automatically whenever XP, streaks, flashcards, exercises or badges change —
 * which is what makes the learning bar update in real time.
 */
export function useProgress(): {
  progress: ProgressState;
  stats: ReturnType<typeof progressSelectors>;
  actions: typeof progressStore;
} {
  const progress = useSyncExternalStore(
    progressStore.subscribe,
    progressStore.getSnapshot,
    progressStore.getSnapshot,
  );
  return {
    progress,
    stats: progressSelectors(progress),
    actions: progressStore,
  };
}
