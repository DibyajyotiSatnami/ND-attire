/**
 * The catalogue. Adding a product is a one-file change: add an entry below and
 * drop its photo into source-images/products/<slug>.jpg (see README).
 */

export const categories = [
  {
    slug: "handpainted",
    label: "Handpainted",
    blurb: "Every motif painted by hand, so no two pieces are exactly alike.",
  },
  { slug: "bridal", label: "Bridal & suits", blurb: "Handpainted suits and dupattas for weddings and celebrations." },
  {
    slug: "designer",
    label: "Designer mekhela sador",
    blurb: "Embroidered and designed sets from the Durga Puja collection.",
  },
  { slug: "handloom", label: "Handloom cotton", blurb: "Handloom wash cotton and staple cotton mekhela sador." },
  { slug: "everyday", label: "Everyday cotton", blurb: "The MM cotton range, easy to wear and easy on the budget." },
  { slug: "offers", label: "Offers", blurb: "Combos and festive offer prices while stock lasts." },
] as const;

export type CategorySlug = (typeof categories)[number]["slug"];

export type Product = {
  slug: string;
  name: string;
  category: CategorySlug;
  /** One line, shown on cards and as the lede on the product page. */
  description: string;
  /** Price in INR, or null for "Price on request". */
  price: number | null;
  /** Image keys from src/data/image-meta.json, first is the cover. */
  images: string[];
  soldOut: boolean;
  featured: boolean;
  /** Alt text for the cover image. */
  alt: string;
};

