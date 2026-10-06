import type { NextConfig } from "next";
import { movedProducts } from "./src/data/products";

const nextConfig: NextConfig = {
  images: {
    formats: ["image/avif", "image/webp"],
    qualities: [75, 85],
    deviceSizes: [360, 480, 640, 828, 1080, 1280, 1600, 1920],
    imageSizes: [32, 64, 96, 128, 256, 384],
  },
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
