import type { MetadataRoute } from "next";
import { categories, products } from "@/data/products";
import { site } from "@/config/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const u = (p: string) => `${site.url}${p}`;
  return [
    { url: u("/"), changeFrequency: "weekly", priority: 1 },
    { url: u("/shop"), changeFrequency: "weekly", priority: 0.9 },
    { url: u("/about"), changeFrequency: "monthly", priority: 0.6 },
    ...categories.map((c) => ({ url: u(`/collections/${c.slug}`), changeFrequency: "weekly" as const, priority: 0.8 })),
    ...products.map((p) => ({ url: u(`/product/${p.slug}`), changeFrequency: "weekly" as const, priority: 0.7 })),
  ];
}
