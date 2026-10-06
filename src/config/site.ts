/**
 * Site-wide settings and brand facts.
 *
 * Values marked TODO(client) are unknown and must come from ND Attire. While a
 * value is empty, the UI block that uses it stays hidden, so nothing invented
 * ever reaches customers.
 */
export const site = {
  name: "ND Attire",
  tagline: "Style that Speaks, Comfort that lasts",
  description:
    "Handpainted mekhela sador, sarees and bridal dupattas by Nikita Dutta, plus handloom and everyday cotton sets. Order on WhatsApp.",
  founder: "Nikita Dutta",
  founderInstagram: "https://www.instagram.com/nikita_dutta1999/",
  founderHandle: "@nikita_dutta1999",
  instagram: "https://www.instagram.com/nd_attire7/",
  instagramHandle: "@nd_attire7",
  /** WhatsApp number in international format, digits only. */
  whatsapp: "917576843822",
  whatsappDisplay: "+91 75768 43822",
  // TODO(client): an email address for enquiries. Hidden everywhere while empty.
  email: "",
  ordersCount: "1,000+",
  followersCount: "5,000+",

  // TODO(client): the production domain once it is bought (used for canonical
  // URLs, sitemap and Open Graph). Vercel's URL is used until then.
  url:
    process.env.NEXT_PUBLIC_SITE_URL ??
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : "http://localhost:3000"),

  /** The slim bar above the header. Set text to "" to hide it; href is optional. */
  announcement: {
    text: "Order on WhatsApp: +91 75768 43822",
    href: "https://wa.me/917576843822",
  },

  // TODO(client): studio / shop address, e.g. "Studio name, Street, City, State PIN".
  address: "",
  // TODO(client): typical dispatch and delivery times, e.g. "Dispatched in 2–3 days".
  deliveryTimes: "",
  // TODO(client): fabric care instructions for handpainted and cotton pieces.
  fabricCare: "",
  // TODO(client): customer quotes she is happy to publish, with first names.
  testimonials: [] as { quote: string; name: string }[],
} as const;

/**
 * Policy pages at /policies/<slug>. Write each policy as paragraphs. While a
 * policy has no paragraphs, its page says it has not been published yet and
 * points customers to WhatsApp, so no terms are ever made up.
 */
export const policies = [
  {
    slug: "delivery",
    title: "Delivery",
    // TODO(client): where you ship, dispatch times, courier, delivery charges.
    paragraphs: [] as string[],
  },
  {
    slug: "returns",
    title: "Returns and exchanges",
    // TODO(client): whether returns or exchanges are accepted, conditions and time limits.
    paragraphs: [] as string[],
  },
  {
    slug: "privacy",
    title: "Privacy",
    // TODO(client): how ND Attire uses customer details shared on WhatsApp, Instagram or email.
    paragraphs: [] as string[],
  },
] as const;

export type PolicySlug = (typeof policies)[number]["slug"];

/**
 * Size guide, shown on product pages that list sizes. Hidden while `rows` is
 * empty. Example:
 *   columns: ["Size", "Bust (in)", "Waist (in)"],
 *   rows: [["S", "34", "28"], ["M", "36", "30"]],
 */
export const sizeGuide = {
  // TODO(client): measurements for stitched pieces (suits, blouses).
  note: "Measurements are body measurements in inches.",
  columns: [] as string[],
  rows: [] as string[][],
};

export type Site = typeof site;
