import { palette } from "@helu/ui";

export const DELEGATION_COLOR_TOKENS: string[] = [
    palette.brand[500],
    palette.status.success[500],
    palette.accent.calendar[500],
    palette.accent.ai[500],
    palette.accent.medication[500],
    palette.accent.backpack[500],
    palette.accent.notification[500],
    palette.accent.document[500],
    palette.status.warning[500],
    palette.status.error[500],
];

export type DelegationColorToken = string;

export function getDefaultColor(index: number): string {
    return DELEGATION_COLOR_TOKENS[index % DELEGATION_COLOR_TOKENS.length];
}
