import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { usePrefersReducedMotion } from "../../hooks/usePrefersReducedMotion";
import { useDeviceCapability } from "../../hooks/useDeviceCapability";
import * as THREE from "three";
import type { SceneColors } from "../../lib/sceneColors";

/*
 * A persistent flock of stylized 3D sparrows that drift across the whole page.
 * This canvas is fixed to the viewport and sits behind the content (z-0), with
 * pointer-events disabled so it never blocks clicks or scrolling. It is kept
 * deliberately lightweight: three low-poly birds, no shadows, capped DPR, and a
 * full stop on animation when the visitor prefers reduced motion.
 *
 * The birds are faceted/flat-shaded (warm feather bodies, purple accent wings)
 * so they read as living creatures and stay visually distinct from the hero's
 * glassy database slabs and glowing core.
 */

/* Flight paths in normalized space (x,y in [-1,1]; z is a shallow depth).
 * They are scaled to the live viewport at runtime so the birds stay on-screen
 * across desktop and mobile aspect ratios. */
const PATHS: [number, number, number][][] = [
  [
    [-1.15, -0.15, 0.0],
    [-0.6, 0.35, 0.35],
    [-0.05, -0.05, -0.25],
    [0.5, 0.45, 0.2],
    [1.1, 0.05, -0.15],
    [0.55, -0.5, 0.15],
    [0.0, -0.35, -0.35],
    [-0.6, -0.45, 0.25],
  ],
  [
    [1.2, 0.35, -0.2],
    [0.6, -0.25, 0.3],
    [0.05, 0.4, -0.35],
    [-0.5, -0.35, 0.15],
    [-1.15, 0.1, 0.3],
    [-0.6, 0.5, -0.2],
    [0.0, 0.15, 0.4],
    [0.65, 0.5, -0.3],
  ],
  [
    [-0.9, 0.55, 0.4],
    [-0.2, 0.15, -0.4],
    [0.45, 0.6, 0.2],
    [1.0, -0.2, 0.45],
    [0.35, -0.55, -0.3],
    [-0.3, -0.6, 0.35],
    [-0.95, -0.15, -0.25],
  ],
];

interface BirdConfig {
  path: number;
  speed: number; // fraction of the loop per second
  offset: number; // starting position along the loop (0..1)
  scale: number;
  phase: number; // desyncs the hover/flap rhythm between birds
  hoverFreq: number; // how often a bird eases into a hover
}

const FLOCK: BirdConfig[] = [
  { path: 0, speed: 0.05, offset: 0.0, scale: 1.25, phase: 0.0, hoverFreq: 0.17 },
  { path: 1, speed: 0.04, offset: 0.45, scale: 0.98, phase: 2.1, hoverFreq: 0.13 },
  { path: 2, speed: 0.062, offset: 0.72, scale: 0.76, phase: 4.0, hoverFreq: 0.21 },
];

const DEPTH = 3.6; // world units the normalized z maps onto

