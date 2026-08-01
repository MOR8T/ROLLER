# ROLLER.TJ — Frontend

Next.js-приложение корпоративного сайта-каталога **ROLLER.TJ** — производителя
профильных систем (ПВХ и алюминий) в Таджикистане.

Цель сайта — информационное ознакомление клиентов: презентация компании, каталог
продукции, портфолио, калькулятор расчёта и приём заявок (в первую очередь через
WhatsApp). Цены не показываются — везде «цена по расчёту» + CTA.

**Слоган:** «Тепло и комфорт для каждого дома» / «Гармию осоиш ба хар як хонадон».

Это фронтенд-часть монорепозитория. Общий контекст проекта — в корневом
[README.md](../README.md), детальный план разработки — в
[.cursor/project_plan/](../.cursor/project_plan/) (13 этапов).

---

## Быстрый старт

```sh
npm install
npm run dev
```

Приложение поднимется на **http://localhost:3031** (порт зафиксирован в
`package.json`, не 3000 по умолчанию).

### Скрипты

| Команда | Что делает |
|---------|-----------|
| `npm run dev` | Дев-сервер на порту 3031 |
| `npm run build` | Прод-сборка |
| `npm run start` | Запуск прод-сборки |
| `npm run lint` | ESLint (`eslint-config-next` + core-web-vitals + typescript) |
| `npm run format` | Prettier — запись |
| `npm run format:check` | Prettier — проверка |

Тестового фреймворка пока нет.

---

## Стек

| Слой | Технология |
|------|------------|
| Framework | Next.js **16.2.10** (App Router) |
| UI | React 19.2, TypeScript 5 (`strict`) |
| Стили | Tailwind CSS **v4** (`@theme`-токены, без `tailwind.config`) |
| Анимации | Framer Motion 12 |
| Карусели | Swiper 14 |
| Иконки | lucide-react |
| Форматирование | Prettier + `prettier-plugin-tailwindcss` |

Алиас путей: `@/*` → корень `frontend/`.

### ⚠️ Next.js 16 — ломающие изменения

В проекте установлен Next.js 16: API, конвенции и структура файлов могут
отличаться от привычных по 13–15. **Перед написанием кода сверяйтесь с локальной
документацией** в `node_modules/next/dist/docs/`, а не с памятью или старыми
статьями. Об этом же предупреждает [AGENTS.md](AGENTS.md).

---

## Структура

```
frontend/
├── app/
│   ├── layout.tsx          # root layout: шрифты, metadata, Header/Footer/FAB, skip-link
│   ├── page.tsx            # главная страница — сборка из секций
│   ├── globals.css         # Tailwind v4 + @theme токены + стили Swiper
│   └── favicon.ico
├── components/
│   ├── ui/                 # примитивы дизайн-системы
│   ├── layout/             # Header, Footer, LanguageSwitcher, WhatsAppFab
│   └── sections/           # секции страниц
├── data/
│   └── home.ts             # моковые данные главной (типизированы)
├── lib/
│   ├── site-config.ts      # контакты, навигация, локали
│   └── utils.ts            # cn() — склейка классов
├── types/
│   └── index.ts            # доменные типы (будущий контракт API)
└── public/                 # логотипы, фото продукции, обложки новостей
```

---

## Дизайн-система

Все брендовые токены — в одном месте, в [app/globals.css](app/globals.css) через
директиву `@theme` Tailwind v4. Никаких «магических» значений в компонентах.

**Цвета (подтверждены заказчиком):**

| Токен | Значение | Использование |
|-------|----------|---------------|
| `--color-brand-black` | `#1D1D1B` | основной тёмный |
| `--color-brand-red` | `#D3001A` | акцент, CTA |
| `--color-brand-white` | `#FFFFFF` | фон |
| `--color-neutral-50…900` | серая шкала | текст, границы, поверхности |
| `--color-background` / `--color-foreground` / `--color-accent` | семантические алиасы | |

В классах используются как `bg-brand-red`, `text-brand-black`, `border-neutral-200`.

**Шрифты:** `Chakra Petch` (заголовки, `--font-heading`) и `Montserrat`
(основной текст, `--font-sans`) — подключены через `next/font/google` в
[app/layout.tsx](app/layout.tsx) с сабсетами `latin` + `cyrillic` и `display: swap`.
Все `h1…h6` автоматически получают `--font-heading`.

### UI-kit (`components/ui/`)

| Компонент | API |
|-----------|-----|
| `Button` / `ButtonLink` | `variant`: `primary \| outline \| ghost`, `size`: `sm \| md \| lg` |
| `Badge` | `variant`: `red \| black \| outline` |
| `Card` + `CardHeader` / `CardContent` / `CardFooter` | `variant`: `default \| elevated \| bordered` |
| `Container` | центрирование, `max-w-7xl`, адаптивные отступы |
| `Section` | вертикальный ритм `py-16 / sm:py-20 / lg:py-24` |
| `Input`, `Textarea`, `Select` | поля форм |
| `MediaFrame` | обёртка над `next/image`: `fill`, `objectFit`, `sizes`, плейсхолдер |
| `Reveal` / `RevealItem` | анимации появления, пресеты `fade-up \| fade \| stagger` |
| `BrandLogo` | логотип, тёмный/светлый вариант |

