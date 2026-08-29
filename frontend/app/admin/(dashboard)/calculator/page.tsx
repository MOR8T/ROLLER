import { CalculatorSettingsManager } from "@/components/admin/calculator/calculator-settings-manager";
import { SchemesManager } from "@/components/admin/calculator/schemes-manager";
import { getAdminCalculatorSettings } from "@/components/admin-sections/calculator-settings-actions";
import { getAdminSchemes } from "@/components/admin-sections/calculator-schemes-actions";

export default async function AdminCalculatorPage() {
  const [settings, schemes] = await Promise.all([getAdminCalculatorSettings(), getAdminSchemes()]);

  return (
    <div className="px-gutter py-10">
      <h1 className="text-2xl font-semibold text-brand-black">Калькулятор</h1>
      <p className="mt-2 text-neutral-600">
        Схемы конструкций и справочники калькулятора: механизмы, аксессуары, цвета ламинации и
        размерные лимиты.
      </p>

      <SchemesManager initialSchemes={schemes} />

      {settings ? (
        <CalculatorSettingsManager initialSettings={settings} />
      ) : (
        <p className="mt-8 text-sm text-brand-red">
          Не удалось загрузить настройки калькулятора — обновите страницу.
        </p>
      )}
    </div>
  );
}