function Sparrow({
  config,
  curve,
  colors,
  reduced,
}: {
  config: BirdConfig;
  curve: THREE.CatmullRomCurve3;
  colors: SceneColors;
  reduced: boolean;
}) {
  const group = useRef<THREE.Group>(null);
  const leftWing = useRef<THREE.Group>(null);
  const rightWing = useRef<THREE.Group>(null);

  const progress = useRef(config.offset);
  const flapPhase = useRef(config.phase);
  const bank = useRef(0);
  const placed = useRef(false);

  // scratch objects reused every frame to avoid allocations
  const scratch = useMemo(
    () => ({
      pos: new THREE.Vector3(),
      ahead: new THREE.Vector3(),
      dir: new THREE.Vector3(),
      look: new THREE.Vector3(),
    }),
    [],
  );

  const toWorld = (p: THREE.Vector3, out: THREE.Vector3, vw: number, vh: number) => {
    out.set(p.x * vw * 0.5 * 0.92, p.y * vh * 0.5 * 0.9, p.z * DEPTH);
    return out;
  };

  useFrame((state, delta) => {
    const g = group.current;
    if (!g) return;
    const { vw, vh } = {
      vw: state.viewport.width,
      vh: state.viewport.height,
    };

    const t = state.clock.getElapsedTime();

    if (reduced) {
      // Static, gently perched placement — computed once, never animated.
      if (!placed.current) {
        const p = curve.getPointAt(config.offset % 1);
        const a = curve.getPointAt((config.offset + 0.002) % 1);
        toWorld(p, scratch.pos, vw, vh);
        toWorld(a, scratch.ahead, vw, vh);
        g.position.copy(scratch.pos);
        g.lookAt(scratch.ahead);
        if (leftWing.current) leftWing.current.rotation.z = -0.22;
        if (rightWing.current) rightWing.current.rotation.z = 0.22;
        placed.current = true;
      }
      return;
    }

    // Cruise <-> hover rhythm: a slow sine eases each bird into occasional
    // pauses without ever fully freezing (keeps it feeling alive).
    const s = Math.sin(t * config.hoverFreq * Math.PI * 2 + config.phase);
    const cruise = 0.5 + 0.5 * s; // 0 (hovering) .. 1 (cruising)
    const moveFactor = 0.12 + 0.88 * cruise * cruise;

    progress.current = (progress.current + delta * config.speed * moveFactor) % 1;

    const p = curve.getPointAt(progress.current);
    const ahead = curve.getPointAt((progress.current + 0.0015) % 1);
    toWorld(p, scratch.pos, vw, vh);
    toWorld(ahead, scratch.ahead, vw, vh);

    // A soft vertical bob while hovering.
    scratch.pos.y += Math.sin(t * 2.1 + config.phase) * 0.07 * (1 - cruise);

    g.position.copy(scratch.pos);
    scratch.dir.subVectors(scratch.ahead, scratch.pos).normalize();
    scratch.look.copy(scratch.pos).add(scratch.dir);
    g.lookAt(scratch.look);

    // Bank into the turn for a natural, weighty flight feel.
    const targetBank = THREE.MathUtils.clamp(-scratch.dir.x * 0.6, -0.6, 0.6);
    bank.current = THREE.MathUtils.lerp(bank.current, targetBank, 0.06);
    g.rotateZ(bank.current);

    // Wing flap: faster and wider when cruising, slow and shallow when hovering.
    flapPhase.current += delta * (5 + 15 * cruise);
    const amp = 0.3 + 0.6 * cruise;
    const flap = Math.sin(flapPhase.current) * amp;
    if (leftWing.current) leftWing.current.rotation.z = -flap;
    if (rightWing.current) rightWing.current.rotation.z = flap;
  });

  const { accent, feather, dark } = colors;
  const belly = dark ? "#ffe6c2" : "#fff2dd";
  const beak = "#f2932c";

  return (
    <group ref={group} scale={config.scale}>
      {/* body — elongated along +Z (forward) */}
      <mesh scale={[0.9, 0.86, 1.45]}>
        <sphereGeometry args={[0.34, 10, 8]} />
        <meshStandardMaterial color={feather} flatShading roughness={0.62} metalness={0.06} />
      </mesh>
      {/* belly */}
      <mesh position={[0, -0.1, 0.04]} scale={[0.7, 0.62, 1.1]}>
        <sphereGeometry args={[0.3, 8, 6]} />
        <meshStandardMaterial color={belly} flatShading roughness={0.7} />
      </mesh>
      {/* head */}
      <mesh position={[0, 0.17, 0.36]}>
        <sphereGeometry args={[0.2, 10, 8]} />
        <meshStandardMaterial color={feather} flatShading roughness={0.6} metalness={0.06} />
      </mesh>
      {/* beak */}
      <mesh position={[0, 0.13, 0.56]} rotation={[Math.PI / 2, 0, 0]}>
        <coneGeometry args={[0.07, 0.24, 6]} />
        <meshStandardMaterial color={beak} flatShading roughness={0.5} />
      </mesh>
      {/* eyes */}
      <mesh position={[-0.11, 0.22, 0.46]}>
        <sphereGeometry args={[0.032, 6, 6]} />
        <meshStandardMaterial color="#241a12" roughness={0.4} />
      </mesh>
      <mesh position={[0.11, 0.22, 0.46]}>
        <sphereGeometry args={[0.032, 6, 6]} />
        <meshStandardMaterial color="#241a12" roughness={0.4} />
      </mesh>
      {/* tail */}
      <mesh position={[0, 0.0, -0.52]} rotation={[-Math.PI / 2, 0, 0]} scale={[1, 1, 0.35]}>
        <coneGeometry args={[0.17, 0.42, 4]} />
        <meshStandardMaterial
          color={accent}
          emissive={accent}
          emissiveIntensity={dark ? 0.35 : 0.12}
          flatShading
          roughness={0.5}
        />
      </mesh>

      {/* wings — accent purple, pivot at the shoulder, flap around local Z */}
      <group ref={leftWing} position={[-0.14, 0.09, -0.02]}>
        <mesh position={[-0.4, 0, 0]} scale={[1, 1, 0.9]}>
          <boxGeometry args={[0.8, 0.05, 0.4]} />
          <meshStandardMaterial
            color={accent}
            emissive={accent}
            emissiveIntensity={dark ? 0.5 : 0.18}
            flatShading
            roughness={0.45}
            metalness={0.15}
            toneMapped={false}
          />
        </mesh>
      </group>
      <group ref={rightWing} position={[0.14, 0.09, -0.02]}>
        <mesh position={[0.4, 0, 0]} scale={[1, 1, 0.9]}>
          <boxGeometry args={[0.8, 0.05, 0.4]} />
          <meshStandardMaterial
            color={accent}
            emissive={accent}
            emissiveIntensity={dark ? 0.5 : 0.18}
            flatShading
            roughness={0.45}
            metalness={0.15}
            toneMapped={false}
          />
        </mesh>
      </group>
    </group>
  );
}

