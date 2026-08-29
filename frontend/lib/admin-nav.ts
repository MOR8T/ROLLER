export interface AdminNavItem {
  label: string;
  href: string;
  icon:
    | "home"
    | "building"
    | "layout-grid"
    | "package"
    | "calculator"
    | "newspaper"
    | "store"
    | "phone"
    | "panel-bottom"
    | "settings"
    | "inbox";
}

export const adminNavItems: AdminNavItem[] = [
  { label: "Главная", href: "/admin", icon: "home" },
  { label: "Заявки", href: "/admin/leads", icon: "inbox" },
  { label: "О компании", href: "/admin/about", icon: "building" },
  { label: "Категория продукции", href: "/admin/product-categories", icon: "layout-grid" },
  { label: "Продукция", href: "/admin/products", icon: "package" },
  { label: "Калькулятор", href: "/admin/calculator", icon: "calculator" },
  { label: "Новости", href: "/admin/news", icon: "newspaper" },
  { label: "Шоурумы", href: "/admin/showrooms", icon: "store" },
  { label: "Контакты", href: "/admin/contacts", icon: "phone" },
  { label: "Подвал сайта", href: "/admin/footer", icon: "panel-bottom" },
  { label: "Настройки сайта", href: "/admin/settings", icon: "settings" },
];
