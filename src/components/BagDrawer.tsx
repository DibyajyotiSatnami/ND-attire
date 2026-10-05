"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef } from "react";
import { AnimatePresence, animate, m, useMotionValue, useReducedMotion, useTransform } from "motion/react";
import { CloseIcon, MinusIcon, PlusIcon, WhatsAppIcon } from "@/components/Icons";
import { useFocusTrap } from "@/hooks/useFocusTrap";
import { selectLines, useBag } from "@/store/bag";
import { checkout } from "@/lib/checkout";
import { img } from "@/lib/images";
import { rupee } from "@/lib/format";
import { ease, spring } from "@/lib/motion";
import { site } from "@/config/site";

export function BagDrawer() {
  const open = useBag((s) => s.open);
  const setOpen = useBag((s) => s.setOpen);
  const close = useCallback(() => setOpen(false), [setOpen]);
  const ref = useRef<HTMLDivElement>(null);
  useFocusTrap(ref, open, close);

  return (
    <AnimatePresence>
      {open && (
        <>
          <m.div
            key="scrim"
            className="fixed inset-0 z-40 bg-[var(--scrim)]"
            onClick={close}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease }}
          />
          <m.div
            key="drawer"
            ref={ref}
            role="dialog"
            aria-modal="true"
            aria-labelledby="bag-title"
            className="fixed inset-y-0 right-0 z-50 flex w-full max-w-[440px] flex-col bg-surface pb-[env(safe-area-inset-bottom)] pt-[env(safe-area-inset-top)] shadow-[var(--shadow)]"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={spring}
          >
            <BagContents onClose={close} />
          </m.div>
        </>
      )}
    </AnimatePresence>
  );
}

function BagContents({ onClose }: { onClose: () => void }) {
  const items = useBag((s) => s.items);
  const customer = useBag((s) => s.customer);
  const setCustomer = useBag((s) => s.setCustomer);
  const setQty = useBag((s) => s.setQty);
  const remove = useBag((s) => s.remove);
  const lines = selectLines(items);
  const total = lines.reduce((s, l) => s + l.price * l.qty, 0);
  const orderLines = lines.map((l) => ({ name: l.name, qty: l.qty, price: l.price }));
  const can = checkout.canSubmit(orderLines, customer);
  const href = checkout.href?.(orderLines, customer);

  return (
    <>
      <div className="flex items-center justify-between px-6 pt-5 pb-4">
        <h2 id="bag-title" className="display text-xl text-plum">
          Your bag
        </h2>
        <button
          type="button"
          data-autofocus
          onClick={onClose}
          aria-label="Close bag"
          className="-mr-2 grid size-11 place-items-center rounded-full text-muted transition-colors hover:text-plum"
        >
          <CloseIcon width={24} height={24} />
        </button>
      </div>
      <div aria-hidden className="weave" style={{ height: 10, backgroundSize: "20px 10px" }} />

      <div className="flex-1 overflow-y-auto overscroll-contain px-6">
        {lines.length === 0 ? (
          <div className="py-16 text-center">
            <p className="display text-lg text-plum">Your bag is empty</p>
            <p className="mx-auto mt-2 max-w-[30ch] text-muted">Add a piece from the collection to start an order.</p>
            <Link href="/shop" onClick={onClose} className="btn btn-plum mt-6">
              Browse the collection
            </Link>
          </div>
        ) : (
          <ul className="divide-y divide-line">
            <AnimatePresence initial={false}>
              {lines.map((l) => {
                const pic = img(l.image);
                return (
                  <m.li
                    key={l.slug}
                    layout
                    initial={{ opacity: 0, x: 24 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 24, transition: { duration: 0.3 } }}
                    transition={spring}
                    className="grid grid-cols-[72px_1fr] gap-4 py-5"
                  >
                    <Image
                      src={pic.src}
                      alt=""
                      width={72}
                      height={90}
                      sizes="72px"
                      placeholder="blur"
                      blurDataURL={pic.blurDataURL}
                      className="aspect-[4/5] w-[72px] rounded-[3px] object-cover"
                    />
                    <div className="min-w-0">
                      <div className="flex items-start justify-between gap-3">
                        <Link
                          href={`/product/${l.slug}`}
                          onClick={onClose}
                          className="font-semibold leading-snug hover:text-plum"
                        >
                          {l.name}
                        </Link>
                        <span className="display shrink-0 text-rose">{rupee(l.price * l.qty)}</span>
                      </div>
                      <div className="mt-3 flex items-center justify-between">
                        <Stepper value={l.qty} label={l.name} removeAtMin onChange={(q) => setQty(l.slug, q)} />
                        <button
                          type="button"
                          onClick={() => remove(l.slug)}
                          className="link-underline text-sm text-muted hover:text-rose"
                          aria-label={`Remove ${l.name}`}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </m.li>
                );
              })}
            </AnimatePresence>
          </ul>
        )}
      </div>

      {lines.length > 0 && (
        <div className="border-t border-line px-6 pt-5 pb-6">
          <div className="flex items-baseline justify-between">
            <span className="font-medium">Total</span>
            <AnimatedRupee value={total} className="display text-xl text-rose" />
          </div>
          <div className="mt-4 grid gap-3">
            <label className="grid gap-1.5">
              <span className="text-sm text-muted">Your name</span>
              <input
                value={customer.name}
                onChange={(e) => setCustomer({ name: e.target.value })}
                autoComplete="name"
                className="h-12 rounded-lg border border-line bg-paper px-4 text-base text-ink outline-none transition-colors focus-visible:border-muga"
              />
            </label>
            <label className="grid gap-1.5">
              <span className="text-sm text-muted">Delivery address</span>
              <textarea
                value={customer.address}
                onChange={(e) => setCustomer({ address: e.target.value })}
                autoComplete="street-address"
                rows={3}
                className="resize-y rounded-lg border border-line bg-paper px-4 py-3 text-base text-ink outline-none transition-colors focus-visible:border-muga"
              />
            </label>
          </div>
          <p className="mt-3 text-sm text-muted">
            {site.deliveryTimes ? `${site.deliveryTimes}. ` : ""}Delivery charges are confirmed on WhatsApp.
          </p>
          <a href={href} target="_blank" rel="noopener" aria-disabled={!can} className="btn btn-wa-solid mt-4 w-full">
            <WhatsAppIcon /> {checkout.label}
          </a>
        </div>
      )}
    </>
  );
}

