import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductDetail } from "@/components/product/ProductDetail";
import { ProductCard } from "@/components/ProductCard";
import { JsonLd } from "@/components/JsonLd";
import { WovenBand } from "@/components/WovenBand";
import { STEPS } from "@/components/home/HowToOrder";
import { categoryLabel, getProduct, isSoldOut, products } from "@/data/products";
import { img } from "@/lib/images";
import { site } from "@/config/site";
import { rupee } from "@/lib/format";

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
    description: `${p.description}. ${p.price === null ? "Price on request" : rupee(p.price)}${
      p.colours.length > 1 ? `, in ${p.colours.map((c) => c.name.toLowerCase()).join(", ")}` : ""
    }. Enquire or order on WhatsApp from ND Attire.`,
    alternates: { canonical: `/product/${p.slug}` },
    openGraph: { images: [{ url: `${site.url}${cover.src}`, width: cover.width, height: cover.height, alt: p.alt }] },
  };
}

export default async function ProductPage({ params }: PageProps<"/product/[slug]">) {
  const { slug } = await params;
  const p = getProduct(slug);
  if (!p) notFound();

  const details = (
    [
      ["Fabric", p.details?.fabric],
      ["Care", p.details?.care || site.fabricCare],
      ["Delivery", p.details?.delivery || site.deliveryTimes],
    ] as [string, string | undefined][]
  ).filter((d): d is [string, string] => !!d[1]);

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
                  availability: isSoldOut(p) ? "https://schema.org/OutOfStock" : "https://schema.org/InStock",
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
        <ProductDetail product={p}>
          <div className="mt-12">
            {details.length > 0 && (
              <dl className="mb-10 divide-y divide-line border-y border-line">
                {details.map(([k, v]) => (
                  <div key={k} className="grid gap-1 py-4 sm:grid-cols-[7rem_1fr]">
                    <dt className="font-medium">{k}</dt>
                    <dd className="text-muted">{v}</dd>
                  </div>
                ))}
              </dl>
            )}
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
            <p className="mt-6 text-sm text-muted">
              Read our{" "}
              <Link href="/policies/delivery" className="link-underline">
                delivery
              </Link>{" "}
              and{" "}
              <Link href="/policies/returns" className="link-underline">
                returns
              </Link>{" "}
              information.
            </p>
          </div>
        </ProductDetail>
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
