"use client";

import Image from "next/image";
import { m } from "motion/react";
import { img } from "@/lib/images";
import { ease } from "@/lib/motion";
import { site } from "@/config/site";

const SHOTS = [
  { key: "brand/client-1", alt: "Client wearing a lavender ND Attire saree", caption: "Happy client" },
  {
    key: "brand/orders-packed",
    alt: "Stacks of packed ND Attire orders at the studio",
    caption: `${site.ordersCount} orders packed and sent`,
  },
  {
    key: "brand/client-2",
    alt: "Client in a handpainted suit at the ND Attire studio",
    caption: "Client visit at the studio",
  },
];

export function ClientsStrip() {
  return (
    <section aria-labelledby="clients-title" className="py-16 lg:py-24">
      <div className="wrap">
        <h2 id="clients-title" className="display text-2xl text-plum md:text-3xl">
          Worn and loved
        </h2>
        <p className="measure mt-3 text-muted">
          From Durga Puja to wedding days, more than a thousand orders have left our studio.
        </p>
        {site.testimonials.length > 0 && (
          <ul className="mt-8 grid gap-6 md:grid-cols-2">
            {site.testimonials.map((t) => (
              <li key={t.name}>
                <blockquote className="display text-lg text-plum">“{t.quote}”</blockquote>
                <p className="mt-2 text-muted">{t.name}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
      <m.ul
        className="no-scrollbar wrap mt-10 flex snap-x snap-mandatory gap-3 overflow-x-auto sm:grid sm:grid-cols-3 sm:gap-6 sm:overflow-visible"
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "0px 0px -80px 0px" }}
        variants={{ show: { transition: { staggerChildren: 0.1 } } }}
      >
        {SHOTS.map((s, i) => {
          const pic = img(s.key);
          return (
            <m.li
              key={s.key}
              className={`w-[70vw] shrink-0 snap-start sm:w-auto ${i === 1 ? "sm:translate-y-10" : ""}`}
              variants={{
                hidden: { opacity: 0, y: 30 },
                show: { opacity: 1, y: 0, transition: { duration: 0.9, ease } },
              }}
            >
              <figure>
                <div className="relative aspect-[4/5] overflow-hidden bg-sunk">
                  <Image
                    src={pic.src}
                    alt={s.alt}
                    fill
                    sizes="(min-width: 640px) 33vw, 70vw"
                    placeholder="blur"
                    blurDataURL={pic.blurDataURL}
                    className="object-cover"
                  />
                </div>
                <figcaption className="mt-3 text-sm text-muted">{s.caption}</figcaption>
              </figure>
            </m.li>
          );
        })}
      </m.ul>
    </section>
  );
}
