import { AboutSection } from "@/components/sections/about-section";
import { AdvantagesSection } from "@/components/sections/advantages-section";
import { CategoriesSection } from "@/components/sections/categories-section";
import { ContactsSection } from "@/components/sections/contacts-section";
import { HeroSection } from "@/components/sections/hero-section";
import { LeadFormSection } from "@/components/sections/lead-form-section";
import { PartnersSection } from "@/components/sections/partners-section";
import { ProductsSection } from "@/components/sections/products-section";
import { StatsSection } from "@/components/sections/stats-section";

export default function Home() {
  return (
    <>
      <HeroSection />
      <AboutSection />
      <CategoriesSection />
      <AdvantagesSection />
      <ProductsSection />
      <StatsSection />
      <PartnersSection />
      <LeadFormSection />
      <ContactsSection />
    </>
  );
}
