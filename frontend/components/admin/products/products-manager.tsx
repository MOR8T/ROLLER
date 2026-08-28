"use client";

import {
  useEffect,
  useOptimistic,
  useState,
  useTransition,
  type ChangeEvent,
  type FormEvent,
} from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowDown, ArrowUp, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ImageLightbox } from "@/components/ui/image-lightbox";
import { IconButton } from "@/components/admin/products/section-form";
import { locales } from "@/i18n/routing";
import { localeLabels } from "@/i18n/locale-labels";
import {
  createProductAction,
  deleteProductAction,
  reorderProductsAction,
  updateProductAction,
  type AdminCategoryOptionDto,
  type AdminProductDto,
} from "@/components/admin-sections/products-actions";

/** Kept in sync with the backend's own check in `routes/products.py`. */
const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024;

function imageTooLarge(formData: FormData): boolean {
  const file = formData.get("image");
  return file instanceof File && file.size > MAX_IMAGE_SIZE_BYTES;
}

/**
 * Step one of the client's flow: the product itself — «сперва админ создаёт
 * саму продукцию: фотография, заголовок и описание».
 *
 * Those three fields are what a card shows on a category page and what the
 * product page opens with. The content of the page — the five kinds of section
 * — is edited one level down, at `/admin/products/<id>`, which is where
 * «Открыть» goes and where a newly created product lands straight away.
 *
 * Reordering is optimistic, create/edit/delete wait for the round trip: the
 * same contract as `ProductCategoriesManager`, and for the same reasons.
 */
