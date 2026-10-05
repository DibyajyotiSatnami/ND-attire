import type { Transition } from "motion/react";

/** Soft, weighted UI spring — fabric settling, not a bounce. */
export const spring: Transition = { type: "spring", stiffness: 120, damping: 20, mass: 0.9 };

/** Easing for reveals. */
export const ease = [0.22, 1, 0.36, 1] as const;

export const reveal: Transition = { duration: 0.8, ease };
