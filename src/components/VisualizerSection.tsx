import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Edges, Float, Line, RoundedBox } from "@react-three/drei";
import { motion } from "motion/react";
import * as THREE from "three";
import { SectionHeading } from "./ui";
import { useDeviceCapability } from "../hooks/useDeviceCapability";
import type { SceneColors } from "../lib/sceneColors";

type VisualizerMode = "pipeline" | "joins";
type JoinKind = "INNER JOIN" | "LEFT JOIN" | "RIGHT JOIN" | "FULL OUTER JOIN";

interface EmpRow {
  id: number;
  name: string;
  department: string;
  salary: number;
}

const RAW_EMPLOYEES: EmpRow[] = [
  { id: 1, name: "Ada Lovelace", department: "Engineering", salary: 125000 },
  { id: 2, name: "Grace Hopper", department: "Engineering", salary: 115000 },
  { id: 3, name: "Alan Turing", department: "Analytics", salary: 98000 },
  { id: 4, name: "Linus Torvalds", department: "Support", salary: 76000 },
  { id: 5, name: "Margaret Hamilton", department: "Analytics", salary: 108000 },
  { id: 6, name: "Ken Thompson", department: "Support", salary: 82000 },
];

interface PipelineStep {
  id: string;
  clause: string;
  sqlSnippet: string;
  title: string;
  explanation: string;
}

const PIPELINE_STEPS: PipelineStep[] = [
  {
    id: "from",
    clause: "1. FROM",
    sqlSnippet: "FROM employees",
    title: "Load the source table rows",
    explanation:
      "Even though SELECT is written first, the database engine always starts at FROM. It loads all 6 rows from the employees table into the working set.",
  },
  {
    id: "where",
    clause: "2. WHERE",
    sqlSnippet: "WHERE salary >= 90000",
    title: "Filter individual rows before grouping",
    explanation:
      "WHERE tests every row against the condition salary >= 90000. Rows that evaluate to FALSE (Linus and Ken in Support) are discarded immediately.",
  },
  {
    id: "group",
    clause: "3. GROUP BY",
    sqlSnippet: "GROUP BY department",
    title: "Cluster surviving rows into buckets",
    explanation:
      "GROUP BY gathers the 4 surviving rows by their department value, forming two distinct buckets: Engineering (2 rows) and Analytics (2 rows).",
  },
  {
    id: "select",
    clause: "4. SELECT",
    sqlSnippet: "SELECT department, COUNT(*) AS team_size, ROUND(AVG(salary)) AS avg_salary",
    title: "Collapse each bucket & project columns",
    explanation:
      "Now SELECT finally runs! It computes COUNT(*) and AVG(salary) for each department bucket and strips away unrequested columns.",
  },
  {
    id: "order",
    clause: "5. ORDER BY",
    sqlSnippet: "ORDER BY avg_salary DESC;",
    title: "Sort the final result set",
    explanation:
      "ORDER BY runs last because the aliases and aggregates in SELECT now exist. Engineering ($120,000 avg) sorts above Analytics ($103,000 avg).",
  },
];

const LEFT_STUDENTS = [
  { id: 1, name: "Maya" },
  { id: 2, name: "Devon" },
  { id: 3, name: "Priya" },
];

const RIGHT_ENROLLMENTS = [
  { enroll_id: 101, student_id: 1, course: "Databases 101" },
  { enroll_id: 102, student_id: 2, course: "Query Tuning" },
  { enroll_id: 103, student_id: 4, course: "Distributed SQL" },
];

/* ----------------------------------------------------- 3D WebGL Stage Meshes */

