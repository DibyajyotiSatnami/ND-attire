"use client";

import { m } from "motion/react";
import { ease } from "@/lib/motion";

type Props = {
  className?: string;
  /** "static" — always drawn. "view" — weaves in once when scrolled into view. "load" — weaves in on mount. */
  mode?: "static" | "view" | "load";
  delay?: number;
  height?: number;
};

/** The mekhela woven border motif. Used sparingly: header, hero frame, dividers, loading. */
export function WovenBand({ className = "", mode = "static", delay = 0, height = 18 }: Props) {
  const style = { height };
  if (mode === "static") return <div aria-hidden className={`weave ${className}`} style={style} />;
  const from = { clipPath: "inset(0 100% 0 0)" };
  const to = { clipPath: "inset(0 0% 0 0)" };
  const transition = { duration: 1.1, ease, delay };
  return mode === "view" ? (
    <m.div
      aria-hidden
      className={`weave ${className}`}
      style={style}
      initial={from}
      whileInView={to}
      viewport={{ once: true, margin: "0px 0px -10% 0px" }}
      transition={transition}
    />
  ) : (
    <m.div
      aria-hidden
      className={`weave ${className}`}
      style={style}
      initial={from}
      animate={to}
      transition={transition}
    />
  );
}

/** A short centred band used as a section divider. */
export function WeaveDivider({ className = "" }: { className?: string }) {
  return (
    <div className={`wrap ${className}`}>
      <WovenBand mode="view" height={14} className="mx-auto max-w-[216px]" />
    </div>
  );
}
