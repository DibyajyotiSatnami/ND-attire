"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, m, useInView } from "motion/react";
import { ProductCard } from "@/components/ProductCard";
import { categories, isCategory, type CategorySlug, type Product } from "@/data/products";
import { ease, spring } from "@/lib/motion";
import { SORTS, sortProducts, type SortKey } from "@/lib/sort";

const setParam = (key: string, value: string | null) => {
  const url = new URL(window.location.href);
  if (value) url.searchParams.set(key, value);
  else url.searchParams.delete(key);
  // Next.js syncs native history updates with useSearchParams
  window.history.replaceState(null, "", url.pathname + url.search);
};

type Filter = { category: CategorySlug | "all"; sort: SortKey };

const readParams = (params: URLSearchParams): Filter => {
  const raw = params.get("category");
  const sortRaw = params.get("sort") as SortKey | null;
  return {
    category: isCategory(raw) ? raw : "all",
    sort: SORTS.some((s) => s.key === sortRaw) ? sortRaw! : "featured",
  };
};

/**
 * Reads ?category= and ?sort= after hydration. Kept in its own Suspense
 * boundary so the grid itself is server-rendered (useSearchParams would
 * otherwise turn the whole grid into a client-only render).
 */
function SyncParams({ onChange }: { onChange: (f: Filter) => void }) {
  const params = useSearchParams();
  useEffect(() => onChange(readParams(params)), [params, onChange]);
  return null;
}

/** Shop grid with category chips (synced to ?category=) and sort (?sort=). */
export function ShopGrid({ products }: { products: Product[] }) {
  const [{ category, sort }, setFilter] = useState<Filter>({ category: "all", sort: "featured" });
  const sync = useCallback(
    (f: Filter) => setFilter((cur) => (cur.category === f.category && cur.sort === f.sort ? cur : f)),
    [],
  );

  const list = useMemo(
    () => sortProducts(category === "all" ? products : products.filter((p) => p.category === category), sort),
    [products, category, sort],
  );

  return (
    <>
      <Suspense fallback={null}>
        <SyncParams onChange={sync} />
      </Suspense>
      <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
        <div
          role="group"
          aria-label="Filter by category"
          className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:flex-wrap md:px-0"
        >
          {[{ slug: "all", label: "All" } as const, ...categories].map((c) => {
            const on = c.slug === category;
            return (
              <button
                key={c.slug}
                type="button"
                aria-pressed={on}
                onClick={() => setParam("category", c.slug === "all" ? null : c.slug)}
                className={`relative h-10 shrink-0 rounded-full px-4 text-[0.95rem] font-medium transition-colors duration-300 ${
                  on ? "text-paper" : "text-ink shadow-[inset_0_0_0_1px_var(--line)] hover:text-plum"
                }`}
              >
                {on && (
                  <m.span
                    layoutId="chip-active"
                    className="absolute inset-0 rounded-full bg-plum"
                    transition={spring}
                  />
                )}
                <span className="relative">{c.label}</span>
              </button>
            );
          })}
        </div>
        <SortSelect value={sort} onChange={(v) => setParam("sort", v === "featured" ? null : v)} />
      </div>
      <p className="sr-only" aria-live="polite">
        {list.length} {list.length === 1 ? "piece" : "pieces"} shown
      </p>
      <Grid products={list} />
    </>
  );
}

/** A category page: fixed category, sort only. */
export function CollectionGrid({ products }: { products: Product[] }) {
  const [sort, setSort] = useState<SortKey>("featured");
  const list = useMemo(() => sortProducts(products, sort), [products, sort]);
  return (
    <>
      <div className="flex items-center justify-between gap-4">
        <p className="text-muted">
          {products.length} {products.length === 1 ? "piece" : "pieces"}
        </p>
        <SortSelect value={sort} onChange={setSort} />
      </div>
      <Grid products={list} />
    </>
  );
}

function SortSelect({ value, onChange }: { value: SortKey; onChange: (v: SortKey) => void }) {
  const onSelect = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => onChange(e.target.value as SortKey),
    [onChange],
  );
  return (
    <label className="flex shrink-0 items-center gap-3 text-[0.95rem]">
      <span className="text-muted">Sort</span>
      <span className="relative">
        <select
          value={value}
          onChange={onSelect}
          className="h-10 appearance-none rounded-full bg-transparent pl-4 pr-10 font-medium text-ink shadow-[inset_0_0_0_1px_var(--line)]"
        >
          {SORTS.map((s) => (
            <option key={s.key} value={s.key}>
              {s.label}
            </option>
          ))}
        </select>
        <svg
          aria-hidden
          viewBox="0 0 24 24"
          className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
        >
          <path d="m7 10 5 5 5-5" />
        </svg>
      </span>
    </label>
  );
}

// Cards start part-visible (not opacity 0) so the first row paints with the
// server HTML instead of waiting for JavaScript; the rise still reads as an entrance.
const item = {
  hidden: { opacity: 0.4, y: 36 },
  show: { opacity: 1, y: 0, transition: { duration: 0.8, ease } },
};

export function Grid({ products }: { products: Product[] }) {
  // An explicit animate label (not whileInView) so cards mounted later by a
  // filter change inherit "show" too.
  const ref = useRef<HTMLUListElement>(null);
  const seen = useInView(ref, { once: true, margin: "0px 0px -80px 0px" });
  return (
    <m.ul
      ref={ref}
      className="-mx-4 mt-8 grid grid-cols-2 gap-x-0.5 gap-y-10 sm:mx-0 sm:gap-x-6 sm:gap-y-14 md:grid-cols-3 xl:grid-cols-4"
      initial="hidden"
      animate={seen ? "show" : "hidden"}
      variants={{ show: { transition: { staggerChildren: 0.06 } } }}
    >
      <AnimatePresence mode="popLayout" initial={false}>
        {products.map((p, i) => (
          <m.li
            key={p.slug}
            layout
            variants={item}
            exit={{ opacity: 0, scale: 0.97, transition: { duration: 0.3, ease } }}
            transition={{ layout: spring }}
          >
            <ProductCard product={p} priority={i < 2} />
          </m.li>
        ))}
      </AnimatePresence>
    </m.ul>
  );
}
