// Export processed PNGs to web formats and build the review sheet.
//
//   scripts/output/processed/<group>/<slug>.png
//     -> public/images/<group>/<slug>/{1600,800}.{avif,webp}
//     -> src/data/image-meta.json  { "<group>/<slug>": { width, height, blurDataURL, src } }
//     -> scripts/output/review.html (before / mask / after for every image)
//
// Run by scripts/process-images.py, or on its own: `node scripts/export-images.mjs`.
import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const OUT = path.join(ROOT, "scripts/output");
const PROCESSED = path.join(OUT, "processed");
const PUBLIC = path.join(ROOT, "public/images");
const META = path.join(ROOT, "src/data/image-meta.json");

const LONG_EDGE = 1600;
const SIZES = [1600, 800];

const manifest = JSON.parse(await fs.readFile(path.join(OUT, "manifest.json"), "utf8"));
const meta = {};

for (const group of ["products", "brand"]) {
  const dir = path.join(PROCESSED, group);
  const files = (await fs.readdir(dir).catch(() => [])).filter((f) => f.endsWith(".png")).sort();
  for (const file of files) {
    const slug = path.basename(file, ".png");
    const src = path.join(dir, file);
    const dest = path.join(PUBLIC, group, slug);
    await fs.mkdir(dest, { recursive: true });

    // 4:5 at 1600 px on the long edge (1280 x 1600)
    const base = sharp(src).resize({
      width: Math.round((LONG_EDGE * 4) / 5),
      height: LONG_EDGE,
      fit: "cover",
      position: "attention",
      kernel: "lanczos3",
    });
    const master = await base.png().toBuffer();
    for (const size of SIZES) {
      const w = Math.round((size * 4) / 5);
      const img = sharp(master).resize({ width: w, height: size, kernel: "lanczos3" });
      await img
        .clone()
        .avif({ quality: 58, effort: 6, chromaSubsampling: "4:4:4" })
        .toFile(path.join(dest, `${size}.avif`));
      await img
        .clone()
        .webp({ quality: 84, effort: 6, smartSubsample: true })
        .toFile(path.join(dest, `${size}.webp`));
    }
    const blur = await sharp(master).resize(13, 16).webp({ quality: 50 }).toBuffer();
    meta[`${group}/${slug}`] = {
      src: `/images/${group}/${slug}/1600.webp`,
      width: Math.round((LONG_EDGE * 4) / 5),
      height: LONG_EDGE,
      blurDataURL: `data:image/webp;base64,${blur.toString("base64")}`,
    };
    console.log(`  exported ${group}/${slug}`);
  }
}

await fs.mkdir(path.dirname(META), { recursive: true });
await fs.writeFile(META, JSON.stringify(meta, null, 2) + "\n");

// ---------------------------------------------------------------- review sheet
const rows = Object.values(manifest)
  .sort((a, b) => (a.group + a.slug).localeCompare(b.group + b.slug))
  .map((m) => {
    const before = path.relative(OUT, path.join(ROOT, m.source));
    const after = path.relative(OUT, path.join(PUBLIC, m.group, m.slug, "800.webp"));
    const mask = `masks/${m.slug}.png`;
    const flags = m.flags.length ? `<ul class="flags">${m.flags.map((f) => `<li>${f}</li>`).join("")}</ul>` : "";
    return `<section class="${m.flags.length ? "flagged" : ""}">
  <h2>${m.group}/${m.slug}</h2>
  <p class="meta">mode: <b>${m.mode}</b>${m.inpaint ? ` · inpaint: ${m.inpaint}` : ""} · mask ${m.mask_pct ?? 0}% · texture ${m.texture ?? 0} · source ${m.source_size?.join("×") ?? "original"} → ${m.output_size.join("×")}</p>
  ${flags}
  <div class="pair">
    <figure><img src="${before}" alt=""><figcaption>Before</figcaption></figure>
    <figure><img src="${mask}" alt="" onerror="this.parentNode.remove()"><figcaption>Mask</figcaption></figure>
    <figure><img src="${after}" alt=""><figcaption>After</figcaption></figure>
  </div>
</section>`;
  });

const flagged = Object.values(manifest).filter((m) => m.flags.length);
await fs.writeFile(
  path.join(OUT, "review.html"),
  `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>ND Attire image review</title>
<style>
body{font:16px/1.5 system-ui,sans-serif;margin:0 auto;padding:24px;max-width:1300px;background:#FFF8FA;color:#2B1630}
h1{font-weight:500}h2{font-size:1.1rem;margin:0}
section{border-top:1px solid #EAD9E2;padding:20px 0}
section.flagged h2::after{content:" — flagged";color:#C2185B}
.meta{color:#6E5A70;margin:4px 0 8px;font-size:.9rem}
.flags{color:#C2185B;margin:0 0 10px;font-size:.92rem}
.pair{display:grid;grid-template-columns:1fr 1fr 1.6fr;gap:12px;align-items:start}
.pair img{width:100%;image-rendering:auto;border-radius:3px;background:#eee}
figure{margin:0}figcaption{font-size:.85rem;color:#6E5A70}
</style>
<h1>Image review: before / mask / after</h1>
<p>${Object.keys(manifest).length} images processed. ${flagged.length} flagged:</p>
<ul>${flagged.map((m) => `<li><b>${m.slug}</b>: ${m.flags.join("; ")}</li>`).join("")}</ul>
${rows.join("\n")}
</html>`,
);
console.log(`Wrote ${path.relative(ROOT, META)} and scripts/output/review.html`);
