"use client";

import { LazyMotion, MotionConfig } from "motion/react";
import { useEffect, type ReactNode } from "react";
import { useBag } from "@/store/bag";
import { spring } from "@/lib/motion";

const loadFeatures = () => import("@/lib/motion-features").then((mod) => mod.default);

export function Providers({ children }: { children: ReactNode }) {
  // the bag is persisted; load it after hydration so server and client HTML match
  useEffect(() => {
    useBag.persist.rehydrate();
  }, []);
  return (
    <LazyMotion features={loadFeatures} strict>
      <MotionConfig reducedMotion="user" transition={spring}>
        {children}
      </MotionConfig>
    </LazyMotion>
  );
}
