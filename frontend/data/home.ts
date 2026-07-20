import {
  Award,
  Clock,
  Factory,
  Headphones,
  PackageCheck,
  Ruler,
  ShieldCheck,
  Truck,
  Wrench,
} from "lucide-react";

export const productCategories = [
  {
    title: "ПВХ продукция",
    description: "Оконные и дверные системы для квартир, частных домов и коммерческих объектов.",
    href: "/catalog/pvc",
    accent: "bg-brand-red",
  },
  {
    title: "Алюминиевая продукция",
    description: "Тёплые, фасадные и раздвижные алюминиевые решения для современной архитектуры.",
    href: "/catalog/aluminium",
    accent: "bg-brand-black",
  },
] as const;

export const advantages = [
  {
    title: "Собственное производство",
    description: "Контроль качества на каждом этапе: от профиля до готовой конструкции.",
    icon: Factory,
  },
  {
    title: "Качественные материалы",
    description: "Профильные системы, фурнитура и комплектующие от проверенных поставщиков.",
    icon: Award,
  },
  {
    title: "Гарантия",
    description: "Фиксируем обязательства и сопровождаем объект после установки.",
    icon: ShieldCheck,
  },
  {
    title: "Быстрый замер",
    description: "Специалист выезжает на объект и помогает выбрать подходящую систему.",
    icon: Ruler,
  },
  {
    title: "Профессиональный монтаж",
    description: "Монтажные бригады работают по технологическим картам и стандартам.",
    icon: Wrench,
  },
  {
    title: "Доставка",
    description: "Организуем аккуратную доставку конструкций на объект в согласованный срок.",
    icon: Truck,
  },
  {
    title: "Сервис",
    description: "Помогаем с регулировкой, консультациями и плановым обслуживанием.",
    icon: Headphones,
  },
] as const;

export const popularProducts = [
  {
    name: "ROLLER",
    type: "ПВХ система",
    badge: "Практичный выбор",
    description: "Базовая система для тёплых окон и дверей в жилых проектах.",
  },
  {
    name: "STELLA",
    type: "ПВХ система",
    badge: "Комфорт",
    description: "Повышенная теплоизоляция и строгая геометрия профиля.",
  },
  {
    name: "UNOPEN",
    type: "ПВХ система",
    badge: "Надёжность",
    description: "Универсальное решение для частных домов и коммерческих помещений.",
  },
  {
    name: "ТЕРМО",
    type: "Алюминий",
    badge: "Тёплый профиль",
    description: "Алюминиевые системы для фасадов, входных групп и панорамных проёмов.",
  },
] as const;

export const companyStats = [
  { value: "20", label: "лет на рынке" },
  { value: "1000+", label: "реализованных объектов" },
  { value: "1000+", label: "клиентов" },
  { value: "400", label: "сотрудников" },
  { value: "10 000+", label: "тонн в год" },
] as const;

export const partners = [
  "Krauss Maffei",
  "Renolit",
  "Mikrosan",
  "Akdeniz",
  "Dow",
  "Kronos",
  "Baerlocher",
  "CNT Conta",
] as const;

export const serviceHighlights = [
  { label: "Замер", icon: Ruler },
  { label: "Производство", icon: PackageCheck },
  { label: "Монтаж", icon: Wrench },
  { label: "Сроки", icon: Clock },
] as const;
