export const siteConfig = {
  name: "ROLLER.TJ",
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
  workingHours: "Пн–Вс: 08:00–18:00",
  mapUrl:
    "https://earth.google.com/web/@38.54657348,68.77633513,778.986166a,524.41622405d,30y,-0h,0t,0r",
  social: {
    instagram: "https://instagram.com/roller.tj",
    telegram: "https://t.me/roller_tj",
  },
} as const;

export const navLinks = [
  { href: "/catalog", label: "Каталог" },
  { href: "/calculator", label: "Калькулятор" },
  { href: "/about", label: "О компании" },
  { href: "/portfolio", label: "Портфолио" },
  { href: "/news", label: "Новости" },
  { href: "/contacts", label: "Контакты" },
] as const;

export const locales = ["ru", "tg", "en"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "ru";