function Pipeline3DScene({
  step,
  colors,
}: {
  step: number;
  colors: SceneColors;
}) {
  const group = useRef<THREE.Group>(null);
  const targets = useMemo(() => {
    return RAW_EMPLOYEES.map((row, idx) => {
      const passWhere = row.salary >= 90000;
      const isEng = row.department === "Engineering";
      // Base grid positions (Step 0: FROM)
      let x = -2.2 + (idx % 3) * 2.2;
      let y = idx < 3 ? 0.85 : -0.85;
      let z = 0;
      let scale = 1;
      let color = colors.accent;

      if (step === 1) {
        // WHERE filter gate
        if (!passWhere) {
          y = -1.9;
          z = -1.6;
          scale = 0.45;
          color = colors.muted;
        } else {
          y = idx < 3 ? 0.9 : -0.3;
          color = colors.feather;
        }
      } else if (step === 2) {
        // GROUP BY buckets
        if (!passWhere) {
          scale = 0.01;
        } else {
          x = isEng ? -1.85 : 1.85;
          y = idx % 2 === 0 ? 0.65 : -0.35;
          color = isEng ? colors.accent : colors.feather;
        }
      } else if (step === 3 || step === 4) {
        // SELECT aggregate & ORDER BY
        if (!passWhere || (idx !== 0 && idx !== 2)) {
          scale = 0.01;
        } else {
          x = 0;
          y = step === 4 ? (isEng ? 0.75 : -0.65) : isEng ? 0.55 : -0.55;
          z = 0.4;
          scale = 1.25;
          color = isEng ? colors.accent : colors.feather;
        }
      }
      return { x, y, z, scale, color };
    });
  }, [step, colors]);

  useFrame((_, delta) => {
    if (!group.current) return;
    group.current.children.forEach((child, i) => {
      const t = targets[i];
      if (!t) return;
      child.position.x = THREE.MathUtils.lerp(child.position.x, t.x, delta * 5);
      child.position.y = THREE.MathUtils.lerp(child.position.y, t.y, delta * 5);
      child.position.z = THREE.MathUtils.lerp(child.position.z, t.z, delta * 5);
      const s = THREE.MathUtils.lerp(child.scale.x, t.scale, delta * 5);
      child.scale.setScalar(s);
    });
  });

  return (
    <group ref={group}>
      {RAW_EMPLOYEES.map((row, idx) => {
        const t = targets[idx]!;
        return (
          <group key={row.id} position={[t.x, t.y, t.z]}>
            <Float speed={1.4} rotationIntensity={0.12} floatIntensity={0.25}>
              <RoundedBox args={[1.75, 0.72, 0.16]} radius={0.08} smoothness={3}>
                <meshPhysicalMaterial
                  color={colors.dark ? "#161b2e" : "#ffffff"}
                  transparent
                  opacity={0.9}
                  roughness={0.22}
                  metalness={0.12}
                />
                <Edges scale={1.002} color={t.color} />
              </RoundedBox>
              <mesh position={[0, 0.12, 0.09]}>
                <boxGeometry args={[1.35, 0.14, 0.02]} />
                <meshStandardMaterial
                  color={t.color}
                  emissive={t.color}
                  emissiveIntensity={colors.dark ? 0.65 : 0.25}
                />
              </mesh>
              <mesh position={[-0.2, -0.14, 0.09]}>
                <boxGeometry args={[0.95, 0.1, 0.02]} />
                <meshStandardMaterial color={colors.muted} transparent opacity={0.6} />
              </mesh>
            </Float>
          </group>
        );
      })}
    </group>
  );
}

