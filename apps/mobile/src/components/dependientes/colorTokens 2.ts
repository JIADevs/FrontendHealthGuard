import { palette } from "@helu/ui";

/** Closed palette — each entry has a stable id (React key) and a distinct hex color. */
export const DELEGATION_COLOR_OPTIONS = [
    { id: "brand", color: palette.brand[500] },
    { id: "pink", color: palette.accent.calendar[500] },
    { id: "violet", color: palette.accent.ai[500] },
    { id: "amber", color: palette.accent.medication[500] },
    { id: "orange", color: palette.accent.backpack[500] },
    { id: "emerald", color: palette.accent.notification[500] },
    { id: "green", color: palette.accent.document[600] },
    { id: "sky", color: palette.status.info[500] },
    { id: "red", color: palette.status.error[500] },
] as const;

export const DELEGATION_COLOR_TOKENS: string[] = DELEGATION_COLOR_OPTIONS.map((o) => o.color);

export type DelegationColorToken = string;

export function getDefaultColor(index: number): string {
    return DELEGATION_COLOR_TOKENS[index % DELEGATION_COLOR_TOKENS.length]!;
}

export function resolveDelegationRingColor(
    contextColors: Record<string, string>,
    patientId: string,
    colorIndex: number,
): string {
    return contextColors[patientId] ?? getDefaultColor(colorIndex);
}
