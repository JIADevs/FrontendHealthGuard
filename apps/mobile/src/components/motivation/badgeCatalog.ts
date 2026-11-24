import { Activity, CalendarCheck, FileCheck2, Flame, Medal as MedalIcon, Route, Trophy, type LucideIcon } from "lucide-react-native";
import type { ThemeContextValue } from "@helu/ui";

/**
 * Copy and look of the 8 badges (Motivación PRD §5, mockup m6 «Perfil»). The backend only says
 * which `code` is earned; names and criteria are product copy (es-CO, tuteo) and live here.
 */
export interface BadgeCopy {
  label: string;
  /** «Se gana cuando…», for the accessibility label and the celebration card. */
  earnedText: string;
  /** Third person, for a manager (DA-13). */
  earnedTextOther: string;
  icon: LucideIcon;
  /** Fill and bottom edge of the medal (MASTER §4.4: level and badges in amber; mockup colors). */
  colors: (t: ThemeContextValue) => { bg: string; edge: string };
}

const level = (t: ThemeContextValue) => ({ bg: t.motivation.level, edge: t.status.warningFg });
const brand = (t: ThemeContextValue) => ({ bg: t.brand.focus, edge: t.brand.text });
const streak = (t: ThemeContextValue) => ({ bg: t.motivation.streak, edge: t.motivation.streakSolid });
const success = (t: ThemeContextValue) => ({ bg: t.status.successGraphic, edge: t.status.successFg });

export const BADGE_CATALOG: Record<string, BadgeCopy> = {
  first_mission: {
    label: "Primera misión",
    earnedText: "Completaste tu primera misión en Helu.",
    earnedTextOther: "Completó su primera misión en Helu.",
    icon: Trophy,
    colors: level,
  },
  step_by_step: {
    label: "Paso a paso",
    earnedText: "Completaste 10 pasos de tus misiones.",
    earnedTextOther: "Completó 10 pasos de sus misiones.",
    icon: Route,
    colors: brand,
  },
  five_missions: {
    label: "Cinco misiones",
    earnedText: "Completaste 5 misiones.",
    earnedTextOther: "Completó 5 misiones.",
    icon: MedalIcon,
    colors: level,
  },
  therapy_complete: {
    label: "Terapia completa",
    earnedText: "Terminaste una misión de terapia.",
    earnedTextOther: "Terminó una misión de terapia.",
    icon: Activity,
    colors: brand,
  },
  streak_7: {
    label: "Racha de 7",
    earnedText: "Hiciste check-in 7 días seguidos.",
    earnedTextOther: "Hizo check-in 7 días seguidos.",
    icon: Flame,
    colors: streak,
  },
  streak_30: {
    label: "Racha de 30",
    earnedText: "Hiciste check-in 30 días seguidos.",
    earnedTextOther: "Hizo check-in 30 días seguidos.",
    icon: Flame,
    colors: streak,
  },
  week_on_track: {
    label: "Semana al día",
    earnedText: "Registraste todas tus tomas 7 días seguidos.",
    earnedTextOther: "Registró todas sus tomas 7 días seguidos.",
    icon: CalendarCheck,
    colors: success,
  },
  documents_ready: {
    label: "Documentos listos",
    earnedText: "Compartiste documentos con tu médico por primera vez.",
    earnedTextOther: "Compartió documentos con su médico por primera vez.",
    icon: FileCheck2,
    colors: brand,
  },
};

export function badgeCopy(code: string): BadgeCopy | undefined {
  return BADGE_CATALOG[code];
}
