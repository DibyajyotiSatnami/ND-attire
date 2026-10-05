"use client";

import Image from "next/image";
import Link from "next/link";
import { ViewTransition, useRef } from "react";
import { ProductAction } from "@/components/AddToBagButton";
import { Price } from "@/components/Price";
import { isHandpainted, type Product } from "@/data/products";
import { img } from "@/lib/images";

type Props = {
  product: Product;
  /** Above-the-fold cards load eagerly. */
  priority?: boolean;
  sizes?: string;
};

export function ProductCard({
  product,
  priority,
  sizes = "(min-width: 1280px) 25vw, (min-width: 768px) 33vw, 50vw",
}: Props) {
  const imageRef = useRef<HTMLDivElement>(null);
  const cover = img(product.images[0]);
  const second = product.images[1] ? img(product.images[1]) : null;
  const href = `/product/${product.slug}`;

  return (
    <article className="group relative flex flex-col">
      <div className="relative overflow-hidden bg-sunk">
        <Link href={href} className="block focus-ring-inset" tabIndex={-1} aria-hidden>
          <ViewTransition name={`product-${product.slug}`} share="morph" default="none">
            <div ref={imageRef} className="relative aspect-[4/5]">
              <Image
                src={cover.src}
                alt={product.alt}
                fill
                sizes={sizes}
                priority={priority}
                placeholder="blur"
                blurDataURL={cover.blurDataURL}
                className="object-cover transition-transform duration-[800ms] ease-[var(--ease-cloth)] motion-safe:group-hover:scale-[1.04]"
              />
              {second && (
                <Image
                  src={second.src}
                  alt=""
                  fill
                  sizes={sizes}
                  className="object-cover opacity-0 transition-opacity duration-[800ms] ease-[var(--ease-cloth)] group-hover:opacity-100"
                />
              )}
            </div>
          </ViewTransition>
        </Link>

        {(product.soldOut || isHandpainted(product)) && (
          <span
            className={`pointer-events-none absolute left-3 top-3 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
              product.soldOut ? "bg-ink text-paper" : "bg-surface/95 text-teal"
            }`}
          >
            {product.soldOut ? "Sold out" : "Handpainted"}
          </span>
        )}

        {/* desktop: the action slides up from the bottom of the image on hover / focus */}
        <div className="absolute inset-x-3 bottom-3 z-10 hidden translate-y-[calc(100%+1rem)] opacity-0 transition-[transform,opacity] duration-500 ease-[var(--ease-cloth)] group-focus-within:translate-y-0 group-focus-within:opacity-100 group-hover:translate-y-0 group-hover:opacity-100 [@media(hover:hover)_and_(pointer:fine)]:flex">
          <ProductAction product={product} flyFrom={() => imageRef.current} solid className="w-full shadow-lg" />
        </div>
      </div>

      <div className="flex flex-1 flex-col px-3 pt-3 sm:px-0 sm:pt-4">
        <h3 className="text-base font-semibold leading-snug">
          <Link href={href} className="after:absolute after:inset-0 after:content-[''] hover:text-plum">
            {product.name}
          </Link>
        </h3>
        <p className="mt-1 line-clamp-2 text-sm text-muted">{product.description}</p>
        <div className="mt-auto flex flex-wrap items-center justify-between gap-x-3 gap-y-2 pt-3">
          <Price value={product.price} className={product.price === null ? "text-sm" : "text-lg"} />
          {/* touch: always visible */}
          <div className="relative z-10 [@media(hover:hover)_and_(pointer:fine)]:hidden">
            <ProductAction product={product} flyFrom={() => imageRef.current} />
          </div>
        </div>
      </div>
    </article>
  );
}
