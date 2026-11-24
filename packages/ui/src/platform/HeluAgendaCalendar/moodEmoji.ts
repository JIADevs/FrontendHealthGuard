import type { MoodEnum } from "@helu/api";

export const MOOD_EMOJI: Record<MoodEnum, string> = {
    excellent: "😄",
    good: "😊",
    okay: "😐",
    bad: "😕",
    awful: "😢",
};

/** The five check-in faces, as the app names them (MASTER: «Muy mal» … «Excelente»). */
export const MOOD_LABEL_ES: Record<MoodEnum, string> = {
    excellent: "Excelente",
    good: "Bien",
    okay: "Regular",
    bad: "Mal",
    awful: "Muy mal",
};
