/** Local datetime for DateTimePicker (YYYY-MM-DDTHH:mm, device timezone). */
export function toISOLocal(date: Date): string {
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/** Hydrate picker from an API UTC ISO string. */
export function pickerValueFromUtcIso(iso: string): string {
    if (!iso) return toISOLocal(new Date());
    return toISOLocal(new Date(iso));
}

/** Convert picker value to UTC ISO for the API (backend expects timezone-aware UTC). */
export function toUtcIsoFromPickerValue(value: string): string {
    if (!value) return new Date().toISOString();
    return new Date(value).toISOString();
}
