"use client";

import Image from "next/image";
import { ViewTransition, useCallback, useRef, useState } from "react";
import { AnimatePresence, m } from "motion/react";
import { CloseIcon } from "@/components/Icons";
import { useFocusTrap } from "@/hooks/useFocusTrap";
import { img } from "@/lib/images";
import { ease } from "@/lib/motion";

type Props = { slug: string; images: string[]; alt: string };

export function ProductGallery({ slug, images, alt }: Props) {
  const [active, setActive] = useState(0);
  const [lightbox, setLightbox] = useState<number | null>(null);
  const track = useRef<HTMLDivElement>(null);
  const metas = images.map(img);

  const go = (i: number) => {
    setActive(i);
    const el = track.current;
    if (el) el.scrollTo({ left: el.clientWidth * i, behavior: "smooth" });
  };

  return (
    <div className="lg:sticky lg:top-28 lg:flex lg:gap-4">
      {metas.length > 1 && (
        <ul className="hidden w-20 shrink-0 flex-col gap-3 lg:flex" aria-label="Choose image">
          {metas.map((pic, i) => (
            <li key={pic.src}>
              <button
                type="button"
                onClick={() => go(i)}
                aria-label={`Show image ${i + 1}`}
                aria-current={i === active}
                className="relative block aspect-[4/5] w-full overflow-hidden opacity-60 transition-opacity aria-[current=true]:opacity-100 aria-[current=true]:ring-2 aria-[current=true]:ring-muga"
              >
                <Image src={pic.src} alt="" fill sizes="80px" className="object-cover" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="relative min-w-0 flex-1">
        {/* swipe on touch: a scroll-snap track */}
        <div
          ref={track}
          className="no-scrollbar -mx-4 flex snap-x snap-mandatory overflow-x-auto sm:mx-0"
          onScroll={(e) => {
            const el = e.currentTarget;
            setActive(Math.round(el.scrollLeft / el.clientWidth));
          }}
        >
          {metas.map((pic, i) => {
            const frame = (
              <ZoomFrame
                src={pic.src}
                blur={pic.blurDataURL}
                alt={i === 0 ? alt : `${alt}, view ${i + 1}`}
                priority={i === 0}
                onOpen={() => setLightbox(i)}
              />
            );
            return (
              <div key={pic.src} className="w-full shrink-0 snap-center">
                {i === 0 ? (
                  <ViewTransition name={`product-${slug}`} share="morph" default="none">
                    {frame}
                  </ViewTransition>
                ) : (
                  frame
                )}
              </div>
            );
          })}
        </div>
        {metas.length > 1 && (
          <div className="mt-3 flex justify-center gap-2 lg:hidden" aria-hidden>
            {metas.map((pic, i) => (
              <span
                key={pic.src}
                className={`h-1.5 rounded-full transition-all ${i === active ? "w-6 bg-plum" : "w-1.5 bg-line"}`}
              />
            ))}
          </div>
        )}
      </div>

      <Lightbox
        index={lightbox}
        srcs={metas.map((pic) => pic.src)}
        alt={alt}
        onClose={useCallback(() => setLightbox(null), [])}
      />
    </div>
  );
}

/** Desktop: click to zoom in place, the zoom follows the pointer. Touch: tap opens the pinch-zoom lightbox. */
function ZoomFrame({
  src,
  blur,
  alt,
  priority,
  onOpen,
}: {
  src: string;
  blur: string;
  alt: string;
  priority: boolean;
  onOpen: () => void;
}) {
  const [zoom, setZoom] = useState(false);
  const [origin, setOrigin] = useState("50% 50%");
  const move = (e: React.PointerEvent<HTMLButtonElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    setOrigin(`${((e.clientX - r.left) / r.width) * 100}% ${((e.clientY - r.top) / r.height) * 100}%`);
  };
  return (
    <button
      type="button"
      aria-label={zoom ? "Zoom out" : "Zoom in"}
      onClick={(e) => {
        const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
        if (!fine) return onOpen();
        move(e as unknown as React.PointerEvent<HTMLButtonElement>);
        setZoom((z) => !z);
      }}
      onPointerMove={(e) => zoom && move(e)}
      onPointerLeave={() => setZoom(false)}
      onKeyDown={(e) => e.key === "Escape" && setZoom(false)}
      data-gallery-main={priority || undefined}
      className={`focus-ring-inset relative block aspect-[4/5] w-full overflow-hidden bg-sunk ${zoom ? "cursor-zoom-out" : "cursor-zoom-in"}`}
    >
      <Image
        src={src}
        alt={alt}
        fill
        priority={priority}
        sizes="(min-width: 1024px) 50vw, 100vw"
        quality={85}
        placeholder="blur"
        blurDataURL={blur}
        className="object-cover transition-transform duration-500 ease-[var(--ease-cloth)]"
        style={{ transform: zoom ? "scale(2.2)" : "none", transformOrigin: origin }}
      />
    </button>
  );
}

function Lightbox({
  index,
  srcs,
  alt,
  onClose,
}: {
  index: number | null;
  srcs: string[];
  alt: string;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useFocusTrap(ref, index !== null, onClose);
  return (
    <AnimatePresence>
      {index !== null && (
        <m.div
          ref={ref}
          role="dialog"
          aria-modal="true"
          aria-label="Image zoom"
          className="fixed inset-0 z-[80] bg-[#140b17]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4, ease }}
        >
          <PinchImage src={srcs[index]} alt={alt} />
          <button
            type="button"
            data-autofocus
            onClick={onClose}
            aria-label="Close zoom"
            className="absolute right-[calc(env(safe-area-inset-right)+12px)] top-[calc(env(safe-area-inset-top)+12px)] grid size-12 place-items-center rounded-full bg-black/40 text-white"
          >
            <CloseIcon width={24} height={24} />
          </button>
          <p className="pointer-events-none absolute inset-x-0 bottom-[calc(env(safe-area-inset-bottom)+20px)] text-center text-sm text-white/70">
            Pinch to zoom
          </p>
        </m.div>
      )}
    </AnimatePresence>
  );
}

/** Two-finger pinch + one-finger pan, double-tap to toggle 2.5×. */
function PinchImage({ src, alt }: { src: string; alt: string }) {
  const [t, setT] = useState({ s: 1, x: 0, y: 0 });
  const pts = useRef(new Map<number, { x: number; y: number }>());
  const start = useRef<{ d: number; s: number; x: number; y: number; cx: number; cy: number } | null>(null);
  const lastTap = useRef(0);

  const clamp = (v: { s: number; x: number; y: number }) => {
    const s = Math.min(4, Math.max(1, v.s));
    const lim = (s - 1) * 0.5;
    return {
      s,
      x: Math.max(-lim * innerWidth, Math.min(lim * innerWidth, v.x)),
      y: Math.max(-lim * innerHeight, Math.min(lim * innerHeight, v.y)),
    };
  };

  return (
    <div
      className="absolute inset-0 touch-none select-none"
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        pts.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
        const p = [...pts.current.values()];
        const now = Date.now();
        if (p.length === 1 && now - lastTap.current < 280)
          setT((v) => (v.s > 1 ? { s: 1, x: 0, y: 0 } : { s: 2.5, x: 0, y: 0 }));
        lastTap.current = now;
        const d = p.length > 1 ? Math.hypot(p[0].x - p[1].x, p[0].y - p[1].y) : 0;
        const cx = p.reduce((a, b) => a + b.x, 0) / p.length;
        const cy = p.reduce((a, b) => a + b.y, 0) / p.length;
        start.current = { d, s: t.s, x: t.x, y: t.y, cx, cy };
      }}
      onPointerMove={(e) => {
        if (!pts.current.has(e.pointerId) || !start.current) return;
        pts.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
        const p = [...pts.current.values()];
        const cx = p.reduce((a, b) => a + b.x, 0) / p.length;
        const cy = p.reduce((a, b) => a + b.y, 0) / p.length;
        const st = start.current;
        const s = p.length > 1 && st.d ? (st.s * Math.hypot(p[0].x - p[1].x, p[0].y - p[1].y)) / st.d : st.s;
        setT(clamp({ s, x: st.x + cx - st.cx, y: st.y + cy - st.cy }));
      }}
      onPointerUp={(e) => {
        pts.current.delete(e.pointerId);
        const p = [...pts.current.values()];
        if (p.length) start.current = { d: 0, s: t.s, x: t.x, y: t.y, cx: p[0].x, cy: p[0].y };
        else start.current = null;
      }}
      onPointerCancel={(e) => pts.current.delete(e.pointerId)}
    >
      <div className="absolute inset-0" style={{ transform: `translate3d(${t.x}px, ${t.y}px, 0) scale(${t.s})` }}>
        <Image src={src} alt={alt} fill sizes="100vw" quality={85} className="object-contain" />
      </div>
    </div>
  );
}
