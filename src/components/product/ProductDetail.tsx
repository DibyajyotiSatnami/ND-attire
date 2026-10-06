"use client";

import { useCallback, useEffect, useId, useRef, useState, type ReactNode } from "react";
import { AnimatePresence, m } from "motion/react";
import { ProductGallery } from "@/components/product/ProductGallery";
import { AddButton, defaultVariant } from "@/components/AddToBagButton";
import { Stepper } from "@/components/BagDrawer";
import { Price } from "@/components/Price";
import { CloseIcon, WhatsAppIcon } from "@/components/Icons";
import { useFocusTrap } from "@/hooks/useFocusTrap";
import { categoryLabel, isHandpainted, isSoldOut, type Product } from "@/data/products";
import { enquiryLink, waLink, productUrl } from "@/lib/whatsapp";
import { sizeGuide, site } from "@/config/site";
import { ease } from "@/lib/motion";

type Errors = { colour?: string; size?: string };

/**
 * The interactive part of a product page: gallery, colour and size pickers,
 * quantity, "Enquire on WhatsApp" and "Add to bag". Static extras (details,
 * how ordering works) come in as children.
 */
export function ProductDetail({ product: p, children }: { product: Product; children?: ReactNode }) {
  const initial = defaultVariant(p);
  const [colour, setColour] = useState<string | null>(initial.colour);
  const [size, setSize] = useState<string | null>(initial.size);
  const [qty, setQty] = useState(1);
  const [errors, setErrors] = useState<Errors>({});
  const [guide, setGuide] = useState(false);
  const colourGroup = useRef<HTMLFieldSetElement>(null);
  const sizeGroup = useRef<HTMLFieldSetElement>(null);
  const ids = useId();

  // /product/x?colour=Wine preselects a colour (used by links and old URLs)
  useEffect(() => {
    const want = new URLSearchParams(window.location.search).get("colour");
    const c = p.colours.find((x) => x.name.toLowerCase() === want?.toLowerCase());
    if (c && !c.soldOut) setColour(c.name); // eslint-disable-line react-hooks/set-state-in-effect
  }, [p.colours]);

  const pickColour = p.colours.length > 1;
  const pickSize = (p.sizes?.length ?? 0) > 1;
  const chosen = p.colours.find((c) => c.name === colour);
  const soldOut = isSoldOut(p) || !!chosen?.soldOut;
  const focus = chosen?.image ? p.images.indexOf(chosen.image) : undefined;
  const alts = p.images.map((k, i) => p.colours.find((c) => c.image === k)?.alt ?? (i === 0 ? p.alt : undefined));
  const hasGuide = !!p.sizes?.length && sizeGuide.rows.length > 0;

  /** Required choices made? If not, show why and move focus to the first gap. */
  const validate = useCallback(() => {
    const next: Errors = {};
    if (pickColour && !colour) next.colour = "Please choose a colour.";
    if (pickSize && !size) next.size = "Please choose a size.";
    setErrors(next);
    const first = next.colour ? colourGroup.current : next.size ? sizeGroup.current : null;
    first?.querySelector<HTMLInputElement>("input:not(:disabled)")?.focus();
    return !first;
  }, [pickColour, pickSize, colour, size]);

  const enquire = enquiryLink(p, { colour, size, qty });

  return (
    <div className="grid gap-10 lg:grid-cols-12 lg:gap-12">
      <div className="lg:col-span-7">
        <ProductGallery slug={p.slug} images={p.images} alt={p.alt} alts={alts} focus={focus} />
      </div>
      <div className="lg:col-span-5 lg:pt-4">
        <p className="text-sm font-medium text-tea">
          {isHandpainted(p) && p.category !== "handpainted" ? "Handpainted · " : ""}
          {categoryLabel(p.category)}
        </p>
        <h1 className="display mt-3 text-3xl leading-[1.08] text-maroon md:text-4xl">{p.name}</h1>
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <Price value={p.price} className={p.price === null ? "text-lg" : "text-2xl"} />
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-0.5 text-sm font-semibold ${
              soldOut ? "bg-ink text-paper" : "bg-tea/10 text-tea"
            }`}
          >
            {soldOut ? "Sold out" : "Available"}
          </span>
        </div>
        {p.price === null && (
          <p className="mt-2 text-sm text-muted">Message us on WhatsApp for the price of this piece.</p>
        )}
        <p className="measure mt-6 text-lg text-ink/90">{p.description}.</p>

        <div className="mt-8 space-y-7">
          {p.colours.length === 1 && (
            <p>
              <span className="text-muted">Colour: </span>
              <span className="font-medium">{p.colours[0].name}</span>
            </p>
          )}
          {pickColour && (
            <fieldset
              ref={colourGroup}
              aria-describedby={errors.colour ? `${ids}-colour-err` : undefined}
              aria-invalid={!!errors.colour || undefined}
            >
              <legend className="mb-3">
                <span className="text-muted">Colour: </span>
                <span className="font-medium">{colour ?? "Choose one"}</span>
              </legend>
              <div className="flex flex-wrap gap-2.5">
                {p.colours.map((c) => (
                  <label
                    key={c.name}
                    className={`relative inline-flex min-h-11 cursor-pointer items-center gap-2.5 rounded-full py-1.5 pl-1.5 pr-4 text-[0.95rem] shadow-[inset_0_0_0_1px_var(--line)] transition-shadow has-[:checked]:shadow-[inset_0_0_0_2px_var(--maroon)] has-[:focus-visible]:outline has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-muga ${
                      c.soldOut ? "cursor-not-allowed text-muted" : "hover:shadow-[inset_0_0_0_1px_var(--maroon)]"
                    }`}
                  >
                    <input
                      type="radio"
                      name={`${ids}-colour`}
                      value={c.name}
                      checked={colour === c.name}
                      disabled={c.soldOut}
                      onChange={() => {
                        setColour(c.name);
                        setErrors((e) => ({ ...e, colour: undefined }));
                      }}
                      className="sr-only"
                    />
                    <span
                      aria-hidden
                      className="size-8 rounded-full shadow-[inset_0_0_0_1px_rgb(0_0_0/0.15)]"
                      style={{ background: c.swatch }}
                    />
                    <span className={c.soldOut ? "line-through" : ""}>{c.name}</span>
                    {c.soldOut && <span className="sr-only">(sold out)</span>}
                  </label>
                ))}
              </div>
              {errors.colour && (
                <p id={`${ids}-colour-err`} role="alert" className="mt-2 text-sm font-medium text-gamosa">
                  {errors.colour}
                </p>
              )}
            </fieldset>
          )}

          {p.sizes?.length === 1 && (
            <p>
              <span className="text-muted">Size: </span>
              <span className="font-medium">{p.sizes[0]}</span>
            </p>
          )}
          {pickSize && (
            <fieldset
              ref={sizeGroup}
              aria-describedby={errors.size ? `${ids}-size-err` : undefined}
              aria-invalid={!!errors.size || undefined}
            >
              <legend className="mb-3 flex w-full items-baseline justify-between gap-4">
                <span>
                  <span className="text-muted">Size: </span>
                  <span className="font-medium">{size ?? "Choose one"}</span>
                </span>
              </legend>
              <div className="flex flex-wrap gap-2.5">
                {p.sizes!.map((s) => (
                  <label
                    key={s}
                    className="relative inline-grid h-11 min-w-12 cursor-pointer place-items-center rounded-full px-4 font-medium shadow-[inset_0_0_0_1px_var(--line)] transition-colors hover:shadow-[inset_0_0_0_1px_var(--maroon)] has-[:checked]:bg-maroon has-[:checked]:text-paper has-[:focus-visible]:outline has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-muga"
                  >
                    <input
                      type="radio"
                      name={`${ids}-size`}
                      value={s}
                      checked={size === s}
                      onChange={() => {
                        setSize(s);
                        setErrors((e) => ({ ...e, size: undefined }));
                      }}
                      className="sr-only"
                    />
                    {s}
                  </label>
                ))}
              </div>
              {errors.size && (
                <p id={`${ids}-size-err`} role="alert" className="mt-2 text-sm font-medium text-gamosa">
                  {errors.size}
                </p>
              )}
            </fieldset>
          )}
          {hasGuide && (
            <button
              type="button"
              onClick={() => setGuide(true)}
              className="link-underline -mt-3 text-[0.95rem] font-medium text-maroon"
            >
              Size guide
            </button>
          )}

          {!soldOut && (
            <div className="flex items-center gap-3">
              <span className="text-muted">Quantity</span>
              <Stepper value={qty} onChange={(q) => setQty(Math.max(1, q))} label={p.name} />
            </div>
          )}
        </div>

        <div className="mt-8 grid gap-3">
          {soldOut ? (
            <a
              href={waLink(
                `Hi ${site.name}, is ${p.name}${chosen ? ` in ${chosen.name}` : ""} coming back in stock?\n${productUrl(p.slug)}`,
              )}
              target="_blank"
              rel="noopener"
              className="btn btn-wa min-h-[54px] w-full text-[1.02rem]"
            >
              <WhatsAppIcon /> Ask about a restock
            </a>
          ) : (
            <>
              <a
                href={enquire}
                target="_blank"
                rel="noopener"
                onClick={(e) => {
                  if (!validate()) e.preventDefault();
                }}
                className="btn btn-wa-solid min-h-[56px] w-full text-[1.05rem]"
              >
                <WhatsAppIcon width={22} height={22} /> Enquire on WhatsApp
              </a>
              <AddButton
                product={p}
                variant={{ colour, size }}
                qty={qty}
                validate={validate}
                flyFrom={() => document.querySelector("[data-gallery-main]")}
                className="min-h-[52px] w-full text-[1.02rem]"
              />
              <p className="text-sm text-muted">
                Nothing is charged here. {site.name} confirms availability, delivery charges and payment on WhatsApp.
              </p>
            </>
          )}
        </div>

        {children}
      </div>

      {hasGuide && <SizeGuide open={guide} onClose={() => setGuide(false)} />}
    </div>
  );
}

function SizeGuide({ open, onClose }: { open: boolean; onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  useFocusTrap(ref, open, onClose);
  return (
    <AnimatePresence>
      {open && (
        <m.div
          key="guide"
          className="fixed inset-0 z-[60] grid place-items-end bg-[var(--scrim)] sm:place-items-center"
          onClick={onClose}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3, ease }}
        >
          <m.div
            ref={ref}
            role="dialog"
            aria-modal="true"
            aria-labelledby="size-guide-title"
            onClick={(e) => e.stopPropagation()}
            className="max-h-[85dvh] w-full overflow-y-auto rounded-t-2xl bg-surface p-6 pb-[calc(env(safe-area-inset-bottom)+24px)] shadow-[var(--shadow)] sm:max-w-lg sm:rounded-2xl"
            initial={{ y: 40 }}
            animate={{ y: 0 }}
            exit={{ y: 40 }}
            transition={{ duration: 0.4, ease }}
          >
            <div className="flex items-center justify-between">
              <h2 id="size-guide-title" className="display text-xl text-maroon">
                Size guide
              </h2>
              <button
                type="button"
                data-autofocus
                onClick={onClose}
                aria-label="Close size guide"
                className="-mr-2 grid size-11 place-items-center rounded-full text-muted hover:text-maroon"
              >
                <CloseIcon width={22} height={22} />
              </button>
            </div>
            {sizeGuide.note && <p className="mt-2 text-sm text-muted">{sizeGuide.note}</p>}
            <table className="mt-5 w-full text-left text-[0.95rem]">
              <thead>
                <tr className="border-b border-line">
                  {sizeGuide.columns.map((c) => (
                    <th key={c} scope="col" className="py-2 pr-3 font-semibold">
                      {c}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sizeGuide.rows.map((r) => (
                  <tr key={r.join()} className="border-b border-line/70">
                    {r.map((cell, i) =>
                      i === 0 ? (
                        <th key={i} scope="row" className="py-2 pr-3 font-medium">
                          {cell}
                        </th>
                      ) : (
                        <td key={i} className="py-2 pr-3 tabular-nums">
                          {cell}
                        </td>
                      ),
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </m.div>
        </m.div>
      )}
    </AnimatePresence>
  );
}
