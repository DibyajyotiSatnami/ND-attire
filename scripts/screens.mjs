// Playwright screenshots of every page at mobile and desktop sizes.
//   npm run build && npm start   (in another terminal)
//   npm run screens              -> scripts/output/screens/*.jpg
// BASE_URL defaults to http://localhost:3000. Also fails on any console error.
import { chromium } from "@playwright/test";
import fs from "node:fs/promises";

const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const OUT = new URL("./output/screens/", import.meta.url).pathname;
const pages = [
  ["home", "/"],
  ["shop", "/shop"],
  ["shop-handloom", "/shop?category=handloom"],
  ["collection-handpainted", "/collections/handpainted"],
  ["product-priced", "/product/ds-seagreen"],
  ["product-on-request", "/product/hp-lavender"],
  ["product-colours", "/product/hl-wash-cotton"],
  ["product-sold-out-colour", "/product/hl-staple-cotton?colour=purple"],
  ["shop-search-empty", "/shop?q=velvet"],
  ["about", "/about"],
  ["contact", "/contact"],
  ["policy-delivery", "/policies/delivery"],
  ["404", "/nope"],
];
const viewports = [
  ["mobile", { width: 390, height: 844 }, 2, true],
  ["desktop", { width: 1440, height: 900 }, 1, false],
];
const schemes = (process.env.SCHEMES ?? "light,dark").split(",");

await fs.mkdir(OUT, { recursive: true });
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || undefined /* e.g. /opt/pw-browsers/chromium */,
});
const errors = [];

for (const scheme of schemes) {
  for (const [vname, viewport, dpr, mobile] of viewports) {
    const ctx = await browser.newContext({
      viewport,
      deviceScaleFactor: dpr,
      isMobile: mobile,
      hasTouch: mobile,
      colorScheme: scheme,
      reducedMotion: "reduce",
    });
    for (const [name, path] of pages) {
      const page = await ctx.newPage();
      page.on("console", (m) => {
        // the 404 page itself is meant to answer 404
        if (m.type() === "error" && !(name === "404" && m.text().includes("404")))
          errors.push(`${scheme}/${vname}${path}: ${m.text()}`);
      });
      page.on("pageerror", (e) => errors.push(`${scheme}/${vname}${path}: ${e.message}`));
      await page.goto(BASE + path, { waitUntil: "networkidle" });
      // scroll through so whileInView reveals fire and lazy images load
      await page.evaluate(async () => {
        for (let y = 0; y < document.body.scrollHeight; y += 500) {
          window.scrollTo(0, y);
          await new Promise((r) => setTimeout(r, 120));
        }
        window.scrollTo(0, 0);
      });
      await page.waitForTimeout(600);
      await page.screenshot({
        path: `${OUT}${name}-${vname}-${scheme}.jpg`,
        fullPage: true,
        type: "jpeg",
        quality: 80,
      });
      await page.close();
    }
    await ctx.close();
  }
}

// interaction states (light)
const ctx = await browser.newContext({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
  isMobile: true,
  hasTouch: true,
});
const page = await ctx.newPage();
page.on("console", (m) => m.type() === "error" && errors.push(`interaction: ${m.text()}`));
await page.goto(BASE + "/product/ds-seagreen", { waitUntil: "networkidle" });
await page.getByRole("button", { name: "Add to bag" }).first().click();
await page.waitForTimeout(1200);
await page.getByRole("button", { name: /^Bag/ }).click();
await page.waitForTimeout(800);
await page.screenshot({ path: `${OUT}bag-open-mobile-light.jpg`, type: "jpeg", quality: 85 });
await page.keyboard.press("Escape");
await page.getByRole("button", { name: "Open menu" }).click();
await page.waitForTimeout(900);
await page.screenshot({ path: `${OUT}menu-open-mobile-light.jpg`, type: "jpeg", quality: 85 });
await ctx.close();

await browser.close();
if (errors.length) {
  console.error("Console errors:\n" + errors.join("\n"));
  process.exitCode = 1;
} else console.log(`Screens written to ${OUT}, no console errors.`);
