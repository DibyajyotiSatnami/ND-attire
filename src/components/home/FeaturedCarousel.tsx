"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { m } from "motion/react";
import { ProductCard } from "@/components/ProductCard";
import { ChevronIcon } from "@/components/Icons";
import type { Product } from "@/data/products";
import { ease } from "@/lib/motion";

export function FeaturedCarousel({ products }: { products: Product[] }) {
  const track = useRef<HTMLUListElement>(null);
  const [edge, setEdge] = useState({ start: true, end: false });

  useEffect(() => {
    const el = track.current;
    if (!el) return;
    const update = () =>
      setEdge({ start: el.scrollLeft < 8, end: el.scrollLeft + el.clientWidth > el.scrollWidth - 8 });
    update();
    el.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      el.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  const page = (dir: 1 | -1) => {
    const el = track.current;
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollBy({ left: dir * el.clientWidth * 0.8, behavior: reduce ? "auto" : "smooth" });
  };

  return (
    <section aria-labelledby="featured-title" className="pb-16 pt-6 lg:pb-24 lg:pt-12">
      <div className="wrap flex items-end justify-between gap-6">
        <div>
          <h2 id="featured-title" className="display text-2xl text-plum md:text-3xl">
            The handpainted collection
          </h2>
          <p className="measure mt-3 text-muted">
            Every motif starts as a brushstroke on plain fabric, so no two pieces are exactly alike. Handpainted designs
            are priced on request.
          </p>
        </div>
        <div className="hidden shrink-0 items-center gap-2 md:flex">
          <button
            type="button"
            onClick={() => page(-1)}
            disabled={edge.start}
            aria-label="Previous pieces"
            className="grid size-11 place-items-center rounded-full text-plum shadow-[inset_0_0_0_1px_var(--line)] transition-opacity hover:bg-plum/5 disabled:opacity-35"
          >
            <ChevronIcon className="rotate-180" />
          </button>
          <button
            type="button"
            onClick={() => page(1)}
            disabled={edge.end}
            aria-label="Next pieces"
            className="grid size-11 place-items-center rounded-full text-plum shadow-[inset_0_0_0_1px_var(--line)] transition-opacity hover:bg-plum/5 disabled:opacity-35"
          >
            <ChevronIcon />
          </button>
        </div>
      </div>

      <m.ul
        ref={track}
        aria-label="Handpainted pieces"
        className="no-scrollbar mt-10 flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-px-4 px-4 pb-2 sm:scroll-px-8 sm:gap-6 sm:px-8 xl:scroll-px-[max(48px,calc((100vw-1320px)/2+48px))] xl:px-[max(48px,calc((100vw-1320px)/2+48px))]"
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "0px 0px -80px 0px" }}
        variants={{ show: { transition: { staggerChildren: 0.08 } } }}
      >
        {products.map((p) => (
          <m.li
            key={p.slug}
            className="w-[72vw] max-w-[340px] shrink-0 snap-start sm:w-[44vw] lg:w-[30vw]"
            variants={{
              hidden: { opacity: 0, x: 40 },
              show: { opacity: 1, x: 0, transition: { duration: 0.9, ease } },
            }}
          >
            <ProductCard product={p} sizes="(min-width: 1024px) 340px, (min-width: 640px) 44vw, 72vw" />
          </m.li>
        ))}
      </m.ul>

      <div className="wrap mt-8">
        <Link href="/collections/handpainted" className="link-underline font-medium text-plum">
          See all handpainted pieces
        </Link>
      </div>
    </section>
  );
}