export function ProductsManager({
  initialProducts,
  categories,
}: {
  initialProducts: AdminProductDto[];
  categories: AdminCategoryOptionDto[];
}) {
  const router = useRouter();
  const [products, setProducts] = useOptimistic(initialProducts);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [lightbox, setLightbox] = useState<{ src: string; alt: string } | null>(null);

  function move(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= products.length) return;

    const reordered = products.slice();
    [reordered[index], reordered[target]] = [reordered[target], reordered[index]];

    setError(null);
    startTransition(async () => {
      setProducts(reordered);
      const result = await reorderProductsAction(reordered.map((product) => product.id));
      if (!result.success) {
        setError(result.error);
        router.refresh();
      }
    });
  }

  function remove(id: number) {
    if (!window.confirm("Удалить продукт вместе со всеми его секциями?")) return;

    setError(null);
    startTransition(async () => {
      setProducts(products.filter((product) => product.id !== id));
      const result = await deleteProductAction(id);
      if (!result.success) {
        setError(result.error);
        router.refresh();
      }
    });
  }

  function submitCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);

    setError(null);
    if (imageTooLarge(formData)) {
      setError("Размер файла не должен превышать 10 МБ");
      return;
    }

    startTransition(async () => {
      const result = await createProductAction(collapseCategories(formData));
      if (!result.success) {
        setError(result.error);
        return;
      }
      form.reset();
      setShowAddForm(false);
      // Straight into step two — the product exists, and what it needs now is
      // its sections.
      router.push(`/admin/products/${result.data.id}`);
    });
  }

  function submitEdit(id: number, event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    setError(null);
    if (imageTooLarge(formData)) {
      setError("Размер файла не должен превышать 10 МБ");
      return;
    }

    startTransition(async () => {
      const result = await updateProductAction(id, collapseCategories(formData));
      if (!result.success) {
        setError(result.error);
        // A 404 means the product was deleted elsewhere while this form was
        // open — pull fresh data rather than leaving the form on a ghost.
        router.refresh();
        return;
      }
      setEditingId(null);
    });
  }

  return (
    <section className="mt-10 border-t border-brand-black/10 pt-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-brand-black">Продукция</h2>
          <p className="mt-1 text-sm text-neutral-500">
            Фотография, заголовок и описание на четырёх языках — это карточка продукта. Секции
            страницы добавляются внутри продукта, кнопкой «Открыть».
          </p>
        </div>
        <Button
          type="button"
          size="sm"
          variant={showAddForm ? "outline" : "primary"}
          onClick={() => setShowAddForm((v) => !v)}
        >
          {showAddForm ? "Отмена" : "Добавить продукт"}
        </Button>
      </div>

      {categories.length === 0 ? (
        <p className="mt-4 text-sm text-neutral-500">
          Категорий продукции пока нет — создайте их в разделе «Категория продукции», иначе продукт
          не на что будет открыть с сайта.
        </p>
      ) : null}

      {error ? (
        <p role="alert" className="mt-4 text-sm text-brand-red">
          {error}
        </p>
      ) : null}

      {showAddForm ? (
        <form
          onSubmit={submitCreate}
          className="mt-5 rounded-card border border-brand-black/10 p-5"
        >
          <ProductFields disabled={isPending} categories={categories} />
          <div className="mt-5">
            <Button type="submit" disabled={isPending}>
              {isPending ? "Сохранение..." : "Добавить и перейти к секциям"}
            </Button>
          </div>
        </form>
      ) : null}

      <ul className="mt-6 space-y-3">
        {products.length === 0 ? (
          <p className="text-sm text-neutral-500">Продукции пока нет.</p>
        ) : (
          products.map((product, index) =>
            editingId === product.id ? (
              <li key={product.id} className="rounded-card border border-brand-black/10 p-5">
                <form onSubmit={(event) => submitEdit(product.id, event)}>
                  <ProductFields
                    disabled={isPending}
                    categories={categories}
                    product={product}
                    isEdit
                  />
                  <div className="mt-5 flex gap-2">
                    <Button type="submit" size="sm" disabled={isPending}>
                      {isPending ? "Сохранение..." : "Сохранить"}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => setEditingId(null)}
                      disabled={isPending}
                    >
                      Отмена
                    </Button>
                  </div>
                </form>
              </li>
            ) : (
              <li
                key={product.id}
                className="flex items-center gap-4 rounded-card border border-brand-black/10 p-3"
              >
                {product.imageSrc ? (
                  <button
                    type="button"
                    aria-label="Просмотреть фотографию"
                    onClick={() => setLightbox({ src: product.imageSrc!, alt: product.titles.ru })}
                    className="shrink-0 cursor-zoom-in rounded-control transition-opacity hover:opacity-80 focus-visible:ring-2 focus-visible:ring-brand-red focus-visible:ring-offset-2 focus-visible:outline-none"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={product.imageSrc}
                      alt=""
                      className="h-16 w-24 rounded-control object-cover"
                    />
                  </button>
                ) : (
                  <span className="grid h-16 w-24 shrink-0 place-items-center rounded-control bg-brand-black/5 text-xs text-neutral-500">
                    без фото
                  </span>
                )}

                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-brand-black">{product.titles.ru}</p>
                  <p className="mt-0.5 truncate text-xs text-neutral-500">
                    {product.categoryIds.length === 0
                      ? "Не в одной категории"
                      : categories
                          .filter((category) => product.categoryIds.includes(category.id))
                          .map((category) => category.name)
                          .join(", ")}
                  </p>
                </div>

                <div className="flex shrink-0 items-center gap-1">
                  <IconButton
                    label="Выше"
                    onClick={() => move(index, -1)}
                    disabled={isPending || index === 0}
                  >
                    <ArrowUp className="size-4" />
                  </IconButton>
                  <IconButton
                    label="Ниже"
                    onClick={() => move(index, 1)}
                    disabled={isPending || index === products.length - 1}
                  >
                    <ArrowDown className="size-4" />
                  </IconButton>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => setEditingId(product.id)}
                    disabled={isPending}
                  >
                    Изменить
                  </Button>
                  {/* `next/link`, not the locale-aware one: the admin panel
                      lives outside the `[locale]` segment. */}
                  <Link
                    href={`/admin/products/${product.id}`}
                    className="inline-flex min-h-9 items-center rounded-control bg-brand-black px-4 py-2 text-sm font-medium text-brand-white transition-colors hover:bg-brand-black/85"
                  >
                    Открыть
                  </Link>
                  <IconButton
                    label="Удалить"
                    onClick={() => remove(product.id)}
                    disabled={isPending}
                    tone="danger"
                  >
                    <Trash2 className="size-4" />
                  </IconButton>
                </div>
              </li>
            ),
          )
        )}
      </ul>

      <ImageLightbox
        src={lightbox?.src ?? null}
        alt={lightbox?.alt}
        onClose={() => setLightbox(null)}
      />
    </section>
  );
}

/**
 * The checkboxes post one `category_ids` entry per ticked box; the API takes
 * one comma-separated field plus a flag saying "replace the links with this".
 * Both live here rather than in the markup so the form stays a plain HTML form
 * — see `_parse_category_ids` in `routes/products.py` for why the API is
 * shaped that way.
 */
function collapseCategories(formData: FormData): FormData {
  const ids = formData.getAll("category_ids").map(String).filter(Boolean);
  formData.delete("category_ids");
  formData.set("category_ids", ids.join(","));
  formData.set("replace_categories", "true");
  return formData;
}

