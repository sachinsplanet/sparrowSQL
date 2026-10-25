import { useState } from "react";
import { motion } from "motion/react";
import { usePrefersReducedMotion } from "../hooks/usePrefersReducedMotion";
import type { SceneColors } from "../lib/sceneColors";

function openLab(mode: "learn" | "playground") {
  window.dispatchEvent(new CustomEvent("sparrowsql:lab", { detail: { mode } }));
}

export function Hero({ colors }: { colors: SceneColors }) {
  const reduce = usePrefersReducedMotion();
  const [activeTab, setActiveTab] = useState<"result" | "explain" | "logs">("result");

  return (
    <section
      id="top"
      className="relative flex min-h-[calc(100dvh-64px)] flex-col justify-between overflow-hidden border-b border-line pt-12 pb-10 sm:pt-16 sm:pb-12 lg:pt-20"
    >
      {/* Soft atmospheric gradient glow behind the composition */}
      <div
        className="pointer-events-none absolute inset-0 z-0 overflow-hidden"
        aria-hidden="true"
      >
        <div
          className="absolute right-[5%] top-[8%] h-[580px] w-[620px] rounded-full opacity-60 blur-3xl dark:opacity-20"
          style={{
            background:
              "radial-gradient(circle at 50% 50%, #bae6fd 0%, #e0f2fe 35%, #ddd6fe 65%, transparent 80%)",
          }}
        />
        <div
          className="absolute -bottom-[10%] left-[8%] h-[380px] w-[460px] rounded-full opacity-45 blur-3xl dark:opacity-10"
          style={{
            background:
              "radial-gradient(circle at 50% 50%, #a7e5d3 0%, #f4c5a8 45%, transparent 75%)",
          }}
        />
      </div>

      <div className="relative z-[2] mx-auto w-full max-w-[1600px] px-4 sm:px-8 lg:px-12">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-8">
          {/* Left Column: Headline, Badge, Copy & CTAs */}
          <div className="lg:col-span-6 xl:col-span-6">
            {/* Pill badge: REAL SQLITE IN YOUR BROWSER */}
            <motion.div
              initial={reduce ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            >
              <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200/80 bg-[#eef8f1] px-3.5 py-1.5 font-sans text-[11.5px] font-semibold uppercase tracking-[0.08em] text-emerald-800 shadow-xs dark:border-emerald-800/50 dark:bg-emerald-950/40 dark:text-emerald-300">
                <span className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                Real SQLite in your browser
              </span>
            </motion.div>

            {/* Headline */}
            <motion.h1
              initial={reduce ? false : { opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.65, delay: 0.06, ease: [0.16, 1, 0.3, 1] }}
              className="mt-6 font-sans text-[2.75rem] font-extrabold leading-[1.04] tracking-[-0.03em] text-ink sm:text-[60px] lg:text-[68px] xl:text-[74px]"
            >
              Learn SQL by<br />
              <span className="font-serif font-normal italic text-[#2563eb] dark:text-[#3b82f6] mr-3">
                actually
              </span>
              <span>using SQL</span>
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              initial={reduce ? false : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.16, ease: [0.16, 1, 0.3, 1] }}
              className="mt-6 max-w-[34rem] font-sans text-[17px] font-normal leading-[1.6] text-muted sm:text-[18px]"
            >
              Write queries. Run them. Make mistakes. Sparrow helps you
              understand exactly what happened.
            </motion.p>

            {/* CTAs */}
            <motion.div
              initial={reduce ? false : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.24, ease: [0.16, 1, 0.3, 1] }}
              className="mt-8 flex flex-wrap items-center gap-3.5"
            >
              <a
                href="#basics"
                className="inline-flex h-[42px] items-center gap-2 rounded-full bg-[#0c0a09] px-6 font-sans text-[15px] font-medium text-white shadow-xs transition-all hover:bg-[#292524] hover:shadow-sm active:scale-[0.98] dark:bg-white dark:text-[#0c0a09] dark:hover:bg-neutral-200"
              >
                <span>Start learning</span>
                <span aria-hidden="true">→</span>
              </a>

              <a
                href="#lab"
                onClick={() => openLab("playground")}
                className="inline-flex h-[42px] items-center gap-2 rounded-full border border-neutral-300/90 bg-white/80 px-5 font-sans text-[15px] font-medium text-ink shadow-xs backdrop-blur-xs transition-all hover:border-neutral-400 hover:bg-white active:scale-[0.98] dark:border-neutral-700 dark:bg-neutral-900/80 dark:hover:border-neutral-600 dark:hover:bg-neutral-800"
              >
                <span className="font-mono text-xs font-semibold text-muted">&lt;/&gt;</span>
                <span>Open playground</span>
              </a>
            </motion.div>
          </div>

          {/* Right Column: 3D Database Cylinder + Code Window + Overlapping Result Card + Whimsical Doodles */}
          <div className="relative mt-4 lg:col-span-6 lg:mt-0 xl:col-span-6">
            <motion.div
              initial={reduce ? false : { opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.75, delay: 0.12, ease: [0.16, 1, 0.3, 1] }}
              className="relative mx-auto w-full max-w-[560px] pb-14 sm:pb-16"
            >
              {/* Soft circular sky-blue backdrop glow */}
              <div
                className="pointer-events-none absolute -inset-6 -z-10 rounded-full opacity-70 blur-2xl dark:opacity-20"
                style={{
                  background:
                    "radial-gradient(circle at 65% 45%, #bae6fd 0%, #e0f2fe 40%, transparent 72%)",
                }}
              />

              {/* Sparkle rays above database */}
              <div
                className="pointer-events-none absolute -left-2 top-28 z-20 text-[#3b82f6] sm:-left-5 sm:top-24"
                aria-hidden="true"
              >
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M5 6l4 4" />
                  <path d="M12 3v5" />
                  <path d="M19 6l-4 4" />
                </svg>
              </div>

              {/* Code Editor Window */}
              <div className="relative ml-auto w-[92%] sm:w-[88%] rounded-[24px] border border-neutral-200/90 bg-white p-3.5 shadow-[0_20px_50px_-15px_rgba(15,23,42,0.1)] dark:border-neutral-800 dark:bg-[#1a1816] sm:p-4.5">
                {/* Window header dots */}
                <div className="flex items-center gap-1.5 pb-3">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#f87171]" />
                  <span className="h-2.5 w-2.5 rounded-full bg-[#fbbf24]" />
                  <span className="h-2.5 w-2.5 rounded-full bg-[#34d399]" />
                </div>

                {/* Dark Code Terminal */}
                <div className="rounded-xl bg-[#161c24] p-4.5 font-mono text-[13.5px] leading-relaxed text-slate-100 shadow-inner sm:p-5 sm:text-[14.5px] dark:bg-[#0c0a09]">
                  <div className="flex">
                    <span className="w-6 shrink-0 select-none text-slate-500">1</span>
                    <div>
                      <span className="font-semibold text-[#38bdf8]">SELECT </span>
                      <span>name, email</span>
                    </div>
                  </div>
                  <div className="flex">
                    <span className="w-6 shrink-0 select-none text-slate-500">2</span>
                    <div>
                      <span className="font-semibold text-[#38bdf8]">FROM </span>
                      <span>users</span>
                    </div>
                  </div>
                  <div className="flex">
                    <span className="w-6 shrink-0 select-none text-slate-500">3</span>
                    <div>
                      <span className="font-semibold text-[#38bdf8]">WHERE </span>
                      <span>id = </span>
                      <span className="font-semibold text-[#fbbf24]">1</span>
                      <span>;</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 3D Database Cylinder Stack (overlapping the left of the editor card) */}
              <motion.div
                initial={reduce ? false : { y: 8, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
                className="absolute -left-2 top-32 z-10 w-[124px] sm:-left-4 sm:top-28 sm:w-[148px]"
              >
                <svg
                  viewBox="0 0 140 160"
                  className="w-full drop-shadow-[0_18px_25px_rgba(37,99,235,0.28)]"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <defs>
                    {/* Top disc face gradient */}
                    <radialGradient
                      id="db-disc-top"
                      cx="42%"
                      cy="38%"
                      r="65%"
                      fx="42%"
                      fy="38%"
                    >
                      <stop offset="0%" stopColor="#93c5fd" />
                      <stop offset="50%" stopColor="#60a5fa" />
                      <stop offset="100%" stopColor="#3b82f6" />
                    </radialGradient>

                    {/* Tier 1 body gradient */}
                    <linearGradient id="db-tier-1" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#60a5fa" />
                      <stop offset="35%" stopColor="#3b82f6" />
                      <stop offset="85%" stopColor="#2563eb" />
                      <stop offset="100%" stopColor="#1d4ed8" />
                    </linearGradient>

                    {/* Tier 2 body gradient */}
                    <linearGradient id="db-tier-2" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#60a5fa" />
                      <stop offset="35%" stopColor="#3b82f6" />
                      <stop offset="85%" stopColor="#2563eb" />
                      <stop offset="100%" stopColor="#1d4ed8" />
                    </linearGradient>

                    {/* Tier 3 body gradient */}
                    <linearGradient id="db-tier-3" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#60a5fa" />
                      <stop offset="35%" stopColor="#3b82f6" />
                      <stop offset="85%" stopColor="#2563eb" />
                      <stop offset="100%" stopColor="#1d4ed8" />
                    </linearGradient>
                  </defs>

                  {/* Tier 3 (Bottom) */}
                  <path
                    d="M 16 94 A 54 22 0 0 0 124 94 V 126 A 54 22 0 0 1 16 126 Z"
                    fill="url(#db-tier-3)"
                  />
                  <ellipse cx="70" cy="126" rx="54" ry="22" fill="#2563eb" />
                  <path
                    d="M 16 94 A 54 22 0 0 0 124 94"
                    stroke="#93c5fd"
                    strokeWidth="1.2"
                    strokeOpacity="0.75"
                  />

                  {/* Tier 2 (Middle) */}
                  <path
                    d="M 16 60 A 54 22 0 0 0 124 60 V 94 A 54 22 0 0 1 16 94 Z"
                    fill="url(#db-tier-2)"
                  />
                  <path
                    d="M 16 60 A 54 22 0 0 0 124 60"
                    stroke="#93c5fd"
                    strokeWidth="1.2"
                    strokeOpacity="0.75"
                  />

                  {/* Tier 1 (Top) */}
                  <path
                    d="M 16 28 A 54 22 0 0 0 124 28 V 60 A 54 22 0 0 1 16 60 Z"
                    fill="url(#db-tier-1)"
                  />

                  {/* Top Disc Cap */}
                  <ellipse cx="70" cy="28" rx="54" ry="22" fill="url(#db-disc-top)" />
                  <ellipse
                    cx="70"
                    cy="28"
                    rx="53"
                    ry="21"
                    stroke="#ffffff"
                    strokeWidth="1"
                    strokeOpacity="0.6"
                  />

                  {/* Subtle specular reflection stripe on the left edge */}
                  <path
                    d="M 22 28 V 126"
                    stroke="#ffffff"
                    strokeWidth="2.5"
                    strokeOpacity="0.45"
                    strokeLinecap="round"
                  />
                </svg>
              </motion.div>

              {/* Overlapping Floating Result Card */}
              <motion.div
                initial={reduce ? false : { y: 16, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.75, delay: 0.35, ease: [0.16, 1, 0.3, 1] }}
                className="absolute -bottom-6 right-0 z-20 w-[84%] sm:w-[74%] rounded-2xl border border-neutral-200/90 bg-white p-3.5 shadow-[0_25px_60px_-15px_rgba(15,23,42,0.18)] dark:border-neutral-800 dark:bg-[#1a1816] sm:p-4.5"
              >
                {/* Result / Explain / Logs Tabs */}
                <div className="flex items-center border-b border-neutral-100 pb-2.5 text-xs sm:text-sm dark:border-neutral-800">
                  <button
                    type="button"
                    onClick={() => setActiveTab("result")}
                    className={`relative pb-1.5 font-semibold transition-colors ${
                      activeTab === "result"
                        ? "text-[#2563eb] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:rounded-full after:bg-[#2563eb] dark:text-[#60a5fa] dark:after:bg-[#60a5fa]"
                        : "text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"
                    }`}
                  >
                    Result
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab("explain")}
                    className={`ml-5 font-medium transition-colors ${
                      activeTab === "explain"
                        ? "text-[#2563eb] dark:text-[#60a5fa]"
                        : "text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"
                    }`}
                  >
                    Explain
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab("logs")}
                    className={`ml-5 font-medium transition-colors ${
                      activeTab === "logs"
                        ? "text-[#2563eb] dark:text-[#60a5fa]"
                        : "text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"
                    }`}
                  >
                    Logs
                  </button>
                </div>

                {/* Table View */}
                <div className="mt-2.5 overflow-hidden rounded-lg border border-neutral-100 font-mono dark:border-neutral-800">
                  <div className="grid grid-cols-2 bg-[#f8fafc] px-3.5 py-2 text-[11px] font-medium uppercase tracking-wider text-slate-500 sm:text-xs dark:bg-neutral-800/60 dark:text-neutral-400">
                    <div>name</div>
                    <div>email</div>
                  </div>
                  <div className="grid grid-cols-2 bg-white px-3.5 py-2.5 text-[12.5px] text-slate-800 sm:text-[13.5px] dark:bg-transparent dark:text-slate-200">
                    <div className="font-medium">Alice</div>
                    <div className="truncate text-slate-600 dark:text-slate-400">
                      alice@example.com
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Hand-drawn annotation "Write. Run. Learn." + Arrow + Sparkles */}
              <div
                className="pointer-events-none absolute -top-8 right-8 z-30 sm:-top-10 sm:right-12"
                aria-hidden="true"
              >
                <div className="flex flex-col items-center">
                  {/* Sparkle rays */}
                  <div className="text-[#2563eb] opacity-80">
                    <svg width="22" height="16" viewBox="0 0 24 16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                      <path d="M4 14l3-8" />
                      <path d="M12 2v10" />
                      <path d="M20 14l-3-8" />
                    </svg>
                  </div>
                  {/* Handwritten script text */}
                  <span
                    className="rotate-[-6deg] text-[18px] font-bold tracking-tight text-[#1d4ed8] sm:text-[22px] dark:text-[#60a5fa]"
                    style={{ fontFamily: "'Caveat', cursive, sans-serif" }}
                  >
                    Write. Run.<br />
                    <span className="ml-3">Learn.</span>
                  </span>
                  {/* Curving blue arrow */}
                  <svg
                    width="44"
                    height="46"
                    viewBox="0 0 44 46"
                    fill="none"
                    className="-mt-1 text-[#2563eb] opacity-85"
                  >
                    <path
                      d="M32 4 C 24 18, 12 28, 8 40"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                    <path
                      d="M3 34 L 8 41 L 16 38"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
              </div>

              {/* Floating green leaf accent to the right of the result card */}
              <div
                className="pointer-events-none absolute -bottom-1 -right-3 z-30 sm:-bottom-2 sm:-right-6"
                aria-hidden="true"
              >
                <svg
                  width="40"
                  height="40"
                  viewBox="0 0 40 40"
                  fill="none"
                  className="rotate-[-18deg] drop-shadow-[0_4px_10px_rgba(34,197,94,0.35)]"
                >
                  <path
                    d="M8 32 C 14 18, 26 8, 36 6 C 34 16, 24 28, 8 32 Z"
                    fill="#22c55e"
                  />
                  <path
                    d="M10 30 C 18 22, 28 14, 35 7"
                    stroke="#15803d"
                    strokeWidth="1.2"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Bottom 4-Feature Strip: Queries, Functions, Joins, Real-world examples */}
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, delay: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="mt-16 border-t border-line/80 pt-8 sm:mt-20 sm:pt-10 lg:mt-24"
        >
          <div className="grid grid-cols-2 gap-y-6 sm:gap-y-8 md:grid-cols-4 md:divide-x md:divide-line">
            {/* 1. Queries */}
            <a
              href="#basics"
              className="group flex items-center gap-3.5 px-2 transition-transform hover:translate-y-[-1px] sm:px-4 lg:px-6"
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#eff6ff] text-[#2563eb] transition-colors group-hover:bg-[#dbeafe] dark:bg-blue-950/60 dark:text-blue-400">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                  <path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5" />
                </svg>
              </div>
              <div>
                <div className="font-sans text-[15px] font-semibold text-ink group-hover:text-accent">
                  Queries
                </div>
                <div className="text-[13px] text-muted">Build real skills</div>
              </div>
            </a>

            {/* 2. Functions */}
            <a
              href="#curriculum"
              className="group flex items-center gap-3.5 px-2 transition-transform hover:translate-y-[-1px] sm:px-4 lg:px-6"
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#ecfdf5] text-[#10b981] transition-colors group-hover:bg-[#d1fae5] dark:bg-emerald-950/60 dark:text-emerald-400">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 20V10M12 20V4M6 20v-6" />
                </svg>
              </div>
              <div>
                <div className="font-sans text-[15px] font-semibold text-ink group-hover:text-accent">
                  Functions
                </div>
                <div className="text-[13px] text-muted">Go beyond basics</div>
              </div>
            </a>

            {/* 3. Joins */}
            <a
              href="#visualizers"
              className="group flex items-center gap-3.5 px-2 transition-transform hover:translate-y-[-1px] sm:px-4 lg:px-6"
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#f5f3ff] text-[#8b5cf6] transition-colors group-hover:bg-[#ede9fe] dark:bg-purple-950/60 dark:text-purple-400">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="3" />
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
                </svg>
              </div>
              <div>
                <div className="font-sans text-[15px] font-semibold text-ink group-hover:text-accent">
                  Joins
                </div>
                <div className="text-[13px] text-muted">Connect the dots</div>
              </div>
            </a>

            {/* 4. Real-world examples */}
            <a
              href="#lab"
              onClick={() => openLab("playground")}
              className="group flex items-center gap-3.5 px-2 transition-transform hover:translate-y-[-1px] sm:px-4 lg:px-6"
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#eff6ff] text-[#3b82f6] transition-colors group-hover:bg-[#dbeafe] dark:bg-sky-950/60 dark:text-sky-400">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" />
                </svg>
              </div>
              <div>
                <div className="font-sans text-[15px] font-semibold text-ink group-hover:text-accent">
                  Real-world examples
                </div>
                <div className="text-[13px] text-muted">Learn by doing</div>
              </div>
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
