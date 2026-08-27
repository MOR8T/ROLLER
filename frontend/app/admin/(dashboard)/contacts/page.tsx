import { ContactInfoManager } from "@/components/admin/contact-info/contact-info-manager";
import { ContactInterestsManager } from "@/components/admin/contact-interests/contact-interests-manager";
import { getAdminContactInfo } from "@/app/admin/(dashboard)/contact-info-actions";
import { getAdminContactInterests } from "@/app/admin/(dashboard)/contact-interests-actions";

export default async function AdminContactsPage() {
  const [content, interests] = await Promise.all([
    getAdminContactInfo(),
    getAdminContactInterests(),
  ]);

  return (
    <div className="px-gutter py-10">
      <h1 className="text-2xl font-semibold text-brand-black">Контакты</h1>
      <p className="mt-2 text-neutral-600">
        Данные блока «Свяжитесь с нами» и подвала сайта — сохранённые изменения появляются на
        сайте сразу.
      </p>

      <ContactInfoManager content={content} />
      <ContactInterestsManager initialItems={interests} />
    </div>
  );
}
