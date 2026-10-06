import Image from "next/image";
import Link from "next/link";
import { WovenBand } from "@/components/WovenBand";
import { categories, getProduct, productsIn } from "@/data/products";
import { img } from "@/lib/images";

/** Edit these to feature a different collection or image. */
const FEATURE = {
  category: "handpainted",
  image: "hp-blue-floral",
  title: "The handpainted collection",
  body: "Every motif starts as a brushstroke on plain fabric, so no two pieces are exactly alike. Lotus clusters, garden florals and roses, painted onto mekhela sador and sarees. Handpainted designs are priced on request.",
} as const;

export function FeaturedCollection() {
  const c = categories.find((x) => x.slug === FEATURE.category)!;
  const p = getProduct(FEATURE.image)!;
  const pic = img(p.images[0]);
  const n = productsIn(c.slug).length;
  return (
    <section aria-labelledby="feature-title" className="bg-surface">
      <div className="grid items-stretch lg:grid-cols-2">
        <div className="relative aspect-[4/5] overflow-hidden sm:aspect-[5/4] lg:aspect-auto lg:min-h-[640px]">
          <Image
            src={pic.src}
            alt={p.alt}
            fill
            sizes="(min-width: 1024px) 50vw, 100vw"
            placeholder="blur"
            blurDataURL={pic.blurDataURL}
            className="object-cover"
          />
        </div>
        <div className="flex items-center px-4 py-14 sm:px-8 lg:px-16 xl:px-24">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-tea">Featured collection</p>
            <h2 id="feature-title" className="display mt-4 text-3xl leading-[1.08] text-maroon md:text-4xl">
              {FEATURE.title}
            </h2>
            <WovenBand mode="view" height={10} className="mt-6 w-24 [background-size:20px_10px]" />
            <p className="measure mt-6 text-lg text-ink/90">{FEATURE.body}</p>
            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
              <Link href={`/collections/${c.slug}`} className="btn btn-primary">
                Explore the collection
              </Link>
              <span className="text-muted">
                {n} {n === 1 ? "piece" : "pieces"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
