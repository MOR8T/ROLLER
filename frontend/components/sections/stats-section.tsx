import { Container } from "@/components/ui/container";
import { companyStats } from "@/data/home";

export function StatsSection() {
  return (
    <section className="bg-neutral-50 py-10">
      <Container>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {companyStats.map((stat) => (
            <div
              key={stat.label}
              className="rounded-3xl border border-brand-black/10 bg-brand-white p-6 text-center shadow-sm"
            >
              <p className="font-heading text-4xl font-bold tracking-tight text-brand-red">
                {stat.value}
              </p>
              <p className="mt-2 text-sm font-medium text-brand-black/60">{stat.label}</p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
