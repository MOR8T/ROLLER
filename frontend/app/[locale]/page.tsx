import { setRequestLocale } from "next-intl/server";
import { ApplicationsSection } from "@/components/sections/applications-section";
import { BrandLineupSection } from "@/components/sections/brand-lineup-section";
import { HeroSection } from "@/components/sections/hero-section";
import { LeadFormSection } from "@/components/sections/lead-form-section";
import { ProductionScaleSection } from "@/components/sections/production-scale-section";
import { ProfessionalsSection } from "@/components/sections/professionals-section";
import { ProjectsSection } from "@/components/sections/projects-section";

export default async function Home({ params }: PageProps<"/[locale]">) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <>
      <HeroSection />
      <BrandLineupSection />
      <ApplicationsSection />
      <ProductionScaleSection />
      <ProjectsSection />
      <ProfessionalsSection />
      <LeadFormSection />
    </>
  );
}
