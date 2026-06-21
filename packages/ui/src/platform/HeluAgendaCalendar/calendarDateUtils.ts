/** Calendar day keys (YYYY-MM-DD) in the device local timezone. */

export function localDateKey(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
}

export function todayLocalDateKey(): string {
    return localDateKey(new Date());
}

export function localDateKeyFromISO(iso: string): string {
    return localDateKey(new Date(iso));
}

export function addLocalDays(isoDate: string, delta: number): string {
    const [y, m, d] = isoDate.split("-").map(Number);
    const date = new Date(y, m - 1, d);
    date.setDate(date.getDate() + delta);
    return localDateKey(date);
}

export function buildLocalDateRange(start: string, end: string): string[] {
    const dates: string[] = [];
    let current = start;
    while (current <= end) {
        dates.push(current);
        current = addLocalDays(current, 1);
    }
    return dates;
}

export function formatMonthYear(isoDate: string): string {
    const d = new Date(`${isoDate}T12:00:00`);
    return d.toLocaleDateString("es-CO", { month: "long", year: "numeric" });
}

export function formatDayShort(isoDate: string): { weekday: string; day: string; isToday: boolean } {
    const d = new Date(`${isoDate}T12:00:00`);
    const weekday = d.toLocaleDateString("es-CO", { weekday: "short" }).replace(".", "");
    const day = String(d.getDate());
    return { weekday, day, isToday: isoDate === todayLocalDateKey() };
}
