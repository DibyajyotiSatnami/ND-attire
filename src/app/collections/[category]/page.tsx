import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CollectionGrid } from "@/components/ProductGrid";
import { categories, isCategory, productsIn } from "@/data/products";

export const dynamicParams = false;

export function generateStaticParams() {
  return categories.map((c) => ({ category: c.slug }));
}

export async function generateMetadata({ params }: PageProps<"/collections/[category]">): Promise<Metadata> {
  const { category } = await params;
  const c = categories.find((x) => x.slug === category);
  if (!c) return {};
  return {
    title: c.label,
    description: `${c.blurb} Shop ${c.label.toLowerCase()} from ND Attire and order on WhatsApp.`,
    alternates: { canonical: `/collections/${c.slug}` },
  };
}

export default async function CollectionPage({ params }: PageProps<"/collections/[category]">) {
  const { category } = await params;
  if (!isCategory(category)) notFound();
  const c = categories.find((x) => x.slug === category)!;
  return (
    <div className="wrap pb-24 pt-10 md:pt-14">
      <nav aria-label="Breadcrumb" className="text-sm text-muted">
        <Link href="/shop" className="link-underline">
          Shop
        </Link>{" "}
        / <span aria-current="page">{c.label}</span>
      </nav>
      <h1 className="display mt-4 text-3xl text-plum md:text-4xl">{c.label}</h1>
      <p className="measure mt-3 text-muted">{c.blurb}</p>
      <h2 className="sr-only">{c.label} pieces</h2>
      <div className="mt-8">
        <CollectionGrid products={productsIn(c.slug)} />
      </div>
      <nav aria-label="Other collections" className="mt-20 border-t border-line pt-10">
        <h2 className="display text-xl text-plum">More collections</h2>
        <ul className="mt-5 flex flex-wrap gap-2">
          {categories
            .filter((x) => x.slug !== c.slug)
            .map((x) => (
              <li key={x.slug}>
                <Link
                  href={`/collections/${x.slug}`}
                  className="inline-flex h-10 items-center rounded-full px-4 font-medium shadow-[inset_0_0_0_1px_var(--line)] transition-colors hover:text-plum"
                >
                  {x.label}
                </Link>
              </li>
            ))}
        </ul>
      </nav>
    </div>
  );
}
