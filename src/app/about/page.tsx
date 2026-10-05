import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { WovenBand, WeaveDivider } from "@/components/WovenBand";
import { InstagramIcon, WhatsAppIcon } from "@/components/Icons";
import { img } from "@/lib/images";
import { waHello } from "@/lib/whatsapp";
import { site } from "@/config/site";

export const metadata: Metadata = {
  title: "Our story",
  description:
    "ND Attire was founded by Nikita Dutta and specialises in handpainted attire and bridal dupattas. Every design starts as a brushstroke on plain fabric.",
  alternates: { canonical: "/about" },
};

function Photo({ k, alt, sizes, className = "" }: { k: string; alt: string; sizes: string; className?: string }) {
  const m = img(k);
  return (
    <div className={`relative aspect-[4/5] overflow-hidden bg-sunk ${className}`}>
      <Image
        src={m.src}
        alt={alt}
        fill
        sizes={sizes}
        placeholder="blur"
        blurDataURL={m.blurDataURL}
        className="object-cover"
      />
    </div>
  );
}

export default function AboutPage() {
  return (
    <>
      <section className="wrap grid items-end gap-10 pb-16 pt-10 md:pt-14 lg:grid-cols-12 lg:gap-8 lg:pb-24">
        <div className="lg:col-span-6">
          <h1 className="display text-[clamp(2.4rem,6vw,4rem)] leading-[1.04] text-plum">
            Every piece starts with a brushstroke
          </h1>
          <p className="measure mt-6 text-lg text-muted">
            ND Attire was founded by {site.founder} and specialises in handpainted attire and bridal dupattas.
          </p>
        </div>
        <div className="lg:col-span-5 lg:col-start-8">
          <div className="weave-frame rounded-[6px] p-3">
            <div className="overflow-hidden ring-[3px] ring-[var(--band-gold)]">
              <Photo
                k="brand/founder-studio"
                alt="Nikita Dutta holding up a white handpainted saree at the ND Attire studio"
                sizes="(min-width: 1024px) 40vw, 92vw"
              />
            </div>
          </div>
        </div>
      </section>

      <section aria-labelledby="craft-title" className="bg-surface py-16 lg:py-24">
        <div className="wrap grid items-center gap-12 lg:grid-cols-12 lg:gap-8">
          <div className="lg:col-span-5">
            <Photo
              k="brand/handpainting-process"
              alt="A brush painting a blue flower onto a mekhela sador"
              sizes="(min-width: 1024px) 40vw, 92vw"
            />
          </div>
          <div className="lg:col-span-6 lg:col-start-7">
            <WovenBand mode="view" height={10} className="w-24 [background-size:20px_10px]" />
            <h2 id="craft-title" className="display mt-6 text-2xl text-plum md:text-3xl">
              Painted by hand, one piece at a time
            </h2>
            <div className="mt-6 space-y-4">
              <p className="measure">
                Every painted design starts as a brushstroke on plain fabric, which is why no two pieces are exactly
                alike. Lotus clusters, garden florals, roses and wisteria vines are painted onto mekhela sador, sarees,
                suits and dupattas.
              </p>
              <p className="measure">
                Because each piece is painted to order, handpainted designs are priced on request. Message us on
                WhatsApp with the design you love and we will share the price and availability.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section aria-labelledby="range-title" className="wrap py-16 lg:py-24">
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-8">
          <div className="lg:col-span-5">
            <h2 id="range-title" className="display text-2xl text-plum md:text-3xl">
              Beyond the brush
            </h2>
            <p className="measure mt-6">
              Alongside the handpainted work, we curate handloom wash cotton, staple cotton and everyday mekhela sador,
              with special collections for Durga Puja and the wedding season.
            </p>
            <p className="measure mt-4">
              <strong className="font-semibold">{site.ordersCount} orders</strong> have been packed and sent from our
              studio so far.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/shop" className="btn btn-primary">
                Shop the collection
              </Link>
              <a href={waHello()} target="_blank" rel="noopener" className="btn btn-wa">
                <WhatsAppIcon /> Order on WhatsApp
              </a>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:gap-6 lg:col-span-6 lg:col-start-7">
            <Photo
              k="brand/orders-packed"
              alt="Stacks of packed ND Attire orders at the studio"
              sizes="(min-width: 1024px) 25vw, 46vw"
            />
            <Photo
              k="brand/client-2"
              alt="Client in a handpainted suit at the ND Attire studio"
              sizes="(min-width: 1024px) 25vw, 46vw"
              className="mt-12"
            />
          </div>
        </div>
      </section>

      <WeaveDivider />

      <section className="wrap py-16 text-center lg:py-24">
        <h2 className="display mx-auto max-w-[20ch] text-2xl text-plum md:text-3xl">Say hello</h2>
        <p className="mx-auto mt-4 max-w-[46ch] text-muted">
          Follow {site.founder} at{" "}
          <a href={site.founderInstagram} target="_blank" rel="noopener" className="link-underline text-plum">
            {site.founderHandle}
          </a>{" "}
          and the label at {site.instagramHandle} for new pieces.
        </p>
        <a href={site.instagram} target="_blank" rel="noopener" className="btn btn-ghost mt-8">
          <InstagramIcon /> Follow {site.instagramHandle}
        </a>
      </section>
    </>
  );
}
