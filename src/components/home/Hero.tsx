"use client";

import Image from "next/image";
import Link from "next/link";
import { useLayoutEffect, useRef } from "react";
import { m, useScroll, useTransform } from "motion/react";
import { WhatsAppIcon } from "@/components/Icons";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { getProduct } from "@/data/products";
import { img } from "@/lib/images";
import { waHello } from "@/lib/whatsapp";
import { site } from "@/config/site";

const INTRO_KEY = "nd-intro";
const INTRO_MS = 1800;

/**
 * The one orchestrated moment. The sequence itself is CSS (see globals.css,
 * `[data-intro="play"]`) so it starts on first paint instead of waiting for
 * hydration, which keeps the hero fast on slow phones. An inline script in the
 * layout decides whether it plays (once per session, never with reduced motion);
 * this component replays it after client-side navigation and records that it ran.
 */
function useIntro() {
  useLayoutEffect(() => {
    const root = document.documentElement;
    let played = false;
    try {
      played = sessionStorage.getItem(INTRO_KEY) === "1";
    } catch {}
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (root.dataset.intro !== "play") {
      if (played || reduce) return;
      root.dataset.intro = "play"; // arrived by client navigation
    }
    try {
      sessionStorage.setItem(INTRO_KEY, "1");
    } catch {}
    const t = window.setTimeout(() => (root.dataset.intro = "done"), INTRO_MS + 200);
    return () => {
      window.clearTimeout(t);
      root.dataset.intro = "done";
    };
  }, []);
}

export function Hero() {
  useIntro();
  const product = getProduct("hp-lavender")!;
  const cover = img(product.images[0]);
  const frame = useRef<HTMLDivElement>(null);
  const desktop = useMediaQuery("(min-width: 1024px)");
  const { scrollYProgress } = useScroll({ target: frame, offset: ["start start", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], desktop ? [-20, 20] : [0, 0]);

  return (
    <section className="wrap grid items-center gap-10 pb-16 pt-10 md:pt-14 lg:grid-cols-12 lg:gap-8 lg:pb-16 lg:pt-16">
      <div className="lg:col-span-6">
        <h1 className="display text-[clamp(2.6rem,5.6vw,4.4rem)] leading-[1.02] text-maroon">
          <span className="intro-line block overflow-hidden pb-[0.08em]">
            <span className="block">Mekhela sador,</span>
          </span>
          <span className="intro-line block overflow-hidden pb-[0.08em]">
            <span className="block">painted by hand.</span>
          </span>
        </h1>
        <p className="intro-fade mt-6 max-w-[36ch] text-lg text-muted">
          Handpainted attire and bridal dupattas, plus handloom and everyday cotton sets for every festive season.
        </p>
        <div className="intro-fade mt-8 flex flex-wrap gap-3">
          <Link href="/shop" className="btn btn-primary">
            Explore Collection
          </Link>
          <a href={waHello()} target="_blank" rel="noopener" className="btn btn-wa">
            <WhatsAppIcon /> Order on WhatsApp
          </a>
        </div>
        <p className="intro-fade mt-8 max-w-[40ch] text-muted">
          <strong className="font-semibold text-ink">{site.ordersCount} orders</strong> packed and sent so far. Founded
          by {site.founder}.
        </p>
      </div>

      <div className="lg:col-span-6">
        <figure ref={frame} className="relative mx-auto max-w-[520px] lg:ml-auto lg:mr-0">
          <div className="weave-frame rounded-[6px] p-3 sm:p-3.5">
            <div className="intro-image relative overflow-hidden rounded-[2px] ring-[3px] ring-[var(--band-gold)]">
              <m.div style={{ y }} className="relative -my-5 aspect-[4/5] lg:-my-6">
                <Link
                  href={`/product/${product.slug}`}
                  tabIndex={-1}
                  aria-hidden
                  className="intro-zoom absolute inset-0 block"
                >
                  <Image
                    src={cover.src}
                    alt={product.alt}
                    fill
                    priority
                    fetchPriority="high"
                    sizes="(min-width: 1024px) 520px, (min-width: 640px) 520px, 92vw"
                    placeholder="blur"
                    blurDataURL={cover.blurDataURL}
                    className="object-cover object-[center_30%]"
                  />
                </Link>
              </m.div>
            </div>
          </div>
          <figcaption className="intro-fade absolute -left-2 bottom-8 max-w-[230px] rounded-[4px] bg-surface px-4 py-3 text-[0.95rem] leading-snug shadow-[var(--shadow)] sm:-left-6">
            <Link href={`/product/${product.slug}`} className="display block text-lg text-gamosa hover:underline">
              Lavender handpainted
            </Link>
            Our most-requested design
          </figcaption>
        </figure>
      </div>
    </section>
  );
}
