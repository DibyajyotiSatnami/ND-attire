"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { AnimatePresence, m, useInView } from "motion/react";
import { ProductCard } from "@/components/ProductCard";
import { CloseIcon, FilterIcon, SearchIcon, WhatsAppIcon } from "@/components/Icons";
import { categories, categoryLabel, type Product } from "@/data/products";
import { ease, spring } from "@/lib/motion";
import { SORTS, sortProducts, type SortKey } from "@/lib/sort";
import {
  EMPTY,
  PRICE_BANDS,
  activeCount,
  applyFilters,
  filterOptions,
  readFilters,
  writeFilters,
  type Filters,
} from "@/lib/filters";
import { waLink } from "@/lib/whatsapp";
import { site } from "@/config/site";

type Props = {
  products: Product[];
  /** On a collection page the category is fixed and its chips are hidden. */
  fixedCategory?: boolean;
};

/**
 * Reads the query string after hydration. Kept in its own Suspense boundary so
 * the grid itself is server-rendered (useSearchParams would otherwise turn the
 * whole grid into a client-only render).
 */
function SyncParams({ onChange }: { onChange: (f: Filters) => void }) {
  const params = useSearchParams();
  useEffect(() => onChange(readFilters(params)), [params, onChange]);
  return null;
}

const toggle = (list: string[], v: string) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);

/** Product grid with search, category chips, colour / size / price / availability filters and sort, all in the URL. */
export function ShopGrid({ products, fixedCategory = false }: Props) {
  const [f, setF] = useState<Filters>(EMPTY);
  const [panel, setPanel] = useState(false);
  const sync = useCallback(
    (next: Filters) => {
      if (fixedCategory) next = { ...next, category: "all" };
      setF((cur) => (writeFilters(cur) === writeFilters(next) ? cur : next));
    },
    [fixedCategory],
  );

  const update = (patch: Partial<Filters>) => {
    const next = { ...f, ...patch };
    setF(next);
    // Next.js syncs native history updates with useSearchParams
    window.history.replaceState(null, "", window.location.pathname + writeFilters(next, fixedCategory));
  };

  const options = useMemo(() => filterOptions(products), [products]);
  const list = useMemo(() => sortProducts(applyFilters(products, f), f.sort), [products, f]);
  const active = activeCount(f);
  const any = active > 0 || f.q.trim() !== "" || f.category !== "all";
  const clear = () => update({ ...EMPTY, sort: f.sort });

  return (
    <>
      <Suspense fallback={null}>
        <SyncParams onChange={sync} />
      </Suspense>

      <SearchField value={f.q} onChange={(q) => update({ q })} />

      {!fixedCategory && (
        <div
          role="group"
          aria-label="Filter by category"
          className="no-scrollbar -mx-4 mt-5 flex gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:flex-wrap md:px-0"
        >
          {[{ slug: "all", label: "All" } as const, ...categories].map((c) => {
            const on = c.slug === f.category;
            return (
              <button
                key={c.slug}
                type="button"
                aria-pressed={on}
                onClick={() => update({ category: c.slug })}
                className={`relative h-11 shrink-0 rounded-full px-4 text-[0.95rem] font-medium transition-colors duration-300 ${
                  on ? "text-paper" : "text-ink shadow-[inset_0_0_0_1px_var(--line)] hover:text-maroon"
                }`}
              >
                {on && (
                  <m.span
                    layoutId="chip-active"
                    className="absolute inset-0 rounded-full bg-maroon"
                    transition={spring}
                  />
                )}
                <span className="relative">{c.label}</span>
              </button>
            );
          })}
        </div>
      )}

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-y border-line py-3">
        <button
          type="button"
          aria-expanded={panel}
          aria-controls="filter-panel"
          onClick={() => setPanel((v) => !v)}
          className="inline-flex h-11 items-center gap-2 rounded-full px-4 font-medium shadow-[inset_0_0_0_1px_var(--line)] transition-colors hover:text-maroon"
        >
          <FilterIcon width={18} height={18} />
          Filters
          {active > 0 && (
            <span className="inline-grid h-6 min-w-6 place-items-center rounded-full bg-maroon px-1.5 text-xs font-semibold text-paper">
              {active}
            </span>
          )}
        </button>
        <p className="order-last w-full text-sm text-muted sm:order-none sm:w-auto" aria-live="polite">
          {list.length} {list.length === 1 ? "piece" : "pieces"}
        </p>
        <SortSelect value={f.sort} onChange={(sort) => update({ sort })} />
      </div>

      <AnimatePresence initial={false}>
        {panel && (
          <m.div
            id="filter-panel"
            key="panel"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.4, ease }}
            className="overflow-hidden"
          >
            <div className="grid gap-7 border-b border-line py-6 md:grid-cols-2 lg:grid-cols-4">
              {options.colours.length > 1 && (
                <FilterGroup title="Colour">
                  {options.colours.map((c) => (
                    <Chip
                      key={c.name}
                      on={f.colours.includes(c.name)}
                      onClick={() => update({ colours: toggle(f.colours, c.name) })}
                    >
                      <span
                        aria-hidden
                        className="size-4 rounded-full shadow-[inset_0_0_0_1px_rgb(0_0_0/0.18)]"
                        style={{ background: c.swatch }}
                      />
                      {c.name}
                    </Chip>
                  ))}
                </FilterGroup>
              )}
              {options.prices.length > 1 && (
                <FilterGroup title="Price">
                  {options.prices.map((b) => (
                    <Chip
                      key={b.key}
                      on={f.price === b.key}
                      onClick={() => update({ price: f.price === b.key ? null : b.key })}
                    >
                      {b.label}
                    </Chip>
                  ))}
                </FilterGroup>
              )}
              {options.sizes.length > 0 && (
                <FilterGroup title="Size">
                  {options.sizes.map((s) => (
                    <Chip key={s} on={f.sizes.includes(s)} onClick={() => update({ sizes: toggle(f.sizes, s) })}>
                      {s}
                    </Chip>
                  ))}
                </FilterGroup>
              )}
              {options.hasSoldOut && (
                <FilterGroup title="Availability">
                  <Chip on={f.available} onClick={() => update({ available: !f.available })}>
                    Available only
                  </Chip>
                </FilterGroup>
              )}
            </div>
          </m.div>
        )}
      </AnimatePresence>

      {any && (
        <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
          {f.q.trim() && <ActiveTag onRemove={() => update({ q: "" })}>“{f.q.trim()}”</ActiveTag>}
          {!fixedCategory && f.category !== "all" && (
            <ActiveTag onRemove={() => update({ category: "all" })}>{categoryLabel(f.category)}</ActiveTag>
          )}
          {f.colours.map((c) => (
            <ActiveTag key={c} onRemove={() => update({ colours: toggle(f.colours, c) })}>
              {c}
            </ActiveTag>
          ))}
          {f.sizes.map((s) => (
            <ActiveTag key={s} onRemove={() => update({ sizes: toggle(f.sizes, s) })}>
              Size {s}
            </ActiveTag>
          ))}
          {f.price && (
            <ActiveTag onRemove={() => update({ price: null })}>
              {PRICE_BANDS.find((b) => b.key === f.price)!.label}
            </ActiveTag>
          )}
          {f.available && <ActiveTag onRemove={() => update({ available: false })}>Available only</ActiveTag>}
          <button type="button" onClick={clear} className="link-underline ml-1 min-h-9 font-medium text-maroon">
            Clear all
          </button>
        </div>
      )}

      {list.length === 0 ? (
        <div className="mx-auto max-w-md py-20 text-center">
          <p className="display text-xl text-maroon">No pieces match</p>
          <p className="mt-3 text-muted">
            {f.q.trim() ? `Nothing found for “${f.q.trim()}”` : "Nothing fits these filters"}. Try fewer filters, or ask
            us on WhatsApp: we may have it in the studio.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <button type="button" onClick={clear} className="btn btn-maroon">
              Clear filters
            </button>
            <a
              href={waLink(
                `Hi ${site.name}, I'm looking for ${f.q.trim() ? `“${f.q.trim()}”` : "a piece"}. Do you have something like this?`,
              )}
              target="_blank"
              rel="noopener"
              className="btn btn-wa"
            >
              <WhatsAppIcon /> Ask on WhatsApp
            </a>
          </div>
        </div>
      ) : (
        <Grid products={list} />
      )}
    </>
  );
}

