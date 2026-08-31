import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { ProductSectionsManager } from "@/components/admin/products/product-sections-manager";
import { getAdminProduct } from "@/components/admin-sections/products-actions";

/**
 * One product's page, as the admin builds it: the five kinds of section, in
 * the order a visitor will meet them.
 *
 * The product's own fields — photo, title, description, categories — are
 * edited in the list at `/admin/products`, which is where they are created.
 * This screen is step two and nothing else.
 */
export default async function AdminProductPage({ params }: PageProps<"/admin/products/[id]">) {
  const { id } = await params;
  const product = await getAdminProduct(Number(id));
  if (!product) notFound();

  return (
    <div className="px-gutter py-10">
      <Link
        href="/admin/products"
        className="inline-flex items-center gap-2 text-sm font-medium text-neutral-500 transition-colors hover:text-brand-black"
      >
        <ArrowLeft className="size-4" />
        Вся продукция
      </Link>

      <h1 className="mt-4 text-2xl font-semibold text-brand-black">{product.titles.ru}</h1>
      <p className="mt-1 max-w-2xl text-sm text-neutral-500">{product.descriptions.ru}</p>

      <ProductSectionsManager productId={product.id} initialSections={product.sections} />
    </div>
  );
}
