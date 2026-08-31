interface PagePlaceholderProps {
  title: string;
}

export function PagePlaceholder({ title }: PagePlaceholderProps) {
  return (
    <div className="px-gutter py-10">
      <h1 className="text-2xl font-semibold text-brand-black">{title}</h1>
      <p className="mt-2 text-neutral-600">Раздел в разработке.</p>
    </div>
  );
}
