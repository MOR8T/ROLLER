export type Material = "ПВХ" | "алюминий";

export type Segment = "эконом" | "средний" | "выше среднего" | "премиум";

export interface Category {
  slug: string;
  title: string;
  description: string;
  image: string;
}

export interface ProductSpecs {
  thickness: string;
  chambers: number;
  glazing: string;
  soundInsulation: boolean;
  heatInsulation: boolean;
  warranty: string;
}

export interface Product {
  slug: string;
  name: string;
  brand: string;
  categorySlug: string;
  segment: Segment;
  material: Material;
  shortDescription: string;
  specs: ProductSpecs;
  colors: string[];
  images: string[];
  popular: boolean;
}

export interface Article {
  slug: string;
  title: string;
  excerpt: string;
  body: string;
  cover: string;
  publishedAt: string;
}

export interface Project {
  slug: string;
  title: string;
  city: string;
  description: string;
  images: string[];
}

export interface Lead {
  name: string;
  phone: string;
  city: string;
  productType: string;
  comment?: string;
}

export interface HeroSlide {
  id: string;
  eyebrow: string;
  headline: string;
  subtext: string;
  image: string;
  primaryCta: { label: string; href: string };
  secondaryCta?: { label: string; href: string };
}

export interface PopularProductSpec {
  label: string;
  value: string;
}

export interface PopularProduct {
  name: string;
  type: string;
  badge: string;
  description: string;
  image: string;
  specs: PopularProductSpec[];
}

export interface ProjectTeaser {
  id: string;
  title: string;
  location: string;
  category: string;
  image: string;
  caption: string;
}

export interface NewsTeaser {
  id: string;
  title: string;
  excerpt: string;
  image: string;
  date: string;
  href: string;
}
