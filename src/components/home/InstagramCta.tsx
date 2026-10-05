import { InstagramIcon } from "@/components/Icons";
import { site } from "@/config/site";

export function InstagramCta() {
  return (
    <section aria-labelledby="ig-title" className="wrap py-16 text-center lg:py-24">
      <h2 id="ig-title" className="display mx-auto max-w-[18ch] text-2xl text-plum md:text-3xl">
        New pieces land on Instagram first
      </h2>
      <p className="mx-auto mt-4 max-w-[46ch] text-muted">
        Join {site.followersCount} followers for fresh handpainted designs, festive drops and offers.
      </p>
      <a href={site.instagram} target="_blank" rel="noopener" className="btn btn-ghost mt-8">
        <InstagramIcon /> Follow {site.instagramHandle}
      </a>
    </section>
  );
}
