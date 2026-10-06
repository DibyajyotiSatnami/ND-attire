import Link from "next/link";
import { Grid } from "@/components/ProductGrid";
import type { Product } from "@/data/products";

export function NewArrivals({ products }: { products: Product[] }) {
  if (!products.length) return null;
  return (
    <section aria-labelledby="new-title" className="wrap pb-16 pt-6 lg:pb-24 lg:pt-12">
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
        <div>
          <h2 id="new-title" className="display text-2xl text-maroon md:text-3xl">
            New arrivals
          </h2>
          <p className="measure mt-3 text-muted">The latest pieces from our Durga Puja collection.</p>
        </div>
        <Link href="/shop?sort=new" className="link-underline font-medium text-maroon">
          View all new arrivals
        </Link>
      </div>
      <Grid products={products.slice(0, 4)} />
    </section>
  );
}
