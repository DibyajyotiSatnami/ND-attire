"use client";

import { useId, useRef, useState } from "react";
import { CheckIcon, MailIcon, WhatsAppIcon } from "@/components/Icons";
import { products } from "@/data/products";
import { productUrl, waLink } from "@/lib/whatsapp";
import { site } from "@/config/site";

type Fields = { name: string; phone: string; email: string; product: string; message: string };
type Errors = Partial<Record<keyof Fields, string>>;

const EMPTY: Fields = { name: "", phone: "", email: "", product: "", message: "" };

export function validate(f: Fields): Errors {
  const e: Errors = {};
  if (!f.name.trim()) e.name = "Please enter your name.";
  const digits = f.phone.replace(/[\s()+-]/g, "");
  if (f.phone.trim() && !/^\d{10,13}$/.test(digits)) e.phone = "Please enter a valid phone number, e.g. 98765 43210.";
  if (f.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email.trim()))
    e.email = "Please enter a valid email address, e.g. name@example.com.";
  if (f.message.trim().length < 10) e.message = "Please write a short message (at least 10 characters).";
  return e;
}

export function compose(f: Fields) {
  const p = products.find((x) => x.slug === f.product);
  return [
    `Hi ${site.name}, I have an enquiry.`,
    "",
    f.message.trim(),
    "",
    `Name: ${f.name.trim()}`,
    f.phone.trim() ? `Phone: ${f.phone.trim()}` : null,
    f.email.trim() ? `Email: ${f.email.trim()}` : null,
    p ? `Product: ${p.name} (${productUrl(p.slug)})` : null,
  ]
    .filter((l) => l !== null)
    .join("\n");
}

/**
 * Enquiry form. There is no server: on submit it opens WhatsApp (or the
 * customer's email app, when site.email is set) with the message filled in.
 */
export function ContactForm() {
  const [f, setF] = useState<Fields>(EMPTY);
  const [errors, setErrors] = useState<Errors>({});
  const [sent, setSent] = useState<"whatsapp" | "email" | null>(null);
  const via = useRef<"whatsapp" | "email">("whatsapp");
  const form = useRef<HTMLFormElement>(null);
  const id = useId();

  const set =
    (k: keyof Fields) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      setF((cur) => ({ ...cur, [k]: e.target.value }));
      if (errors[k]) setErrors((cur) => ({ ...cur, [k]: undefined }));
    };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate(f);
    setErrors(errs);
    const first = (Object.keys(errs) as (keyof Fields)[])[0];
    if (first) {
      form.current?.querySelector<HTMLElement>(`[name="${first}"]`)?.focus();
      return;
    }
    const text = compose(f);
    if (via.current === "email" && site.email) {
      window.location.href = `mailto:${site.email}?subject=${encodeURIComponent(`Enquiry from ${f.name.trim()}`)}&body=${encodeURIComponent(text)}`;
      setSent("email");
    } else {
      const url = waLink(text);
      // (a "noopener" feature string would make window.open return null even on success)
      const w = window.open(url, "_blank");
      if (w) w.opener = null;
      else window.location.href = url;
      setSent("whatsapp");
    }
  };

  const field = (k: keyof Fields) => ({
    id: `${id}-${k}`,
    name: k,
    value: f[k],
    onChange: set(k),
    "aria-invalid": !!errors[k] || undefined,
    "aria-describedby": errors[k] ? `${id}-${k}-err` : undefined,
  });
  const input =
    "w-full rounded-lg border bg-surface px-4 text-base text-ink outline-none transition-colors focus-visible:border-muga aria-[invalid=true]:border-gamosa border-line";
  const err = (k: keyof Fields) =>
    errors[k] ? (
      <p id={`${id}-${k}-err`} className="text-sm font-medium text-gamosa">
        {errors[k]}
      </p>
    ) : null;

  if (sent) {
    return (
      <div className="rounded-2xl bg-surface p-8 text-center shadow-[inset_0_0_0_1px_var(--line)]" role="status">
        <span className="mx-auto grid size-12 place-items-center rounded-full bg-tea/10 text-tea">
          <CheckIcon width={24} height={24} />
        </span>
        <p className="display mt-4 text-xl text-maroon">Almost done</p>
        <p className="mx-auto mt-2 max-w-[40ch] text-muted">
          {sent === "whatsapp"
            ? "WhatsApp has opened with your message filled in. Press send there and we will reply on chat."
            : "Your email app has opened with your message filled in. Press send there and we will reply by email."}
        </p>
        <button
          type="button"
          onClick={() => {
            setSent(null);
            setF(EMPTY);
          }}
          className="btn btn-ghost mt-6"
        >
          Write another message
        </button>
      </div>
    );
  }

  return (
    <form ref={form} noValidate onSubmit={onSubmit} className="grid gap-5" aria-describedby={`${id}-note`}>
      <p id={`${id}-note`} className="text-sm text-muted">
        Fields marked * are required.
      </p>
      <div className="grid gap-1.5">
        <label htmlFor={`${id}-name`} className="font-medium">
          Name *
        </label>
        <input {...field("name")} autoComplete="name" required className={`${input} h-12`} />
        {err("name")}
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="grid content-start gap-1.5">
          <label htmlFor={`${id}-phone`} className="font-medium">
            Phone <span className="font-normal text-muted">(optional)</span>
          </label>
          <input {...field("phone")} type="tel" autoComplete="tel" inputMode="tel" className={`${input} h-12`} />
          {err("phone")}
        </div>
        <div className="grid content-start gap-1.5">
          <label htmlFor={`${id}-email`} className="font-medium">
            Email <span className="font-normal text-muted">(optional)</span>
          </label>
          <input {...field("email")} type="email" autoComplete="email" className={`${input} h-12`} />
          {err("email")}
        </div>
      </div>
      <div className="grid gap-1.5">
        <label htmlFor={`${id}-product`} className="font-medium">
          Product <span className="font-normal text-muted">(optional)</span>
        </label>
        <select {...field("product")} className={`${input} h-12`}>
          <option value="">General enquiry</option>
          {products.map((p) => (
            <option key={p.slug} value={p.slug}>
              {p.name}
            </option>
          ))}
        </select>
      </div>
      <div className="grid gap-1.5">
        <label htmlFor={`${id}-message`} className="font-medium">
          Message *
        </label>
        <textarea {...field("message")} rows={5} required className={`${input} resize-y py-3`} />
        {err("message")}
      </div>
      <div className="flex flex-col gap-3 sm:flex-row">
        <button type="submit" onClick={() => (via.current = "whatsapp")} className="btn btn-wa-solid min-h-[52px]">
          <WhatsAppIcon /> Send on WhatsApp
        </button>
        {site.email && (
          <button type="submit" onClick={() => (via.current = "email")} className="btn btn-ghost min-h-[52px]">
            <MailIcon /> Send by email
          </button>
        )}
      </div>
      <p className="text-sm text-muted">
        Your message opens in {site.email ? "WhatsApp or your email app" : "WhatsApp"}, ready to send. Nothing is stored
        on this website.
      </p>
    </form>
  );
}