export const products: Product[] = [
  {
    slug: "hp-lavender",
    name: "Lavender handpainted saree",
    category: "handpainted",
    description: "Hand-painted florals on soft lavender, our most-ordered design",
    price: null,
    images: ["products/hp-lavender"],
    soldOut: false,
    featured: true,
    alt: "Model in a lavender saree with blue handpainted florals",
  },
  {
    slug: "hp-lotus-green",
    name: "Lotus handpainted mekhela sador",
    category: "handpainted",
    description: "Pink lotus clusters painted on fresh green",
    price: null,
    images: ["products/hp-lotus-green"],
    soldOut: false,
    featured: true,
    alt: "Green mekhela sador with handpainted pink lotus clusters",
  },
  {
    slug: "hp-blue-floral",
    name: "Floral handpainted mekhela sador, royal blue",
    category: "handpainted",
    description: "Mixed garden florals on a deep blue base",
    price: null,
    images: ["products/hp-blue-floral"],
    soldOut: false,
    featured: true,
    alt: "Royal blue mekhela sador with a handpainted bouquet of garden flowers",
  },
  {
    slug: "hp-sky",
    name: "Handpainted pair, sky blue",
    category: "handpainted",
    description: "Blue lotus painting with scalloped lace edge",
    price: null,
    images: ["products/hp-sky"],
    soldOut: false,
    featured: true,
    alt: "Sky blue handpainted pair with blue lotus painting",
  },
  {
    slug: "hp-pink-rose",
    name: "Handpainted mekhela sador, rani pink",
    category: "handpainted",
    description: "Painted roses on a bright rani pink base",
    price: null,
    images: ["products/hp-pink-rose"],
    soldOut: false,
    featured: true,
    alt: "Rani pink mekhela sador with handpainted roses",
  },
  {
    slug: "hp-white-lotus",
    name: "Lotus handpainted saree, white",
    category: "handpainted",
    description: "Red lotus and leaves on white",
    price: null,
    images: ["products/hp-white-lotus"],
    soldOut: false,
    featured: true,
    alt: "White saree with handpainted red lotus flowers and green leaves",
  },
  {
    slug: "hp-wisteria",
    name: "Handpainted suit with dupatta",
    category: "bridal",
    description: "Wisteria vines painted on white, with purple dupatta",
    price: null,
    images: ["products/hp-wisteria"],
    soldOut: false,
    featured: false,
    alt: "White suit with handpainted wisteria vines and a purple dupatta",
  },
  {
    slug: "ds-seagreen",
    name: "Embroidered mekhela sador, sea green",
    category: "designer",
    description: "Durga Puja collection, designed by ND Attire",
    price: 1900,
    images: ["products/ds-seagreen"],
    soldOut: false,
    featured: false,
    alt: "Sea green embroidered mekhela sador held up in the studio",
  },
  {
    slug: "ds-green",
    name: "Embroidered mekhela sador, emerald",
    category: "designer",
    description: "Durga Puja collection, designed by ND Attire",
    price: 1450,
    images: ["products/ds-green"],
    soldOut: false,
    featured: false,
    alt: "Emerald embroidered mekhela sador with paisley work",
  },
  {
    slug: "ds-pink",
    name: "Embroidered mekhela sador, magenta",
    category: "designer",
    description: "Durga Puja collection, designed by ND Attire",
    price: 1450,
    images: ["products/ds-pink"],
    soldOut: false,
    featured: false,
    alt: "Magenta embroidered mekhela sador with floral work",
  },
  {
    slug: "ds-red",
    name: "Designed mekhela sador, red",
    category: "designer",
    description: "Durga Puja special with woven border work",
    price: null,
    images: ["products/ds-red"],
    soldOut: false,
    featured: false,
    alt: "Red mekhela sador with a multicoloured woven border",
  },
  {
    slug: "hl-wash-red",
    name: "Handloom wash cotton, red",
    category: "handloom",
    description: "Handloom wash cotton mekhela sador",
    price: 1500,
    images: ["products/hl-wash-red"],
    soldOut: false,
    featured: false,
    alt: "Red handloom wash cotton mekhela sador with white woven motifs",
  },
  {
    slug: "hl-wash-wine",
    name: "Handloom wash cotton, wine",
    category: "handloom",
    description: "Handloom wash cotton mekhela sador",
    price: 1500,
    images: ["products/hl-wash-wine"],
    soldOut: false,
    featured: false,
    alt: "Wine handloom wash cotton mekhela sador with yellow and white motifs",
  },
  {
    slug: "hl-wash-pink",
    name: "Handloom wash cotton, pink",
    category: "handloom",
    description: "Handloom wash cotton mekhela sador",
    price: 1500,
    images: ["products/hl-wash-pink"],
    soldOut: false,
    featured: false,
    alt: "Pink handloom wash cotton mekhela sador",
  },
  {
    slug: "hl-staple-blue",
    name: "Handloom staple cotton, royal blue",
    category: "handloom",
    description: "Handloom staple cotton mekhela sador",
    price: 1450,
    images: ["products/hl-staple-blue"],
    soldOut: false,
    featured: false,
    alt: "Royal blue handloom staple cotton mekhela sador with white woven motifs",
  },
  {
    slug: "hl-staple-purple",
    name: "Handloom staple cotton, purple",
    category: "handloom",
    description: "Handloom staple cotton mekhela sador",
    price: 1450,
    images: ["products/hl-staple-purple"],
    soldOut: true,
    featured: false,
    alt: "Purple handloom staple cotton mekhela sador with an orange woven border",
  },
  {
    slug: "mm-padmini",
    name: "MM Padmini cotton",
    category: "everyday",
    description: "Padmini cotton mekhela sador",
    price: 999,
    images: ["products/mm-padmini"],
    soldOut: false,
    featured: false,
    alt: "Magenta Padmini cotton mekhela sador with a woven border",
  },
  {
    slug: "mm-masrise",
    name: "MM Masrise cotton",
    category: "everyday",
    description: "Masrise cotton mekhela sador",
    price: 999,
    images: ["products/mm-masrise"],
    soldOut: false,
    featured: false,
    alt: "Rust Masrise cotton mekhela sador held open",
  },
  {
    slug: "mm-wash",
    name: "MM wash cotton",
    category: "everyday",
    description: "Wash cotton mekhela sador for daily wear",
    price: 799,
    images: ["products/mm-wash"],
    soldOut: false,
    featured: false,
    alt: "White wash cotton mekhela sador with a colourful woven border",
  },
  {
    slug: "of-semipat",
    name: "Semi pat jura",
    category: "offers",
    description: "Dhamaka offer price",
    price: 900,
    images: ["products/of-semipat"],
    soldOut: false,
    featured: false,
    alt: "Pink semi pat mekhela sador spread out in the studio",
  },
  {
    slug: "of-combo",
    name: "Combo: two mekhela sador",
    category: "offers",
    description: "Any two mekhela sador from the combo range",
    price: 1199,
    images: ["products/of-combo"],
    soldOut: false,
    featured: false,
    alt: "Stacks of packed ND Attire orders in the studio",
  },
];

export const categoryLabel = (slug: CategorySlug) => categories.find((c) => c.slug === slug)?.label ?? slug;

export const getProduct = (slug: string) => products.find((p) => p.slug === slug);

export const productsIn = (category: CategorySlug) => products.filter((p) => p.category === category);

export const isCategory = (s: string | null | undefined): s is CategorySlug =>
  !!s && categories.some((c) => c.slug === s);

/** Handpainted pieces get the tea-green "Handpainted" tag. */
export const isHandpainted = (p: Product) => p.category === "handpainted" || p.category === "bridal";