function Join3DScene({
  joinKind,
  colors,
}: {
  joinKind: JoinKind;
  colors: SceneColors;
}) {
  const showLeftUnmatched =
    joinKind === "LEFT JOIN" || joinKind === "FULL OUTER JOIN";
  const showRightUnmatched =
    joinKind === "RIGHT JOIN" || joinKind === "FULL OUTER JOIN";

  return (
    <group>
      {/* Left table slabs (students) */}
      {LEFT_STUDENTS.map((s, i) => {
        const matched = s.id === 1 || s.id === 2;
        const active = matched || showLeftUnmatched;
        const y = 1.0 - i * 1.0;
        const edgeColor = matched
          ? colors.accent
          : active
            ? colors.feather
            : colors.muted;
        return (
          <group key={s.id} position={[-2.35, y, 0]} scale={active ? 1 : 0.78}>
            <RoundedBox args={[1.8, 0.64, 0.14]} radius={0.06} smoothness={3}>
              <meshPhysicalMaterial
                color={colors.dark ? "#15192b" : "#ffffff"}
                transparent
                opacity={active ? 0.92 : 0.35}
                roughness={0.25}
              />
              <Edges color={edgeColor} />
            </RoundedBox>
            <mesh position={[0, 0, 0.08]}>
              <boxGeometry args={[1.35, 0.14, 0.02]} />
              <meshStandardMaterial
                color={edgeColor}
                emissive={edgeColor}
                emissiveIntensity={active ? 0.5 : 0.1}
              />
            </mesh>
          </group>
        );
      })}

      {/* Right table slabs (enrollments) */}
      {RIGHT_ENROLLMENTS.map((e, i) => {
        const matched = e.student_id === 1 || e.student_id === 2;
        const active = matched || showRightUnmatched;
        const y = 1.0 - i * 1.0;
        const edgeColor = matched
          ? colors.accent
          : active
            ? colors.feather
            : colors.muted;
        return (
          <group key={e.enroll_id} position={[2.35, y, 0]} scale={active ? 1 : 0.78}>
            <RoundedBox args={[1.8, 0.64, 0.14]} radius={0.06} smoothness={3}>
              <meshPhysicalMaterial
                color={colors.dark ? "#15192b" : "#ffffff"}
                transparent
                opacity={active ? 0.92 : 0.35}
                roughness={0.25}
              />
              <Edges color={edgeColor} />
            </RoundedBox>
            <mesh position={[0, 0, 0.08]}>
              <boxGeometry args={[1.35, 0.14, 0.02]} />
              <meshStandardMaterial
                color={edgeColor}
                emissive={edgeColor}
                emissiveIntensity={active ? 0.5 : 0.1}
              />
            </mesh>
          </group>
        );
      })}

      {/* Foreign key bridges for id=1 and id=2 */}
      {[0, 1].map((idx) => {
        const y = 1.0 - idx * 1.0;
        return (
          <Line
            key={idx}
            points={[
              [-1.4, y, 0.05],
              [0, y + 0.18, 0.35],
              [1.4, y, 0.05],
            ]}
            color={colors.accent}
            lineWidth={2.5}
          />
        );
      })}
    </group>
  );
}

/* ----------------------------------------------------- Main Visualizer Section */

