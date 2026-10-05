import Image from "next/image";
import Link from "next/link";
import { categories } from "@/data/products";
import { site } from "@/config/site";
import { waLink } from "@/lib/whatsapp";

export function Footer() {
  return (
    <footer className="bg-footer pb-[calc(env(safe-area-inset-bottom)+2rem)] text-[#f5ebdd]">
      <div aria-hidden className="weave" style={{ height: 14 }} />
      <div className="wrap grid gap-12 pt-14 md:grid-cols-12">
        <div className="md:col-span-5">
          <Image
            src="/brand/logo-mark.png"
            alt="ND Attire logo"
            width={88}
            height={88}
            className="size-[88px] rounded-full"
          />
          <p className="display mt-5 text-xl leading-snug text-[#ebc27a]">
            Style that speaks,
            <br />
            comfort that lasts.
          </p>
          {site.address && <p className="mt-4 max-w-[32ch] text-[#d9c6b4]">{site.address}</p>}
        </div>
        <div className="md:col-span-3">
          <h2 className="font-semibold text-[var(--band-gold)]">Order</h2>
          <ul className="mt-3 space-y-2">
            <li>
              <a className="link-underline" href={waLink("Hi ND Attire!")} target="_blank" rel="noopener">
                WhatsApp {site.whatsappDisplay}
              </a>
            </li>
            <li>
              <a className="link-underline" href={site.instagram} target="_blank" rel="noopener">
                Instagram {site.instagramHandle}
              </a>
            </li>
            <li>
              <Link className="link-underline" href="/#how">
                How ordering works
              </Link>
            </li>
            <li>
              <Link className="link-underline" href="/about">
                Our story
              </Link>
            </li>
          </ul>
        </div>
        <div className="md:col-span-4">
          <h2 className="font-semibold text-[var(--band-gold)]">Shop</h2>
          <ul className="mt-3 space-y-2">
            {categories.map((c) => (
              <li key={c.slug}>
                <Link className="link-underline" href={`/collections/${c.slug}`}>
                  {c.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
      {(site.returnPolicy || site.fabricCare) && (
        <div className="wrap mt-12 grid gap-8 text-[#d9c6b4] md:grid-cols-2">
          {site.returnPolicy && (
            <div>
              <h2 className="font-semibold text-[var(--band-gold)]">Returns</h2>
              <p className="mt-2 max-w-[60ch]">{site.returnPolicy}</p>
            </div>
          )}
          {site.fabricCare && (
            <div>
              <h2 className="font-semibold text-[var(--band-gold)]">Fabric care</h2>
              <p className="mt-2 max-w-[60ch]">{site.fabricCare}</p>
            </div>
          )}
        </div>
      )}
      <p className="wrap mt-14 text-sm text-[#c9ae98]">
        © {new Date().getFullYear()} ND Attire. Founded by{" "}
        <a className="link-underline" href={site.founderInstagram} target="_blank" rel="noopener">
          {site.founder}
        </a>
        .
      </p>
    </footer>
  );
}
