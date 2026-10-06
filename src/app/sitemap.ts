import type { MetadataRoute } from "next";
import { categories, products } from "@/data/products";
import { policies, site } from "@/config/site";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const u = (p: string) => `${site.url}${p}`;
  return [
    { url: u("/"), changeFrequency: "weekly", priority: 1 },
    { url: u("/shop"), changeFrequency: "weekly", priority: 0.9 },
    { url: u("/about"), changeFrequency: "monthly", priority: 0.6 },
    { url: u("/contact"), changeFrequency: "monthly", priority: 0.6 },
    ...policies
      .filter((p) => p.paragraphs.length > 0)
      .map((p) => ({ url: u(`/policies/${p.slug}`), changeFrequency: "yearly" as const, priority: 0.3 })),
    ...categories.map((c) => ({ url: u(`/collections/${c.slug}`), changeFrequency: "weekly" as const, priority: 0.8 })),
    ...products.map((p) => ({ url: u(`/product/${p.slug}`), changeFrequency: "weekly" as const, priority: 0.7 })),
  ];
}
