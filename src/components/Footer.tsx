import Image from "next/image";
import Link from "next/link";
import { Children, type ReactNode } from "react";
import { InstagramIcon, MailIcon, WhatsAppIcon } from "@/components/Icons";
import { categories } from "@/data/products";
import { policies, site } from "@/config/site";
import { waLink } from "@/lib/whatsapp";

export function Footer() {
  return (
    <footer className="bg-footer pb-[calc(env(safe-area-inset-bottom)+2rem)] text-[#f5ebdd]">
      <div aria-hidden className="weave" style={{ height: 14 }} />
      <div className="wrap grid gap-12 pt-14 sm:grid-cols-3 lg:grid-cols-[1.5fr_1fr_1fr_1fr]">
        <div className="sm:col-span-3 lg:col-span-1">
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
          {site.address && <p className="mt-4 max-w-[32ch] not-italic text-[#d9c6b4]">{site.address}</p>}
          <ul className="mt-6 flex gap-2" aria-label="Social links">
            <li>
              <a
                href={site.instagram}
                target="_blank"
                rel="noopener"
                aria-label={`Instagram ${site.instagramHandle}`}
                className="grid size-11 place-items-center rounded-full shadow-[inset_0_0_0_1px_rgb(245_235_221/0.3)] transition-colors hover:bg-white/10"
              >
                <InstagramIcon width={20} height={20} />
              </a>
            </li>
            <li>
              <a
                href={waLink(`Hi ${site.name}!`)}
                target="_blank"
                rel="noopener"
                aria-label={`WhatsApp ${site.whatsappDisplay}`}
                className="grid size-11 place-items-center rounded-full shadow-[inset_0_0_0_1px_rgb(245_235_221/0.3)] transition-colors hover:bg-white/10"
              >
                <WhatsAppIcon width={20} height={20} />
              </a>
            </li>
            {site.email && (
              <li>
                <a
                  href={`mailto:${site.email}`}
                  aria-label={`Email ${site.email}`}
                  className="grid size-11 place-items-center rounded-full shadow-[inset_0_0_0_1px_rgb(245_235_221/0.3)] transition-colors hover:bg-white/10"
                >
                  <MailIcon width={20} height={20} />
                </a>
              </li>
            )}
          </ul>
        </div>
        <FooterList title="Contact">
          <a className="link-underline" href={waLink(`Hi ${site.name}!`)} target="_blank" rel="noopener">
            WhatsApp {site.whatsappDisplay}
          </a>
          <a className="link-underline" href={site.instagram} target="_blank" rel="noopener">
            Instagram {site.instagramHandle}
          </a>
          {!!site.email && (
            <a className="link-underline" href={`mailto:${site.email}`}>
              {site.email}
            </a>
          )}
          <Link className="link-underline" href="/contact">
            Send an enquiry
          </Link>
        </FooterList>
        <FooterList title="Shop">
          {categories.map((c) => (
            <Link key={c.slug} className="link-underline" href={`/collections/${c.slug}`}>
              {c.label}
            </Link>
          ))}
        </FooterList>
        <FooterList title="Help">
          <Link className="link-underline" href="/#how">
            How ordering works
          </Link>
          {policies.map((p) => (
            <Link key={p.slug} className="link-underline" href={`/policies/${p.slug}`}>
              {p.title}
            </Link>
          ))}
          <Link className="link-underline" href="/about">
            Our story
          </Link>
        </FooterList>
      </div>
      <p className="wrap mt-14 text-sm text-[#c9ae98]">
        © {new Date().getFullYear()} {site.name}. Founded by{" "}
        <a className="link-underline" href={site.founderInstagram} target="_blank" rel="noopener">
          {site.founder}
        </a>
        .
      </p>
    </footer>
  );
}

function FooterList({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <h2 className="font-semibold text-[var(--band-gold)]">{title}</h2>
      <ul className="mt-3 space-y-1">
        {Children.toArray(children).map((c, i) => (
          <li key={i} className="py-1">
            {c}
          </li>
        ))}
      </ul>
    </div>
  );
}
