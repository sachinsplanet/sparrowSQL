/**
 * Reads the book's own progress store from React.
 *
 * The same `useSyncExternalStore` shape `useProgress.ts` uses, so a quiz answer, a
 * solved exercise or a page turn re-renders every part of the interface that shows
 * progress — the header, the contents panel and the page footers stay in step without
 * any of them owning the state.
 */

import { useSyncExternalStore } from "react";
import { bookStore, type BookState } from "../lib/bookStore";

export function useBookState(): BookState {
  return useSyncExternalStore(bookStore.subscribe, bookStore.getSnapshot, bookStore.getSnapshot);
}
