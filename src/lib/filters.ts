import { categoryLabel, isCategory, isSoldOut, type CategorySlug, type Product } from "@/data/products";
import { SORTS, type SortKey } from "@/lib/sort";

export const PRICE_BANDS = [
  { key: "under-1000", label: "Under ₹1,000", test: (n: number | null) => n !== null && n < 1000 },
  { key: "1000-1500", label: "₹1,000 – ₹1,500", test: (n: number | null) => n !== null && n >= 1000 && n <= 1500 },
  { key: "over-1500", label: "Over ₹1,500", test: (n: number | null) => n !== null && n > 1500 },
  { key: "on-request", label: "Price on request", test: (n: number | null) => n === null },
] as const;
export type PriceBand = (typeof PRICE_BANDS)[number]["key"];

export type Filters = {
  q: string;
  category: CategorySlug | "all";
  colours: string[];
  sizes: string[];
  price: PriceBand | null;
  available: boolean;
  sort: SortKey;
};

export const EMPTY: Filters = {
  q: "",
  category: "all",
  colours: [],
  sizes: [],
  price: null,
  available: false,
  sort: "featured",
};

const list = (v: string | null) => (v ? v.split(",").filter(Boolean) : []);

export function readFilters(params: URLSearchParams): Filters {
  const category = params.get("category");
  const sort = params.get("sort") as SortKey | null;
  const price = params.get("price") as PriceBand | null;
  return {
    q: params.get("q") ?? "",
    category: isCategory(category) ? category : "all",
    colours: list(params.get("colour")),
    sizes: list(params.get("size")),
    price: PRICE_BANDS.some((b) => b.key === price) ? price : null,
    available: params.get("available") === "1",
    sort: SORTS.some((s) => s.key === sort) ? sort! : "featured",
  };
}

/** Filters → query string (defaults left out). */
export function writeFilters(f: Filters, fixedCategory?: boolean) {
  const p = new URLSearchParams();
  if (f.q.trim()) p.set("q", f.q.trim());
  if (!fixedCategory && f.category !== "all") p.set("category", f.category);
  if (f.colours.length) p.set("colour", f.colours.join(","));
  if (f.sizes.length) p.set("size", f.sizes.join(","));
  if (f.price) p.set("price", f.price);
  if (f.available) p.set("available", "1");
  if (f.sort !== "featured") p.set("sort", f.sort);
  const s = p.toString();
  return s ? `?${s}` : "";
}

/** Words a search can match: name, description, collection, colours, sizes and fabric. */
export const haystack = (p: Product) =>
  [
    p.name,
    p.description,
    categoryLabel(p.category),
    ...p.colours.flatMap((c) => [c.name, c.family]),
    ...(p.sizes ?? []),
    p.details?.fabric ?? "",
  ]
    .join(" ")
    .toLowerCase();

/** Every word typed must appear somewhere ("blue cotton" finds blue cotton pieces). */
export function matchesQuery(p: Product, q: string) {
  const words = q.toLowerCase().split(/\s+/).filter(Boolean);
  if (!words.length) return true;
  const h = haystack(p);
  return words.every((w) => h.includes(w));
}

export function applyFilters(products: Product[], f: Filters) {
  return products.filter((p) => {
    if (f.category !== "all" && p.category !== f.category) return false;
    if (!matchesQuery(p, f.q)) return false;
    if (f.colours.length && !p.colours.some((c) => f.colours.includes(c.family) && (!f.available || !c.soldOut)))
      return false;
    if (f.sizes.length && !p.sizes?.some((s) => f.sizes.includes(s))) return false;
    if (f.price && !PRICE_BANDS.find((b) => b.key === f.price)!.test(p.price)) return false;
    if (f.available && isSoldOut(p)) return false;
    return true;
  });
}

/** Swatches for the colour filter's shade families. Unlisted families use their first shade. */
const FAMILY_SWATCH: Record<string, string> = {
  Red: "#c0102a",
  Pink: "#d6408f",
  Purple: "#6b3fa6",
  Blue: "#1f4fbf",
  Green: "#2f9a5a",
  Orange: "#c86a52",
  White: "#f4efe6",
};

/** Filter options that exist in this set of products, so no filter ever leads nowhere by itself. */
export function filterOptions(products: Product[]) {
  const colours = new Map<string, string>();
  for (const p of products)
    for (const c of p.colours) if (!colours.has(c.family)) colours.set(c.family, FAMILY_SWATCH[c.family] ?? c.swatch);
  const sizes = [...new Set(products.flatMap((p) => p.sizes ?? []))];
  return {
    colours: [...colours].map(([name, swatch]) => ({ name, swatch })).sort((a, b) => a.name.localeCompare(b.name)),
    sizes,
    prices: PRICE_BANDS.filter((b) => products.some((p) => b.test(p.price))),
    hasSoldOut: products.some((p) => isSoldOut(p) || p.colours.some((c) => c.soldOut)),
  };
}

/** How many refinements are on (search and sort not counted). */
export const activeCount = (f: Filters) =>
  f.colours.length + f.sizes.length + (f.price ? 1 : 0) + (f.available ? 1 : 0);
