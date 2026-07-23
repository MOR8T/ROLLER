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

/** Placeholder catalog menu — replace/edit freely later. */
export const catalogMenu = [
  {
    href: "/catalog/plastic-windows",
    label: "Пластиковые окна",
    description: "ПВХ-системы для квартир, домов и офисов",
  },
  {
    href: "/catalog/aluminium-windows",
    label: "Алюминиевые окна",
    description: "Лёгкие конструкции с большой площадью остекления",
  },
  {
    href: "/catalog/aluminium-doors",
    label: "Алюминиевые двери",
    description: "Входные и межкомнатные алюминиевые решения",
  },
  {
    href: "/catalog/sliding-systems",
    label: "Раздвижные системы",
    description: "Раздвижные окна и двери для современных проёмов",
  },
  {
    href: "/catalog/facade-systems",
    label: "Фасадные системы",
    description: "Фасадное остекление для коммерческих объектов",
  },
  {
    href: "/catalog/mosquito-nets",
    label: "Москитные сетки",
    description: "Сетки и москитные профили в комплекте",
  },
  {
    href: "/catalog/fittings",
    label: "Фурнитура и комплектующие",
    description: "Ручки, петли, ригели и сопутствующие детали",
  },
] as const;

export const locales = ["ru", "tg", "en", "tr"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "ru";
