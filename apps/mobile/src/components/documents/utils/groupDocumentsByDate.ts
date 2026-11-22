import type { Document } from "@helu/api";

export interface DocumentSection {
  title: string;
  data: Document[];
}

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

/** The document's own date, read as a calendar day (the API stores midnight UTC). */
export function documentDay(doc: Pick<Document, "documentDate" | "uploadedAt">): Date {
  if (doc.documentDate) return new Date(`${doc.documentDate.slice(0, 10)}T00:00:00`);
  return startOfDay(new Date(doc.uploadedAt));
}

/**
 * Groups documents newest first (mockup «Documentos»): «Esta semana» for the last 7 days, then one
 * group per month («Octubre», «Octubre 2025» when it is not the current year).
 */
export function groupDocumentsByDate(documents: Document[]): DocumentSection[] {
  const today = startOfDay(new Date());
  const weekAgo = new Date(today);
  weekAgo.setDate(today.getDate() - 6);
  const map = new Map<string, Document[]>();
  const order: string[] = [];

  const sorted = [...documents].sort((a, b) => documentDay(b).getTime() - documentDay(a).getTime());

  for (const doc of sorted) {
    const date = documentDay(doc);
    let title: string;
    if (date >= weekAgo) {
      title = "Esta semana";
    } else {
      const month = date.toLocaleDateString("es-CO", { month: "long" });
      title = month.charAt(0).toUpperCase() + month.slice(1);
      if (date.getFullYear() !== today.getFullYear()) title = `${title} ${date.getFullYear()}`;
    }
    if (!map.has(title)) {
      map.set(title, []);
      order.push(title);
    }
    map.get(title)!.push(doc);
  }

  return order.map((title) => ({ title, data: map.get(title)! }));
}

const MONTHS_SHORT = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

/** «28 oct», or «28 oct 2025» when it is not the current year. */
export function documentDateLabel(doc: Pick<Document, "documentDate" | "uploadedAt">): string {
  const d = documentDay(doc);
  if (Number.isNaN(d.getTime())) return "";
  const base = `${d.getDate()} ${MONTHS_SHORT[d.getMonth()]}`;
  return d.getFullYear() === new Date().getFullYear() ? base : `${base} ${d.getFullYear()}`;
}
