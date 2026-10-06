import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { WhatsAppIcon } from "@/components/Icons";
import { policies, site } from "@/config/site";
import { waLink } from "@/lib/whatsapp";

export const dynamicParams = false;

export function generateStaticParams() {
  return policies.map((p) => ({ policy: p.slug }));
}

const find = (slug: string) => policies.find((p) => p.slug === slug);

export async function generateMetadata({ params }: PageProps<"/policies/[policy]">): Promise<Metadata> {
  const { policy } = await params;
  const p = find(policy);
  if (!p) return {};
  return {
    title: `${p.title} policy`,
    description: `${site.name}'s ${p.title.toLowerCase()} policy. Questions? Message us on WhatsApp.`,
    alternates: { canonical: `/policies/${p.slug}` },
    // keep placeholder pages out of search results until the policy is written
    ...(p.paragraphs.length ? {} : { robots: { index: false } }),
  };
}

export default async function PolicyPage({ params }: PageProps<"/policies/[policy]">) {
  const { policy } = await params;
  const p = find(policy);
  if (!p) notFound();
  const paragraphs: readonly string[] = p.paragraphs;

  return (
    <div className="wrap pb-24 pt-10 md:pt-14">
      <nav aria-label="Policies" className="text-sm">
        <ul className="flex flex-wrap gap-2">
          {policies.map((x) => (
            <li key={x.slug}>
              <Link
                href={`/policies/${x.slug}`}
                aria-current={x.slug === p.slug ? "page" : undefined}
                className="inline-flex h-10 items-center rounded-full px-4 font-medium shadow-[inset_0_0_0_1px_var(--line)] transition-colors hover:text-maroon aria-[current=page]:bg-maroon aria-[current=page]:text-paper"
              >
                {x.title}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      <h1 className="display mt-8 text-3xl text-maroon md:text-4xl">{p.title}</h1>
      {paragraphs.length > 0 ? (
        <div className="mt-6 space-y-4">
          {paragraphs.map((t) => (
            <p key={t} className="measure">
              {t}
            </p>
          ))}
        </div>
      ) : (
        <div className="measure mt-6 rounded-2xl bg-surface p-6 shadow-[inset_0_0_0_1px_var(--line)]">
          <p className="font-semibold">This policy has not been published yet.</p>
          <p className="mt-2 text-muted">
            Please message us on WhatsApp and we will tell you how {p.title.toLowerCase()} works for your order.
          </p>
          <a
            href={waLink(`Hi ${site.name}, could you tell me about your ${p.title.toLowerCase()} policy?`)}
            target="_blank"
            rel="noopener"
            className="btn btn-wa mt-5"
          >
            <WhatsAppIcon /> Ask on WhatsApp
          </a>
        </div>
      )}
      {p.slug === "privacy" && (
        <section aria-labelledby="site-data" className="measure mt-12">
          <h2 id="site-data" className="text-lg font-semibold">
            What this website stores
          </h2>
          <p className="mt-3 text-muted">
            Your bag, and the name and address you type into it, are saved in your own browser so they are still there
            when you come back. They are not sent anywhere until you choose to send your order on WhatsApp. The enquiry
            form does not store anything either: it opens WhatsApp{site.email ? " or your email app" : ""} with your
            message filled in.
          </p>
        </section>
      )}
    </div>
  );
}
