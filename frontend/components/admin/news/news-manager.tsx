"use client";

import {
  useEffect,
  useOptimistic,
  useState,
  useTransition,
  type ChangeEvent,
  type FormEvent,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ImageLightbox } from "@/components/ui/image-lightbox";
import { TiptapEditor } from "@/components/admin/news/tiptap-editor";
import { cn } from "@/lib/utils";
import { locales, type Locale } from "@/i18n/routing";
import { localeLabels } from "@/i18n/locale-labels";
import type { AdminNewsArticleDto } from "@/app/admin/(dashboard)/news-actions";
import {
  createNewsAction,
  deleteNewsAction,
  updateNewsAction,
} from "@/app/admin/(dashboard)/news-actions";

interface NewsManagerProps {
  initialArticles: AdminNewsArticleDto[];
}

/** Kept in sync with the backend's own check in `routes/news.py`. */
const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024;

function imageTooLarge(formData: FormData): boolean {
  const file = formData.get("cover");
  return file instanceof File && file.size > MAX_IMAGE_SIZE_BYTES;
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "").trim();
}

/**
 * The title and body are required on every one of the four locales — a form
 * field like `body_tj` submits `<p></p>` for an untouched Tiptap editor, so
 * "empty" has to check the text, not just presence.
 */
function missingLocale(formData: FormData): Locale | null {
  for (const locale of locales) {
    const title = String(formData.get(`title_${locale}`) ?? "").trim();
    const body = stripHtml(String(formData.get(`body_${locale}`) ?? ""));
    if (!title || !body) return locale;
  }
  return null;
}

function formatDate(iso: string): string {
  const parsed = new Date(iso);
  return Number.isNaN(parsed.getTime()) ? iso : parsed.toLocaleDateString("ru-RU");
}

/**
 * The news grid on `/` and the paged list on `/news` read whatever this list
 * holds — see `lib/news.ts` (public read) and `news-actions.ts` (the
 * mutations below, which revalidate both this page and the public sections'
 * tagged fetch on success).
 *
 * Sorting is by publish date, not a manual position like `HeroSlidesManager`
 * / `PartnersManager` — the backend itself orders by `published_at desc`, so
 * there is nothing to drag-reorder here.
 */
