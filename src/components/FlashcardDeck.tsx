import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { usePrefersReducedMotion } from "../hooks/usePrefersReducedMotion";
import { SparrowMascot } from "./SparrowMascot";
import { SectionHeading } from "./ui";
import { FLASHCARDS, FLASHCARD_COUNT } from "../lib/flashcards";
import { useProgress } from "../hooks/useProgress";
import type { SparrowState } from "../lib/types";

const XP_PER_CARD = 5;

/**
 * The guided basics deck. One concept card at a time: plain-language idea, a
 * runnable example, then a quiz the learner must answer correctly to advance.
 * Finishing the whole deck marks the flashcards complete and unlocks the
 * Live Lab playground. Progress is persisted through the shared store.
 */
export function FlashcardDeck({ onOpenLab }: { onOpenLab?: () => void }) {
  const reduce = usePrefersReducedMotion();
  const { progress, actions } = useProgress();

  // Resume at the first card the learner has not yet passed.
  const firstIncomplete = useMemo(
    () => Math.max(0, FLASHCARDS.findIndex((c) => !progress.flashcards[c.id])),
    [progress.flashcards],
  );

  const [i, setI] = useState(firstIncomplete);
  const [picked, setPicked] = useState<number | null>(null);

  // Restarting the journey empties the deck: send the view back to card 1 and
  // drop the quiz selection too. `i` is normally already 0 at that moment, so
  // the old "answered correctly" explanation used to survive the reset until the
  // learner navigated away and back. The effect keys on the *count* rather than
  // the map because every store write hands out a fresh object identity.
  const passedCount = idx2count(progress.flashcards);
  useEffect(() => {
    if (passedCount === 0) {
      setI(0);
      setPicked(null);
    }
  }, [passedCount]);

  // Reset the quiz selection whenever the visible card changes.
  useEffect(() => {
    setPicked(null);
  }, [i]);

  const card = FLASHCARDS[i] ?? FLASHCARDS[0];
  const done = card ? progress.flashcards[card.id] === true : false;
  const correct =
    card !== undefined && picked !== null && picked === card.quiz.answerIndex;
  const allDone = progress.flashcards && FLASHCARD_COUNT > 0
    ? Object.keys(progress.flashcards).filter((k) => progress.flashcards[k]).length >= FLASHCARD_COUNT
    : false;

  // Unlock the playground the moment the deck is finished.
  useEffect(() => {
    if (allDone) actions.unlockPlayground();
  }, [allDone, actions]);

  // A deck with no cards cannot be rendered; bail out instead of throwing and
  // blanking the whole page.
  if (!card) return null;

  const choose = (idx: number) => {
    if (done || correct) return;
    setPicked(idx);
    if (idx === card.quiz.answerIndex) {
      actions.completeFlashcard(card.id, XP_PER_CARD);
    }
  };

  const goNext = () => setI((n) => Math.min(n + 1, FLASHCARD_COUNT - 1));
  const goPrev = () => setI((n) => Math.max(n - 1, 0));

  const mascot: SparrowState = correct
    ? "celebrating"
    : picked !== null
      ? "confused"
      : "thinking";

  if (allDone) {
    return (
      <section id="basics" className="relative scroll-mt-[120px] py-16 sm:py-20">
        <div className="mx-auto max-w-[960px] px-4 sm:px-8 lg:px-12">
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center gap-4 rounded-[20px] border border-[color:var(--success)]/40 bg-surface/60 p-8 text-center"
          >
            <SparrowMascot state="celebrating" size={104} />
            <h2 className="font-display text-2xl font-semibold text-ink sm:text-3xl">
              You finished the basics! 🎉
            </h2>
            <p className="max-w-[52ch] text-[15px] leading-relaxed text-muted">
              You now know SELECT, WHERE, JOIN, INSERT, UPDATE and GROUP BY well
              enough to drive. The Live Lab playground is unlocked — put it to
              work.
            </p>
            <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={onOpenLab}
                className="rounded-full bg-accent px-6 py-3 text-[15px] font-semibold text-[color:var(--accent-ink)] shadow-[var(--shadow-accent)] transition-transform hover:-translate-y-[2px] active:scale-[0.98]"
              >
                Open the Live Lab
              </button>
              <button
                type="button"
                onClick={() => {
                  setI(0);
                  setPicked(null);
                  actions.setFlashcards({}); // allow re-reviewing the deck
                }}
                className="rounded-full border border-line px-5 py-3 text-[14px] font-semibold text-muted transition-colors hover:text-ink"
              >
                Review the deck
              </button>
            </div>
          </motion.div>
        </div>
      </section>
    );
  }

  return (
    <section id="basics" className="relative scroll-mt-[120px] py-16 sm:py-20">
      <div className="mx-auto max-w-[960px] px-4 sm:px-8 lg:px-12">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <SectionHeading
            eyebrow="Flashcards"
            title={
              <>
                Learn the basics, <span className="text-accent">one card at a time.</span>
              </>
            }
            lede="Answer each quiz correctly to unlock the next card. Finish the deck to open the playground."
          />
        </div>

        {/* journey dots */}
        <div className="mt-6 flex items-center gap-1.5">
          {FLASHCARDS.map((c, idx) => (
            <button
              key={c.id}
              type="button"
              aria-label={`Card ${idx + 1}: ${c.term}`}
              onClick={() => setI(idx)}
              className={`h-2.5 rounded-full transition-all ${
                idx === i
                  ? "w-7 bg-accent"
                  : progress.flashcards[c.id]
                    ? "w-2.5 bg-success"
                    : "w-2.5 bg-line-strong hover:bg-muted"
              }`}
            />
          ))}
          <span className="ml-auto font-mono text-[12px] text-faint">
            {idx2count(progress.flashcards)}/{FLASHCARD_COUNT} passed
          </span>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-[1fr_auto]">
          {/* card body */}
          <div className="rounded-[18px] border border-line bg-surface/60 p-5 sm:p-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={card.id}
                initial={reduce ? false : { opacity: 0, x: 18 }}
                animate={{ opacity: 1, x: 0 }}
                exit={reduce ? { opacity: 0 } : { opacity: 0, x: -18 }}
                transition={{ duration: reduce ? 0 : 0.3, ease: [0.16, 1, 0.3, 1] }}
              >
                <div className="flex items-center gap-3">
                  <span className="rounded-full bg-accent-soft px-2.5 py-0.5 font-mono text-[12px] font-semibold text-accent">
                    {card.term}
                  </span>
                  <span className="font-mono text-[11px] uppercase tracking-wide text-faint">
                    Card {i + 1} / {FLASHCARD_COUNT}
                  </span>
                  {done && (
                    <span className="ml-auto inline-flex items-center gap-1 font-mono text-[11px] text-success">
                      ✓ Passed
                    </span>
                  )}
                </div>

                <h3 className="mt-3 font-display text-xl font-semibold text-ink">
                  {card.title}
                </h3>
                <p className="mt-2 text-[15px] leading-relaxed text-muted">
                  {card.concept}
                </p>

                <pre className="mt-4 overflow-x-auto rounded-[12px] bg-[var(--bg-deep)] p-4 font-mono text-[13px] leading-relaxed text-ink">
                  {card.example}
                </pre>
                {card.exampleNote && (
                  <p className="mt-2 text-[13px] italic text-faint">{card.exampleNote}</p>
                )}

                {/* quiz */}
                <div className="mt-6 rounded-[14px] border border-line bg-surface-2/50 p-4">
                  <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-faint">
                    Quick check
                  </p>
                  <p className="mt-1.5 text-[15px] font-medium text-ink">{card.quiz.prompt}</p>
                  <div className="mt-3 grid gap-2">
                    {card.quiz.options.map((opt, idx) => {
                      const isAnswer = idx === card.quiz.answerIndex;
                      const chosen = picked === idx;
                      let cls =
                        "border-line text-muted hover:border-line-strong hover:text-ink";
                      if (chosen && isAnswer)
                        cls = "border-[color:var(--success)] bg-[color:var(--success)]/12 text-ink";
                      else if (chosen && !isAnswer)
                        cls = "border-[color:var(--danger)] bg-[color:var(--danger)]/12 text-ink";
                      else if ((done || correct) && isAnswer)
                        cls = "border-[color:var(--success)]/50 text-ink";
                      return (
                        <button
                          key={opt}
                          type="button"
                          disabled={done || correct}
                          onClick={() => choose(idx)}
                          className={`rounded-[10px] border px-3.5 py-2.5 text-left font-mono text-[13px] transition-colors disabled:cursor-default ${cls}`}
                        >
                          {opt}
                        </button>
                      );
                    })}
                  </div>

                  {(correct || (picked !== null && !correct)) && (
                    <motion.p
                      initial={reduce ? false : { opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`mt-3 text-[13.5px] leading-relaxed ${
                        correct ? "text-success" : "text-danger"
                      }`}
                    >
                      {correct
                        ? `✅ ${card.quiz.explain}`
                        : "Not quite — try the other options. You'll get it."}
                    </motion.p>
                  )}
                </div>
              </motion.div>
            </AnimatePresence>

            <div className="mt-5 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={goPrev}
                disabled={i === 0}
                className="rounded-lg border border-line px-3 py-1.5 text-[13px] text-muted transition-colors hover:text-ink disabled:opacity-40"
              >
                Prev
              </button>
              <button
                type="button"
                onClick={goNext}
                disabled={!(correct || done) || i === FLASHCARD_COUNT - 1}
                className="rounded-full bg-accent px-4 py-2 text-[13px] font-semibold text-[color:var(--accent-ink)] transition-transform hover:-translate-y-[1px] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
              >
                {i === FLASHCARD_COUNT - 1 ? "Finish" : "Next card"}
              </button>
            </div>
          </div>

          {/* side mascot */}
          <div className="hidden shrink-0 flex-col items-center gap-2 pt-2 md:flex">
            <SparrowMascot state={mascot} size={120} />
            <span className="font-mono text-[11px] text-faint">
              +{XP_PER_CARD} XP each
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

function idx2count(map: Record<string, boolean>): number {
  return Object.keys(map).filter((k) => map[k]).length;
}
