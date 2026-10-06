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

/**
 * A colourway. Products with one colour show it as a fixed label; products with
 * several show a required colour picker.
 */
export type Colour = {
  name: string;
  /** Groups shades for the shop's colour filter, e.g. "Wine" → "Red". */
  family: string;
  /** Swatch colour for the picker and the colour filter. */
  swatch: string;
  /** Image key shown when this colour is picked (defaults to the cover). */
  image?: string;
  /** Alt text for that image. */
  alt?: string;
  /** This colour alone is sold out. */
  soldOut?: boolean;
};

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
  /** Shown in "New arrivals" on the home page. */
  newArrival?: boolean;
  /** Alt text for the cover image. */
  alt: string;
  colours: Colour[];
  /**
   * Sizes the customer must choose from, e.g. ["S", "M", "L"]. Leave out for
   * free-size or unstitched pieces: no size picker is shown. Sizes listed here
   * also appear in the shop's size filter and turn on the size guide.
   */
  sizes?: string[];
  /** Shown on the product page only when filled in. */
  details?: {
    fabric?: string;
    /** Overrides site.fabricCare for this piece. */
    care?: string;
    /** Overrides site.deliveryTimes for this piece. */
    delivery?: string;
  };
};

const WHITE = "#f4efe6";

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
    colours: [{ name: "Lavender", family: "Purple", swatch: "#b9a3d6" }],
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
    colours: [{ name: "Green", family: "Green", swatch: "#93cf6b" }],
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
    colours: [{ name: "Royal blue", family: "Blue", swatch: "#1f4fbf" }],
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
    colours: [{ name: "Sky blue", family: "Blue", swatch: "#8cc8e6" }],
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
    colours: [{ name: "Rani pink", family: "Pink", swatch: "#d0127e" }],
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
    colours: [{ name: "White", family: "White", swatch: WHITE }],
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
    colours: [{ name: "White with purple dupatta", family: "White", swatch: WHITE }],
    // TODO(client): add the suit sizes she makes, e.g. sizes: ["S", "M", "L", "XL"]
  },
  // TODO(client): newArrival marks the Durga Puja pieces as the latest drop. Move
  // it to whichever pieces are actually newest.
  {
    slug: "ds-seagreen",
    name: "Embroidered mekhela sador, sea green",
    category: "designer",
    description: "Durga Puja collection, designed by ND Attire",
    price: 1900,
    images: ["products/ds-seagreen"],
    soldOut: false,
    featured: false,
    newArrival: true,
    alt: "Sea green embroidered mekhela sador held up in the studio",
    colours: [{ name: "Sea green", family: "Green", swatch: "#8fc9b4" }],
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
    newArrival: true,
    alt: "Emerald embroidered mekhela sador with paisley work",
    colours: [{ name: "Emerald", family: "Green", swatch: "#0d8a4f" }],
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
    newArrival: true,
    alt: "Magenta embroidered mekhela sador with floral work",
    colours: [{ name: "Magenta", family: "Pink", swatch: "#d0157f" }],
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
    newArrival: true,
    alt: "Red mekhela sador with a multicoloured woven border",
    colours: [{ name: "Red", family: "Red", swatch: "#c4111d" }],
  },
  {
    slug: "hl-wash-cotton",
    name: "Handloom wash cotton mekhela sador",
    category: "handloom",
    description: "Handloom wash cotton with woven motifs, in three colours",
    price: 1500,
    images: ["products/hl-wash-red", "products/hl-wash-wine", "products/hl-wash-pink"],
    soldOut: false,
    featured: false,
    alt: "Red handloom wash cotton mekhela sador with white woven motifs",
    colours: [
      { name: "Red", family: "Red", swatch: "#c0102a", image: "products/hl-wash-red" },
      {
        name: "Wine",
        family: "Red",
        swatch: "#7a3048",
        image: "products/hl-wash-wine",
        alt: "Wine handloom wash cotton mekhela sador with yellow and white motifs",
      },
      {
        name: "Pink",
        family: "Pink",
        swatch: "#e070b8",
        image: "products/hl-wash-pink",
        alt: "Pink handloom wash cotton mekhela sador",
      },
    ],
    details: { fabric: "Handloom wash cotton" },
  },
  {
    slug: "hl-staple-cotton",
    name: "Handloom staple cotton mekhela sador",
    category: "handloom",
    description: "Handloom staple cotton with a woven border",
    price: 1450,
    images: ["products/hl-staple-blue", "products/hl-staple-purple"],
    soldOut: false,
    featured: false,
    alt: "Royal blue handloom staple cotton mekhela sador with white woven motifs",
    colours: [
      { name: "Royal blue", family: "Blue", swatch: "#1a2fb0", image: "products/hl-staple-blue" },
      {
        name: "Purple",
        family: "Purple",
        swatch: "#5b2a9e",
        image: "products/hl-staple-purple",
        alt: "Purple handloom staple cotton mekhela sador with an orange woven border",
        soldOut: true,
      },
    ],
    details: { fabric: "Handloom staple cotton" },
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
    colours: [{ name: "Magenta", family: "Pink", swatch: "#c41a6a" }],
    details: { fabric: "Padmini cotton" },
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
    colours: [{ name: "Rust", family: "Orange", swatch: "#c86a52" }],
    details: { fabric: "Masrise cotton" },
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
    colours: [{ name: "White", family: "White", swatch: WHITE }],
    details: { fabric: "Wash cotton" },
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
    colours: [{ name: "Pink", family: "Pink", swatch: "#f0a6c6" }],
    details: { fabric: "Semi pat" },
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
    // colours are picked from the combo range on WhatsApp
    colours: [],
  },
];

export const categoryLabel = (slug: CategorySlug) => categories.find((c) => c.slug === slug)?.label ?? slug;

export const getProduct = (slug: string) => products.find((p) => p.slug === slug);

export const productsIn = (category: CategorySlug) => products.filter((p) => p.category === category);

export const isCategory = (s: string | null | undefined): s is CategorySlug =>
  !!s && categories.some((c) => c.slug === s);

/** Handpainted pieces get the tea-green "Handpainted" tag. */
export const isHandpainted = (p: Product) => p.category === "handpainted" || p.category === "bridal";

/** Old URLs that now live on a product with colour options. */
export const movedProducts: Record<string, { slug: string; colour: string }> = {
  "hl-wash-red": { slug: "hl-wash-cotton", colour: "Red" },
  "hl-wash-wine": { slug: "hl-wash-cotton", colour: "Wine" },
  "hl-wash-pink": { slug: "hl-wash-cotton", colour: "Pink" },
  "hl-staple-blue": { slug: "hl-staple-cotton", colour: "Royal blue" },
  "hl-staple-purple": { slug: "hl-staple-cotton", colour: "Purple" },
};

/** Every colour of the piece is sold out, or the piece itself is. */
export const isSoldOut = (p: Product) => p.soldOut || (p.colours.length > 0 && p.colours.every((c) => c.soldOut));

/** The customer has to pick a colour or size before ordering. */
export const needsChoice = (p: Product) => p.colours.length > 1 || (p.sizes?.length ?? 0) > 1;

export const newArrivals = () => products.filter((p) => p.newArrival);