export function Stepper({
  value,
  onChange,
  label,
  removeAtMin = false,
}: {
  value: number;
  onChange: (n: number) => void;
  label: string;
  /** In the bag, stepping below 1 removes the line; elsewhere 1 is the floor. */
  removeAtMin?: boolean;
}) {
  return (
    <div
      className="inline-flex items-center rounded-full border border-line"
      role="group"
      aria-label={`Quantity of ${label}`}
    >
      <button
        type="button"
        onClick={() => onChange(value - 1)}
        disabled={value <= 1 && !removeAtMin}
        aria-label={value <= 1 && removeAtMin ? `Remove ${label}` : `One less ${label}`}
        className="grid size-10 place-items-center rounded-full text-muted transition-colors hover:text-plum disabled:opacity-40"
      >
        <MinusIcon width={16} height={16} />
      </button>
      <span className="min-w-6 text-center tabular-nums" aria-live="polite">
        {value}
      </span>
      <button
        type="button"
        onClick={() => onChange(value + 1)}
        disabled={value >= 99}
        aria-label={`One more ${label}`}
        className="grid size-10 place-items-center rounded-full text-muted transition-colors hover:text-plum disabled:opacity-40"
      >
        <PlusIcon width={16} height={16} />
      </button>
    </div>
  );
}

function AnimatedRupee({ value, className }: { value: number; className?: string }) {
  const reduce = useReducedMotion();
  const mv = useMotionValue(value);
  const text = useTransform(mv, (v) => rupee(Math.round(v)));
  useEffect(() => {
    if (reduce) {
      mv.set(value);
      return;
    }
    const c = animate(mv, value, { duration: 0.6, ease });
    return () => c.stop();
  }, [value, mv, reduce]);
  return (
    <m.span className={className} aria-live="polite">
      {text}
    </m.span>
  );
}
