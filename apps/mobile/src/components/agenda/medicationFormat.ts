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