function SearchField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const id = useId();
  return (
    <form role="search" onSubmit={(e) => e.preventDefault()} className="relative">
      <label htmlFor={id} className="sr-only">
        Search products
      </label>
      <SearchIcon
        width={20}
        height={20}
        className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted"
      />
      <input
        id={id}
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search by name, colour or fabric"
        autoComplete="off"
        enterKeyHint="search"
        className="h-12 w-full rounded-full border border-line bg-surface pl-12 pr-4 text-base text-ink outline-none transition-colors placeholder:text-muted/80 focus-visible:border-muga"
      />
    </form>
  );
}

function FilterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset>
      <legend className="mb-3 font-semibold">{title}</legend>
      <div className="flex flex-wrap gap-2">{children}</div>
    </fieldset>
  );
}

function Chip({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      className={`inline-flex h-10 items-center gap-2 rounded-full px-3.5 text-[0.95rem] transition-colors duration-300 ${
        on ? "bg-maroon text-paper" : "shadow-[inset_0_0_0_1px_var(--line)] hover:text-maroon"
      }`}
    >
      {children}
    </button>
  );
}

function ActiveTag({ children, onRemove }: { children: React.ReactNode; onRemove: () => void }) {
  return (
    <span className="inline-flex h-9 items-center gap-1 rounded-full bg-sunk pl-3 pr-1">
      {children}
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove filter: ${typeof children === "string" ? children : "search"}`}
        className="grid size-7 place-items-center rounded-full text-muted hover:text-maroon"
      >
        <CloseIcon width={14} height={14} />
      </button>
    </span>
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
