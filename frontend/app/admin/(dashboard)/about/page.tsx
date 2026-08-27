import { AboutContentManager } from "@/components/admin/about-content/about-content-manager";
import { AboutTimelineManager } from "@/components/admin/about-timeline/about-timeline-manager";
import { AboutCertificatesManager } from "@/components/admin/about-certificates/about-certificates-manager";
import { PartnersManager } from "@/components/admin/partners/partners-manager";
import { getAdminAboutContent } from "@/app/admin/(dashboard)/about-content-actions";
import { getAdminAboutTimeline } from "@/app/admin/(dashboard)/about-timeline-actions";
import { getAdminAboutCertificates } from "@/app/admin/(dashboard)/about-certificates-actions";
import { getAdminPartners } from "@/app/admin/(dashboard)/partners-actions";

export default async function AdminAboutPage() {
  const [content, timeline, certificates, partners] = await Promise.all([
    getAdminAboutContent(),
    getAdminAboutTimeline(),
    getAdminAboutCertificates(),
    getAdminPartners(),
  ]);

  return (
    <div className="px-gutter py-10">
      <h1 className="text-2xl font-semibold text-brand-black">О компании</h1>
      <p className="mt-2 text-neutral-600">
        Всё содержимое страницы «О компании» — сохранённые изменения появляются на сайте сразу.
      </p>

      <AboutContentManager content={content} />
      <AboutTimelineManager initialItems={timeline} />
      <AboutCertificatesManager initialCertificates={certificates} />
      <PartnersManager initialPartners={partners} />
    </div>
  );
}
