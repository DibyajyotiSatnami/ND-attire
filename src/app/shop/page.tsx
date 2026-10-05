import type { Metadata } from "next";
import { ShopGrid } from "@/components/ProductGrid";
import { products } from "@/data/products";

export const metadata: Metadata = {
  title: "Shop the collection",
  description:
    "Handpainted mekhela sador and sarees, bridal suits, designer and handloom cotton mekhela sador. Add to your bag and order on WhatsApp.",
  alternates: { canonical: "/shop" },
};

export default function ShopPage() {
  return (
    <div className="wrap pb-24 pt-10 md:pt-14">
      <h1 className="display text-3xl text-maroon md:text-4xl">Shop the collection</h1>
      <p className="measure mt-3 text-muted">
        Add pieces to your bag and send the order to us on WhatsApp. Handpainted designs are priced on request.
      </p>
      <h2 className="sr-only">All pieces</h2>
      <div className="mt-8">
        <ShopGrid products={products} />
      </div>
    </div>
  );
}
