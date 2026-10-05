import Image from "next/image";
import Link from "next/link";
import { img } from "@/lib/images";
import { site } from "@/config/site";

export function FounderStory() {
  const studio = img("brand/founder-studio");
  const process = img("brand/handpainting-process");
  return (
    <section id="story" aria-labelledby="story-title" className="wrap py-16 lg:py-28">
      <div className="grid items-center gap-12 lg:grid-cols-12 lg:gap-8">
        <div className="relative lg:col-span-6">
          <div className="relative aspect-[4/5] w-[78%] overflow-hidden bg-sunk">
            <Image
              src={studio.src}
              alt="Nikita Dutta holding up a white handpainted saree at the ND Attire studio"
              fill
              sizes="(min-width: 1024px) 40vw, 78vw"
              placeholder="blur"
              blurDataURL={studio.blurDataURL}
              className="object-cover"
            />
          </div>
          <div className="absolute -bottom-10 right-0 aspect-[4/5] w-[46%] overflow-hidden bg-sunk ring-8 ring-paper">
            <Image
              src={process.src}
              alt="A brush painting a blue flower onto a mekhela sador"
              fill
              sizes="(min-width: 1024px) 24vw, 46vw"
              placeholder="blur"
              blurDataURL={process.blurDataURL}
              className="object-cover"
            />
          </div>
        </div>
        <div className="mt-10 lg:col-span-5 lg:col-start-8 lg:mt-0">
          <h2 id="story-title" className="display text-2xl text-maroon md:text-3xl">
            Style that speaks, comfort that lasts
          </h2>
          <div className="mt-6 space-y-4 text-ink/90">
            <p className="measure">
              ND Attire was founded by {site.founder} and specialises in handpainted attire and bridal dupattas. Every
              painted design starts as a brushstroke on plain fabric, which is why no two pieces are exactly alike.
            </p>
            <p className="measure">
              Alongside the handpainted work, we curate handloom wash cotton, staple cotton and everyday mekhela sador,
              with special collections for Durga Puja and the wedding season.
            </p>
          </div>
          <Link href="/about" className="link-underline mt-8 inline-block font-medium text-maroon">
            Read our story
          </Link>
        </div>
      </div>
    </section>
  );
}
