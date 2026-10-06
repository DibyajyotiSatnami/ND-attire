"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, m } from "motion/react";
import { CheckIcon } from "@/components/Icons";
import { addToBag, useBag, lineKey, type Variant } from "@/store/bag";
import { isSoldOut, needsChoice, type Product } from "@/data/products";

/** The variant used when the customer has nothing to choose. */
export const defaultVariant = (p: Product): Variant => ({
  colour: p.colours.length === 1 ? p.colours[0].name : null,
  size: p.sizes?.length === 1 ? p.sizes[0] : null,
});

type CardProps = {
  product: Product;
  /** Element the thumbnail flies from. */
  flyFrom?: () => Element | null;
  className?: string;
  /** Solid style, for use over imagery. */
  solid?: boolean;
};

/** Product card action: "Add to bag", "Choose options" when a colour or size must be picked, or "Sold out". */
export function ProductAction({ product, flyFrom, className = "", solid = false }: CardProps) {
  const sz = "min-h-10 px-4 text-[0.95rem]";
  if (isSoldOut(product)) {
    return (
      <button type="button" disabled className={`btn btn-maroon ${sz} ${className}`}>
        Sold out
      </button>
    );
  }
  if (needsChoice(product)) {
    return (
      <Link
        href={`/product/${product.slug}`}
        className={`btn ${solid ? "btn-maroon" : "btn-ghost"} ${sz} ${className}`}
        aria-label={`Choose options for ${product.name}`}
      >
        Choose options
      </Link>
    );
  }
  return (
    <AddButton
      product={product}
      variant={defaultVariant(product)}
      qty={1}
      flyFrom={flyFrom}
      className={`${sz} ${className}`}
      compact
    />
  );
}

type AddProps = {
  product: Product;
  variant: Variant;
  qty: number;
  flyFrom?: () => Element | null;
  className?: string;
  /** Card size: the accessible name includes the product. */
  compact?: boolean;
  /** Run before adding; return false to stop (e.g. a required choice is missing). */
  validate?: () => boolean;
};

export function AddButton({ product, variant, qty, flyFrom, className = "", compact, validate }: AddProps) {
  const inBag = useBag((s) => (s.items[lineKey(product.slug, variant)] ?? 0) > 0);
  const [state, setState] = useState<"idle" | "added">("idle");
  const timer = useRef<number>(undefined);
  useEffect(() => () => window.clearTimeout(timer.current), []);
  const image = product.colours.find((c) => c.name === variant.colour)?.image ?? product.images[0];

  const label = state === "added" ? "Added to bag" : inBag ? "Add another" : "Add to bag";
  return (
    <button
      type="button"
      onClick={() => {
        if (validate && !validate()) return;
        addToBag(product.slug, variant, qty, image, flyFrom?.() ?? null);
        setState("added");
        window.clearTimeout(timer.current);
        timer.current = window.setTimeout(() => setState("idle"), 1400);
      }}
      aria-label={compact ? `${label}: ${product.name}` : undefined}
      className={`btn ${state === "added" ? "bg-tea text-paper" : "btn-maroon"} relative overflow-hidden ${className}`}
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
