"use client";

import Image from "next/image";
import { animate, m, useMotionValue, useTransform } from "motion/react";
import { useEffect, useState } from "react";
import { useFly, type Flight } from "@/store/bag";
import { img } from "@/lib/images";

/** Global layer: small thumbnails flying along a curve into the bag icon. */
export function FlyToBag() {
  const flights = useFly((s) => s.flights);
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-[60]">
      {flights.map((f) => (
        <Flyer key={f.id} flight={f} />
      ))}
    </div>
  );
}

const SIZE = 64;

function Flyer({ flight }: { flight: Flight }) {
  const land = useFly((s) => s.land);
  const t = useMotionValue(0);
  const [path] = useState(() => {
    const target = document.querySelector("[data-bag-target]")?.getBoundingClientRect();
    const sx = flight.from.x + flight.from.w / 2 - SIZE / 2;
    const sy = flight.from.y + flight.from.h / 2 - (SIZE * 1.25) / 2;
    const ex = target ? target.left + target.width / 2 - SIZE / 2 : window.innerWidth - SIZE;
    const ey = target ? target.top + target.height / 2 - (SIZE * 1.25) / 2 : 0;
    // control point: lifted above the higher end, pulled toward the target
    const cx = sx + (ex - sx) * 0.35;
    const cy = Math.min(sy, ey) - Math.max(120, Math.abs(ex - sx) * 0.25);
    return { sx, sy, cx, cy, ex, ey };
  });
  const bez = (a: number, c: number, b: number, v: number) => (1 - v) ** 2 * a + 2 * (1 - v) * v * c + v ** 2 * b;
  const x = useTransform(t, (v) => bez(path.sx, path.cx, path.ex, v));
  const y = useTransform(t, (v) => bez(path.sy, path.cy, path.ey, v));
  const scale = useTransform(t, [0, 0.15, 1], [0.6, 1, 0.3]);
  const opacity = useTransform(t, [0, 0.1, 0.85, 1], [0, 1, 1, 0]);
  const rotate = useTransform(t, [0, 1], [0, -8]);

  useEffect(() => {
    const c = animate(t, 1, { duration: 0.85, ease: [0.45, 0, 0.2, 1], onComplete: () => land(flight.id) });
    return () => c.stop();
  }, [t, land, flight.id]);

  const pic = img(flight.image);
  return (
    <m.div
      className="absolute left-0 top-0 overflow-hidden rounded-[4px] shadow-[var(--shadow)] ring-2 ring-[var(--band-gold)]"
      style={{ x, y, scale, opacity, rotate, width: SIZE, height: SIZE * 1.25 }}
    >
      <Image src={pic.src} alt="" width={SIZE} height={SIZE * 1.25} sizes="64px" className="size-full object-cover" />
    </m.div>
  );
}
