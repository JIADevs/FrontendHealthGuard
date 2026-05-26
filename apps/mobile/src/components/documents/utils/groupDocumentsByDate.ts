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

/** Agrupa documentos por "Hoy" o nombre de mes, ordenados del más reciente al más antiguo. */
export function groupDocumentsByDate(documents: Document[]): DocumentSection[] {
  const today = startOfDay(new Date());
  const map = new Map<string, Document[]>();
  const order: string[] = [];

  const sorted = [...documents].sort((a, b) => {
    const da = new Date(a.documentDate ?? a.uploadedAt).getTime();
    const db = new Date(b.documentDate ?? b.uploadedAt).getTime();
    return db - da;
  });

  for (const doc of sorted) {
    const raw = doc.documentDate ?? doc.uploadedAt;
    const date = startOfDay(new Date(raw));
    let title: string;

    if (date.getTime() === today.getTime()) {
      title = "Hoy";
    } else {
      const month = date.toLocaleDateString("es-CO", { month: "long" });
      title = month.charAt(0).toUpperCase() + month.slice(1);
      if (date.getFullYear() !== today.getFullYear()) {
        title = `${title} ${date.getFullYear()}`;
      }
    }

    if (!map.has(title)) {
      map.set(title, []);
      order.push(title);
    }
    map.get(title)!.push(doc);
  }

  return order.map((title) => ({ title, data: map.get(title)! }));
}
