export const siteConfig = {
  name: "ROLLER",
  slogan: {
    ru: "Тепло и комфорт для каждого дома",
    tg: "Гармию осоиш ба хар як хонадон",
  },
  foundedYear: 2006,
  phone: "+992 700 600 700",
  phoneHref: "tel:+992700600700",
  whatsapp: "992700600700",
  whatsappHref: "https://wa.me/992700600700",
  email: "rollerunopen2006@gmail.com",
  address: "г. Душанбе, ул. Мирали Махмадали 25",
  workingHours: "Пн–Сб: 08:00–18:00",
  mapUrl: "https://yandex.tj/maps/-/CTVRvHm1",
  mapEmbedUrl:
    "https://yandex.tj/map-widget/v1/?ll=68.776335%2C38.546573&mode=search&text=ROLLER%2C%20%D0%B3.%20%D0%94%D1%83%D1%88%D0%B0%D0%BD%D0%B1%D0%B5%2C%20%D1%83%D0%BB.%20%D0%9C%D0%B8%D1%80%D0%B0%D0%BB%D0%B8%20%D0%9C%D0%B0%D1%85%D0%BC%D0%B0%D0%B4%D0%B0%D0%BB%D0%B8%2025&z=16",
  social: {
    instagram: "https://instagram.com/roller.tj",
    telegram: "https://t.me/ROLLERcallcenter",
  },
} as const;

export const navLinks = [
  { href: "/catalog", label: "Каталог" },
  { href: "/about", label: "О компании" },
  { href: "/portfolio", label: "Портфолио" },
  { href: "/calculator", label: "Калькулятор" },
  { href: "/news", label: "Новости" },
  { href: "/showroom", label: "Шоурумы" },
  { href: "/contacts", label: "Контакты" },
] as const;

/**
 * Catalog mega-menu.
 *
 * These point at the application landings (`/solutions/[application]`, built in
 * stage 04), not at product-type URLs. The seven entries that used to live here
 * all 404'd, and more importantly they asked the visitor to pick a product type
 * — "раздвижные системы", "фурнитура" — which is a manufacturer's vocabulary.
 * Sorting by situation is the choice a homeowner can actually make
 * (DESIGN.md §7).
 *
 * Kept in sync with `applications` in `data/home.ts`.
 */
export const catalogMenu = [
  {
    href: "/solutions/apartment",
    label: "Квартира",
    description: "Замена окон в многоэтажном доме",
  },
  {
    href: "/solutions/house",
    label: "Частный дом",
    description: "Большие проёмы и максимальное тепло",
  },
  {
    href: "/solutions/commercial",
    label: "Офис и магазин",
    description: "Витрины, перегородки и входные группы",
  },
  {
    href: "/solutions/facade",
    label: "Фасад ЖК",
    description: "Остекление жилых комплексов под проект",
  },
] as const;

export const locales = ["ru", "tg", "en", "tr"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "ru";
