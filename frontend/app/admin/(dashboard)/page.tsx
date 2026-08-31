import { HeroSlidesManager } from "@/components/admin/hero-slides/hero-slides-manager";
import { getAdminHeroSlides } from "@/components/admin-sections/hero-slides-actions";

export default async function AdminHomePage() {
  const heroSlides = await getAdminHeroSlides();

  return (
    <div className="px-gutter py-10">
      <h1 className="text-2xl font-semibold text-brand-black">Панель управления</h1>
      <p className="mt-2 text-neutral-600">
        Это первая версия админ-панели — выберите раздел в меню слева.
      </p>

      <HeroSlidesManager initialSlides={heroSlides} />
    </div>
  );
}
