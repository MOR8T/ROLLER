import { ContactInfoManager } from "@/components/admin/contact-info/contact-info-manager";
import { ContactInterestsManager } from "@/components/admin/contact-interests/contact-interests-manager";
import { SocialLinksManager } from "@/components/admin/social-links/social-links-manager";
import { getAdminContactInfo } from "@/components/admin-sections/contact-info-actions";
import { getAdminContactInterests } from "@/components/admin-sections/contact-interests-actions";
import { getAdminSocialLinks } from "@/components/admin-sections/social-links-actions";

export default async function AdminContactsPage() {
  const [content, interests, socialLinks] = await Promise.all([
    getAdminContactInfo(),
    getAdminContactInterests(),
    getAdminSocialLinks(),
  ]);

  return (
    <div className="px-gutter py-10">
      <h1 className="text-2xl font-semibold text-brand-black">Контакты</h1>
      <p className="mt-2 text-neutral-600">
        Данные блока «Свяжитесь с нами» и подвала сайта — сохранённые изменения появляются на сайте
        сразу.
      </p>

      <ContactInfoManager content={content} />
      <SocialLinksManager initialItems={socialLinks} />
      <ContactInterestsManager initialItems={interests} />
    </div>
  );
}
