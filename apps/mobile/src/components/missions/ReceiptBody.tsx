import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Check } from "lucide-react-native";
import type { Mission, MissionStep } from "@helu/api";
import { Button, DatePicker, TextField, nativeFont, spacing, useAppTheme } from "@helu/ui";
import { MascotHint } from "../brand/MascotHint";

type ReceiptData = { status: "complete" | "partial" | "not_yet"; pendingNote?: string; returnOn?: string };

/**
 * «¿Recibiste tu medicamento?» (mockups «Medicamento · ¿Lo recibiste?» y «Recepción parcial»). Solo la
 * recepción completa cumple la regla de cierre (RF-31); con una parte la misión sigue activa y guarda
 * lo que falta (RF-37). El recordatorio como tarea de apoyo llega con M5 (RF-27).
 */
export function ReceiptBody({
  mission,
  step,
  onSave,
  onPartialChange,
}: {
  mission: Mission;
  step: MissionStep;
  /** The sheet retitles itself while asking what is pending. */
  onPartialChange?: (partial: boolean) => void;
  /** Saves the receipt and closes the sheet. */
  onSave: (data: ReceiptData) => void;
}) {
  const t = useAppTheme();
  const previous = (step.data ?? {}) as { pendingNote?: string; returnOn?: string };
  const [partial, setPartial] = useState(false);
  const [note, setNote] = useState(previous.pendingNote ?? "");
  const [returnOn, setReturnOn] = useState(previous.returnOn ?? "");
  const [touched, setTouched] = useState(false);
  const name = typeof mission.details.medicationName === "string" ? mission.details.medicationName : mission.title;

  if (partial) {
    const error = touched && !note.trim() ? "Escribe qué te falta recibir." : undefined;
    return (
      <View style={styles.body}>
        <TextField label="Lo que falta" value={note} onChange={setNote} placeholder="Ej: 30 tabletas" error={error} />
        <DatePicker
          label="¿Cuándo vuelves por ello? (opcional)"
          value={returnOn}
          onChange={setReturnOn}
          placeholder="Elige la fecha"
        />
        <Button
          variant="primary"
          fullWidth
          onPress={() => {
            setTouched(true);
            if (!note.trim()) return;
            onSave({ status: "partial", pendingNote: note.trim(), returnOn: returnOn || undefined });
          }}
        >
          Guardar
        </Button>
        <MascotHint pose="happy" text="Tu misión sigue activa hasta que recibas todo." />
      </View>
    );
  }

  return (
    <View style={styles.body}>
      <Text style={[styles.text, { color: t.text.secondary }]}>
        {step.status === "in_progress" && previous.pendingNote ? `${name} · te falta: ${previous.pendingNote}` : name}
      </Text>
      <Button
        variant="primary"
        fullWidth
        icon={<Check size={17} strokeWidth={3} color={t.text.onSolid} />}
        onPress={() => onSave({ status: "complete" })}
      >
        {step.status === "in_progress" ? "Ya lo tengo completo" : "Sí, completo"}
      </Button>
      <Button
        variant="secondary"
        fullWidth
        onPress={() => {
          setPartial(true);
          onPartialChange?.(true);
        }}
      >
        {step.status === "in_progress" ? "Editar lo que falta" : "Recibí una parte"}
      </Button>
      {step.status === "in_progress" ? null : (
        <Button variant="ghost" fullWidth onPress={() => onSave({ status: "not_yet" })}>
          Todavía no
        </Button>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  body: { gap: spacing[3], paddingBottom: spacing[2] },
  text: { fontSize: 15, lineHeight: 22, fontFamily: nativeFont("body", 400) },
});
