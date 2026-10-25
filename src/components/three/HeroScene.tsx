import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, RoundedBox, Edges, Sparkles } from "@react-three/drei";
import { usePrefersReducedMotion } from "../../hooks/usePrefersReducedMotion";
import { useDeviceCapability } from "../../hooks/useDeviceCapability";
import * as THREE from "three";
import type { SceneColors } from "../../lib/sceneColors";

/* A soft radial glow sprite, generated once, used to fake bloom on the core. */
function useGlowTexture(color: string) {
  const tex = useMemo(() => {
    const size = 128;
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = size;
    const ctx = canvas.getContext("2d")!;
    const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    g.addColorStop(0, color);
    g.addColorStop(0.4, color + "55");
    g.addColorStop(1, "transparent");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, size, size);
    const t = new THREE.CanvasTexture(canvas);
    t.needsUpdate = true;
    return t;
  }, [color]);

  // Theme flips create a new GPU texture; release the superseded one so long
  // sessions do not accumulate orphaned glow maps.
  useEffect(() => () => tex.dispose(), [tex]);
  return tex;
}

/* One floating database table, rendered as a glass slab with rows. */
function TableSlab({
  position,
  rotation,
  scale = 1,
  rows = 4,
  accent,
  feather,
  muted,
  dark,
  activeRow = -1,
}: {
  position: [number, number, number];
  rotation: [number, number, number];
  scale?: number;
  rows?: number;
  accent: string;
  feather: string;
  muted: string;
  dark: boolean;
  activeRow?: number;
}) {
  const w = 2.4;
  const h = 0.34 + rows * 0.3;
  const glass = dark ? "#12172a" : "#ffffff";
  const rowColor = dark ? "#2a3350" : "#dfe3f0";

  return (
    <group position={position} rotation={rotation} scale={scale}>
      <RoundedBox args={[w, h, 0.08]} radius={0.05} smoothness={4}>
        <meshPhysicalMaterial
          color={glass}
          transparent
          opacity={dark ? 0.42 : 0.7}
          roughness={0.18}
          metalness={0.1}
          clearcoat={0.6}
          clearcoatRoughness={0.25}
        />
        <Edges scale={1.001} color={accent} />
      </RoundedBox>

      {/* header bar */}
      <mesh position={[0, h / 2 - 0.17, 0.05]}>
        <boxGeometry args={[w - 0.2, 0.16, 0.02]} />
        <meshStandardMaterial
          color={accent}
          emissive={accent}
          emissiveIntensity={dark ? 0.7 : 0.25}
          toneMapped={false}
        />
      </mesh>

      {/* data rows */}
      {Array.from({ length: rows }).map((_, i) => {
        const y = h / 2 - 0.42 - i * 0.3;
        const active = i === activeRow;
        const cellW = (w - 0.4) * (0.5 + ((i * 37) % 40) / 100);
        return (
          <group key={i}>
            <mesh position={[-(w - 0.4 - cellW) / 2, y, 0.05]}>
              <boxGeometry args={[cellW, 0.1, 0.015]} />
              <meshStandardMaterial
                color={active ? feather : rowColor}
                emissive={active ? feather : muted}
                emissiveIntensity={active ? (dark ? 0.9 : 0.4) : dark ? 0.12 : 0.04}
                transparent
                opacity={active ? 1 : 0.75}
                toneMapped={false}
              />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

/* The glowing SQL engine core at the centre of the cosmos. */
function EngineCore({ accent, feather, dark }: SceneColors) {
  const glow = useGlowTexture(accent);
  const mesh = useRef<THREE.Mesh>(null);
  const reduce = usePrefersReducedMotion();

  useFrame((_, delta) => {
    if (reduce || !mesh.current) return;
    mesh.current.rotation.y += delta * 0.25;
    mesh.current.rotation.x += delta * 0.08;
  });

  return (
    <group>
      <sprite scale={[7, 7, 1]}>
        <spriteMaterial
          map={glow}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          opacity={dark ? 0.85 : 0.4}
        />
      </sprite>
      <mesh ref={mesh}>
        <icosahedronGeometry args={[0.72, 1]} />
        <meshStandardMaterial
          color={accent}
          emissive={accent}
          emissiveIntensity={dark ? 1.1 : 0.5}
          roughness={0.25}
          metalness={0.4}
          flatShading
          toneMapped={false}
        />
      </mesh>
      <mesh scale={1.28}>
        <icosahedronGeometry args={[0.72, 1]} />
        <meshBasicMaterial color={feather} wireframe transparent opacity={dark ? 0.22 : 0.16} />
      </mesh>
    </group>
  );
}

/* Faint relation lines linking the tables to the core. The Line objects are
 * built once per point set: constructing them during render leaked a new
 * BufferGeometry to the GPU on every theme flip. */
function Relations({ points, color }: { points: [number, number, number][]; color: string }) {
  const material = useMemo(
    () =>
      new THREE.LineBasicMaterial({
        color,
        transparent: true,
        opacity: 0.22,
      }),
    [color],
  );
  const lines = useMemo(
    () =>
      points.map(
        (p) =>
          new THREE.Line(
            new THREE.BufferGeometry().setFromPoints([
              new THREE.Vector3(0, 0, 0),
              new THREE.Vector3(...p),
            ]),
            material,
          ),
      ),
    [points, material],
  );

  useEffect(
    () => () => {
      for (const line of lines) line.geometry.dispose();
      material.dispose();
    },
    [lines, material],
  );

  return (
    <group>
      {lines.map((line, i) => (
        <primitive key={i} object={line} />
      ))}
    </group>
  );
}

interface SlabSpec {
  pos: [number, number, number];
  rot: [number, number, number];
  scale: number;
  rows: number;
  active: number;
  float: number;
}

/* Module-level so the relation-line memo above sees a stable point array
 * instead of a fresh one on every render. */
const SLABS: SlabSpec[] = [
  { pos: [-3.1, 1.1, -1.2], rot: [0.05, 0.5, 0.04], scale: 1, rows: 4, active: 1, float: 1.4 },
  { pos: [3.2, 0.6, -1.6], rot: [-0.04, -0.5, -0.03], scale: 0.95, rows: 5, active: 2, float: 1.1 },
  { pos: [-2.4, -1.5, 0.6], rot: [0.06, 0.35, -0.05], scale: 0.85, rows: 3, active: 0, float: 1.7 },
  { pos: [2.6, -1.6, 0.2], rot: [-0.05, -0.3, 0.05], scale: 0.9, rows: 4, active: 3, float: 1.3 },
  { pos: [0.2, 2.3, -2.6], rot: [0.1, 0.1, 0], scale: 0.7, rows: 3, active: -1, float: 1.9 },
];

const RELATION_POINTS = SLABS.map((s) => s.pos);

function Cosmos({ colors }: { colors: SceneColors }) {
  const group = useRef<THREE.Group>(null);
  const reduce = usePrefersReducedMotion();
  const { accent, feather, muted, dark } = colors;

  useFrame((state) => {
    if (reduce || !group.current) return;
    const t = state.clock.getElapsedTime();
    // gentle auto drift + pointer parallax
    const px = state.pointer.x;
    const py = state.pointer.y;
    group.current.rotation.y = THREE.MathUtils.lerp(
      group.current.rotation.y,
      px * 0.28 + Math.sin(t * 0.12) * 0.08,
      0.04,
    );
    group.current.rotation.x = THREE.MathUtils.lerp(
      group.current.rotation.x,
      -py * 0.18,
      0.04,
    );
  });

  return (
    <group ref={group}>
      <EngineCore {...colors} />
      <Relations
        color={accent}
        points={RELATION_POINTS}
      />
      {SLABS.map((s, i) => (
        <Float
          key={i}
          speed={reduce ? 0 : s.float}
          rotationIntensity={reduce ? 0 : 0.25}
          floatIntensity={reduce ? 0 : 0.7}
          floatingRange={[-0.18, 0.18]}
        >
          <TableSlab
            position={s.pos}
            rotation={s.rot}
            scale={s.scale}
            rows={s.rows}
            activeRow={s.active}
            accent={accent}
            feather={feather}
            muted={muted}
            dark={dark}
          />
        </Float>
      ))}
      <Sparkles
        count={dark ? 90 : 40}
        scale={[13, 9, 8]}
        size={dark ? 2.4 : 1.6}
        speed={reduce ? 0 : 0.32}
        opacity={dark ? 0.6 : 0.4}
        color={feather}
      />
      <Sparkles
        count={dark ? 70 : 30}
        scale={[16, 11, 10]}
        size={dark ? 1.8 : 1.2}
        speed={reduce ? 0 : 0.2}
        opacity={dark ? 0.5 : 0.3}
        color={accent}
      />
    </group>
  );
}

export function HeroScene({ colors }: { colors: SceneColors }) {
  const reduce = usePrefersReducedMotion();
  const { liteMode, tier, isMobile } = useDeviceCapability();
  const containerRef = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(true);
  const [tabVisible, setTabVisible] = useState(true);

  useEffect(() => {
    const onVis = () => setTabVisible(document.visibilityState === "visible");
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      ([entry]) => setInView(Boolean(entry?.isIntersecting)),
      { threshold: 0.05 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  if (liteMode || tier < 3) {
    return (
      <div
        ref={containerRef}
        aria-hidden="true"
        className="pointer-events-none relative flex h-full w-full items-center justify-center overflow-hidden"
      >
        <div
          className="h-56 w-56 rounded-full opacity-35 blur-3xl"
          style={{
            background: `radial-gradient(circle, ${colors.accent}, ${colors.feather}, transparent 70%)`,
          }}
        />
      </div>
    );
  }

  const activeLoop = !inView || !tabVisible ? "never" : reduce ? "demand" : "always";

  return (
    <div ref={containerRef} className="h-full w-full" aria-hidden="true">
      <Canvas
        dpr={isMobile ? [1, 1.4] : [1, 1.75]}
        camera={{ position: [0, 0, 8], fov: 42 }}
        gl={{ antialias: !isMobile, alpha: true, powerPreference: "high-performance" }}
        frameloop={activeLoop}
        style={{ pointerEvents: "none" }}
      >
        <ambientLight intensity={colors.dark ? 0.5 : 0.9} />
        <pointLight position={[6, 4, 6]} intensity={colors.dark ? 40 : 20} color={colors.accent} />
        <pointLight position={[-6, -3, 4]} intensity={colors.dark ? 26 : 14} color={colors.feather} />
        <Cosmos colors={colors} />
      </Canvas>
    </div>
  );
}