function Flock({ colors, reduced }: { colors: SceneColors; reduced: boolean }) {
  const curves = useMemo(
    () =>
      PATHS.map(
        (pts) =>
          new THREE.CatmullRomCurve3(
            pts.map((p) => new THREE.Vector3(p[0], p[1], p[2])),
            true,
            "catmullrom",
            0.5,
          ),
      ),
    [],
  );

  return (
    <group>
      {FLOCK.map((cfg, i) => {
        const curve = curves[cfg.path];
        if (!curve) return null;
        return (
          <Sparrow
            key={i}
            config={cfg}
            curve={curve}
            colors={colors}
            reduced={reduced}
          />
        );
      })}
    </group>
  );
}

export function SparrowFlock({ colors }: { colors: SceneColors }) {
  // A live subscription, so changing the OS setting while the page is open
  // really does park the flock instead of needing a reload.
  const reduced = usePrefersReducedMotion();
  const { liteMode, tier, isMobile } = useDeviceCapability();
  const [tabVisible, setTabVisible] = useState(true);

  useEffect(() => {
    const onVis = () => setTabVisible(document.visibilityState === "visible");
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  if (liteMode || tier < 3) {
    return null;
  }

  return (
    <div className="pointer-events-none fixed inset-0 z-0" aria-hidden="true">
      <Canvas
        dpr={isMobile ? [1, 1.25] : [1, 1.5]}
        frameloop={!tabVisible ? "never" : reduced ? "demand" : "always"}
        camera={{ position: [0, 0, 15], fov: 38 }}
        gl={{ antialias: !isMobile, alpha: true, powerPreference: "high-performance" }}
        style={{ pointerEvents: "none" }}
      >
        <ambientLight intensity={colors.dark ? 0.75 : 1.1} />
        <directionalLight position={[4, 6, 9]} intensity={colors.dark ? 1.5 : 1.8} />
        <pointLight
          position={[-7, -4, 6]}
          intensity={colors.dark ? 22 : 10}
          color={colors.accent}
        />
        <Flock colors={colors} reduced={reduced} />
      </Canvas>
    </div>
  );
}