function ProductFields({
  disabled,
  categories,
  product,
  isEdit = false,
}: {
  disabled: boolean;
  categories: AdminCategoryOptionDto[];
  product?: AdminProductDto;
  isEdit?: boolean;
}) {
  // Starts on the current photo in edit mode, so there is always something to
  // look at; swaps to an object URL for whatever file is picked next.
  const [preview, setPreview] = useState<string | null>(product?.imageSrc ?? null);
  const [previewOpen, setPreviewOpen] = useState(false);

  useEffect(() => {
    return () => {
      if (preview?.startsWith("blob:")) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  function onImageChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    setPreview((current) => {
      if (current?.startsWith("blob:")) URL.revokeObjectURL(current);
      return file ? URL.createObjectURL(file) : (product?.imageSrc ?? null);
    });
  }

  return (
    <div className="grid gap-5">
      <LocaleGroup
        label="Заголовок"
        hint="Название продукта — на карточке и первым экраном страницы."
        field="title"
        values={product?.titles}
        disabled={disabled}
      />

      <LocaleGroup
        label="Описание"
        hint="Короткий текст под заголовком: он же стоит на карточке и на первом экране."
        field="description"
        values={product?.descriptions}
        disabled={disabled}
        multiline
      />

      <div>
        <p className="mb-1.5 text-sm font-medium text-brand-black">Категории</p>
        <p className="mb-2 text-xs text-neutral-500">
          В каких разделах показывать продукт. Продукт может быть сразу в нескольких — например, и в
          «Окнах», и в «Дверях».
        </p>
        {categories.length === 0 ? (
          <p className="text-sm text-neutral-500">Категорий пока нет.</p>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2">
            {categories.map((category) => (
              <label
                key={category.id}
                className="flex items-center gap-2.5 rounded-control border border-brand-black/10 px-3 py-2.5 text-sm text-brand-black"
              >
                <input
                  type="checkbox"
                  name="category_ids"
                  value={category.id}
                  defaultChecked={product?.categoryIds.includes(category.id) ?? false}
                  disabled={disabled}
                  className="size-4 accent-brand-red"
                />
                {category.name}
              </label>
            ))}
          </div>
        )}
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-brand-black">
          Фотография продукта
        </label>
        <div className="flex items-start gap-4">
          {preview ? (
            <button
              type="button"
              aria-label="Просмотреть фотографию"
              onClick={() => setPreviewOpen(true)}
              className="shrink-0 cursor-zoom-in rounded-control transition-opacity hover:opacity-80 focus-visible:ring-2 focus-visible:ring-brand-red focus-visible:ring-offset-2 focus-visible:outline-none"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={preview}
                alt=""
                className="h-16 w-24 rounded-control border border-brand-black/10 object-cover"
              />
            </button>
          ) : null}
          <div className="min-w-0 flex-1">
            <input
              type="file"
              name="image"
              accept="image/*"
              required={!isEdit}
              disabled={disabled}
              onChange={onImageChange}
              className="block w-full text-sm text-neutral-600 file:mr-3 file:rounded-control file:border-0 file:bg-brand-black file:px-4 file:py-2 file:text-sm file:font-medium file:text-brand-white hover:file:bg-brand-black/85"
            />
            <p className="mt-1 text-xs text-neutral-500">
              {isEdit ? "Оставьте пустым, чтобы не менять фото. " : ""}До 10 МБ.
            </p>
          </div>
        </div>
      </div>

      <ImageLightbox src={previewOpen ? preview : null} onClose={() => setPreviewOpen(false)} />
    </div>
  );
}

/**
 * Four uncontrolled inputs named `title_ru`, `title_tj`, … — the same shape
 * every other manager in the panel posts, and the reason this form can stay
 * plain `FormData` while the section forms cannot.
 */
function LocaleGroup({
  label,
  hint,
  field,
  values,
  disabled,
  multiline = false,
}: {
  label: string;
  hint: string;
  field: string;
  values?: Record<string, string>;
  disabled: boolean;
  multiline?: boolean;
}) {
  return (
    <div>
      <p className="mb-1.5 text-sm font-medium text-brand-black">{label}</p>
      <p className="mb-2 text-xs text-neutral-500">{hint}</p>
      <div className="grid gap-3 sm:grid-cols-2">
        {locales.map((locale) => {
          const name = `${field}_${locale}`;
          const common = {
            id: name,
            name,
            required: true,
            defaultValue: values?.[locale],
            disabled,
          };

          return (
            <div key={locale}>
              <label
                htmlFor={name}
                className="mb-1 flex items-center gap-1.5 text-xs font-medium text-neutral-500 uppercase"
              >
                {locale}
                <span className="font-normal text-neutral-400 normal-case">
                  · {localeLabels[locale]}
                </span>
              </label>
              {multiline ? <Textarea rows={3} {...common} /> : <Input {...common} />}
            </div>
          );
        })}
      </div>
    </div>
  );
}