export function NewsManager({ initialArticles }: NewsManagerProps) {
  const router = useRouter();
  const [articles, setArticles] = useOptimistic(initialArticles);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [lightbox, setLightbox] = useState<{ src: string; alt: string } | null>(null);

  function remove(id: number) {
    if (!window.confirm("Удалить эту новость? Действие необратимо.")) return;

    setError(null);
    startTransition(async () => {
      setArticles(articles.filter((article) => article.id !== id));
      const result = await deleteNewsAction(id);
      if (!result.success) {
        setError(result.error);
        // Someone else changed the list in the meantime — pull the real
        // state back in rather than leaving the optimistic delete showing.
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
    const missing = missingLocale(formData);
    if (missing) {
      setError(`Заполните заголовок и текст на языке «${localeLabels[missing]}»`);
      return;
    }
    startTransition(async () => {
      const result = await createNewsAction(formData);
      if (!result.success) {
        setError(result.error);
        return;
      }
      form.reset();
      setShowAddForm(false);
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
    const missing = missingLocale(formData);
    if (missing) {
      setError(`Заполните заголовок и текст на языке «${localeLabels[missing]}»`);
      return;
    }
    startTransition(async () => {
      const result = await updateNewsAction(id, formData);
      if (!result.success) {
        setError(result.error);
        // A 404 here means the article was deleted elsewhere while this form
        // was open — leaving the edit form open on an article that no
        // longer exists is exactly the confusing state to avoid.
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
          <h2 className="text-lg font-semibold text-brand-black">Новости</h2>
          <p className="mt-1 text-sm text-neutral-500">
            Заголовок, дата, фотография и текст на четырёх языках. Список на сайте всегда
            отсортирован по дате публикации.
          </p>
        </div>
        <Button
          type="button"
          size="sm"
          variant={showAddForm ? "outline" : "primary"}
          onClick={() => {
            setShowAddForm((v) => !v);
            setEditingId(null);
          }}
        >
          {showAddForm ? "Отмена" : "Добавить новость"}
        </Button>
      </div>

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
          <ArticleFields disabled={isPending} />
          <Button type="submit" disabled={isPending} className="mt-5">
            {isPending ? "Сохранение..." : "Опубликовать"}
          </Button>
        </form>
      ) : null}

      <ul className="mt-6 space-y-3">
        {articles.length === 0 ? (
          <p className="text-sm text-neutral-500">Новостей пока нет.</p>
        ) : (
          articles.map((article) =>
            editingId === article.id ? (
              <li key={article.id} className="rounded-card border border-brand-black/10 p-5">
                <form onSubmit={(event) => submitEdit(article.id, event)}>
                  <ArticleFields disabled={isPending} article={article} isEdit />
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
                key={article.id}
                className="flex items-center gap-4 rounded-card border border-brand-black/10 p-3"
              >
                <button
                  type="button"
                  aria-label="Просмотреть фотографию"
                  onClick={() => setLightbox({ src: article.coverSrc, alt: article.titles.ru })}
                  className="shrink-0 cursor-zoom-in rounded-control transition-opacity hover:opacity-80 focus-visible:ring-2 focus-visible:ring-brand-red focus-visible:ring-offset-2 focus-visible:outline-none"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={article.coverSrc}
                    alt=""
                    className="h-16 w-24 rounded-control object-cover"
                  />
                </button>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-brand-black">{article.titles.ru}</p>
                  <p className="text-sm text-neutral-500">{formatDate(article.publishedAt)}</p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setEditingId(article.id);
                      setShowAddForm(false);
                    }}
                    disabled={isPending}
                  >
                    Изменить
                  </Button>
                  <IconButton
                    label="Удалить"
                    onClick={() => remove(article.id)}
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

function ArticleFields({
  disabled,
  article,
  isEdit = false,
}: {
  disabled: boolean;
  article?: AdminNewsArticleDto;
  isEdit?: boolean;
}) {
  const [activeLocale, setActiveLocale] = useState<Locale>("ru");

  // Starts on the current photo in edit mode, so there is always something
  // to look at; swaps to an object URL for whatever file is picked next, and
  // falls back to the current photo again if that selection is cleared.
  const [preview, setPreview] = useState<string | null>(article?.coverSrc ?? null);
  const [previewOpen, setPreviewOpen] = useState(false);

  useEffect(() => {
    return () => {
      if (preview?.startsWith("blob:")) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  function onCoverChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    setPreview((current) => {
      if (current?.startsWith("blob:")) URL.revokeObjectURL(current);
      return file ? URL.createObjectURL(file) : (article?.coverSrc ?? null);
    });
  }

  return (
    <div className="grid gap-5 sm:grid-cols-2">
      <div>
        <label htmlFor="published_at" className="mb-1.5 block text-sm font-medium text-brand-black">
          Дата публикации
        </label>
        <Input
          id="published_at"
          name="published_at"
          type="date"
          required
          defaultValue={article?.publishedAt}
          disabled={disabled}
        />
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-brand-black">Фотография</label>
        <div className="flex items-start gap-4">
          {preview ? (
            <button
              type="button"
              aria-label="Просмотреть фотографию"
              onClick={() => setPreviewOpen(true)}
              className="shrink-0 cursor-zoom-in rounded-control transition-opacity hover:opacity-80 focus-visible:ring-2 focus-visible:ring-brand-red focus-visible:ring-offset-2 focus-visible:outline-none"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={preview} alt="" className="h-16 w-24 rounded-control object-cover" />
            </button>
          ) : null}
          <div className="min-w-0 flex-1">
            <input
              type="file"
              name="cover"
              accept="image/*"
              required={!isEdit}
              disabled={disabled}
              onChange={onCoverChange}
              className="block w-full text-sm text-neutral-600 file:mr-3 file:rounded-control file:border-0 file:bg-brand-black file:px-4 file:py-2 file:text-sm file:font-medium file:text-brand-white hover:file:bg-brand-black/85"
            />
            <p className="mt-1 text-xs text-neutral-500">
              {isEdit ? "Оставьте пустым, чтобы не менять фото. " : ""}До 10 МБ.
            </p>
          </div>
        </div>
      </div>

      <div className="sm:col-span-2">
        <div className="flex flex-wrap gap-1.5 border-b border-brand-black/10">
          {locales.map((locale) => (
            <button
              key={locale}
              type="button"
              onClick={() => setActiveLocale(locale)}
              className={cn(
                "-mb-px rounded-t-control border-b-2 px-3 py-2 text-sm font-medium transition-colors",
                activeLocale === locale
                  ? "border-brand-red text-brand-black"
                  : "border-transparent text-neutral-500 hover:text-brand-black",
              )}
            >
              {locale.toUpperCase()} · {localeLabels[locale]}
            </button>
          ))}
        </div>

        {locales.map((locale) => (
          <div key={locale} hidden={activeLocale !== locale} className="space-y-4 pt-4">
            <div>
              <label
                htmlFor={`title_${locale}`}
                className="mb-1.5 block text-sm font-medium text-brand-black"
              >
                Заголовок
              </label>
              <Input
                id={`title_${locale}`}
                name={`title_${locale}`}
                required
                defaultValue={article?.titles[locale]}
                disabled={disabled}
              />
            </div>

            <div>
              <label
                htmlFor={`excerpt_${locale}`}
                className="mb-1.5 block text-sm font-medium text-brand-black"
              >
                Краткое описание{" "}
                <span className="font-normal text-neutral-400">
                  (необязательно — иначе возьмётся начало текста)
                </span>
              </label>
              <Textarea
                id={`excerpt_${locale}`}
                name={`excerpt_${locale}`}
                rows={2}
                defaultValue={article?.excerpts[locale]}
                disabled={disabled}
              />
            </div>

            <div>
              <p className="mb-1.5 text-sm font-medium text-brand-black">Текст новости</p>
              <TiptapEditor
                name={`body_${locale}`}
                defaultValue={article?.bodies[locale]}
                placeholder="Текст новости..."
                disabled={disabled}
              />
            </div>
          </div>
        ))}
      </div>

      <ImageLightbox src={previewOpen ? preview : null} onClose={() => setPreviewOpen(false)} />
    </div>
  );
}

function IconButton({
  label,
  onClick,
  disabled,
  tone = "default",
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  tone?: "default" | "danger";
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "grid size-9 place-items-center rounded-control transition-colors focus-visible:ring-2 focus-visible:ring-brand-red focus-visible:ring-offset-2 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-40",
        tone === "danger"
          ? "text-brand-red hover:bg-brand-red/10"
          : "text-brand-black hover:bg-brand-black/5",
      )}
    >
      {children}
    </button>
  );
}
