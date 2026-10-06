/**
 * Image loader for the static GitHub Pages build (see next.config.ts). Every
 * processed photo exists at 800 and 1600 px, so pick the smaller one when it is
 * wide enough and add the base path the site is served from.
 */
export default function loader({ src, width }: { src: string; width: number; quality?: number }) {
  const base = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
  const file = width <= 800 ? src.replace(/\/1600\.(webp|avif)$/, "/800.$1") : src;
  return `${base}${file}`;
}
