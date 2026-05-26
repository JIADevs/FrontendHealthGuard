import type { Backpack } from "@helu/api";

export interface BackpackSection {
  title: string;
  data: Backpack[];
}

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

/** Agrupa mochilas por "Hoy" o nombre de mes, del más reciente al más antiguo. */
export function groupBackpacksByDate(backpacks: Backpack[]): BackpackSection[] {
  const today = startOfDay(new Date());
  const map = new Map<string, Backpack[]>();
  const order: string[] = [];

  const sorted = [...backpacks].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  for (const bp of sorted) {
    const date = startOfDay(new Date(bp.createdAt));
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
    map.get(title)!.push(bp);
  }

  return order.map((title) => ({ title, data: map.get(title)! }));
}
