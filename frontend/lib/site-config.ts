export const siteConfig = {
  name: "ROLLER",
  foundedYear: 2006,
  phone: "+992 700 600 700",
  phoneHref: "tel:+992700600700",
  whatsapp: "992700600700",
  whatsappHref: "https://wa.me/992700600700",
  email: "rollerunopen2006@gmail.com",
  mapUrl: "https://yandex.tj/maps/-/CTVRvHm1",
  mapEmbedUrl:
    "https://yandex.tj/map-widget/v1/?ll=68.776126%2C38.546627&mode=search&text=ROLLER%2C%20%D0%B3.%20%D0%94%D1%83%D1%88%D0%B0%D0%BD%D0%B1%D0%B5%2C%20%D1%83%D0%BB.%20%D0%9C%D0%B8%D1%80%D0%B0%D0%BB%D0%B8%20%D0%9C%D0%B0%D1%85%D0%BC%D0%B0%D0%B4%D0%B0%D0%BB%D0%B8%2025&z=16",
  social: {
    instagram: "https://instagram.com/roller.tj",
    telegram: "https://t.me/ROLLERcallcenter",
  },
} as const;

export interface NavLink {
  /** Label key inside the `nav` namespace. */
  key: string;
  href: string;
  /**
   * The item opens the products mega-menu instead of navigating. The header
   * renders it as a `<button>`, so `href` is never followed there — it only
   * serves places that cannot open a panel, namely the footer's list of
   * sections.
   */
  menu?: true;
}

export const navLinks: NavLink[] = [
  // { key: "main", href: "/" },
  { key: "about", href: "/about" },
  { key: "products", href: "/products", menu: true },
  { key: "calculator", href: "/calculator" },
  { key: "news", href: "/news" },
  { key: "showroom", href: "/showroom" },
  { key: "contacts", href: "/contacts" },
];
