import { useId } from "react";
import type { SparrowState } from "../lib/types";

interface Props {
  state?: SparrowState;
  size?: number;
  className?: string;
  title?: string;
}

/**
 * Sparrow: the tutor mascot. A single geometric sparrow whose expression,
 * posture and props change with its SparrowState. Animations are subtle and
 * collapse under prefers-reduced-motion (handled globally in index.css).
 */
export function SparrowMascot({
  state = "idle",
  size = 120,
  className = "",
  title = "Sparrow",
}: Props) {
  const blink = state !== "happy" && state !== "celebrating";
  const showThought = state === "thinking";
  const showQuestion = state === "confused";
  const showAlert = state === "warning";
  const celebrate = state === "celebrating";
  const happy = state === "happy" || state === "celebrating";

  // Unique per-instance gradient ids so multiple mascots on the page never
  // collide (duplicate DOM ids are invalid and can break fills).
  const uid = useId().replace(/:/g, "");
  const bodyId = `sp-body-${uid}`;
  const headId = `sp-head-${uid}`;
  const glowId = `sp-glow-${uid}`;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 140 140"
      className={`sparrow sparrow--${state} ${className}`}
      role="img"
      aria-label={`${title}: ${state}`}
      data-state={state}
    >
      <defs>
        <linearGradient id={bodyId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--feather)" />
          <stop offset="100%" stopColor="#c9743a" />
        </linearGradient>
        <linearGradient id={headId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#ffc06a" />
          <stop offset="100%" stopColor="var(--feather)" />
        </linearGradient>
        <radialGradient id={glowId} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.35" />
          <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* ambient glow */}
      <circle cx="70" cy="74" r="62" fill={`url(#${glowId})`} className="sp-glow" />

      {/* celebration confetti */}
      {celebrate && (
        <g className="sp-confetti">
          <rect x="26" y="24" width="5" height="9" rx="2" fill="var(--accent)" />
          <rect x="108" y="30" width="5" height="9" rx="2" fill="var(--feather)" />
          <rect x="44" y="12" width="5" height="9" rx="2" fill="var(--success)" />
          <rect x="92" y="14" width="5" height="9" rx="2" fill="var(--accent)" />
          <circle cx="118" cy="56" r="3" fill="var(--success)" />
          <circle cx="20" cy="52" r="3" fill="var(--feather)" />
        </g>
      )}

      {/* thought bubble */}
      {showThought && (
        <g className="sp-thought" fill="var(--muted)">
          <circle cx="104" cy="34" r="3" />
          <circle cx="112" cy="26" r="4" />
          <circle cx="122" cy="17" r="5.5" />
        </g>
      )}
      {showQuestion && (
        <text
          x="108"
          y="34"
          className="sp-mark"
          fontSize="26"
          fontWeight="700"
          fill="var(--warning)"
          fontFamily="var(--font-display)"
        >
          ?
        </text>
      )}
      {showAlert && (
        <text
          x="110"
          y="34"
          className="sp-mark"
          fontSize="28"
          fontWeight="800"
          fill="var(--danger)"
          fontFamily="var(--font-display)"
        >
          !
        </text>
      )}

      <g className="sp-body-group">
        {/* tail */}
        <path
          d="M40 84 L18 74 Q14 82 20 90 L18 100 Q30 100 42 94 Z"
          fill="#b9682f"
        />
        {/* feet */}
        <g stroke="#e08a2e" strokeWidth="3.4" strokeLinecap="round">
          <path d="M62 108 L60 120 M62 108 L67 119" />
          <path d="M80 108 L80 120 M80 108 L85 119" />
        </g>
        {/* body */}
        <ellipse cx="70" cy="82" rx="34" ry="30" fill={`url(#${bodyId})`} />
        {/* belly */}
        <ellipse cx="72" cy="90" rx="20" ry="18" fill="#ffe6c2" opacity="0.92" />
        {/* wing */}
        <path
          className="sp-wing"
          d="M64 72 Q48 74 44 92 Q58 96 70 86 Q70 76 64 72 Z"
          fill="#a95f2b"
        />
        {/* head */}
        <circle cx="82" cy="52" r="26" fill={`url(#${headId})`} />
        {/* head tuft */}
        <path d="M78 27 Q82 18 90 24 Q84 26 83 31 Z" fill="#b9682f" />
        {/* cheek */}
        <circle cx="70" cy="60" r="5" fill="#ff9d7a" opacity="0.5" />
        {/* beak */}
        <path
          className={happy ? "sp-beak sp-beak--open" : "sp-beak"}
          d="M104 52 L124 57 L104 63 Z"
          fill="#f2932c"
        />
        {/* eye */}
        <g className="sp-eye">
          {happy ? (
            <path
              d="M86 46 q6 -7 12 0"
              stroke="#2a1a10"
              strokeWidth="3.4"
              strokeLinecap="round"
              fill="none"
            />
          ) : (
            <>
              <circle
                cx="92"
                cy="47"
                r={state === "warning" ? "6.5" : "5.4"}
                fill="#241a12"
                className={blink ? "sp-blink" : undefined}
              />
              <circle cx="93.6" cy="45.2" r="1.7" fill="#fff" />
            </>
          )}
        </g>
        {/* brow for confused / warning */}
        {(state === "confused" || state === "warning") && (
          <path
            d={state === "confused" ? "M84 37 l14 4" : "M84 36 l14 -1"}
            stroke="#7a4a20"
            strokeWidth="3"
            strokeLinecap="round"
          />
        )}
      </g>
    </svg>
  );
}
