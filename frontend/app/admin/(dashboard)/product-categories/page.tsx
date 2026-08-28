import { ProductCategoriesManager } from "@/components/admin/product-categories/product-categories-manager";
import { getAdminProductCategories } from "@/components/admin-sections/product-categories-actions";

export default async function AdminProductCategoriesPage() {
  const categories = await getAdminProductCategories();

  return (
    <div className="px-gutter py-10">
      <h1 className="text-2xl font-semibold text-brand-black">Категория продукции</h1>

      <ProductCategoriesManager initialCategories={categories} />
    </div>
  );
}
