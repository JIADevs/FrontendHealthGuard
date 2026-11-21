import type { DoseUnit, FrequencyUnit, MedicationCycle, PharmaceuticalForm } from "@helu/api";

const DOSE_UNIT_LABELS_ES: Record<string, string> = {
  TABLET: "tableta(s)",
  ML: "ml",
  DROPS: "gotas",
  GRAMS: "gramos",
  MG: "mg",
  UNITS: "unidad(es)",
};

export function formatFrequency(freq: number, unit: string): string {
  const labels: Record<string, [string, string]> = {
    HOUR: ["hora", "horas"],
    DAY: ["día", "días"],
    WEEK: ["semana", "semanas"],
    MONTH: ["mes", "meses"],
    YEAR: ["año", "años"],
  };
  const [s, p] = labels[unit] ?? [unit.toLowerCase(), unit.toLowerCase()];
  return `cada ${freq} ${freq === 1 ? s : p}`;
}

export function formatDose(
  doseAmount: number | null | undefined,
  doseUnit: string | null | undefined,
  fallback: string,
): string {
  const unitLabel = doseUnit ? (DOSE_UNIT_LABELS_ES[doseUnit] ?? doseUnit.toLowerCase()) : "";
  if (doseAmount != null && unitLabel) return `${doseAmount} ${unitLabel}`;
  if (doseAmount != null) return String(doseAmount);
  return fallback;
}

/** The dose unit comes from the form: the person never picks «ml» for a tablet. */
export const FORM_UNIT: Record<PharmaceuticalForm, { unit: DoseUnit; one: string; many: string; trail: string }> = {
  TABLET: { unit: "TABLET", one: "tableta", many: "tabletas", trail: "tableta(s)" },
  CAPSULE: { unit: "UNITS", one: "cápsula", many: "cápsulas", trail: "cápsula(s)" },
  SYRUP: { unit: "ML", one: "ml", many: "ml", trail: "ml" },
  DROPS: { unit: "DROPS", one: "gota", many: "gotas", trail: "gota(s)" },
  INJECTION: { unit: "ML", one: "ml", many: "ml", trail: "ml" },
  CREAM: { unit: "GRAMS", one: "g", many: "g", trail: "g" },
  SPRAY: { unit: "UNITS", one: "disparo", many: "disparos", trail: "disparo(s)" },
  PASTE: { unit: "GRAMS", one: "g", many: "g", trail: "g" },
  POWDER: { unit: "GRAMS", one: "g", many: "g", trail: "g" },
};

export const FREQ_UNITS: { value: FrequencyUnit; label: string; one: string; many: string }[] = [
  { value: "HOUR", label: "Horas", one: "hora", many: "horas" },
  { value: "DAY", label: "Días", one: "día", many: "días" },
  { value: "WEEK", label: "Semanas", one: "semana", many: "semanas" },
  { value: "MONTH", label: "Meses", one: "mes", many: "meses" },
  { value: "YEAR", label: "Años", one: "año", many: "años" },
];

export const parseAmount = (v: string) => Number.parseFloat(v.replace(",", "."));

/** «1 tableta cada 12 horas · 2 tomas al día». Null until dose and frequency make sense. */
export function doseSummary(
  amount: string,
  form: PharmaceuticalForm | "",
  frequency: string,
  unit: FrequencyUnit,
  withPerDay = true,
): string | null {
  const n = parseAmount(amount);
  const every = Number.parseInt(frequency, 10);
  if (!form || !(n > 0) || !(every > 0)) return null;
  const f = FORM_UNIT[form];
  const doseText = `${String(n).replace(".", ",")} ${n === 1 ? f.one : f.many}`;
  const u = FREQ_UNITS.find((x) => x.value === unit)!;
  const everyText = every === 1 ? `cada ${u.one}` : `cada ${every} ${u.many}`;
  let perDay = "";
  if (unit === "HOUR" && 24 % every === 0) perDay = 24 / every === 1 ? "1 toma al día" : `${24 / every} tomas al día`;
  else if (unit === "DAY" && every === 1) perDay = "1 toma al día";
  else if (unit === "WEEK" && every === 1) perDay = "1 toma a la semana";
  return [`${doseText} ${everyText}`, withPerDay ? perDay : ""].filter(Boolean).join(" · ");
}


/** «1 tableta cada 12 horas» for a saved cycle; falls back to the stored text when the form is unknown. */
export function cycleDoseText(cycle: MedicationCycle): string {
  const fromForm = doseSummary(
    cycle.doseAmount != null ? String(cycle.doseAmount) : "",
    (cycle.pharmaceuticalForm as PharmaceuticalForm | null) ?? "",
    String(cycle.frequency),
    cycle.frequencyUnit as FrequencyUnit,
    false,
  );
  if (fromForm) return fromForm;
  return `${formatDose(cycle.doseAmount, cycle.doseUnit, cycle.dosage)} ${formatFrequency(cycle.frequency, cycle.frequencyUnit)}`;
}

/** «1 tableta», «5 ml»: the dose alone, with the noun of the pharmaceutical form when it is known. */
export function cycleDoseAmount(cycle: MedicationCycle): string {
  const form = cycle.pharmaceuticalForm as PharmaceuticalForm | null | undefined;
  const n = cycle.doseAmount != null ? Number(cycle.doseAmount) : NaN;
  if (form && FORM_UNIT[form] && n > 0) {
    return `${String(n).replace(".", ",")} ${n === 1 ? FORM_UNIT[form].one : FORM_UNIT[form].many}`;
  }
  return formatDose(cycle.doseAmount, cycle.doseUnit, cycle.dosage);
}

/** «Cada 12 horas», «Cada día». */
export function cycleFrequencyText(cycle: MedicationCycle): string {
  const u = FREQ_UNITS.find((x) => x.value === cycle.frequencyUnit);
  if (!u) return formatFrequency(cycle.frequency, cycle.frequencyUnit);
  return cycle.frequency === 1 ? `Cada ${u.one}` : `Cada ${cycle.frequency} ${u.many}`;
}

/** «Al momento de la toma», «15 min antes», «Sin recordatorio». */
export function reminderText(offsets: number[] | null | undefined): string {
  const list = offsets ?? [];
  if (list.length === 0) return "Sin recordatorio";
  return list
    .slice()
    .sort((a, b) => a - b)
    .map((m) => (m === 0 ? "Al momento de la toma" : m % 60 === 0 ? `${m / 60} h antes` : `${m} min antes`))
    .join(" · ");
}
