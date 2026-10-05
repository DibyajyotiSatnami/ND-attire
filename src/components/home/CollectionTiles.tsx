"use client";

import Image from "next/image";
import Link from "next/link";
import { m } from "motion/react";
import { categories, getProduct, productsIn, type CategorySlug } from "@/data/products";
import { img } from "@/lib/images";
import { ease } from "@/lib/motion";

const COVER: Record<CategorySlug, string> = {
  handpainted: "hp-white-lotus",
  bridal: "hp-wisteria",
  designer: "ds-pink",
  handloom: "hl-wash-red",
  everyday: "mm-padmini",
  offers: "of-semipat",
};

export function CollectionTiles() {
  return (
    <section aria-labelledby="collections-title" className="wrap py-16 lg:py-24">
      <h2 id="collections-title" className="display text-2xl text-maroon md:text-3xl">
        Shop by collection
      </h2>
      <m.ul
        className="mt-10 grid grid-cols-2 gap-x-3 gap-y-10 sm:gap-x-6 lg:grid-cols-3 lg:gap-y-14"
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "0px 0px -80px 0px" }}
        variants={{ show: { transition: { staggerChildren: 0.07 } } }}
      >
        {categories.map((c) => {
          const p = getProduct(COVER[c.slug])!;
          const pic = img(p.images[0]);
          const n = productsIn(c.slug).length;
          return (
            <m.li
              key={c.slug}
              variants={{
                hidden: { opacity: 0, y: 36 },
                show: { opacity: 1, y: 0, transition: { duration: 0.8, ease } },
              }}
            >
              <Link href={`/collections/${c.slug}`} className="group block">
                <div className="relative aspect-[4/5] overflow-hidden bg-sunk">
                  <Image
                    src={pic.src}
                    alt=""
                    fill
                    sizes="(min-width: 1024px) 400px, 50vw"
                    placeholder="blur"
                    blurDataURL={pic.blurDataURL}
                    className="object-cover transition-transform duration-[800ms] ease-[var(--ease-cloth)] motion-safe:group-hover:scale-[1.04]"
                  />
                </div>
                <h3 className="display mt-4 text-lg leading-tight text-maroon group-hover:text-gamosa md:text-xl">
                  {c.label}
                </h3>
                <p className="mt-1 hidden text-muted sm:block">{c.blurb}</p>
                <p className="mt-1 text-sm text-muted">
                  {n} {n === 1 ? "piece" : "pieces"}
                </p>
              </Link>
            </m.li>
          );
        })}
      </m.ul>
    </section>
  );
}