Утилита [`cn()`](lib/utils.ts) — самый переиспользуемый узел кодовой базы;
используйте её для склейки классов вместо конкатенации строк.

### Layout (`components/layout/`)

- **`Header`** — липкая шапка, десктопная навигация с мега-меню каталога,
  мобильный drawer с фокус-трапом, возвратом фокуса, блокировкой скролла body,
  закрытием по Escape и рендером через портал.
- **`Footer`** — навигация, контакты, соцсети, слоган на TJ, копирайт.
- **`LanguageSwitcher`** — ⚠️ визуальная заглушка: показывает RU / Тоҷикӣ /
  English / Türkçe и отмечает активный язык, но переключение не реализовано
  (этап 07).
- **`WhatsAppFab`** — плавающая кнопка WhatsApp.

### Доступность

Заложена с самого начала и должна поддерживаться дальше: skip-link в root layout,
фокус-трап и управление фокусом в мобильном меню, честная поддержка
`prefers-reduced-motion` в `Reveal` (обнуление длительностей, а не отключение
анимаций), осмысленный `alt` у всех изображений, видимые focus-ring на кнопках.

---

## Данные и типы

На фронт-фазе используются **моки с типами, которые позже совпадут с контрактом
API** (этапы 09–10). Замена моков на реальный API — этап 12, без переписывания
вёрстки.

- [types/index.ts](types/index.ts) — доменные типы: `Material`, `Segment`,
  `Category`, `Product`, `ProductSpecs`, `Article`, `Project`, `Lead`, а также
  вью-модели главной: `HeroSlide`, `ShowcaseProduct`, `ProjectTeaser`,
  `NewsTeaser`, `Partner`.
- [data/home.ts](data/home.ts) — контент главной: `heroSlides`,
  `productCategories`, `advantages`, `showcaseProducts`, `companyStats`,
  `partners`, `serviceHighlights`, `projectTeasers`, `newsTeasers`.
- [lib/site-config.ts](lib/site-config.ts) — `siteConfig` (телефон, WhatsApp,
  email, адрес, график, карта, соцсети), `navLinks`, `catalogMenu`, `locales`.

Тексты, ссылки и контакты **не хардкодятся в компонентах** — только через `data/`
и `siteConfig`.

### Продуктовые бренды (по брифу)

| Бренд | Класс | Материал | Профиль | Камеры |
|-------|-------|----------|---------|--------|
| ROLLER | средний | ПВХ | 60 мм | 4 |
| STELLA | премиум | ПВХ | 75 мм | 5 |
| UNOPEN | выше среднего | ПВХ | 65 мм | 5 |
| ECOLINE | эконом | ПВХ | 60 мм | 3 |
| АЛД-45 (холодный) | эконом | алюминий | 45 мм | 1 |
| ТЕРМО 60 (тёплый) | премиум | алюминий | 60 мм | 3 |

Две верхнеуровневые категории каталога: **ПВХ продукция** и **Алюминиевая продукция**.

---

## Текущее состояние

Реализована **только главная страница** — эталонный шаблон, по которому
утверждается дизайн всего сайта (этап 02).

Секции главной сверху вниз ([app/page.tsx](app/page.tsx)):
`HeroSection` → `AboutSection` → `CategoriesSection` → `AdvantagesSection` →
`ProductsSection` → `ProjectsSection` → `StatsSection` → `NewsSection` →
`PartnersSection` → `LeadFormSection`.
`ContactsSection` написан, но временно отключён в `page.tsx`.

### Что ещё не работает

- **Маршруты навигации не существуют.** `navLinks` и мега-меню каталога ссылаются
  на `/catalog`, `/about`, `/portfolio`, `/calculator`, `/news`, `/showroom`,
  `/contacts` — сборка выдаёт только `/` и `/_not-found`. Любой клик по
  навигации ведёт в 404.
- **i18n не реализован.** `<html lang="ru">` захардкожен, переключатель языков —
  заглушка. Расхождение: в плане три языка (RU/TJ/EN), в `locales` — четыре
  (добавлен `tr`); нужно закрыть решением.
- **Заявки нигде не сохраняются.** `LeadFormSection` формирует текст и открывает
  `wa.me`; по плану должно быть «WhatsApp **+** сохранение лида в БД». Поле
  `city` ограничено двумя вариантами (Душанбе, «Худжант» — опечатка в
  `cityOptions`), клиенты из других городов заявку не оставят.
