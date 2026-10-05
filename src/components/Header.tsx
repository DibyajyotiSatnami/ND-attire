"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, m } from "motion/react";
import { BagIcon, CloseIcon, InstagramIcon, MenuIcon, WhatsAppIcon } from "@/components/Icons";
import { useFocusTrap } from "@/hooks/useFocusTrap";
import { selectCount, useBag } from "@/store/bag";
import { site } from "@/config/site";
import { waHello } from "@/lib/whatsapp";
import { ease, spring } from "@/lib/motion";

const NAV = [
  { href: "/shop", label: "Shop" },
  { href: "/collections/handpainted", label: "Handpainted" },
  { href: "/#how", label: "How to order" },
  { href: "/about", label: "Our story" },
];

export function Header() {
  const pathname = usePathname();
  const [menu, setMenu] = useState(false);

  const closeMenu = useCallback(() => setMenu(false), []);

  return (
    <>
      <header className="sticky top-0 z-30 bg-paper/92 backdrop-blur-md supports-[backdrop-filter]:bg-paper/85">
        <div className="wrap flex h-[68px] items-center gap-4 lg:h-[76px]">
          <Link href="/" className="flex items-center gap-3 rounded-full" aria-label="ND Attire home">
            <Image
              src="/brand/logo-mark.png"
              alt=""
              width={44}
              height={44}
              priority
              className="size-10 rounded-full lg:size-11"
            />
            <span className="display text-[1.4rem] leading-none text-plum">ND Attire</span>
          </Link>

          <nav aria-label="Main" className="ml-auto hidden md:block">
            <ul className="flex items-center gap-8">
              {NAV.map((n) => {
                const active =
                  n.href === pathname || (n.href !== "/" && !n.href.includes("#") && pathname.startsWith(n.href));
                return (
                  <li key={n.href}>
                    <Link
                      href={n.href}
                      aria-current={active ? "page" : undefined}
                      className="relative py-2 font-medium text-muted transition-colors duration-300 hover:text-plum aria-[current=page]:text-plum"
                    >
                      {n.label}
                      {active && <span aria-hidden className="absolute inset-x-0 -bottom-0.5 h-px bg-muga" />}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          <BagButton className="ml-auto md:ml-6" />
          <button
            type="button"
            className="-mr-2 grid size-11 place-items-center rounded-full text-plum md:hidden"
            aria-label="Open menu"
            aria-expanded={menu}
            aria-controls="mobile-menu"
            onClick={() => setMenu(true)}
          >
            <MenuIcon width={24} height={24} />
          </button>
        </div>
        <div className="intro-band">
          <div aria-hidden className="weave" style={{ height: 14 }} />
        </div>
      </header>
      {/* outside <header>: its backdrop-filter would otherwise contain this fixed overlay */}
      <MobileMenu open={menu} onClose={closeMenu} pathname={pathname} />
    </>
  );
}

function BagButton({ className = "" }: { className?: string }) {
  const count = useBag((s) => selectCount(s.items));
  const bump = useBag((s) => s.bump);
  const setOpen = useBag((s) => s.setOpen);
  return (
    <button
      type="button"
      data-bag-target
      onClick={() => setOpen(true)}
      aria-haspopup="dialog"
      aria-label={`Bag, ${count} ${count === 1 ? "item" : "items"}`}
      className={`flex h-11 items-center gap-2 rounded-full pl-3 pr-2 text-plum transition-colors duration-300 hover:bg-plum/8 ${className}`}
    >
      <BagIcon width={22} height={22} />
      <span className="hidden font-medium sm:inline">Bag</span>
      <m.span
        key={bump}
        initial={bump ? { scale: 1.45 } : false}
        animate={{ scale: 1 }}
        transition={{ ...spring, stiffness: 420, damping: 14 }}
        className="inline-grid h-6 min-w-6 place-items-center rounded-full bg-rose px-1.5 text-xs font-semibold tabular-nums text-rose-ink"
      >
        {count}
      </m.span>
    </button>
  );
}

function MobileMenu({ open, onClose, pathname }: { open: boolean; onClose: () => void; pathname: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useFocusTrap(ref, open, onClose);
  // close when the route changes
  const prev = useRef(pathname);
  useEffect(() => {
    if (prev.current !== pathname) onClose();
    prev.current = pathname;
  }, [pathname, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <m.div
          ref={ref}
          id="mobile-menu"
          role="dialog"
          aria-modal="true"
          aria-label="Menu"
          className="fixed inset-0 z-50 flex flex-col bg-paper pb-[env(safe-area-inset-bottom)] md:hidden"
          initial={{ clipPath: "inset(0 0 100% 0)" }}
          animate={{ clipPath: "inset(0 0 0% 0)" }}
          exit={{ clipPath: "inset(0 0 100% 0)" }}
          transition={{ duration: 0.6, ease }}
        >
          <div className="wrap flex h-[68px] items-center">
            <span className="display text-[1.4rem] text-plum">ND Attire</span>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close menu"
              className="-mr-2 ml-auto grid size-11 place-items-center rounded-full text-plum"
            >
              <CloseIcon width={24} height={24} />
            </button>
          </div>
          <div aria-hidden className="weave" style={{ height: 14 }} />
          <nav aria-label="Mobile" className="wrap flex-1 pt-10">
            <m.ul
              className="space-y-2"
              initial="hidden"
              animate="show"
              variants={{
                show: {
                  transition: { staggerChildren: 0.07, delayChildren: 0.18 },
                },
              }}
            >
              {[{ href: "/", label: "Home" }, ...NAV].map((n) => (
                <m.li
                  key={n.href}
                  variants={{
                    hidden: { opacity: 0, y: 24 },
                    show: {
                      opacity: 1,
                      y: 0,
                      transition: { duration: 0.7, ease },
                    },
                  }}
                >
                  <Link
                    href={n.href}
                    onClick={onClose}
                    aria-current={n.href === pathname ? "page" : undefined}
                    className="display block py-2 text-[2.2rem] leading-tight text-plum aria-[current=page]:text-rose"
                  >
                    {n.label}
                  </Link>
                </m.li>
              ))}
            </m.ul>
          </nav>
          <m.div
            className="wrap flex flex-col gap-3 pb-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: { delay: 0.5, duration: 0.6 } }}
          >
            <a href={waHello()} target="_blank" rel="noopener" className="btn btn-wa-solid w-full">
              <WhatsAppIcon /> Order on WhatsApp
            </a>
            <a href={site.instagram} target="_blank" rel="noopener" className="btn btn-ghost w-full">
              <InstagramIcon /> {site.instagramHandle}
            </a>
          </m.div>
        </m.div>
      )}
    </AnimatePresence>
  );
}
