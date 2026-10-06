"use client";

import { create } from "zustand";
import { createJSONStorage, persist, type StateStorage } from "zustand/middleware";
import { getProduct, movedProducts } from "@/data/products";

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

/** A bag line is one product in one colour and size. */
export type Variant = { colour: string | null; size: string | null };

const SEP = "|";
export const lineKey = (slug: string, v: Variant) => [slug, v.colour ?? "", v.size ?? ""].join(SEP);
export const parseKey = (key: string) => {
  const [slug, colour, size] = key.split(SEP);
  return { slug, colour: colour || null, size: size || null };
};

/** In stock, and the colour / size (if any) is one the product offers. */
export function orderable(slug: string, v: Variant) {
  const p = getProduct(slug);
  if (!p || p.soldOut) return false;
  if (p.colours.length > 1 || v.colour) {
    const c = p.colours.find((x) => x.name === v.colour);
    if (!c || c.soldOut) return false;
  }
  if ((p.sizes?.length ?? 0) > 1 || v.size) {
    if (!v.size || !p.sizes?.includes(v.size)) return false;
  }
  return true;
}

type BagState = {
  /** line key → quantity */
  items: Record<string, number>;
  customer: { name: string; address: string };
  open: boolean;
  /** Bumped when an added item lands in the bag, so the count can spring. */
  bump: number;
  bumpCount: () => void;
  add: (slug: string, v: Variant, qty?: number) => void;
  setQty: (key: string, qty: number) => void;
  remove: (key: string) => void;
  clear: () => void;
  setCustomer: (c: Partial<BagState["customer"]>) => void;
  setOpen: (open: boolean) => void;
};

const validKey = (key: string) => {
  const { slug, ...v } = parseKey(key);
  return orderable(slug, v);
};

export const useBag = create<BagState>()(
  persist(
    (set) => ({
      items: {},
      customer: { name: "", address: "" },
      open: false,
      bump: 0,
      add: (slug, v, qty = 1) =>
        set((s) => {
          if (!orderable(slug, v)) return s;
          const key = lineKey(slug, v);
          return { items: { ...s.items, [key]: Math.min(99, (s.items[key] ?? 0) + qty) } };
        }),
      setQty: (key, qty) =>
        set((s) => {
          const items = { ...s.items };
          if (qty <= 0) delete items[key];
          else items[key] = Math.min(99, qty);
          return { items };
        }),
      remove: (key) =>
        set((s) => {
          const items = { ...s.items };
          delete items[key];
          return { items };
        }),
      clear: () => set({ items: {} }),
      setCustomer: (c) => set((s) => ({ customer: { ...s.customer, ...c } })),
      setOpen: (open) => set({ open }),
      bumpCount: () => set((s) => ({ bump: s.bump + 1 })),
    }),
    {
      name: "nd-bag",
      version: 2,
      storage: createJSONStorage(() => safeStorage),
      partialize: (s) => ({ items: s.items, customer: s.customer }),
      // v1 keyed lines by slug alone; the single colour (if any) fills in
      migrate: (persisted, version) => {
        const p = (persisted ?? {}) as Partial<BagState>;
        if (version < 2 && p.items) {
          p.items = Object.fromEntries(
            Object.entries(p.items).map(([slug, q]) => {
              const moved = movedProducts[slug];
              if (moved) return [lineKey(moved.slug, { colour: moved.colour, size: null }), q];
              const only = getProduct(slug)?.colours;
              return [lineKey(slug, { colour: only?.length === 1 ? only[0].name : null, size: null }), q];
            }),
          );
        }
        return p as BagState;
      },
      // drop anything no longer orderable (sold out, colour removed, product removed)
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<BagState>;
        const items = Object.fromEntries(
          Object.entries(p.items ?? {}).filter(([key, q]) => typeof q === "number" && q > 0 && validKey(key)),
        );
        return { ...current, items, customer: { ...current.customer, ...p.customer } };
      },
      skipHydration: true,
    },
  ),
);

export type BagLine = {
  key: string;
  slug: string;
  qty: number;
  name: string;
  price: number | null;
  image: string;
  colour: string | null;
  size: string | null;
};

export const selectLines = (items: Record<string, number>): BagLine[] =>
  Object.entries(items).flatMap(([key, qty]) => {
    const { slug, colour, size } = parseKey(key);
    const p = getProduct(slug);
    if (!p) return [];
    const image = p.colours.find((c) => c.name === colour)?.image ?? p.images[0];
    return [{ key, slug, qty, name: p.name, price: p.price, image, colour, size }];
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
export function addToBag(slug: string, v: Variant, qty: number, image: string, fromEl: Element | null) {
  if (!orderable(slug, v)) return;
  useBag.getState().add(slug, v, qty);
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const target = document.querySelector("[data-bag-target]");
  if (reduce || !fromEl || !target) {
    useBag.getState().bumpCount();
    return;
  }
  const r = fromEl.getBoundingClientRect();
  useFly.getState().launch({ image, from: { x: r.left, y: r.top, w: r.width, h: r.height } });
}
