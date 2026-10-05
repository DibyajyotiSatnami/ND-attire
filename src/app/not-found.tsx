import Link from "next/link";
import { WovenBand } from "@/components/WovenBand";
import { WhatsAppIcon } from "@/components/Icons";
import { waHello } from "@/lib/whatsapp";

export default function NotFound() {
  return (
    <section className="wrap flex min-h-[60vh] flex-col items-center justify-center py-24 text-center">
      <WovenBand mode="load" height={14} className="w-40" />
      <h1 className="display mt-10 text-3xl text-maroon md:text-4xl">This page has slipped off the loom</h1>
      <p className="mt-4 max-w-[44ch] text-muted">
        The link may be old, or the piece may have sold out. The collection is still here.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link href="/shop" className="btn btn-primary">
          Shop the collection
        </Link>
        <a href={waHello()} target="_blank" rel="noopener" className="btn btn-wa">
          <WhatsAppIcon /> Ask us on WhatsApp
        </a>
      </div>
    </section>
  );
}
