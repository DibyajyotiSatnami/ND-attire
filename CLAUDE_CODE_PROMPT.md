# Build the ND Attire ecommerce website

You are building a premium ecommerce website for **ND Attire**, a women's ethnic wear brand selling handpainted mekhela sador, sarees, bridal dupattas and handloom cotton sets. This is client work, and the brand owner must see it and feel her label has become a luxury boutique. Treat polish, image quality and motion as first-class requirements, not finishing touches.

Read this whole file before writing code. Then make a short plan, confirm it against the requirements below, and build in the phases listed at the end.

---

## 1. Project assets (already in this folder)

```
source-images/
  products/<product-slug>.jpg   ← one image per product, named by slug (low-res, from Instagram)
  brand/logo.png                ← circular logo with tagline
  brand/founder-studio.jpg      ← founder holding a handpainted saree in the studio
  brand/handpainting-process.jpg← brush painting a mekhela sador
  brand/orders-packed.jpg       ← stacks of packed orders
  brand/client-1.jpg, client-2.jpg ← happy clients
  originals/                    ← (may be empty) high-res originals from the client — ALWAYS prefer these
reference/nd-attire-demo.html   ← approved single-file demo: copy its content, palette, flow and copywriting
```

Open `reference/nd-attire-demo.html` first. The client has seen it. Keep its structure, copy, palette and WhatsApp ordering flow, then raise everything to a premium level.

---

## 2. Brand facts (use exactly, do not invent others)

- Brand: **ND Attire**
- Tagline: **"Style that Speaks, Comfort that lasts"**
- Founder: **Nikita Dutta** (Instagram @nikita_dutta1999)
- Speciality: **handpainted attire and bridal dupattas**
- Social proof: **1,000+ orders**, 5,000+ Instagram followers
- Instagram: https://www.instagram.com/nd_attire7/
- WhatsApp (orders): **+91 75768 43822** → `https://wa.me/917576843822`
- Collections seen on her feed: Durga Puja Collection, handpainted pairs, designer embroidered mekhela sador, handloom wash cotton, handloom staple cotton, MM cotton everyday range, offers and combos.

Do **not** invent: a street address or city, delivery times, return policy, fabric care claims, reviews/quotes, or prices for "on request" items. Where the site needs them, create clearly marked config values in `src/config/site.ts` with `TODO(client)` comments so they can be filled in later, and hide those UI blocks while the value is empty.

---

## 3. Tech stack

