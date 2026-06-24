import { palette } from "@helu/ui";

export const DELEGATION_COLOR_TOKENS = [
    palette.brand[500],
    palette.status.success[500],
    palette.accent.calendar,
    palette.accent.ai,
    palette.accent.medication,
    palette.accent.backpack,
    palette.accent.notification,
    palette.accent.document,
    palette.status.warning[500],
    palette.status.error[500],
] as const;

export type DelegationColorToken = typeof DELEGATION_COLOR_TOKENS[number];

export function getDefaultColor(index: number): string {
    return DELEGATION_COLOR_TOKENS[index % DELEGATION_COLOR_TOKENS.length];
}
