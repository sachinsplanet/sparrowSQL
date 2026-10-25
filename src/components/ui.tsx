import { motion } from "motion/react";
import { usePrefersReducedMotion } from "../hooks/usePrefersReducedMotion";
import type { ReactNode } from "react";

/** Scroll-reveal wrapper. Collapses to instant under reduced motion. */
export function Reveal({
  children,
  delay = 0,
  y = 26,
  className = "",
  once = true,
}: {
  children: ReactNode;
  delay?: number;
  y?: number;
  className?: string;
  once?: boolean;
}) {
  const reduce = usePrefersReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduce ? false : { opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once, amount: 0.25 }}
      transition={{
        duration: 0.65,
        delay,
        ease: [0.16, 1, 0.3, 1],
      }}
    >
      {children}
    </motion.div>
  );
}

/** Small uppercase badge pill used sparingly above section headlines. */
export function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full bg-surface-2 px-3 py-1 font-sans text-[12px] font-semibold uppercase tracking-[0.96px] text-ink">
      {children}
    </span>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  lede,
  align = "left",
}: {
  eyebrow?: string;
  title: ReactNode;
  lede?: ReactNode;
  align?: "left" | "center";
}) {
  return (
    <div
      className={`flex flex-col gap-4 ${
        align === "center" ? "items-center text-center" : "items-start"
      }`}
    >
      {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
      <h2 className="font-display text-[32px] font-light leading-[1.08] tracking-[-0.02em] text-balance text-ink sm:text-[40px] md:text-[48px]">
        {title}
      </h2>
      {lede && (
        <p
          className={`max-w-[62ch] font-sans text-[16px] font-normal leading-[1.55] tracking-[0.15px] text-muted md:text-[18px] ${
            align === "center" ? "mx-auto" : ""
          }`}
        >
          {lede}
        </p>
      )}
    </div>
  );
}
