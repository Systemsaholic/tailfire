import { FeaturedDestinations } from "@/components/FeaturedDestinations";
import { HeroSection } from "@/components/HeroSection";
import { PackagesSection } from "@/components/PackagesSection";
import { ServicesSection } from "@/components/ServicesSection";

export default function HomePage() {
  return (
    <>
      <HeroSection id="hero" />
      <FeaturedDestinations id="destinations" />
      <PackagesSection id="packages" />
      <ServicesSection id="about" />
    </>
  );
}
