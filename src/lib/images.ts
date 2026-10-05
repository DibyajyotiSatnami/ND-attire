import meta from "@/data/image-meta.json";

export type ImageMeta = { src: string; width: number; height: number; blurDataURL: string };

const all = meta as Record<string, ImageMeta>;

/** Look up a processed image by key, e.g. "products/hp-lavender" or "brand/founder-studio". */
export function img(key: string): ImageMeta {
  const m = all[key];
  if (!m) throw new Error(`Missing image "${key}". Run: npm run images`);
  return m;
}
