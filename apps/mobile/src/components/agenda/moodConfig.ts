import type { MoodEnum } from "@helu/api";
import { palette } from "@helu/ui";

export interface MoodConfig {
    label: string;
    emoji: string;
    circleBg: string;
}

export const MOOD_CONFIG: Record<MoodEnum, MoodConfig> = {
    excellent: { label: "Excelente", emoji: "😄", circleBg: palette.brand[100] },
    good:      { label: "Bien",      emoji: "😊", circleBg: palette.brand[50] },
    okay:      { label: "Regular",   emoji: "😐", circleBg: palette.status.warning[50] },
    bad:       { label: "Mal",       emoji: "😕", circleBg: palette.status.error[50] },
    awful:     { label: "Muy mal",   emoji: "😢", circleBg: palette.status.error[100] },
};

export const MOOD_ORDER: MoodEnum[] = ["excellent", "good", "okay", "bad", "awful"];
