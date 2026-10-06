import type { Metadata } from "next";
import { ContactForm } from "@/components/ContactForm";
import { InstagramIcon, MailIcon, WhatsAppIcon } from "@/components/Icons";
import { WovenBand } from "@/components/WovenBand";
import { waLink } from "@/lib/whatsapp";
import { site } from "@/config/site";

export const metadata: Metadata = {
  title: "Contact",
  description: `Contact ${site.name} on WhatsApp ${site.whatsappDisplay} or Instagram ${site.instagramHandle}, or send an enquiry about a mekhela sador, saree or bridal dupatta.`,
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  const channels = [
    {
      icon: <WhatsAppIcon width={22} height={22} />,
      label: "WhatsApp",
      value: site.whatsappDisplay,
      note: "Orders, prices and availability",
      href: waLink(`Hi ${site.name}!`),
      external: true,
    },
    {
      icon: <InstagramIcon width={22} height={22} />,
      label: "Instagram",
      value: site.instagramHandle,
      note: "New pieces and festive drops",
      href: site.instagram,
      external: true,
    },
    ...(site.email
      ? [
          {
            icon: <MailIcon width={22} height={22} />,
            label: "Email",
            value: site.email,
            note: "General enquiries",
            href: `mailto:${site.email}`,
            external: false,
          },
        ]
      : []),
  ];

  return (
    <div className="wrap pb-24 pt-10 md:pt-14">
      <div className="grid gap-14 lg:grid-cols-12 lg:gap-8">
        <div className="lg:col-span-5">
          <h1 className="display text-[clamp(2.4rem,6vw,3.6rem)] leading-[1.04] text-maroon">Get in touch</h1>
          <p className="measure mt-5 text-lg text-muted">
            The quickest way to reach us is WhatsApp. Ask about a design, a price or your order and we will reply on
            chat.
          </p>
          <WovenBand height={10} className="mt-8 w-24 [background-size:20px_10px]" />
          <ul className="mt-8 grid gap-3">
            {channels.map((c) => (
              <li key={c.label}>
                <a
                  href={c.href}
                  {...(c.external ? { target: "_blank", rel: "noopener" } : {})}
                  className="group grid grid-cols-[48px_1fr] items-center gap-4 rounded-2xl bg-surface p-4 shadow-[inset_0_0_0_1px_var(--line)] transition-shadow hover:shadow-[inset_0_0_0_1px_var(--maroon)]"
                >
                  <span className="grid size-12 place-items-center rounded-full bg-sunk text-maroon">{c.icon}</span>
                  <span>
                    <span className="block text-sm text-muted">{c.label}</span>
                    <span className="block font-semibold group-hover:text-maroon">{c.value}</span>
                    <span className="block text-sm text-muted">{c.note}</span>
                  </span>
                </a>
              </li>
            ))}
          </ul>
          {site.address && (
            <div className="mt-8">
              <h2 className="font-semibold">Studio</h2>
              <address className="mt-1 not-italic text-muted">{site.address}</address>
            </div>
          )}
        </div>
        <section aria-labelledby="enquiry-title" className="lg:col-span-6 lg:col-start-7">
          <h2 id="enquiry-title" className="display text-2xl text-maroon md:text-3xl">
            Send an enquiry
          </h2>
          <div className="mt-6">
            <ContactForm />
          </div>
        </section>
      </div>
    </div>
  );
}
