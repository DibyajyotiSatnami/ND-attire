import { Hero } from "@/components/home/Hero";
import { FeaturedCarousel } from "@/components/home/FeaturedCarousel";
import { CollectionTiles } from "@/components/home/CollectionTiles";
import { HowToOrder } from "@/components/home/HowToOrder";
import { FounderStory } from "@/components/home/FounderStory";
import { ClientsStrip } from "@/components/home/ClientsStrip";
import { InstagramCta } from "@/components/home/InstagramCta";
import { WeaveDivider } from "@/components/WovenBand";
import { products } from "@/data/products";

export default function Home() {
  const featured = products.filter((p) => p.featured);
  return (
    <>
      <Hero />
      <FeaturedCarousel products={featured} />
      <WeaveDivider />
      <CollectionTiles />
      <HowToOrder />
      <FounderStory />
      <WeaveDivider className="mt-6" />
      <ClientsStrip />
      <InstagramCta />
    </>
  );
}
