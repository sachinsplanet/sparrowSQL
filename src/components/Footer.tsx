import { openBook, openLesson } from "./book/bookBus";
import { SparrowMascot } from "./SparrowMascot";

function openLab() {
  window.dispatchEvent(new CustomEvent("sparrowsql:lab", { detail: { mode: "learn" } }));
}

export function Footer() {
  return (
    <footer className="relative z-[1] border-t border-line bg-[var(--bg-deep)]/60">
      <div className="mx-auto max-w-[1600px] px-4 py-16 sm:px-8 lg:px-12">
        <blockquote className="max-w-3xl">
          <p className="font-display text-2xl font-semibold leading-[1.25] tracking-tight text-balance text-ink sm:text-[2rem]">
            Let the learner write SQL. Let the database judge the query. Let Sparrow
            explain what happened.
          </p>
        </blockquote>

        <div className="mt-10 flex flex-col gap-6 border-t border-line pt-10 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <SparrowMascot state="happy" size={44} />
            <div>
              <p className="font-display text-[17px] font-extrabold tracking-tight text-ink">
                sparrow<span className="text-accent">sql</span>
              </p>
              <p className="text-[13px] text-muted">A friendly SQL laboratory in your browser.</p>
            </div>
          </div>
          <a
            href="#lab"
            onClick={openLab}
            className="inline-flex w-fit items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-[color:var(--accent-ink)] shadow-[var(--shadow-accent)] transition-transform hover:-translate-y-[1px] active:translate-y-0 active:scale-[0.98]"
          >
            Start learning
          </a>
        </div>

        <div className="mt-12 grid grid-cols-2 gap-8 sm:grid-cols-4">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-faint">
              Explore
            </p>
            <ul className="mt-3 space-y-2">
              {[
                { label: "Live Lab", href: "#lab" },
                { label: "The Loop", href: "#loop" },
                { label: "Curriculum", href: "#curriculum" },
                { label: "Sparrow Tutor", href: "#tutor" },
                { label: "Fair Grading", href: "#evaluation" },
              ].map((l) => (
                <li key={l.label}>
                  <a
                    href={l.href}
                    className="text-[13.5px] text-muted transition-colors hover:text-ink"
                  >
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-faint">
              Learn
            </p>
            <ul className="mt-3 space-y-2">
              {[
                { label: "Foundations", id: "m01-what-is-database" },
                { label: "DDL & Creation", id: "m02-create-database" },
                { label: "Data Types", id: "m03-numbers-text-dates" },
                { label: "Filtering (WHERE)", id: "m06-where-logic" },
                { label: "Aggregates (GROUP BY)", id: "m07-aggregate-functions" },
                { label: "JOINs & Relations", id: "m08-inner-join" },
              ].map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => openLesson(item.id)}
                    className="text-left text-[13.5px] text-muted transition-colors hover:text-ink hover:underline"
                  >
                    {item.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-faint">
              Interactive
            </p>
            <ul className="mt-3 space-y-2">
              <li>
                <button
                  type="button"
                  onClick={() => openBook()}
                  className="text-left text-[13.5px] text-muted transition-colors hover:text-ink hover:underline"
                >
                  The Interactive Book
                </button>
              </li>
              <li>
                <a
                  href="#basics"
                  className="text-[13.5px] text-muted transition-colors hover:text-ink"
                >
                  Basics Flashcards
                </a>
              </li>
              <li>
                <a
                  href="#lab"
                  onClick={openLab}
                  className="text-[13.5px] text-muted transition-colors hover:text-ink"
                >
                  Sandbox Playground
                </a>
              </li>
            </ul>
          </div>

          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-faint">
              About
            </p>
            <p className="mt-3 text-[13px] leading-relaxed text-muted">
              SparrowSQL is an open, private-by-design SQL laboratory. All queries run in-browser using WebAssembly. No data leaves your machine.
            </p>
          </div>
        </div>

        <p className="mt-12 border-t border-line pt-6 text-[12.5px] text-faint">
          Built for beginners who learn by doing. Runs entirely in your browser on a
          disposable SQLite sandbox.
        </p>
      </div>
    </footer>
  );
}
