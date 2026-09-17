import Hero from "@/components/hero/Hero";
import Capabilities from "@/components/capabilities/Capabilities";
import FeaturedWork from "@/components/featured-work/FeaturedWork";
import IndustriesGrid from "@/components/industries/IndustriesGrid";
import WhyAynam from "@/components/why-aynam/WhyAynam";
import CtaSection from "@/components/contact/CtaSection";

export default function HomePage() {
  return (
    <>
      <Hero />
      <Capabilities />
      <FeaturedWork />
      <IndustriesGrid />
      <WhyAynam />
      <CtaSection />
    </>
  );
}
