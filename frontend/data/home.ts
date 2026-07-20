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
import type {
  HeroSlide,
  NewsTeaser,
  PopularProduct,
  ProjectTeaser,
} from "@/types";

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

export const popularProducts: PopularProduct[] = [
  {
    name: "ROLLER",
    type: "ПВХ система",
    badge: "Практичный выбор",
    description: "Базовая система для тёплых окон и дверей в жилых проектах.",
    image: "/products/roller/roller-main.png",
    specs: [
      { label: "Профиль", value: "3-камерный" },
      { label: "Толщина", value: "58 мм" },
      { label: "Стеклопакет", value: "2-камерный" },
      { label: "Шумоизоляция", value: "до 32 дБ" },
    ],
  },
  {
    name: "STELLA",
    type: "ПВХ система",
    badge: "Комфорт",
    description: "Повышенная теплоизоляция и строгая геометрия профиля.",
    image: "/products/stella/stella-main.png",
    specs: [
      { label: "Профиль", value: "5-камерный" },
      { label: "Толщина", value: "70 мм" },
      { label: "Стеклопакет", value: "2-камерный" },
      { label: "Шумоизоляция", value: "до 36 дБ" },
    ],
  },
  {
    name: "UNOPEN",
    type: "ПВХ система",
    badge: "Надёжность",
    description: "Универсальное решение для частных домов и коммерческих помещений.",
    image: "/products/unopen/unopen-main.png",
    specs: [
      { label: "Профиль", value: "4-камерный" },
      { label: "Толщина", value: "62 мм" },
      { label: "Стеклопакет", value: "1-камерный" },
      { label: "Шумоизоляция", value: "до 30 дБ" },
    ],
  },
  {
    name: "ТЕРМО",
    type: "Алюминий",
    badge: "Тёплый профиль",
    description: "Алюминиевые системы для фасадов, входных групп и панорамных проёмов.",
    image: "/products/thermo/thermo-anthracite.png",
    specs: [
      { label: "Профиль", value: "Тёплый термовставка" },
      { label: "Толщина", value: "от 60 мм" },
      { label: "Стеклопакет", value: "до 44 мм" },
      { label: "Шумоизоляция", value: "до 34 дБ" },
    ],
  },
];

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

export const heroSlides: HeroSlide[] = [
  {
    id: "roller-production",
    eyebrow: "Собственное производство",
    headline: "Профильные системы ROLLER.TJ",
    subtext:
      "Окна, двери и фасадные решения из ПВХ и алюминия для жилых, коммерческих и городских объектов в Таджикистане.",
    image: "/hero/hero-main.png",
    primaryCta: { label: "Рассчитать стоимость", href: "/calculator" },
    secondaryCta: { label: "Заказать звонок", href: "/contacts" },
  },
  {
    id: "stella-comfort",
    eyebrow: "Премиальная серия",
    headline: "STELLA — комфорт и теплоизоляция",
    subtext:
      "Пятикамерный профиль с повышенной теплоизоляцией для частных домов и квартир с высокими требованиями к микроклимату.",
    image: "/products/stella/stella-main.png",
    primaryCta: { label: "Подобрать систему", href: "/catalog/pvc" },
    secondaryCta: { label: "Заказать замер", href: "/contacts" },
  },
  {
    id: "thermo-aluminium",
    eyebrow: "Алюминиевые системы",
    headline: "ТЕРМО — алюминий для современных фасадов",
    subtext:
      "Тёплый алюминиевый профиль для фасадов, входных групп и панорамного остекления с увеличенными световыми проёмами.",
    image: "/products/thermo/thermo-anthracite.png",
    primaryCta: { label: "Смотреть алюминий", href: "/catalog/aluminium" },
    secondaryCta: { label: "Получить консультацию", href: "/contacts" },
  },
  {
    id: "unopen-universal",
    eyebrow: "Универсальное решение",
    headline: "UNOPEN — надёжность для любого объекта",
    subtext:
      "Универсальная оконно-дверная система для частных домов и коммерческих помещений с гарантией и сервисным сопровождением.",
    image: "/products/unopen/unopen-main.png",
    primaryCta: { label: "Выбрать систему", href: "/catalog/pvc" },
    secondaryCta: { label: "Связаться с нами", href: "/contacts" },
  },
];

export const projectTeasers: ProjectTeaser[] = [
  {
    id: "residential-complex-dushanbe",
    title: "Жилой комплекс в Душанбе",
    location: "Душанбе",
    category: "Жильё",
    image: "/products/stella/stella-main.png",
    caption: "Остекление 240 квартир системой STELLA с повышенной теплоизоляцией.",
  },
  {
    id: "business-center-khujand",
    title: "Бизнес-центр в Худжанде",
    location: "Худжанд",
    category: "Коммерция",
    image: "/products/thermo/thermo-anthracite.png",
    caption: "Фасадное остекление алюминиевой системой ТЕРМО с панорамными проёмами.",
  },
  {
    id: "private-house-vahdat",
    title: "Частный дом в Вахдате",
    location: "Вахдат",
    category: "Частное строительство",
    image: "/products/roller/roller-main.png",
    caption: "Окна и двери ROLLER для частного дома с базовой теплоизоляцией.",
  },
  {
    id: "shopping-mall-bokhtar",
    title: "Торговый центр в Бохтаре",
    location: "Бохтар",
    category: "Коммерция",
    image: "/products/unopen/unopen-main.png",
    caption: "Входные группы и витрины UNOPEN для торгового центра.",
  },
  {
    id: "apartment-renovation-dushanbe",
    title: "Реновация квартир в Душанбе",
    location: "Душанбе",
    category: "Жильё",
    image: "/products/holodniy/holodniy-white.png",
    caption: "Замена оконных блоков в 80 квартирах с системой холодного остекления.",
  },
];

export const newsTeasers: NewsTeaser[] = [
  {
    id: "new-stella-line-launch",
    title: "Запуск производственной линии STELLA",
    excerpt:
      "Расширили выпуск пятикамерного профиля STELLA для проектов с повышенными требованиями к теплоизоляции.",
    image: "/products/stella/stella-main.png",
    date: "2026-05-12",
    href: "/news/stella-line-launch",
  },
  {
    id: "thermo-facade-project",
    title: "Алюминиевые фасады ТЕРМО в новом бизнес-центре",
    excerpt:
      "Рассказываем о проекте фасадного остекления с тёплым алюминиевым профилем и панорамными проёмами.",
    image: "/products/thermo/thermo-anthracite.png",
    date: "2026-04-03",
    href: "/news/thermo-facade-project",
  },
  {
    id: "service-expansion-2026",
    title: "Расширяем сервисное сопровождение объектов",
    excerpt:
      "Добавили плановое обслуживание и регулировку оконных систем в Душанбе, Худжанде и Бохтаре.",
    image: "/hero/hero-main.png",
    date: "2026-03-18",
    href: "/news/service-expansion-2026",
  },
];
