import Image from "next/image";
import { InstagramIcon } from "@/components/Icons";
import { img } from "@/lib/images";
import { site } from "@/config/site";

/** Photos from the @nd_attire7 feed. Each tile opens the Instagram profile. */
const POSTS = [
  { key: "products/hp-lotus-green", alt: "Green mekhela sador with handpainted pink lotus clusters" },
  { key: "products/hp-pink-rose", alt: "Rani pink mekhela sador with handpainted roses" },
  { key: "products/mm-wash", alt: "White wash cotton mekhela sador with a colourful woven border" },
  { key: "brand/client-1", alt: "Client wearing a lavender ND Attire saree" },
  { key: "products/hp-sky", alt: "Sky blue handpainted pair with blue lotus painting" },
  { key: "products/hl-wash-wine", alt: "Wine handloom wash cotton mekhela sador with yellow and white motifs" },
];

export function InstagramGallery() {
  return (
    <section aria-labelledby="ig-title" className="py-16 lg:py-24">
      <div className="wrap text-center">
        <h2 id="ig-title" className="display mx-auto max-w-[18ch] text-2xl text-maroon md:text-3xl">
          New pieces land on Instagram first
        </h2>
        <p className="mx-auto mt-4 max-w-[46ch] text-muted">
          Join {site.followersCount} followers at {site.instagramHandle} for fresh handpainted designs, festive drops
          and offers.
        </p>
      </div>
      <ul className="mt-10 grid grid-cols-3 gap-0.5 sm:gap-1 lg:grid-cols-6">
        {POSTS.map((p) => {
          const pic = img(p.key);
          return (
            <li key={p.key}>
              <a
                href={site.instagram}
                target="_blank"
                rel="noopener"
                className="group relative block aspect-square overflow-hidden bg-sunk focus-ring-inset"
              >
                <Image
                  src={pic.src}
                  alt={`${p.alt}. Opens ${site.instagramHandle} on Instagram`}
                  fill
                  sizes="(min-width: 1024px) 17vw, 33vw"
                  placeholder="blur"
                  blurDataURL={pic.blurDataURL}
                  className="object-cover transition-transform duration-[800ms] ease-[var(--ease-cloth)] motion-safe:group-hover:scale-[1.05]"
                />
                <span
                  aria-hidden
                  className="absolute inset-0 grid place-items-center bg-black/0 text-white opacity-0 transition-[opacity,background-color] duration-500 group-hover:bg-black/30 group-hover:opacity-100"
                >
                  <InstagramIcon width={28} height={28} />
                </span>
              </a>
            </li>
          );
        })}
      </ul>
      <div className="wrap mt-10 text-center">
        <a href={site.instagram} target="_blank" rel="noopener" className="btn btn-ghost">
          <InstagramIcon /> Follow {site.instagramHandle}
        </a>
      </div>
    </section>
  );
}
