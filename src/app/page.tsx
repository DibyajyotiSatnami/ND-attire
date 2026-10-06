import { Hero } from "@/components/home/Hero";
import { NewArrivals } from "@/components/home/NewArrivals";
import { CollectionTiles } from "@/components/home/CollectionTiles";
import { FeaturedCollection } from "@/components/home/FeaturedCollection";
import { HowToOrder } from "@/components/home/HowToOrder";
import { FounderStory } from "@/components/home/FounderStory";
import { ClientsStrip } from "@/components/home/ClientsStrip";
import { InstagramGallery } from "@/components/home/InstagramGallery";
import { WeaveDivider } from "@/components/WovenBand";
import { newArrivals } from "@/data/products";

export default function Home() {
  return (
    <>
      <Hero />
      <NewArrivals products={newArrivals()} />
      <WeaveDivider />
      <CollectionTiles />
      <FeaturedCollection />
      <FounderStory />
      <HowToOrder />
      <ClientsStrip />
      <WeaveDivider />
      <InstagramGallery />
    </>
  );
}
