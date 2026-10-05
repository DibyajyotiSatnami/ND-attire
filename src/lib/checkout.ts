/**
 * Checkout is behind this interface so a payment gateway (e.g. Razorpay) can be
 * added later without touching UI components: implement CheckoutProvider and
 * swap `checkout` below.
 */
import { orderMessage, waLink, type OrderLine } from "@/lib/whatsapp";

export type Customer = { name: string; address: string };

export type CheckoutResult = { kind: "redirect"; url: string; newTab: boolean } | { kind: "error"; message: string };

export interface CheckoutProvider {
  id: string;
  /** Label for the primary bag button. */
  label: string;
  /** Can the order be placed with what we have? */
  canSubmit(lines: OrderLine[], customer: Customer): boolean;
  /** A URL the bag button can link to directly (lets WhatsApp open in a new tab without popup blockers). */
  href?(lines: OrderLine[], customer: Customer): string | undefined;
  submit(lines: OrderLine[], customer: Customer): Promise<CheckoutResult>;
}

export const whatsappCheckout: CheckoutProvider = {
  id: "whatsapp",
  label: "Send order on WhatsApp",
  canSubmit: (lines) => lines.length > 0,
  href: (lines, customer) => (lines.length ? waLink(orderMessage(lines, customer)) : undefined),
  async submit(lines, customer) {
    return { kind: "redirect", url: waLink(orderMessage(lines, customer)), newTab: true };
  },
};

// Future: export const razorpayCheckout: CheckoutProvider = { ... }
export const checkout: CheckoutProvider = whatsappCheckout;
