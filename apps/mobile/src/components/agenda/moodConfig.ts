import type { MoodEnum } from "@helu/api";

export interface MoodConfig {
    label: string;
    emoji: string;
}

export const MOOD_CONFIG: Record<MoodEnum, MoodConfig> = {
    excellent: { label: "Excelente", emoji: "😄" },
    good:      { label: "Bien",      emoji: "😊" },
    okay:      { label: "Regular",   emoji: "😐" },
    bad:       { label: "Mal",       emoji: "😕" },
    awful:     { label: "Muy mal",   emoji: "😢" },
};

export const MOOD_ORDER: MoodEnum[] = ["excellent", "good", "okay", "bad", "awful"];
