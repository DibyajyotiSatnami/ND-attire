"use client";

import { AnimatePresence, m } from "motion/react";
import { WhatsAppIcon } from "@/components/Icons";
import { useBag } from "@/store/bag";
import { waHello } from "@/lib/whatsapp";
import { spring } from "@/lib/motion";

/** Mobile only. Hidden while the bag is open. */
export function WhatsAppFab() {
  const open = useBag((s) => s.open);
  return (
    <AnimatePresence>
      {!open && (
        <m.a
          href={waHello()}
          target="_blank"
          rel="noopener"
          aria-label="Order on WhatsApp"
          className="fixed bottom-[calc(env(safe-area-inset-bottom)+16px)] right-[calc(env(safe-area-inset-right)+16px)] z-30 grid size-14 place-items-center rounded-full bg-wa text-white shadow-[0_12px_30px_-8px_rgb(0_0_0/0.45)] md:hidden"
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.6, opacity: 0 }}
          transition={spring}
        >
          <WhatsAppIcon width={28} height={28} />
        </m.a>
      )}
    </AnimatePresence>
  );
}
