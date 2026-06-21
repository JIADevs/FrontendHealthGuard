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
