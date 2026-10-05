import { site } from "@/config/site";
import { rupee } from "@/lib/format";
import type { Product } from "@/data/products";

export const waLink = (text: string) => `https://wa.me/${site.whatsapp}?text=${encodeURIComponent(text)}`;

export const waHello = () => waLink("Hi ND Attire, I'd like to place an order.");

export const askPriceLink = (p: Pick<Product, "name" | "slug">) =>
  waLink(
    `Hi ND Attire, I'm interested in the ${p.name}. Could you share the price and availability?\n${site.url}/product/${p.slug}`,
  );

export type OrderLine = { name: string; qty: number; price: number };

export function orderMessage(lines: OrderLine[], customer: { name: string; address: string }) {
  const total = lines.reduce((s, l) => s + l.price * l.qty, 0);
  let msg = `Hi ND Attire, I'd like to order:\n${lines
    .map((l) => `• ${l.name} × ${l.qty} = ${rupee(l.price * l.qty)}`)
    .join("\n")}\nTotal: ${rupee(total)}`;
  const name = customer.name.trim();
  const address = customer.address.trim();
  if (name || address) msg += "\n";
  if (name) msg += `\nName: ${name}`;
  if (address) msg += `\nDelivery address: ${address}`;
  return msg;
}
