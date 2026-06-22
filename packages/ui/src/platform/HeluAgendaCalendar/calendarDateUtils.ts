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

export function buildThreeDayDates(isoDate: string): string[] {
    return [addLocalDays(isoDate, -1), isoDate, addLocalDays(isoDate, 1)];
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

export function startOfMonth(isoDate: string): string {
    const [y, m] = isoDate.split("-").map(Number);
    return `${y}-${String(m).padStart(2, "0")}-01`;
}

export function endOfMonth(isoDate: string): string {
    const [y, m] = isoDate.split("-").map(Number);
    const lastDay = new Date(y, m, 0).getDate();
    return `${y}-${String(m).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
}

export function addMonths(isoDate: string, delta: number): string {
    const [y, m, d] = isoDate.split("-").map(Number);
    const target = new Date(y, m - 1 + delta, 1);
    const maxDay = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
    target.setDate(Math.min(d, maxDay));
    return localDateKey(target);
}

export type MonthGridCell =
    | { kind: "empty" }
    | {
          kind: "day";
          date: string;
          dayNumber: number;
          isToday: boolean;
          isSelected: boolean;
      };

const WEEKDAY_LABELS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

export function monthWeekdayLabels(): readonly string[] {
    return WEEKDAY_LABELS;
}

/** Monday-start month grid cells (includes leading/trailing padding). */
export function buildMonthGrid(monthAnchor: string): MonthGridCell[] {
    const monthStart = startOfMonth(monthAnchor);
    const [y, m] = monthStart.split("-").map(Number);
    const daysInMonth = new Date(y, m, 0).getDate();
    const today = todayLocalDateKey();

    const firstDow = new Date(`${monthStart}T12:00:00`).getDay();
    const leadingEmpty = firstDow === 0 ? 6 : firstDow - 1;

    const cells: MonthGridCell[] = [];
    for (let i = 0; i < leadingEmpty; i++) {
        cells.push({ kind: "empty" });
    }

    for (let day = 1; day <= daysInMonth; day++) {
        const date = `${y}-${String(m).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
        cells.push({
            kind: "day",
            date,
            dayNumber: day,
            isToday: date === today,
            isSelected: false,
        });
    }

    while (cells.length % 7 !== 0) {
        cells.push({ kind: "empty" });
    }

    return cells;
}