- **Next.js (latest, App Router) + TypeScript**, static-first (SSG), deployable to Vercel
- **Tailwind CSS** with design tokens as CSS variables
- **Motion** for animation — the library formerly called Framer Motion. Install `motion` and import from `motion/react` (check the installed version's docs; fall back to `framer-motion` only if needed)
- **Zustand** with `persist` middleware for the bag (localStorage, guarded)
- `next/image` for every image, with AVIF/WebP and blur placeholders
- `next/font/google` for fonts (self-hosted, no layout shift)
- `sharp` for the image build script
- No UI kit. Build components by hand so the look is bespoke.

---

## 4. Image quality pipeline (critical)

The current product images are Instagram grid thumbnails (~200–430 px wide) with burned-in text ("To order whatsapp us 7576843822", prices, "ND Attire") and Instagram play/pin icons. They must look sharp and clean on a premium site.

Create `scripts/process-images.(py|ts)` and run it. Steps per image:

1. **Source selection.** If `source-images/originals/<slug>.*` exists, use it and skip steps 2–3.
2. **Clean overlays.** Detect burned-in text and UI icons, then remove them:
   - Detect text regions with EasyOCR (`pip install easyocr`); also mask the top-right ~14% corner where Instagram icons sit.
   - Dilate the masks by ~6 px and inpaint with **LaMa via IOPaint** (`pip install iopaint`, `iopaint run --model=lama --device=cpu --image=... --mask=... --output=...`).
   - If inpainting leaves visible smears on fabric patterns, fall back to a tighter crop that excludes the text, and log it.
3. **Upscale 4×** with **Real-ESRGAN** (prefer the `realesrgan-ncnn-vulkan` release binary from github.com/xinntao/Real-ESRGAN with `realesrgan-x4plus`; use the Python package if the binary can't run). Then apply a light unsharp mask and a gentle contrast/vibrance lift. Do not oversaturate, because fabric colour must stay true for customers.
4. **Export** with sharp to `public/images/products/<slug>/` as AVIF + WebP at 1600 px on the long edge, 4:5 crop with subject-aware positioning. Generate a 16 px blur placeholder (base64) into `src/data/image-meta.json`.
5. **Review sheet.** Write `scripts/output/review.html` showing before/after for every image side by side, with a flag list of any image that needed the crop fallback. Tell me which images are weakest so I can request originals from the client.

Do the same for `source-images/brand/*` (except the logo). For the logo: trace it to a clean **SVG** (potrace or vtracer). If tracing looks rough, upscale the PNG 4× and keep it as PNG. Also produce a favicon set and a 1200×630 Open Graph image using the logo on the brand palette.

---

## 5. Design direction

**Feel:** a quiet, confident handloom boutique, not a marketplace. Big imagery, generous whitespace, few elements, everything aligned to a strict grid. The memorable element is the **mekhela woven border motif** (diamond band in rose and muga gold on plum). Use it sparingly as a signature: under the header, framing the hero image, as section dividers, and in loading states. Nowhere else.

**Colour tokens** (light; keep the dark-mode set from the demo):
| Token | Hex | Use |
|---|---|---|
| paper | `#FFF8FA` | page background (blush white, not cream) |
| ink | `#2B1630` | text, footer background |
| plum | `#5E2A63` | headings, primary UI |
| rose | `#C2185B` | prices, primary CTA |
| muga | `#B8862E` / light `#E2B54F` | gold accents, the woven band, focus rings |
| teal | `#2F6F6A` | "handpainted" tags, secondary accents (from logo line-art) |
| wa | `#1F8F4E` | WhatsApp actions only |

**Type:** Young Serif for display (headings, prices) and Mukta for body/UI. Set a real type scale (e.g. 1.250 ratio), headings with slight negative tracking, body at 17–18 px with 1.6 line height, line length under 70 characters. Use sentence case everywhere. No all-caps eyebrow labels, and don't accent single words in headlines.

**Imagery:** 4:5 product images, edge-to-edge on mobile. Use a consistent subtle warm grade. Product cards are borderless, with image, name, one line of description and price, and the action revealed on hover (desktop) / always visible (mobile).

**Avoid:** generic SaaS cards with identical shadows, gradient washes, stock icons everywhere, "→" on every link, numbered markers on things that aren't sequences (the 4-step ordering process is a real sequence, so numbering it is fine).

---

## 6. Motion (Motion / Framer Motion)

Motion should feel like fabric: soft, weighted, unhurried. Use one shared config: spring `{ stiffness: 120, damping: 20, mass: 0.9 }` for UI, and easing `[0.22, 1, 0.36, 1]` at 0.6–0.9 s for reveals. Wrap the app in `<MotionConfig reducedMotion="user">` and make every effect degrade gracefully.

Build these specific moments, and nothing gratuitous beyond them:

1. **Hero load sequence** (the one orchestrated moment): the woven band "weaves" in from left to right (clip-path / scaleX), then the headline reveals line by line with a mask, then the hero image unveils inside its border frame (clip-path inset from 100% → 0 with a slight scale 1.08 → 1), then the CTAs fade in. Total ≤ 1.8 s, and it plays once per session.
2. **Hero image parallax:** subtle `useScroll` + `useTransform` (max ~40 px), desktop only.
3. **Collection grid:** staggered entrance when the grid first enters the viewport (`whileInView`, `once: true`). Filtering uses `layout` + `AnimatePresence` so cards reflow smoothly instead of jumping.
4. **Product card hover (desktop):** image scales to 1.04 over 0.8 s; a second image crossfades in if available; the "Add to bag" button slides up from the card bottom.
5. **Card → product page:** a shared-element transition using `layoutId` on the product image, so the image grows into the product page gallery.
6. **Add to bag:** a small thumbnail flies along a curved path to the bag icon, then the bag count does a spring bump. The button text changes to "Added to bag" with a check, then back to "Add another".
7. **Bag drawer:** slides in with spring, scrim fades, items animate in/out with `AnimatePresence`, and the total animates numerically when it changes.
8. **Section dividers:** the woven band draws in once when scrolled into view.
9. **Mobile menu:** full-screen overlay with staggered links.

Respect `prefers-reduced-motion`. Keep it 60 fps by animating only transform, opacity and clip-path, and never animate layout-heavy properties.

---

## 7. Pages and features

- **Home** `/`: hero (headline "Mekhela sador, painted by hand.", lede, "Shop the collection" + "Order on WhatsApp", 1,000+ orders line), featured handpainted collection (horizontal scroll-snap carousel), collection tiles for each category, the "How ordering works" 4 steps, founder story with studio + painting-process images, happy clients strip, Instagram CTA, footer.
- **Shop** `/shop`: all products with category filter chips (synced to URL `?category=`), sort (featured / price low-high / high-low), and a "Sold out" state.
- **Category** `/collections/[category]`: statically generated.
- **Product** `/product/[slug]`: large gallery (swipe on mobile, thumbnails on desktop, pinch/click zoom), name, price or "Price on request", description, category, quantity, "Add to bag" or "Ask price on WhatsApp", a short "How ordering works" note, related products, and Product JSON-LD.
- **Our story** `/about`: founder, handpainting craft, studio images.
- **Bag drawer** (global): items, quantity steppers, remove, total, name + delivery address fields, and **"Send order on WhatsApp"**, which opens `wa.me` with a formatted message:
  ```
  Hi ND Attire, I'd like to order:
  • <name> × <qty> = ₹<line total>
  Total: ₹<total>

  Name: <name>
  Delivery address: <address>
  ```
  "Ask price" buttons send: `Hi ND Attire, I'm interested in the <product name>. Could you share the price and availability?` with a link to the product page.
- **Floating WhatsApp button** on mobile (bottom-right, respecting safe-area insets), hidden while the bag is open.
- **404 page** in brand style.

Architect checkout behind an interface (`src/lib/checkout.ts`) so a payment gateway (Razorpay) can be added later without touching UI components. Do not build payments now.

---

## 8. Product data

Put products in `src/data/products.ts` (typed). Fields: `slug, name, category, description, price | null, images[], soldOut, featured`. Prices in INR, formatted with `en-IN` grouping.

| slug | name | category | price (₹) |
|---|---|---|---|
| `hp-lavender` | Lavender handpainted saree | handpainted | on request (featured, hero) |
| `hp-lotus-green` | Lotus handpainted mekhela sador | handpainted | on request |
| `hp-blue-floral` | Floral handpainted mekhela sador, royal blue | handpainted | on request |
| `hp-sky` | Handpainted pair, sky blue | handpainted | on request |
| `hp-pink-rose` | Handpainted mekhela sador, rani pink | handpainted | on request |
| `hp-white-lotus` | Lotus handpainted saree, white | handpainted | on request |
| `hp-wisteria` | Handpainted suit with dupatta | bridal | on request |
| `ds-seagreen` | Embroidered mekhela sador, sea green | designer | 1900 |
| `ds-green` | Embroidered mekhela sador, emerald | designer | 1450 |
| `ds-pink` | Embroidered mekhela sador, magenta | designer | 1450 |
| `ds-red` | Designed mekhela sador, red | designer | on request |
| `hl-wash-red` | Handloom wash cotton, red | handloom | 1500 |
| `hl-wash-wine` | Handloom wash cotton, wine | handloom | 1500 |
| `hl-wash-pink` | Handloom wash cotton, pink | handloom | 1500 |
| `hl-staple-blue` | Handloom staple cotton, royal blue | handloom | 1450 |
| `hl-staple-purple` | Handloom staple cotton, purple | handloom | 1450 (sold out) |
| `mm-padmini` | MM Padmini cotton | everyday | 999 |
| `mm-masrise` | MM Masrise cotton | everyday | 999 |
| `mm-wash` | MM wash cotton | everyday | 799 |
| `of-semipat` | Semi pat jura | offers | 900 |
| `of-combo` | Combo: two mekhela sador | offers | 1199 |

Category labels: Handpainted · Bridal & suits · Designer mekhela sador · Handloom cotton · Everyday cotton · Offers. Reuse the one-line descriptions from the demo file.

Make adding a product a one-file change, and document it in the README so the client (or I) can add new stock easily.

---

## 9. Quality bar (must pass before you say "done")

- Lighthouse mobile: Performance ≥ 90, Accessibility ≥ 95, Best Practices ≥ 95, SEO ≥ 95
- No layout shift from fonts or images (CLS < 0.05)
- Fully responsive from 360 px to 1920 px; test 390×844 and 1440×900
- Keyboard accessible: visible focus rings (muga gold), focus trap in the bag drawer and menu, Esc closes overlays, alt text on every image
- Light and dark mode both polished
- SEO: per-page metadata, Open Graph image, `sitemap.xml`, `robots.txt`, Product + Organization JSON-LD
- Zero console errors; `npm run build` passes with no type errors
- Take Playwright screenshots of every page at mobile and desktop sizes into `scripts/output/screens/`, review them yourself, and fix anything that looks off before finishing

---

## 10. Build phases

1. Scaffold the project, tokens, fonts, layout shell, and woven band component. Show me a screenshot.
2. Run the image pipeline and generate the review sheet. Pause and summarise image quality so I can decide on requesting originals.
3. Build home, shop, product pages, and the bag + WhatsApp checkout.
4. Add the motion layer (section 6).
5. Do the QA pass (section 9), then write the README: how to run, add products, swap images, deploy to Vercel, and the list of `TODO(client)` items.

At the end, list exactly what still needs input from the client.
