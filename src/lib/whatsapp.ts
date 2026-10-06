import { site } from "@/config/site";
import { rupee } from "@/lib/format";
import type { Product } from "@/data/products";

export const waLink = (text: string) => `https://wa.me/${site.whatsapp}?text=${encodeURIComponent(text)}`;

export const waHello = () => waLink("Hi ND Attire, I'd like to place an order.");

export const productUrl = (slug: string) => `${site.url}/product/${slug}`;

const NA = "Not applicable";

export type Choice = { colour: string | null; size: string | null; qty: number };

/** The product page's "Enquire on WhatsApp" message. */
export function enquiryMessage(p: Pick<Product, "name" | "slug">, c: Choice) {
  return [
    `Hi ${site.name}, I’m interested in ${p.name}.`,
    `Size: ${c.size ?? NA}`,
    `Colour: ${c.colour ?? NA}`,
    `Quantity: ${c.qty}`,
    `Product link: ${productUrl(p.slug)}`,
    "Please confirm availability and ordering details.",
  ].join("\n");
}

export const enquiryLink = (p: Pick<Product, "name" | "slug">, c: Choice) => waLink(enquiryMessage(p, c));

export type OrderLine = {
  slug: string;
  name: string;
  qty: number;
  /** null when the piece is priced on request. */
  price: number | null;
  colour: string | null;
  size: string | null;
};

export const subtotal = (lines: OrderLine[]) => lines.reduce((s, l) => s + (l.price ?? 0) * l.qty, 0);

/** The bag's "Send order on WhatsApp" message. */
export function orderMessage(lines: OrderLine[], customer: { name: string; address: string }) {
  const out = [`Hi ${site.name}, I'd like to order:`, ""];
  lines.forEach((l, i) => {
    const variant = [l.colour && `Colour: ${l.colour}`, l.size && `Size: ${l.size}`].filter(Boolean).join(" · ");
    const price = l.price === null ? "Price on request" : `${rupee(l.price)} each`;
    out.push(`${i + 1}. ${l.name}`);
    if (variant) out.push(`   ${variant}`);
    out.push(`   Quantity: ${l.qty} · ${price}`);
    out.push(`   ${productUrl(l.slug)}`);
  });
  out.push("");
  const priced = lines.some((l) => l.price !== null);
  const unpriced = lines.some((l) => l.price === null);
  if (priced) out.push(`Subtotal${unpriced ? " (priced items)" : ""}: ${rupee(subtotal(lines))}`);
  out.push("Please confirm availability, delivery charges and the final total.");
  const name = customer.name.trim();
  const address = customer.address.trim();
  if (name || address) out.push("");
  if (name) out.push(`Name: ${name}`);
  if (address) out.push(`Delivery address: ${address}`);
  return out.join("\n");
}
