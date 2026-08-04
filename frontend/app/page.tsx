import { ApplicationsSection } from "@/components/sections/applications-section";
import { BrandLineupSection } from "@/components/sections/brand-lineup-section";
import { ContactsSection } from "@/components/sections/contacts-section";
import { HeroSection } from "@/components/sections/hero-section";
import { LeadFormSection } from "@/components/sections/lead-form-section";
import { ProductionScaleSection } from "@/components/sections/production-scale-section";
import { ProfessionalsSection } from "@/components/sections/professionals-section";
import { ProjectsSection } from "@/components/sections/projects-section";

/**
 * Homepage composition — DESIGN.md §7.
 *
 * The site serves four audiences at once, so the page gives each one a section
 * of equal weight while keeping a single reading flow: everyone can enter, the
 * professionals are handed off at the dark section, and the page closes with
 * one request form and contacts.
 *
 * Only the "Профессионалам" section is dark; every other section is light, and
 * the footer is the site's one other dark surface.
 *
 * Sections that used to live here and where they went:
 *   Categories (ПВХ / Алюминий) → inside the catalog. "PVC or aluminium?" is a
 *     manufacturer's question, not a first choice a flat owner can make.
 *   Products → superseded by the brand lineup, which covers all six systems
 *     rather than five and explains how they differ.
 *   News → the /news page (stage 07).
 *   About / Advantages / Stats / Partners → merged into "Производство и масштаб".
 */
export default function Home() {
  return (
    <>
      <HeroSection />
      <BrandLineupSection />
      <ApplicationsSection />
      <ProductionScaleSection />
      <ProjectsSection />
      <ProfessionalsSection />
      <LeadFormSection />
      <ContactsSection />
    </>
  );
}
