import { motion } from "motion/react";
import { CHAPTERS, CURRICULUM_STATS } from "../lib/curriculum";
import type { Chapter } from "../lib/curriculum/types";
import { chapterProgress, hasReadingHistory } from "../lib/bookStore";
import { useBookState } from "../hooks/useBookState";
import { openLesson, openBook } from "../components/book/bookBus";
import { usePrefersReducedMotion } from "../hooks/usePrefersReducedMotion";
import { SectionHeading } from "./ui";

/** Whole-book figures, read straight from the registry so the copy never drifts. */
const STATS = [
  { value: CURRICULUM_STATS.modules, label: "modules" },
  { value: CURRICULUM_STATS.lessons, label: "lessons" },
  { value: CURRICULUM_STATS.examples, label: "runnable examples" },
  { value: CURRICULUM_STATS.exercises, label: "graded exercises" },
  { value: Math.round(CURRICULUM_STATS.minutes / 60), label: "hours of reading" },
];

export function CurriculumSection() {
  const reduce = usePrefersReducedMotion();
  const state = useBookState();
  const started = hasReadingHistory(state);

  const modules = CHAPTERS.filter((c) => c.kind === "module");
  const capstones = CHAPTERS.filter((c) => c.kind === "capstone");

  return (
    <section id="curriculum" className="relative scroll-mt-[120px] py-20 sm:py-28">
      <div className="mx-auto max-w-[1600px] px-4 sm:px-8 lg:px-12">
        <SectionHeading
          eyebrow="Curriculum"
          title={`${CURRICULUM_STATS.modules} modules and ${CURRICULUM_STATS.capstones} capstones, from “what is data” to a full schema`}
          lede="A complete beginner path, bound as an interactive book. Every idea is something you type and run against a real database in the page, not something you memorise — and the book remembers where you stopped."
        />

        {/* Whole-book figures, derived from the content rather than hand-typed. */}
        <dl className="mt-8 flex flex-wrap gap-x-8 gap-y-3">
          {STATS.map((s) => (
            <div key={s.label} className="flex items-baseline gap-2">
              <dt className="font-display text-2xl font-extrabold text-accent">{s.value}</dt>
              <dd className="text-sm text-muted">{s.label}</dd>
            </div>
          ))}
        </dl>

        {started && (
          <button
            type="button"
            onClick={() => openBook()}
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-[color:var(--accent-ink)] shadow-[var(--shadow-accent)] transition-transform hover:-translate-y-[1px] active:translate-y-0"
          >
            Resume the book
            <ArrowIcon />
          </button>
        )}

        <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {modules.map((chapter, i) => (
            <ChapterCard key={chapter.id} chapter={chapter} index={i} reduce={reduce} />
          ))}
        </div>

        {/* Capstones: the three projects, given more room and a warmer frame. */}
        <h3 className="mt-16 flex items-center gap-3 font-display text-2xl font-bold text-ink">
          Capstone projects
          <span className="h-px flex-1 bg-line" aria-hidden="true" />
        </h3>
        <p className="mt-2 max-w-[62ch] text-[15px] leading-relaxed text-muted">
          Build a real database end to end. Each milestone is graded against the engine, so a green
          check means the query genuinely ran — not that you matched an answer key.
        </p>

        <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-3">
          {capstones.map((chapter, i) => (
            <ChapterCard
              key={chapter.id}
              chapter={chapter}
              index={i}
              reduce={reduce}
              capstone
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function ChapterCard({
  chapter,
  index,
  reduce,
  capstone = false,
}: {
  chapter: Chapter;
  index: number;
  reduce: boolean;
  capstone?: boolean;
}) {
  const state = useBookState();
  const progress = chapterProgress(state, chapter.id);
  const minutes = chapter.lessons.reduce((sum, lesson) => sum + lesson.minutes, 0);
  const first = chapter.lessons[0]?.id;
  const chips = chapter.lessons.slice(0, 4).map((lesson) => lesson.title);
  const extra = chapter.lessons.length - chips.length;
  const open = () => (first ? openLesson(first) : openBook());

  return (
    <motion.article
      initial={reduce ? false : { opacity: 0, y: 22 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.55, delay: reduce ? 0 : (index % 3) * 0.06, ease: [0.16, 1, 0.3, 1] }}
      className="h-full"
    >
      <button
        type="button"
        onClick={open}
        aria-label={`Open ${chapter.kicker}: ${chapter.title}`}
        className={`group relative flex h-full w-full flex-col overflow-hidden border p-6 text-left transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[var(--glow)] ${
          capstone
            ? "rounded-[24px] border-line bg-surface hover:border-line-strong"
            : progress.read > 0
              ? "rounded-[16px] border-line-strong bg-surface hover:border-ink/40"
              : "rounded-[16px] border-line bg-surface hover:border-line-strong"
        }`}
      >
        {capstone && (
          <div
            className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full opacity-55 blur-2xl"
            style={{
              background:
                index % 3 === 0
                  ? "radial-gradient(circle, #a7e5d3, #a8c8e8)"
                  : index % 3 === 1
                    ? "radial-gradient(circle, #f4c5a8, #e8b8c4)"
                    : "radial-gradient(circle, #c8b8e0, #a8c8e8)",
            }}
            aria-hidden="true"
          />
        )}

        {/* ghost chapter number */}
        <span
          className="pointer-events-none absolute right-3 top-1 font-display text-[68px] font-light leading-none text-ink/[0.06] transition-colors group-hover:text-ink/[0.12]"
          aria-hidden="true"
        >
          {capstone ? chapter.number : chapter.module}
        </span>

        <div className="relative flex items-center gap-2">
          <span className="font-sans text-[12px] font-semibold uppercase tracking-[0.96px] text-faint">
            {chapter.kicker}
          </span>
          {progress.read >= chapter.lessons.length && chapter.lessons.length > 0 && (
            <span className="rounded-full bg-success/15 px-2.5 py-[2px] font-sans text-[11px] font-semibold uppercase tracking-wide text-success">
              complete
            </span>
          )}
        </div>

        <h4 className="relative mt-2 font-display text-[24px] font-light leading-[1.2] text-ink">
          {chapter.title}
        </h4>
        <p className="relative mt-2 line-clamp-3 font-sans text-[15px] leading-[1.55] text-muted">
          {chapter.blurb}
        </p>

        <div className="relative mt-3.5 flex flex-wrap gap-1.5">
          {chips.map((t) => (
            <span
              key={t}
              className="rounded-md border border-line bg-[var(--bg-deep)]/60 px-2 py-[3px] font-mono text-[11px] text-muted transition-colors group-hover:border-line-strong"
            >
              {t}
            </span>
          ))}
          {extra > 0 && (
            <span className="rounded-md px-2 py-[3px] font-mono text-[11px] text-accent">
              +{extra} more
            </span>
          )}
        </div>

        <div className="relative mt-auto pt-4">
          <div className="flex items-center justify-between text-[11px] text-faint">
            <span className="font-mono">
              {chapter.lessons.length} lessons · {minutes} min
            </span>
            <span className="inline-flex items-center gap-1 font-semibold text-accent opacity-0 transition-opacity group-hover:opacity-100">
              Read <ArrowIcon small />
            </span>
          </div>
          {/* Per-chapter completion, only once there is something to show. */}
          <div className="mt-2 h-1 overflow-hidden rounded-full bg-line/60">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                capstone ? "bg-feather" : "bg-accent"
              }`}
              style={{ width: `${Math.round(progress.completion * 100)}%` }}
            />
          </div>
        </div>
      </button>
    </motion.article>
  );
}

function ArrowIcon({ small = false }: { small?: boolean }) {
  const size = small ? 12 : 15;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M5 12h13M12 5l7 7-7 7"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
