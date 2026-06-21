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

/** Monday-start week containing `isoDate`. */
export function startOfWeek(isoDate: string): string {
    const d = new Date(`${isoDate}T12:00:00`);
    const weekday = d.getDay();
    const mondayOffset = weekday === 0 ? -6 : 1 - weekday;
    return addLocalDays(isoDate, mondayOffset);
}

export function buildWeekDates(isoDate: string): string[] {
    const start = startOfWeek(isoDate);
    return Array.from({ length: 7 }, (_, i) => addLocalDays(start, i));
}

export function formatWeekLabel(weekDates: string[]): string {
    if (weekDates.length === 0) return "";
    const first = new Date(`${weekDates[0]}T12:00:00`);
    const last = new Date(`${weekDates[weekDates.length - 1]}T12:00:00`);
    const sameMonth = first.getMonth() === last.getMonth() && first.getFullYear() === last.getFullYear();

    if (sameMonth) {
        return `${first.getDate()} – ${last.getDate()} ${first.toLocaleDateString("es-CO", { month: "long", year: "numeric" })}`;
    }

    const left = first.toLocaleDateString("es-CO", { day: "numeric", month: "short" });
    const right = last.toLocaleDateString("es-CO", { day: "numeric", month: "short", year: "numeric" });
    return `${left} – ${right}`;
}
