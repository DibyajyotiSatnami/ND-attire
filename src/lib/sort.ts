import type { Product } from "@/data/products";

export type SortKey = "featured" | "price-asc" | "price-desc";
export const SORTS: { key: SortKey; label: string }[] = [
  { key: "featured", label: "Featured" },
  { key: "price-asc", label: "Price: low to high" },
  { key: "price-desc", label: "Price: high to low" },
];

export function sortProducts(list: Product[], sort: SortKey) {
  const byPrice = (dir: 1 | -1) => (a: Product, b: Product) => {
    if (a.price === null && b.price === null) return 0;
    if (a.price === null) return 1; // price on request goes last
    if (b.price === null) return -1;
    return (a.price - b.price) * dir;
  };
  const copy = [...list];
  if (sort === "price-asc") return copy.sort(byPrice(1));
  if (sort === "price-desc") return copy.sort(byPrice(-1));
  // featured first, then sold out last, otherwise catalogue order
  return copy.sort((a, b) => Number(b.featured) - Number(a.featured) || Number(a.soldOut) - Number(b.soldOut));
}
