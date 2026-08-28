import { ProductsManager } from "@/components/admin/products/products-manager";
import {
  getAdminCategoryOptions,
  getAdminProducts,
} from "@/components/admin-sections/products-actions";

export default async function AdminProductsPage() {
  const [products, categories] = await Promise.all([getAdminProducts(), getAdminCategoryOptions()]);

  return (
    <div className="px-gutter py-10">
      <h1 className="text-2xl font-semibold text-brand-black">Продукция</h1>

      <ProductsManager initialProducts={products} categories={categories} />
    </div>
  );
}
