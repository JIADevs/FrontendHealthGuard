import type { ReactNode } from "react";
import { View, Text, Pressable } from "react-native";
import { CalendarDays, Check, ChevronRight, FileUp, Pill } from "lucide-react-native";
import { Button, Chip, nativeFont, spacing, useAppTheme } from "@helu/ui";
import { HomeCard } from "./HomeCard";
import { HomeRow } from "./HomeRow";
import { ProgressRing } from "./ProgressRing";

export type SetupStepKey = "medication" | "appointment" | "document";

export interface SetupState {
  medication: boolean;
  appointment: boolean;
  document: boolean;
}

interface SetupChecklistProps {
  state: SetupState;
  onStep: (step: SetupStepKey) => void;
  onHide: () => void;
}

const PRIMARY_LABEL: Record<SetupStepKey, string> = {
  medication: "Agregar mi primer medicamento",
  appointment: "Agregar mi próxima cita",
  document: "Subir un documento",
};

/**
 * «Configura Helu · k de 4» (mockup «Inicio · primer uso»). Crear la cuenta ya cuenta como hecho,
 * así la barra no arranca en cero. El botón principal lleva al siguiente paso que falta.
 */
export function SetupChecklist({ state, onStep, onHide }: SetupChecklistProps) {
  const t = useAppTheme();
  const done = 1 + Number(state.medication) + Number(state.appointment) + Number(state.document);
  const next = (["medication", "appointment", "document"] as const).find((k) => !state[k]);
  const doneChip = <Chip label="Hecho" tone="success" icon={<Check size={12} strokeWidth={3} color={t.status.successFg} />} />;
  const chevron = <ChevronRight size={18} color={t.text.secondary} />;
  const icon = (I: typeof Pill, color: string) => <I size={19} strokeWidth={2.2} color={color} />;

  const step = (key: SetupStepKey, I: typeof Pill, title: string, meta: string): ReactNode => {
    const isDone = state[key];
    return (
      <HomeRow
        key={key}
        tone={isDone ? "success" : "brand"}
        icon={icon(isDone ? Check : I, isDone ? t.status.successFg : t.brand.text)}
        title={title}
        meta={isDone ? "Listo" : meta}
        right={isDone ? doneChip : chevron}
        onPress={isDone ? undefined : () => onStep(key)}
      />
    );
  };

  return (
    <HomeCard>
      <View style={{ flexDirection: "row", alignItems: "center", gap: spacing[3] }}>
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={{ fontSize: 11, letterSpacing: 0.9, fontFamily: nativeFont("heading", 900), color: t.brand.text }}>
            EMPIEZA EN 4 PASOS
          </Text>
          <Text accessibilityRole="header" style={{ fontSize: 16, lineHeight: 20, fontFamily: nativeFont("heading", 800), color: t.text.primary }}>
            Configura Helu · {done} de 4
          </Text>
        </View>
        <ProgressRing size={52} progress={done / 4}>
          <Text style={{ fontSize: 13, fontFamily: nativeFont("heading", 900), color: t.text.primary }}>{done}/4</Text>
        </ProgressRing>
      </View>

      <HomeRow tone="success" icon={icon(Check, t.status.successFg)} title="Crear tu cuenta" meta="Listo" right={doneChip} />
      {step("medication", Pill, "Agregar tu primer medicamento", "1 min")}
      {step("appointment", CalendarDays, "Agregar tu próxima cita", "1 min")}
      {step("document", FileUp, "Subir un documento", "30 s")}

      {next ? (
        <Button fullWidth onPress={() => onStep(next)}>
          {PRIMARY_LABEL[next]}
        </Button>
      ) : null}
      <Pressable
        onPress={onHide}
        accessibilityRole="button"
        style={({ pressed }) => ({ alignSelf: "center", minHeight: 44, justifyContent: "center", opacity: pressed ? 0.6 : 1 })}
      >
        <Text style={{ fontSize: 14, fontFamily: nativeFont("heading", 800), color: t.text.secondary }}>Ocultar esta lista</Text>
      </Pressable>
    </HomeCard>
  );
}