export function VisualizerSection({ colors }: { colors: SceneColors }) {
  const { liteMode, tier, isMobile, haptic } = useDeviceCapability();
  const [mode, setMode] = useState<VisualizerMode>("pipeline");
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [joinKind, setJoinKind] = useState<JoinKind>("INNER JOIN");
  const sectionRef = useRef<HTMLElement>(null);
  const [inView, setInView] = useState(false);

  // Pause WebGL canvas when scrolled out of viewport
  useEffect(() => {
    const el = sectionRef.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      setInView(true);
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => setInView(Boolean(entry?.isIntersecting)),
      { threshold: 0.05 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Auto-advance pipeline steps when Play is active
  useEffect(() => {
    if (!playing || mode !== "pipeline") return;
    const id = setInterval(() => {
      setStep((s) => (s + 1) % PIPELINE_STEPS.length);
    }, 2400);
    return () => clearInterval(id);
  }, [playing, mode]);

  const currentStep = PIPELINE_STEPS[step] ?? PIPELINE_STEPS[0]!;

  const joinRows = useMemo(() => {
    if (joinKind === "INNER JOIN") {
      return [
        { id: 1, name: "Maya", student_id: 1, course: "Databases 101", match: "matched" },
        { id: 2, name: "Devon", student_id: 2, course: "Query Tuning", match: "matched" },
      ];
    }
    if (joinKind === "LEFT JOIN") {
      return [
        { id: 1, name: "Maya", student_id: 1, course: "Databases 101", match: "matched" },
        { id: 2, name: "Devon", student_id: 2, course: "Query Tuning", match: "matched" },
        { id: 3, name: "Priya", student_id: null, course: null, match: "left-only" },
      ];
    }
    if (joinKind === "RIGHT JOIN") {
      return [
        { id: 1, name: "Maya", student_id: 1, course: "Databases 101", match: "matched" },
        { id: 2, name: "Devon", student_id: 2, course: "Query Tuning", match: "matched" },
        { id: null, name: null, student_id: 4, course: "Distributed SQL", match: "right-only" },
      ];
    }
    return [
      { id: 1, name: "Maya", student_id: 1, course: "Databases 101", match: "matched" },
      { id: 2, name: "Devon", student_id: 2, course: "Query Tuning", match: "matched" },
      { id: 3, name: "Priya", student_id: null, course: null, match: "left-only" },
      { id: null, name: null, student_id: 4, course: "Distributed SQL", match: "right-only" },
    ];
  }, [joinKind]);

  const openInLab = (sqlToLoad: string) => {
    haptic(10);
    window.dispatchEvent(
      new CustomEvent("sparrowsql:lab", {
        detail: { sql: sqlToLoad },
      }),
    );
    document.getElementById("lab")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section
      id="visualizers"
      ref={sectionRef}
      className="relative scroll-mt-[120px] border-b border-line bg-surface/20 py-20 sm:py-28"
    >
      <div className="mx-auto max-w-[1600px] px-4 sm:px-8 lg:px-12">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <SectionHeading
            eyebrow="Interactive 3D SQL Visualizers"
            title={
              <>
                See how SQL <span className="text-accent">transforms rows in space.</span>
              </>
            }
            lede="Beginners often read queries top-to-bottom, but the SQL engine executes them in a pipeline: FROM → WHERE → GROUP BY → SELECT → ORDER BY. Step through the pipeline or test table JOINs interactively."
          />

          <div
            role="tablist"
            aria-label="Choose SQL visualizer"
            className="inline-flex shrink-0 self-start rounded-full border border-line bg-surface/70 p-1"
          >
            <button
              type="button"
              role="tab"
              aria-selected={mode === "pipeline"}
              onClick={() => {
                haptic();
                setMode("pipeline");
              }}
              className={`min-h-[40px] rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                mode === "pipeline"
                  ? "bg-accent text-[color:var(--accent-ink)]"
                  : "text-muted hover:text-ink"
              }`}
            >
              Query Pipeline
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mode === "joins"}
              onClick={() => {
                haptic();
                setPlaying(false);
                setMode("joins");
              }}
              className={`min-h-[40px] rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                mode === "joins"
                  ? "bg-accent text-[color:var(--accent-ink)]"
                  : "text-muted hover:text-ink"
              }`}
            >
              JOIN Explorer
            </button>
          </div>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-[1.15fr_1fr]">
          {/* LEFT STAGE: 3D WebGL or Lite Spatial Canvas */}
          <div className="tier1-card relative flex flex-col overflow-hidden rounded-[20px] border border-line bg-[var(--bg-deep)]">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line bg-surface/60 px-4 py-3">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-accent" />
                <span className="font-mono text-[11.5px] uppercase tracking-wider text-muted">
                  {mode === "pipeline"
                    ? `Execution Stage ${step + 1}/${PIPELINE_STEPS.length}: ${currentStep.clause}`
                    : `Relational Key Matching: ${joinKind}`}
                </span>
              </div>
              <span className="rounded-full border border-line bg-surface-2 px-2.5 py-0.5 font-mono text-[10.5px] text-faint">
                {liteMode ? "Lite 2D Stage" : "3D Interactive Stage"}
              </span>
            </div>

            {/* 3D Canvas or Lite Fallback */}
            <div className="relative h-[260px] w-full sm:h-[310px]">
              {tier === 3 && inView ? (
                <Canvas
                  dpr={isMobile ? [1, 1.4] : [1, 1.75]}
                  camera={{ position: [0, 0, 5.8], fov: 42 }}
                  gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
                >
                  <ambientLight intensity={colors.dark ? 0.75 : 1.1} />
                  <pointLight
                    position={[5, 4, 5]}
                    intensity={colors.dark ? 32 : 18}
                    color={colors.accent}
                  />
                  <pointLight
                    position={[-5, -3, 4]}
                    intensity={colors.dark ? 22 : 12}
                    color={colors.feather}
                  />
                  {mode === "pipeline" ? (
                    <Pipeline3DScene step={step} colors={colors} />
                  ) : (
                    <Join3DScene joinKind={joinKind} colors={colors} />
                  )}
                </Canvas>
              ) : (
                <div className="flex h-full flex-col justify-center gap-3 p-4">
                  {mode === "pipeline" ? (
                    <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                      {RAW_EMPLOYEES.map((emp) => {
                        const pass = emp.salary >= 90000;
                        const active = step === 0 || pass;
                        return (
                          <div
                            key={emp.id}
                            className={`rounded-xl border p-2.5 font-mono text-[11.5px] transition-all ${
                              active
                                ? "border-accent/50 bg-surface/90 text-ink"
                                : "border-line/40 bg-surface/20 text-faint opacity-45 line-through"
                            }`}
                          >
                            <div className="font-semibold text-accent">{emp.name}</div>
                            <div className="text-[10.5px] text-muted">{emp.department}</div>
                            <div className="mt-1 text-feather tabular-nums">
                              ${emp.salary.toLocaleString()}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <p className="font-mono text-[10.5px] uppercase text-accent">
                          students (Left)
                        </p>
                        {LEFT_STUDENTS.map((s) => (
                          <div
                            key={s.id}
                            className="rounded-lg border border-line bg-surface px-3 py-1.5 font-mono text-[12px]"
                          >
                            id={s.id} · {s.name}
                          </div>
                        ))}
                      </div>
                      <div className="space-y-1.5">
                        <p className="font-mono text-[10.5px] uppercase text-feather">
                          enrollments (Right)
                        </p>
                        {RIGHT_ENROLLMENTS.map((e) => (
                          <div
                            key={e.enroll_id}
                            className="rounded-lg border border-line bg-surface px-3 py-1.5 font-mono text-[12px]"
                          >
                            student_id={e.student_id} · {e.course}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Interactive Controls Bar */}
            {mode === "pipeline" ? (
              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line bg-surface/70 p-3">
                <div className="no-scrollbar flex items-center gap-1.5 overflow-x-auto">
                  {PIPELINE_STEPS.map((st, idx) => (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() => {
                        haptic();
                        setPlaying(false);
                        setStep(idx);
                      }}
                      aria-pressed={step === idx}
                      className={`min-h-[36px] shrink-0 rounded-full px-3 py-1 font-mono text-[11.5px] font-semibold transition-colors ${
                        step === idx
                          ? "bg-accent text-[color:var(--accent-ink)]"
                          : "border border-line bg-surface-2 text-muted hover:text-ink"
                      }`}
                    >
                      {st.clause}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      haptic();
                      setPlaying((p) => !p);
                    }}
                    className="min-h-[36px] rounded-full border border-accent/40 bg-accent-soft px-3.5 py-1 font-mono text-[11.5px] font-semibold text-accent"
                  >
                    {playing ? "⏸ Pause" : "▶ Auto-step"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      haptic();
                      setPlaying(false);
                      setStep((s) => (s + 1) % PIPELINE_STEPS.length);
                    }}
                    className="min-h-[36px] rounded-full border border-line bg-surface-2 px-3 py-1 font-mono text-[11.5px] text-ink hover:border-line-strong"
                  >
                    Step →
                  </button>
                </div>
              </div>
            ) : (
              <div className="no-scrollbar flex items-center gap-2 overflow-x-auto border-t border-line bg-surface/70 p-3">
                {(
                  ["INNER JOIN", "LEFT JOIN", "RIGHT JOIN", "FULL OUTER JOIN"] as JoinKind[]
                ).map((jk) => (
                  <button
                    key={jk}
                    type="button"
                    onClick={() => {
                      haptic();
                      setJoinKind(jk);
                    }}
                    aria-pressed={joinKind === jk}
                    className={`min-h-[38px] shrink-0 rounded-full px-3.5 py-1.5 font-mono text-[11.5px] font-semibold transition-colors ${
                      joinKind === jk
                        ? "bg-accent text-[color:var(--accent-ink)]"
                        : "border border-line bg-surface-2 text-muted hover:text-ink"
                    }`}
                  >
                    {jk}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* RIGHT DECK: Live SQL Clause Highlight, Explanation & Output Preview */}
          <div className="tier1-card flex flex-col justify-between gap-4 rounded-[20px] border border-line bg-surface/60 p-5">
            {mode === "pipeline" ? (
              <>
                <div>
                  <span className="rounded-full bg-accent-soft px-3 py-1 font-mono text-[11px] font-semibold text-accent">
                    Engine Step {step + 1} of {PIPELINE_STEPS.length}
                  </span>
                  <h3 className="mt-3 font-display text-xl font-bold text-ink">
                    {currentStep.title}
                  </h3>
                  <p className="mt-1.5 text-[14px] leading-relaxed text-muted">
                    {currentStep.explanation}
                  </p>

                  {/* SQL Query with active clause highlighted */}
                  <div className="mt-4 rounded-xl border border-line bg-[var(--bg-deep)] p-3.5 font-mono text-[12.5px]">
                    {PIPELINE_STEPS.map((st, idx) => (
                      <motion.div
                        key={st.id}
                        onClick={() => {
                          setPlaying(false);
                          setStep(idx);
                        }}
                        className={`cursor-pointer rounded-md px-2 py-1 transition-colors ${
                          idx === step
                            ? "bg-accent/20 text-accent font-semibold"
                            : "text-muted hover:text-ink"
                        }`}
                      >
                        <span className="mr-2 inline-block w-4 text-[10px] text-faint">
                          #{idx + 1}
                        </span>
                        {st.sqlSnippet}
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* Live Resulting Row Preview at Current Pipeline Stage */}
                <div className="rounded-xl border border-line bg-[var(--bg-deep)]/70 p-3">
                  <div className="mb-2 flex items-center justify-between font-mono text-[11px] text-faint">
                    <span>Working Set after {currentStep.clause}</span>
                    <span>
                      {step === 0
                        ? "6 rows"
                        : step === 1
                          ? "4 rows kept (2 filtered)"
                          : "2 department groups"}
                    </span>
                  </div>
                  {step <= 2 ? (
                    <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                      {RAW_EMPLOYEES.map((r) => {
                        const kept = step === 0 || r.salary >= 90000;
                        return (
                          <div
                            key={r.id}
                            className={`flex items-center justify-between rounded-lg border px-2.5 py-1.5 font-mono text-[11.5px] ${
                              kept
                                ? "border-line bg-surface/80 text-ink"
                                : "border-line/30 bg-surface/20 text-faint line-through opacity-50"
                            }`}
                          >
                            <span className="truncate">{r.name}</span>
                            <span className="ml-2 shrink-0 text-feather tabular-nums">
                              ${(r.salary / 1000).toFixed(0)}k
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="space-y-1.5 font-mono text-[12px]">
                      {(step === 4
                        ? [
                            { dept: "Engineering", count: 2, avg: "$120,000" },
                            { dept: "Analytics", count: 2, avg: "$103,000" },
                          ]
                        : [
                            { dept: "Analytics", count: 2, avg: "$103,000" },
                            { dept: "Engineering", count: 2, avg: "$120,000" },
                          ]
                      ).map((g) => (
                        <div
                          key={g.dept}
                          className="flex items-center justify-between rounded-lg border border-accent/30 bg-surface px-3 py-2"
                        >
                          <span className="font-semibold text-accent">{g.dept}</span>
                          <span className="text-muted">team_size: {g.count}</span>
                          <span className="font-semibold text-feather tabular-nums">
                            avg: {g.avg}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                  <span className="font-mono text-[11px] text-faint">
                    Tap any clause above to inspect that stage
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      openInLab(
                        `SELECT major, COUNT(*) AS student_count, ROUND(AVG(gpa), 2) AS avg_gpa\nFROM students\nWHERE gpa >= 3.4\nGROUP BY major\nORDER BY avg_gpa DESC;`,
                      )
                    }
                    className="min-h-[40px] rounded-full bg-accent px-4 py-2 text-xs font-semibold text-[color:var(--accent-ink)] transition-transform hover:-translate-y-[1px] active:scale-95"
                  >
                    Try Pipeline Query in Live Lab →
                  </button>
                </div>
              </>
            ) : (
              <>
                <div>
                  <span className="rounded-full bg-feather-soft px-3 py-1 font-mono text-[11px] font-semibold text-feather">
                    {joinKind}
                  </span>
                  <h3 className="mt-3 font-display text-xl font-bold text-ink">
                    {joinKind === "INNER JOIN"
                      ? "Keep only rows with matching keys in both tables"
                      : joinKind === "LEFT JOIN"
                        ? "Keep every left row; fill missing right columns with NULL"
                        : joinKind === "RIGHT JOIN"
                          ? "Keep every right row; fill missing left columns with NULL"
                          : "Keep all rows from both tables, padding unmatched sides with NULL"}
                  </h3>
                  <pre className="mt-3 overflow-x-auto rounded-xl border border-line bg-[var(--bg-deep)] p-3.5 font-mono text-[12px] text-ink">
{`SELECT s.id, s.name, e.course
FROM students s
${joinKind} enrollments e
  ON s.id = e.student_id;`}
                  </pre>
                </div>

                <div className="overflow-x-auto rounded-xl border border-line bg-[var(--bg-deep)]/80">
                  <table className="min-w-full border-collapse font-mono text-[12px]">
                    <thead>
                      <tr className="border-b border-line bg-surface-2/80 text-left text-[11px] uppercase text-accent">
                        <th className="px-3 py-2">s.id</th>
                        <th className="px-3 py-2">s.name</th>
                        <th className="px-3 py-2">e.student_id</th>
                        <th className="px-3 py-2">e.course</th>
                      </tr>
                    </thead>
                    <tbody>
                      {joinRows.map((r, i) => (
                        <tr key={i} className="border-t border-line/60">
                          <td className="px-3 py-2 tabular-nums">
                            {r.id ?? <span className="italic text-feather">NULL</span>}
                          </td>
                          <td className="px-3 py-2">
                            {r.name ?? <span className="italic text-feather">NULL</span>}
                          </td>
                          <td className="px-3 py-2 tabular-nums">
                            {r.student_id ?? (
                              <span className="italic text-feather">NULL</span>
                            )}
                          </td>
                          <td className="px-3 py-2">
                            {r.course ?? <span className="italic text-feather">NULL</span>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                  <span className="font-mono text-[11px] text-faint">
                    {joinRows.length} joined row{joinRows.length === 1 ? "" : "s"} produced
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      openInLab(
                        `SELECT s.id, s.name, e.course_id, e.grade\nFROM students s\n${joinKind === "INNER JOIN" ? "INNER JOIN" : "LEFT JOIN"} enrollments e ON s.id = e.student_id;`,
                      )
                    }
                    className="min-h-[40px] rounded-full bg-accent px-4 py-2 text-xs font-semibold text-[color:var(--accent-ink)] transition-transform hover:-translate-y-[1px] active:scale-95"
                  >
                    Load JOIN in Live Lab →
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
