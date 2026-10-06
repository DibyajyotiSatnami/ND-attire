import { site } from "@/config/site";

/** The slim bar above the header. Edit or empty `site.announcement` to change or hide it. */
export function Announcement() {
  const { text, href } = site.announcement;
  if (!text) return null;
  return (
    <div className="bg-maroon text-paper">
      <p className="wrap py-2 text-center text-[0.85rem] font-medium leading-snug tracking-wide">
        {href ? (
          <a
            href={href}
            {...(/^https?:/.test(href) ? { target: "_blank", rel: "noopener" } : {})}
            className="inline-block py-1 underline-offset-4 hover:underline"
          >
            {text}
          </a>
        ) : (
          text
        )}
      </p>
    </div>
  );
}
