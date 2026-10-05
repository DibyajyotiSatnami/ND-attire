"use client";

import { create } from "zustand";
import { createJSONStorage, persist, type StateStorage } from "zustand/middleware";
import { getProduct } from "@/data/products";

/** localStorage that never throws (private mode, blocked storage, SSR). */
const safeStorage: StateStorage = {
  getItem: (k) => {
    try {
      return localStorage.getItem(k);
    } catch {
      return null;
    }
  },
  setItem: (k, v) => {
    try {
      localStorage.setItem(k, v);
    } catch {}
  },
  removeItem: (k) => {
    try {
      localStorage.removeItem(k);
    } catch {}
  },
};

type BagState = {
  items: Record<string, number>;
  customer: { name: string; address: string };
  open: boolean;
  /** Bumped when an added item lands in the bag, so the count can spring. */
  bump: number;
  bumpCount: () => void;
  add: (slug: string, qty?: number) => void;
  setQty: (slug: string, qty: number) => void;
  remove: (slug: string) => void;
  clear: () => void;
  setCustomer: (c: Partial<BagState["customer"]>) => void;
  setOpen: (open: boolean) => void;
};

/** Only priced, in-stock products can sit in the bag. */
const orderable = (slug: string) => {
  const p = getProduct(slug);
  return !!p && p.price !== null && !p.soldOut;
};

export const useBag = create<BagState>()(
  persist(
    (set) => ({
      items: {},
      customer: { name: "", address: "" },
      open: false,
      bump: 0,
      add: (slug, qty = 1) =>
        set((s) => (orderable(slug) ? { items: { ...s.items, [slug]: Math.min(99, (s.items[slug] ?? 0) + qty) } } : s)),
      setQty: (slug, qty) =>
        set((s) => {
          const items = { ...s.items };
          if (qty <= 0) delete items[slug];
          else items[slug] = Math.min(99, qty);
          return { items };
        }),
      remove: (slug) =>
        set((s) => {
          const items = { ...s.items };
          delete items[slug];
          return { items };
        }),
      clear: () => set({ items: {} }),
      setCustomer: (c) => set((s) => ({ customer: { ...s.customer, ...c } })),
      setOpen: (open) => set({ open }),
      bumpCount: () => set((s) => ({ bump: s.bump + 1 })),
    }),
    {
      name: "nd-bag",
      version: 1,
      storage: createJSONStorage(() => safeStorage),
      partialize: (s) => ({ items: s.items, customer: s.customer }),
      // drop anything no longer orderable (price changed, sold out, removed)
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<BagState>;
        const items = Object.fromEntries(Object.entries(p.items ?? {}).filter(([slug, q]) => orderable(slug) && q > 0));
        return { ...current, items, customer: { ...current.customer, ...p.customer } };
      },
      skipHydration: true,
    },
  ),
);

export type BagLine = { slug: string; qty: number; name: string; price: number; image: string };

export const selectLines = (items: Record<string, number>): BagLine[] =>
  Object.entries(items).flatMap(([slug, qty]) => {
    const p = getProduct(slug);
    return p && p.price !== null ? [{ slug, qty, name: p.name, price: p.price, image: p.images[0] }] : [];
  });

export const selectCount = (items: Record<string, number>) => Object.values(items).reduce((a, b) => a + b, 0);

/* ---------------------------------------------------------------- fly to bag */
export type Flight = { id: number; image: string; from: { x: number; y: number; w: number; h: number } };
type FlyState = { flights: Flight[]; launch: (f: Omit<Flight, "id">) => void; land: (id: number) => void };

let flightId = 0;
export const useFly = create<FlyState>((set) => ({
  flights: [],
  launch: (f) => set((s) => ({ flights: [...s.flights, { ...f, id: ++flightId }] })),
  land: (id) => {
    set((s) => ({ flights: s.flights.filter((f) => f.id !== id) }));
    useBag.getState().bumpCount();
  },
}));

/** Add to bag, flying a thumbnail from `fromEl` (the product image) to the bag icon. */
export function addToBag(slug: string, qty: number, image: string, fromEl: Element | null) {
  useBag.getState().add(slug, qty);
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const target = document.querySelector("[data-bag-target]");
  if (reduce || !fromEl || !target) {
    useBag.getState().bumpCount();
    return;
  }
  const r = fromEl.getBoundingClientRect();
  useFly.getState().launch({ image, from: { x: r.left, y: r.top, w: r.width, h: r.height } });
}
