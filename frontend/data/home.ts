import {
  Award,
  Factory,
  Headphones,
  PackageCheck,
  Ruler,
  ShieldCheck,
  Truck,
  Wrench,
} from "lucide-react";
import type { HeroSlide, NewsTeaser, ProjectTeaser, ShowcaseProduct } from "@/types";

export const productCategories = [
  {
    title: "ПВХ продукция",
    eyebrow: "Окна и двери",
    description: "Оконные и дверные системы для квартир, частных домов и коммерческих объектов.",
    href: "/catalog/pvc",
    image: "/products/stella/stella-main.png",
    accent: "bg-brand-red",
  },
  {
    title: "Алюминиевая продукция",
    eyebrow: "Фасады и остекление",
    description: "Тёплые, фасадные и раздвижные алюминиевые решения для современной архитектуры.",
    href: "/catalog/aluminium",
    image: "/products/thermo/thermo-anthracite.png",
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

export const showcaseProducts: ShowcaseProduct[] = [
  {
    name: "ROLLER",
    type: "ПВХ система",
    badge: "Средний сегмент",
    badgeVariant: "outline",
    description:
      "Практичная серия для квартир, домов и офисов, где нужен надёжный базовый баланс тепла, тишины и стоимости.",
    summary: "ПВХ · 60 мм · 4 камеры",
    highlights: [
      "Стеклопакет 20 мм",
      "Откидной и поворотный механизм",
      "Гарантия до 15 лет на цветные решения",
    ],
    image: "/products/roller/roller-main.png",
    href: "/catalog/pvc",
    priority: true,
  },
  {
    name: "STELLA",
    type: "ПВХ система",
    badge: "Премиум класс",
    badgeVariant: "red",
    description:
      "Серия для проектов с повышенными требованиями к теплоизоляции, акустике и более строгой геометрии профиля.",
    summary: "ПВХ · 75 мм · 5 камер",
    highlights: [
      "Стеклопакет 26–42 мм",
      "Тройной контур уплотнения",
      "Подходит для квартир и частных домов",
    ],
    image: "/products/stella/stella-main.png",
    href: "/catalog/pvc",
  },
  {
    name: "UNOPEN",
    type: "ПВХ система",
    badge: "Выше среднего",
    badgeVariant: "black",
    description:
      "Универсальная система для жилых и коммерческих объектов, когда нужен усиленный профиль без перехода в премиальный сегмент.",
    summary: "ПВХ · 65 мм · 5 камер",
    highlights: [
      "Стеклопакет 20 мм",
      "Двойное и стандартное открывание",
      "Подходит для домов, офисов и магазинов",
    ],
    image: "/products/unopen/unopen-main.png",
    href: "/catalog/pvc",
  },
  {
    name: "THERMO 60",
    type: "Алюминиевая система",
    badge: "Премиум",
    badgeVariant: "red",
    description:
      "Тёплый алюминий для фасадов, входных групп и больших проёмов, где важны архитектурность и энергоэффективность.",
    summary: "Алюминий · 60 мм · 3 камеры",
    highlights: [
      "Стеклопакет 4–20 мм",
      "Подходит для фасадов и панорамного остекления",
      "Двойное и стандартное открывание",
    ],
    image: "/products/thermo/thermo-anthracite.png",
    href: "/catalog/aluminium",
  },
  {
    name: "HOLODNIY ALD-45",
    type: "Алюминиевая система",
    badge: "Эконом сегмент",
    badgeVariant: "outline",
    description:
      "Холодная алюминиевая серия для перегородок, террас, витрин и лёгких коммерческих конструкций с тонким профилем.",
    summary: "Алюминий · 45 мм · 1 камера",
    highlights: [
      "Стеклопакет 20 мм",
      "Для офисов, магазинов и перегородок",
      "Лёгкий и прочный профиль",
    ],
    image: "/products/holodniy/holodniy-white.png",
    href: "/catalog/aluminium",
  },
];

export interface CompanyStat {
  value: number;
  suffix: string;
  label: string;
}

export const companyStats: CompanyStat[] = [
  { value: 20, suffix: "", label: "лет на рынке" },
  { value: 1000, suffix: "+", label: "реализованных объектов" },
  { value: 1000, suffix: "+", label: "клиентов" },
  { value: 400, suffix: "", label: "сотрудников" },
  { value: 10000, suffix: "+", label: "тонн в год" },
];

export interface Partner {
  name: string;
  logo: string | null;
}

export const partners: Partner[] = [
  { name: "Krauss Maffei", logo: null },
  { name: "Renolit", logo: null },
  { name: "Mikrosan", logo: null },
  { name: "Akdeniz", logo: null },
  { name: "Dow", logo: null },
  { name: "Kronos", logo: null },
  { name: "Baerlocher", logo: null },
  { name: "CNT Conta", logo: null },
] as const;

export const serviceHighlights = [
  { label: "Замер", icon: Ruler },
  { label: "Производство", icon: PackageCheck },
  { label: "Монтаж", icon: Wrench },
  { label: "Сервис", icon: Headphones },
] as const;

export const heroSlides: HeroSlide[] = [
  {
    id: "roller-production",
    eyebrow: "Собственное производство",
    headline: "Профильные системы ROLLER",
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
    href: "/portfolio",
  },
  {
    id: "business-center-khujand",
    title: "Бизнес-центр в Худжанде",
    location: "Худжанд",
    category: "Коммерция",
    image: "/products/thermo/thermo-anthracite.png",
    caption: "Фасадное остекление алюминиевой системой ТЕРМО с панорамными проёмами.",
    href: "/portfolio",
  },
  {
    id: "private-house-vahdat",
    title: "Частный дом в Вахдате",
    location: "Вахдат",
    category: "Частное строительство",
    image: "/products/roller/roller-main.png",
    caption: "Окна и двери ROLLER для частного дома с базовой теплоизоляцией.",
    href: "/portfolio",
  },
  {
    id: "shopping-mall-bokhtar",
    title: "Торговый центр в Бохтаре",
    location: "Бохтар",
    category: "Коммерция",
    image: "/products/unopen/unopen-main.png",
    caption: "Входные группы и витрины UNOPEN для торгового центра.",
    href: "/portfolio",
  },
  {
    id: "apartment-renovation-dushanbe",
    title: "Реновация квартир в Душанбе",
    location: "Душанбе",
    category: "Жильё",
    image: "/products/holodniy/holodniy-white.png",
    caption: "Замена оконных блоков в 80 квартирах с системой холодного остекления.",
    href: "/portfolio",
  },
];

export const newsTeasers: NewsTeaser[] = [
  {
    id: "new-stella-line-launch",
    title: "Запуск производственной линии STELLA",
    excerpt:
      "Расширили выпуск пятикамерного профиля STELLA для проектов с повышенными требованиями к теплоизоляции.",
    image: "/news/stella-window.png",
    date: "2026-05-12",
    href: "/news/stella-line-launch",
  },
  {
    id: "thermo-facade-project",
    title: "Алюминиевые фасады ТЕРМО в новом бизнес-центре",
    excerpt:
      "Рассказываем о проекте фасадного остекления с тёплым алюминиевым профилем и панорамными проёмами.",
    image: "/news/thermo-anthracite.png",
    date: "2026-04-03",
    href: "/news/thermo-facade-project",
  },
  {
    id: "service-expansion-2026",
    title: "Расширяем сервисное сопровождение объектов",
    excerpt:
      "Добавили плановое обслуживание и регулировку оконных систем в Душанбе, Худжанде и Бохтаре.",
    image: "/news/roller-windows.png",
    date: "2026-03-18",
    href: "/news/service-expansion-2026",
  },
];
