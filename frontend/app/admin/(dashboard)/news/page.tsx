import { NewsManager } from "@/components/admin/news/news-manager";
import { getAdminNews } from "@/app/admin/(dashboard)/news-actions";

export default async function AdminNewsPage() {
  const articles = await getAdminNews();

  return (
    <div className="px-gutter py-10">
      <h1 className="text-2xl font-semibold text-brand-black">Новости</h1>
      <p className="mt-2 text-neutral-600">
        Управление новостями, которые показываются на главной странице и на странице «Новости».
      </p>

      <NewsManager initialArticles={articles} />
    </div>
  );
}
