import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductGallery } from "@/components/product/ProductGallery";
import { ProductBuy } from "@/components/product/ProductBuy";
import { ProductCard } from "@/components/ProductCard";
import { Price } from "@/components/Price";
import { JsonLd } from "@/components/JsonLd";
import { WovenBand } from "@/components/WovenBand";
import { STEPS } from "@/components/home/HowToOrder";
import { categoryLabel, getProduct, isHandpainted, products } from "@/data/products";
import { img } from "@/lib/images";
import { site } from "@/config/site";

export const dynamicParams = false;

export function generateStaticParams() {
  return products.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: PageProps<"/product/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const p = getProduct(slug);
  if (!p) return {};
  const cover = img(p.images[0]);
  return {
    title: p.name,
    description: `${p.description}. ${p.price === null ? "Price on request" : `₹${p.price.toLocaleString("en-IN")}`}, order on WhatsApp from ND Attire.`,
    alternates: { canonical: `/product/${p.slug}` },
    openGraph: { images: [{ url: cover.src, width: cover.width, height: cover.height, alt: p.alt }] },
  };
}

export default async function ProductPage({ params }: PageProps<"/product/[slug]">) {
  const { slug } = await params;
  const p = getProduct(slug);
  if (!p) notFound();

  const related = [
    ...products.filter((x) => x.category === p.category && x.slug !== p.slug),
    ...products.filter((x) => x.featured && x.category !== p.category && x.slug !== p.slug),
  ].slice(0, 4);

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Product",
          name: p.name,
          description: p.description,
          sku: p.slug,
          category: categoryLabel(p.category),
          image: p.images.map((k) => `${site.url}${img(k).src}`),
          brand: { "@type": "Brand", name: site.name },
          url: `${site.url}/product/${p.slug}`,
          ...(p.price !== null
            ? {
                offers: {
                  "@type": "Offer",
                  price: p.price,
                  priceCurrency: "INR",
                  availability: p.soldOut ? "https://schema.org/OutOfStock" : "https://schema.org/InStock",
                  url: `${site.url}/product/${p.slug}`,
                  seller: { "@type": "Organization", name: site.name },
                },
              }
            : {}),
        }}
      />
      <div className="wrap pb-20 pt-6 md:pt-10">
        <nav aria-label="Breadcrumb" className="mb-6 text-sm text-muted">
          <Link href="/shop" className="link-underline">
            Shop
          </Link>{" "}
          /{" "}
          <Link href={`/collections/${p.category}`} className="link-underline">
            {categoryLabel(p.category)}
          </Link>
        </nav>
        <div className="grid gap-10 lg:grid-cols-12 lg:gap-12">
          <div className="lg:col-span-7">
            <ProductGallery slug={p.slug} images={p.images} alt={p.alt} />
          </div>
          <div className="lg:col-span-5 lg:pt-4">
            <p className="text-sm font-medium text-tea">
              {isHandpainted(p) && p.category !== "handpainted" ? "Handpainted · " : ""}
              {categoryLabel(p.category)}
            </p>
            <h1 className="display mt-3 text-3xl leading-[1.08] text-maroon md:text-4xl">{p.name}</h1>
            <div className="mt-5 flex items-center gap-3">
              <Price value={p.price} className={p.price === null ? "text-lg" : "text-2xl"} />
              {p.soldOut && (
                <span className="rounded-full bg-ink px-3 py-0.5 text-sm font-semibold text-paper">Sold out</span>
              )}
            </div>
            <p className="measure mt-6 text-lg text-ink/90">{p.description}.</p>

            <ProductBuy product={p} />

            {p.soldOut && (
              <p className="mt-4 text-muted">
                This piece is sold out. Message us on WhatsApp to ask about a restock or a similar design.
              </p>
            )}

            <div className="mt-12">
              <WovenBand height={10} className="w-24 [background-size:20px_10px]" />
              <h2 className="mt-6 font-semibold">How ordering works</h2>
              <ol className="mt-4 space-y-3 text-muted">
                {STEPS.map((s, i) => (
                  <li key={s.title} className="grid grid-cols-[1.75rem_1fr]">
                    <span className="display text-gamosa">{i + 1}</span>
                    <span>
                      <span className="font-medium text-ink">{s.title}.</span> {s.body}
                    </span>
                  </li>
                ))}
              </ol>
              {(site.deliveryTimes || site.fabricCare) && (
                <dl className="mt-8 space-y-4 text-muted">
                  {site.deliveryTimes && (
                    <div>
                      <dt className="font-medium text-ink">Delivery</dt>
                      <dd>{site.deliveryTimes}</dd>
                    </div>
                  )}
                  {site.fabricCare && (
                    <div>
                      <dt className="font-medium text-ink">Care</dt>
                      <dd>{site.fabricCare}</dd>
                    </div>
                  )}
                </dl>
              )}
            </div>
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <section aria-labelledby="related-title" className="wrap pb-24">
          <h2 id="related-title" className="display text-2xl text-maroon">
            You may also like
          </h2>
          <ul className="-mx-4 mt-8 grid grid-cols-2 gap-x-0.5 gap-y-10 sm:mx-0 sm:gap-x-6 md:grid-cols-4">
            {related.map((r) => (
              <li key={r.slug}>
                <ProductCard product={r} sizes="(min-width: 768px) 25vw, 50vw" />
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}
