import type { NextConfig } from "next";
import { movedProducts } from "./src/data/products";

/**
 * Two build targets:
 * - default (`npm run build`): a Node/Vercel build with the image optimiser and redirects.
 * - GitHub Pages (`npm run build:pages`): a fully static export in `out/`, served from
 *   BASE_PATH (e.g. "/ND-attire" for https://<user>.github.io/ND-attire/).
 */
const pages = process.env.GITHUB_PAGES === "true";
const basePath = (process.env.BASE_PATH ?? "").replace(/\/$/, "");

const images: NextConfig["images"] = {
  formats: ["image/avif", "image/webp"],
  qualities: [75, 85],
  deviceSizes: [360, 480, 640, 828, 1080, 1280, 1600, 1920],
  imageSizes: [32, 64, 96, 128, 256, 384],
};

const nextConfig: NextConfig = pages
  ? {
      output: "export",
      trailingSlash: true,
      basePath,
      env: { NEXT_PUBLIC_BASE_PATH: basePath },
      // no image server on GitHub Pages: pick the pre-built 800 / 1600 px files instead
      images: { ...images, loader: "custom", loaderFile: "./src/lib/image-loader.ts" },
    }
  : {
      images,
      // single-colour product pages that became colour options on one product
      async redirects() {
        return Object.entries(movedProducts).map(([from, to]) => ({
          source: `/product/${from}`,
          destination: `/product/${to.slug}?colour=${encodeURIComponent(to.colour)}`,
          permanent: true,
        }));
      },
    };

export default nextConfig;
