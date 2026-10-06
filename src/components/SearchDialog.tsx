"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useId, useRef, useState } from "react";
import { AnimatePresence, m } from "motion/react";
import { CloseIcon, SearchIcon } from "@/components/Icons";
import { Price } from "@/components/Price";
import { useFocusTrap } from "@/hooks/useFocusTrap";
import { categories, products } from "@/data/products";
import { matchesQuery } from "@/lib/filters";
import { img } from "@/lib/images";
import { ease } from "@/lib/motion";

const MAX = 6;

/** Header search: instant results as you type, Enter opens the full results in the shop. */
export function SearchDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  useFocusTrap(ref, open, onClose);
  return (
    <AnimatePresence>
      {open && (
        <>
          <m.div
            key="scrim"
            className="fixed inset-0 z-40 bg-[var(--scrim)]"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease }}
          />
          <m.div
            key="panel"
            ref={ref}
            role="dialog"
            aria-modal="true"
            aria-label="Search products"
            className="fixed inset-x-0 top-0 z-50 max-h-[100dvh] overflow-y-auto bg-surface pt-[env(safe-area-inset-top)] shadow-[var(--shadow)]"
            initial={{ y: "-100%" }}
            animate={{ y: 0 }}
            exit={{ y: "-100%" }}
            transition={{ duration: 0.45, ease }}
          >
            <SearchBody onClose={onClose} />
          </m.div>
        </>
      )}
    </AnimatePresence>
  );
}

function SearchBody({ onClose }: { onClose: () => void }) {
  const [q, setQ] = useState("");
  const router = useRouter();
  const id = useId();
  const term = q.trim();
  const results = term ? products.filter((p) => matchesQuery(p, term)) : [];

  return (
    <div className="wrap pb-8 pt-4">
      <form
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          onClose();
          router.push(term ? `/shop?q=${encodeURIComponent(term)}` : "/shop");
        }}
        className="flex items-center gap-2"
      >
        <label htmlFor={id} className="sr-only">
          Search products
        </label>
        <div className="relative flex-1">
          <SearchIcon
            width={22}
            height={22}
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted"
          />
          <input
            id={id}
            data-autofocus
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search mekhela sador, sarees, colours…"
            autoComplete="off"
            enterKeyHint="search"
            aria-describedby={`${id}-status`}
            className="h-14 w-full rounded-full border border-line bg-paper pl-13 pr-4 text-lg text-ink outline-none placeholder:text-muted/80 focus-visible:border-muga"
          />
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close search"
          className="grid size-12 shrink-0 place-items-center rounded-full text-muted hover:text-maroon"
        >
          <CloseIcon width={24} height={24} />
        </button>
      </form>

      <p id={`${id}-status`} className="sr-only" aria-live="polite">
        {term ? `${results.length} ${results.length === 1 ? "result" : "results"}` : ""}
      </p>

      {!term && (
        <div className="mt-6">
          <h2 className="text-sm font-semibold text-muted">Browse collections</h2>
          <ul className="mt-3 flex flex-wrap gap-2">
            {categories.map((c) => (
              <li key={c.slug}>
                <Link
                  href={`/collections/${c.slug}`}
                  onClick={onClose}
                  className="inline-flex h-11 items-center rounded-full px-4 font-medium shadow-[inset_0_0_0_1px_var(--line)] hover:text-maroon"
                >
                  {c.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      {term && results.length === 0 && (
        <p className="mt-8 text-muted">
          No pieces match “{term}”. Try a colour (“pink”), a fabric (“cotton”) or a collection (“handpainted”).
        </p>
      )}

      {results.length > 0 && (
        <>
          <ul className="mt-6 grid gap-x-6 gap-y-2 sm:grid-cols-2">
            {results.slice(0, MAX).map((p) => {
              const pic = img(p.images[0]);
              return (
                <li key={p.slug}>
                  <Link
                    href={`/product/${p.slug}`}
                    onClick={onClose}
                    className="grid grid-cols-[56px_1fr] items-center gap-4 rounded-lg p-2 transition-colors hover:bg-sunk"
                  >
                    <Image
                      src={pic.src}
                      alt=""
                      width={56}
                      height={70}
                      sizes="56px"
                      placeholder="blur"
                      blurDataURL={pic.blurDataURL}
                      className="aspect-[4/5] w-14 rounded-[3px] object-cover"
                    />
                    <span className="min-w-0">
                      <span className="block truncate font-semibold">{p.name}</span>
                      <Price value={p.price} className="text-sm" />
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
          <Link
            href={`/shop?q=${encodeURIComponent(term)}`}
            onClick={onClose}
            className="link-underline mt-5 inline-block font-medium text-maroon"
          >
            See all {results.length} {results.length === 1 ? "result" : "results"}
          </Link>
        </>
      )}
    </div>
  );
}