- **SEO не начат.** Нет `sitemap.ts`, `robots.ts`, `metadataBase`, OG-картинки,
  JSON-LD. Базовый `metadata` (title/description/template) есть в `layout.tsx`.
- **`deviceSizes` не настроен** в [next.config.ts](next.config.ts) —
  переопределены только `imageSizes`, а для `fill` и `sizes="100vw"` в герое
  работает дефолтный `deviceSizes` до 3840px.

---

## Дорожная карта фронтенда

Порядок согласован с заказчиком: **сначала фронтенд, затем бэкенд**. Детали
каждого этапа — в [.cursor/project_plan/](../.cursor/project_plan/).

| Этап | Содержание | Статус |
|------|-----------|--------|
| [01](../.cursor/project_plan/01-frontend-foundation.md) | Фундамент: токены, структура, UI-kit, `siteConfig`, моки, Header/Footer | ✅ в основном готов |
| [02](../.cursor/project_plan/02-homepage-template.md) | Эталонная главная страница 🚦 | ✅ сверстана, **ждёт «ОК» заказчика** |
| [03](../.cursor/project_plan/03-catalog-and-category.md) | Каталог `/catalog` и категории `/catalog/[category]` | ⬜ |
| [04](../.cursor/project_plan/04-product-page.md) | Страница товара `/catalog/[category]/[product]`: галерея, `SpecTable`, свотчи цветов, похожие товары | ⬜ |
| [05](../.cursor/project_plan/05-calculator-and-forms.md) | Единый `RequestForm` + калькулятор `/calculator`, абстракция `submitLead()` | ⬜ |
| [06](../.cursor/project_plan/06-secondary-pages.md) | О компании, Портфолио, Новости `/news/[slug]`, Контакты | ⬜ |
| [07](../.cursor/project_plan/07-i18n-seo.md) | i18n (RU/TJ/EN) через `app/[locale]/`, `next-intl`; SEO, sitemap, robots, JSON-LD, hreflang | ⬜ |

### 🚦 Гейт этапа 02

Главная страница — **точка утверждения дизайна**. Стиль, ритм, цвета и
компоненты, утверждённые здесь, становятся эталоном для всего сайта. Пока
дизайн не принят заказчиком, страницы 03–06 не запускаются.

Оставшиеся критерии готовности гейта: Lighthouse (desktop) без критичных
проблем и «ОК» заказчика.

### Дальше (вне этой папки)

Фаза 2 — FastAPI + PostgreSQL ([08](../.cursor/project_plan/08-backend-foundation.md)–[11](../.cursor/project_plan/11-admin-panel.md)):
фундамент бэкенда, схема БД, публичный API, админка (1 пользователь, без ролей).
Фаза 3 — [интеграция](../.cursor/project_plan/12-integration.md) (замена моков на
API) и [деплой](../.cursor/project_plan/13-deployment.md) на домен roller.tj.

Папка `backend/` пока пуста.

---

## Соглашения разработки

- **Mobile-first.** Проверка на 360px / 768px / 1280px обязательна.
- **Токены вместо магических значений.** Новый цвет или размер — сначала в
  `@theme`, потом в компонент.
- **Данные отдельно от вёрстки.** Тексты и контент — в `data/`, контакты — в
  `siteConfig`.
- **Типы = будущий контракт API.** Меняя `types/index.ts`, помните, что то же
  самое будет отдавать FastAPI.
- **A11y обязательна:** семантика, `alt`, контраст, управление фокусом.
- **Производительность:** `next/image`, ленивая загрузка, оптимизация шрифтов.
- **Цены не показываем** — только «цена по расчёту» + CTA.
- **Перед коммитом:** `npm run lint` и `npm run format:check` должны быть чистыми,
  `npm run build` — проходить.
- **Не тянуть тяжёлые UI-библиотеки.** При необходимости — `shadcn/ui` поверх
  Tailwind v4.
- **По библиотекам сверяться с документацией** (локальные docs Next.js, context7
  MCP), а не с памятью.

### Knowledge graph

В корне репозитория есть граф связей `graphify-out/`. Перед грепом по коду
используйте `graphify query "<вопрос>"`, `graphify path "<A>" "<B>"`,
`graphify explain "<концепт>"`. После изменения кода — `graphify update .`.

---

## Открытые вопросы

1. **Бренд BESTWIN** — упомянут в задаче, но отсутствует в брифе. Пока
   используется список брендов из брифа.
2. **Логотип** — нужен PNG с прозрачным фоном в хорошем качестве; в
   `notes/logos/` есть варианты, основной надо подтвердить.
3. **Языки** — 3 (план) или 4 (код, с турецким)? Каждый язык — это полный перевод
   каталога и новостей. Источник переводов TJ/EN тоже не определён.
4. **Контент** портфолио и новостей — реальные фото и тексты от заказчика.
5. **Хостинг** под Next.js + FastAPI + PostgreSQL (VPS?); доступ к домену
   roller.tj подтверждён.
