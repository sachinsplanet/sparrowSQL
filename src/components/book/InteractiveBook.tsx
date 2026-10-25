import { useEffect, useRef, useState } from "react";
import { LESSONS } from "../../lib/curriculum";
import { bookStore } from "../../lib/bookStore";
import { useProgress } from "../../hooks/useProgress";
import { useBookUi } from "./bookBus";

/**
 * Maps a lesson ID (e.g. "m1-l1") or 1-based chapter index to a 1-based book page
 * in `/3d-flip-book.html` (pages 4..29 cover Chapters 01..22).
 */
function lessonIdToFlipBookPage(lessonId: string, pageOffset = 0): number {
  const idx = LESSONS.findIndex((l) => l.id === lessonId);
  if (idx < 0) return 4;
  // Spread the curriculum lessons across the 22 chapters (book pages 4..29)
  const basePage = Math.min(29, Math.max(4, 4 + Math.floor((idx / Math.max(1, LESSONS.length - 1)) * 24)));
  return Math.min(29, basePage + Math.max(0, pageOffset));
}

export function InteractiveBook() {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isBookFullscreen, setIsBookFullscreen] = useState(false);
  const { progress, actions } = useProgress();
  const bookUi = useBookUi();

  // Forward bookUi lesson navigation requests into the 3D Flip Book iframe
  useEffect(() => {
    if (!bookUi.request) return;
    const targetPage = lessonIdToFlipBookPage(bookUi.request.lessonId, bookUi.request.page);
    iframeRef.current?.contentWindow?.postMessage(
      { type: "sparrowsql:goto-page", page: targetPage },
      "*",
    );
    bookUi.clearRequest();
  }, [bookUi]);

  // Listen for custom DOM events (e.g. "Read Chapter 1 in 3D Flip Book" button in LiveLab)
  useEffect(() => {
    const onBookEvent = (e: Event) => {
      const detail = (e as CustomEvent).detail ?? {};
      if (typeof detail.page === "number") {
        iframeRef.current?.contentWindow?.postMessage(
          { type: "sparrowsql:goto-page", page: detail.page },
          "*",
        );
      } else if (typeof detail.spread === "number") {
        iframeRef.current?.contentWindow?.postMessage(
          { type: "sparrowsql:goto-spread", spread: detail.spread },
          "*",
        );
      }
    };
    window.addEventListener("sparrowsql:book", onBookEvent);
    return () => window.removeEventListener("sparrowsql:book", onBookEvent);
  }, []);

  // Listen for messages from `/3d-flip-book.html` iframe
  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      const data = e.data;
      if (!data || typeof data !== "object") return;

      if (data.type === "sparrowsql:book-spread" && typeof data.spread === "number") {
        // Spread >= 2 reaches Chapter 01 (page 4), which unlocks the Live Lab Playground
        if (data.spread >= 2) {
          const firstLesson = LESSONS[0];
          if (firstLesson) {
            bookStore.completeLesson(firstLesson.id);
          }
          if (!progress.playgroundUnlocked) {
            actions.unlockPlayground();
          }
        }
      } else if (data.type === "sparrowsql:open-in-lab" && typeof data.sql === "string") {
        setIsBookFullscreen(false);
        window.dispatchEvent(
          new CustomEvent("sparrowsql:lab", {
            detail: { mode: "playground", sql: data.sql },
          }),
        );
        const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        document.getElementById("lab")?.scrollIntoView({ behavior: reduce ? "auto" : "smooth" });
      } else if (data.type === "sparrowsql:book-fullscreen" && typeof data.fullscreen === "boolean") {
        setIsBookFullscreen(data.fullscreen);
      }
    };

    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [progress.playgroundUnlocked, actions]);

  // Allow Escape on parent window to exit book fullscreen
  useEffect(() => {
    if (!isBookFullscreen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsBookFullscreen(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isBookFullscreen]);

  return (
    <section
      id="book"
      aria-label="Complete SQL 3D Interactive Book"
      className={
        isBookFullscreen
          ? "fixed inset-0 z-[100] h-[100dvh] w-[100vw] bg-[#070a12]"
          : "relative w-full h-[calc(100dvh-64px)] min-h-[520px] overflow-hidden border-b border-[#26231f] bg-[#070a12]"
      }
    >
      <iframe
        ref={iframeRef}
        src="/3d-flip-book.html"
        title="Complete SQL — 3D Interactive Book"
        className="h-full w-full border-0 block"
        allow="fullscreen"
      />
    </section>
  );
}

export default InteractiveBook;
