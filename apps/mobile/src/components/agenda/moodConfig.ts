import type { MoodEnum } from "@helu/api";
import type { SemanticKey } from "@helu/ui";

export interface MoodConfig {
    label: string;
    /** Face and bar color, from red (Muy mal) to emerald (Excelente) — inicio-agenda.md · Check-in. */
    colorKey: SemanticKey;
    /** Mouth curve of the drawn face, mockup `kit.js` · `mood()`: negative frowns, positive smiles. */
    curve: number;
    /** 1 (Muy mal) – 5 (Excelente), for the mood bars. */
    score: number;
}

export const MOOD_CONFIG: Record<MoodEnum, MoodConfig> = {
    awful:     { label: "Muy mal",   colorKey: "danger-solid",            curve: -5,   score: 1 },
    bad:       { label: "Mal",       colorKey: "motivation-streak",       curve: -2.5, score: 2 },
    okay:      { label: "Regular",   colorKey: "motivation-level",        curve: 0,    score: 3 },
    good:      { label: "Bien",      colorKey: "success-graphic",         curve: 3,    score: 4 },
    excellent: { label: "Excelente", colorKey: "feature-wellbeing-solid", curve: 6,    score: 5 },
};

/** v2: worst to best, left to right (RF-MOB-AI4). */
export const MOOD_ORDER: MoodEnum[] = ["awful", "bad", "okay", "good", "excellent"];
