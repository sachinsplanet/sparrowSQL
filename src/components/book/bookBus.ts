/**
 * The book's open/closed state, outside React.
 *
 * Nav buttons, curriculum cards, the hero CTA and the URL all want to open the book
 * at a particular lesson. Giving each of them a callback prop from `App` would mean
 * threading two arguments through every section of a page that mostly ignores them,
 * so this is a five-listener store instead — the same shape `progressStore.ts` uses,
 * and it lets `useSyncExternalStore` bind the book without a context provider.
 *
 * `minimized` matters on its own: the reading surface has to stay mounted while the
 * learner goes to write a query in the Live Lab, or every opened example and half
 * answered quiz would be thrown away for looking at the editor.
 */

import { useSyncExternalStore } from "react";
import type { BookMark } from "../../lib/bookStore";

export type BookPhase = "closed" | "reading" | "minimized";

interface BookUiState {
  phase: BookPhase;
  /** A lesson the site asked the book to open, cleared once the book takes it. */
  request: BookMark | null;
  /** Which panel is showing on a wide screen. */
  contents: boolean;
  /**
   * True when the book was put aside because the learner went to the Live Lab. The
   * lesson's starter database is then left selected on purpose, so a query handed to
   * the editor still has the tables the page described.
   */
  keepDatabase: boolean;
}

let state: BookUiState = {
  phase: "closed",
  request: null,
  contents: false,
  keepDatabase: false,
};
const listeners = new Set<() => void>();

function emit(next: BookUiState): void {
  state = next;
  for (const listener of listeners) listener();
}

export function openBook(mark?: BookMark): void {
  emit({
    phase: "reading",
    request: mark ?? state.request,
    contents: false,
    keepDatabase: false,
  });
}

/** Ask the book for a specific lesson and page. */
export function openLesson(lessonId: string, page = 0): void {
  openBook({ lessonId, page });
}

export function closeBook(): void {
  emit({ phase: "closed", request: null, contents: false, keepDatabase: false });
}

/** Put the book aside without unmounting it: reading state survives. */
export function minimizeBook(keepDatabase = false): void {
  emit({ ...state, phase: "minimized", contents: false, keepDatabase });
}

export function setContents(open: boolean): void {
  if (state.contents === open) return;
  emit({ ...state, contents: open });
}

export function toggleContents(): void {
  setContents(!state.contents);
}

/** Called by the book once it has navigated to the requested lesson. */
export function clearRequest(): void {
  if (!state.request) return;
  emit({ ...state, request: null });
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useBookUi(): BookUiState & {
  open: (mark?: BookMark) => void;
  openLesson: (lessonId: string, page?: number) => void;
  close: () => void;
  minimize: (keepDatabase?: boolean) => void;
  toggleContents: () => void;
  clearRequest: () => void;
} {
  const snapshot = useSyncExternalStore(
    subscribe,
    () => state,
    () => state,
  );
  return {
    ...snapshot,
    open: openBook,
    openLesson,
    close: closeBook,
    minimize: minimizeBook,
    toggleContents,
    clearRequest,
  };
}
