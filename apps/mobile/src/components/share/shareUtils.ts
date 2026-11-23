import type { ShareExpiresIn, ShareResourceType } from "@helu/api";
import { formatFileSize, formatShortDate } from "@helu/ui";

/**
 * #61, decision 2: «1 hora · 24 horas · 7 días», default 24 horas. «Nunca» is gone (medical
 * documents) and the API has no 30 days.
 */
export const SHARE_EXPIRATION_OPTIONS: { value: ShareExpiresIn; label: string }[] = [
  { value: "1h", label: "1 hora" },
  { value: "24h", label: "24 horas" },
  { value: "7d", label: "7 días" },
];

export function shareResourceTypeLabel(type: ShareResourceType): string {
  return type === "backpack" ? "Mochila" : "Documento";
}

/** Tiempo relativo desde que se creó el enlace (p. ej. "hace 2h", "ayer", "hace 1 semana"). */
export function formatShareStartedAt(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "ahora";
  if (mins < 60) return `hace ${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `hace ${hrs}h`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return "ayer";
  if (days < 7) return `hace ${days} días`;
  const weeks = Math.floor(days / 7);
  return weeks === 1 ? "hace 1 semana" : `hace ${weeks} semanas`;
}

export function formatShareExpirationLabel(expiresIn: ShareExpiresIn): string {
  return SHARE_EXPIRATION_OPTIONS.find((o) => o.value === expiresIn)?.label ?? expiresIn;
}

export function formatShareExpiresInHuman(expiresAt: string | null): string {
  if (!expiresAt) return "Sin expiración";
  const diff = new Date(expiresAt).getTime() - Date.now();
  if (diff <= 0) return "Expirado";
  const hrs = Math.floor(diff / 3_600_000);
  if (hrs < 24) return `Expira en ${hrs}h`;
  const days = Math.floor(hrs / 24);
  return `Expira en ${days}d`;
}

export function buildDocumentShareSubtitle(input: {
  uploadedAt?: string | null;
  fileSizeBytes?: number | null;
  format?: string;
}): string {
  const parts: string[] = [];
  if (input.uploadedAt) parts.push(formatShortDate(input.uploadedAt));
  if (input.fileSizeBytes) parts.push(formatFileSize(input.fileSizeBytes));
  else if (input.format) parts.push(input.format.toUpperCase());
  return parts.join(" · ") || "Documento médico";
}

export function buildBackpackShareSubtitle(documentCount?: number | null): string {
  const count = documentCount ?? 0;
  const docLabel = count === 1 ? "1 documento" : `${count} documentos`;
  return docLabel;
}

const MONTHS_SHORT = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sept", "oct", "nov", "dic"];

/** «vence en 40 min», «vence en 24 h», «vence en 3 días»; `null` for a link without expiry. */
export function expiresInPhrase(expiresAt: string | null | undefined, now = Date.now()): string | null {
  if (!expiresAt) return null;
  const diff = new Date(expiresAt).getTime() - now;
  if (diff <= 0) return null;
  const mins = Math.ceil(diff / 60_000);
  if (mins < 60) return `vence en ${mins} min`;
  const hrs = Math.round(diff / 3_600_000);
  if (hrs < 48) return `vence en ${hrs} h`;
  return `vence en ${Math.round(hrs / 24)} días`;
}

/** «Venció el 28 oct». */
export function expiredOnPhrase(expiresAt: string | null | undefined): string {
  if (!expiresAt) return "Vencido";
  const d = new Date(expiresAt);
  return `Venció el ${d.getDate()} ${MONTHS_SHORT[d.getMonth()]}`;
}

/** Row meta in «Compartidos»: «2 documentos · vence en 24 h» or «Venció el 28 oct». */
export function shareLinkMeta(link: { documentCount?: number | null; expiresAt?: string | null; status: string; resourceType: ShareResourceType }): string {
  if (link.status !== "active") return expiredOnPhrase(link.expiresAt);
  const count = link.resourceType === "document" ? 1 : link.documentCount ?? 0;
  const docs = count === 1 ? "1 documento" : `${count} documentos`;
  return [docs, expiresInPhrase(link.expiresAt) ?? "sin vencimiento"].join(" · ");
}

/** «Vence en 24 h» for chips (capitalized `expiresInPhrase`). */
export function expiresChipLabel(expiresAt: string | null | undefined): string {
  const phrase = expiresInPhrase(expiresAt);
  return phrase ? phrase.charAt(0).toUpperCase() + phrase.slice(1) : "Sin vencimiento";
}

/** «Mañana, 9:40 a. m.», «Hoy, 3:00 p. m.» or «28 oct, 9:40 a. m.». */
export function formatShareWhen(iso: string): string {
  const d = new Date(iso);
  const time = d.toLocaleTimeString("es-CO", { hour: "numeric", minute: "2-digit" });
  const today = new Date();
  const tomorrow = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
  const sameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString();
  if (sameDay(d, today)) return `Hoy, ${time}`;
  if (sameDay(d, tomorrow)) return `Mañana, ${time}`;
  return `${d.getDate()} ${MONTHS_SHORT[d.getMonth()]}, ${time}`;
}

/** «3 veces · último hace 2 h» / «Aún no lo abren». */
export function viewsPhrase(viewCount: number, lastViewedAt?: string | null): string {
  if (!viewCount) return "Aún no lo abren";
  const times = viewCount === 1 ? "1 vez" : `${viewCount} veces`;
  return lastViewedAt ? `${times} · último ${formatShareStartedAt(lastViewedAt)}` : times;
}
