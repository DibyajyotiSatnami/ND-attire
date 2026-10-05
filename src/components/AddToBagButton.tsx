"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, m } from "motion/react";
import { CheckIcon, WhatsAppIcon } from "@/components/Icons";
import { addToBag, useBag } from "@/store/bag";
import { askPriceLink } from "@/lib/whatsapp";
import type { Product } from "@/data/products";

type Props = {
  product: Product;
  qty?: number;
  /** Element the thumbnail flies from. */
  flyFrom?: () => Element | null;
  className?: string;
  size?: "sm" | "lg";
  /** Solid WhatsApp style, for use over imagery. */
  solid?: boolean;
};

/** "Add to bag" for priced pieces, "Ask price" (WhatsApp) for price-on-request, disabled when sold out. */
export function ProductAction({ product, qty = 1, flyFrom, className = "", size = "sm", solid = false }: Props) {
  const inBag = useBag((s) => (s.items[product.slug] ?? 0) > 0);
  const [state, setState] = useState<"idle" | "added">("idle");
  const timer = useRef<number>(undefined);
  useEffect(() => () => window.clearTimeout(timer.current), []);
  const sz = size === "lg" ? "w-full" : "min-h-10 px-4 text-[0.95rem]";

  if (product.soldOut) {
    return (
      <button type="button" disabled className={`btn btn-plum ${sz} ${className}`}>
        Sold out
      </button>
    );
  }
  if (product.price === null) {
    return (
      <a
        href={askPriceLink(product)}
        target="_blank"
        rel="noopener"
        className={`btn ${solid ? "btn-wa-solid" : "btn-wa"} ${sz} ${className}`}
        aria-label={size === "sm" ? `Ask price of ${product.name} on WhatsApp` : undefined}
      >
        <WhatsAppIcon width={18} height={18} />
        {size === "lg" ? "Ask price on WhatsApp" : "Ask price"}
      </a>
    );
  }
  const label = state === "added" ? "Added to bag" : inBag ? "Add another" : "Add to bag";
  return (
    <button
      type="button"
      onClick={() => {
        addToBag(product.slug, qty, product.images[0], flyFrom?.() ?? null);
        setState("added");
        window.clearTimeout(timer.current);
        timer.current = window.setTimeout(() => setState("idle"), 1400);
      }}
      aria-label={size === "sm" ? `${label}: ${product.name}` : undefined}
      className={`btn ${state === "added" ? "bg-teal text-paper" : "btn-plum"} relative overflow-hidden ${sz} ${className}`}
    >
      <AnimatePresence mode="popLayout" initial={false}>
        <m.span
          key={label}
          className="inline-flex items-center gap-2"
          initial={{ y: "110%", opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: "-110%", opacity: 0 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        >
          {state === "added" && <CheckIcon width={18} height={18} />}
          {label}
        </m.span>
      </AnimatePresence>
      <span className="sr-only" aria-live="polite">
        {state === "added" ? `${product.name} added to bag` : ""}
      </span>
    </button>
  );
}
