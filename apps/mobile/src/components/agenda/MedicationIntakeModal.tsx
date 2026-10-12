import { useMemo, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import Toast from "react-native-toast-message";
import { Check, X } from "lucide-react-native";
import {
    Modal,
    Button,
    TextField,
    DateTimePicker,
    toISOLocal,
    toUtcIsoFromPickerValue,
    pickerValueFromUtcIso,
    clampPickerValueToMax,
    resolveCycleForDay,
    spacing,
    fontSize,
    fontWeight,
    radii,
    useAppTheme,
} from "@helu/ui";
import type { ThemeContextValue, AgendaEvent } from "@helu/ui";
import { useRecordIntakeMutation } from "@helu/api/hooks";
import { isApiError, type NotTakenReason } from "@helu/api";

type MedicationEvent = Extract<AgendaEvent, { type: "medication" }>;

const REASON_OPTIONS: { value: NotTakenReason; label: string }[] = [
    { value: "FORGOT", label: "Se me olvidó" },
    { value: "NOT_PURCHASED", label: "No lo compré" },
    { value: "OTHER", label: "Otro" },
];

interface MedicationIntakeModalProps {
    event: MedicationEvent;
    onClose: () => void;
}

export function MedicationIntakeModal({ event, onClose }: MedicationIntakeModalProps) {
    const t = useAppTheme();
    const styles = useMemo(() => makeStyles(t), [t]);

    const cycle = useMemo(() => resolveCycleForDay(event.data, event.dayKey), [event]);
    const existingIntake = event.intake;
    const scheduledLocalValue = `${event.dayKey}T${event.intakeTime}`;
    const dayLabel = new Date(`${event.dayKey}T12:00:00`).toLocaleDateString("es-CO", {
        weekday: "long",
        day: "numeric",
        month: "long",
    });

    const [answer, setAnswer] = useState<"TAKEN" | "NOT_TAKEN" | null>(existingIntake?.status ?? null);
    const [takenAtValue, setTakenAtValue] = useState(() =>
        existingIntake?.takenAt
            ? clampPickerValueToMax(pickerValueFromUtcIso(existingIntake.takenAt))
            : clampPickerValueToMax(scheduledLocalValue),
    );
    const [reason, setReason] = useState<NotTakenReason | null>(existingIntake?.notTakenReason ?? null);
    const [notes, setNotes] = useState(existingIntake?.notes ?? "");

    const recordMutation = useRecordIntakeMutation();

    const canSubmit =
        !!cycle && (answer === "TAKEN" || (answer === "NOT_TAKEN" && !!reason));

    const handleSubmit = () => {
        if (!cycle || !answer) return;

        const scheduledTime = toUtcIsoFromPickerValue(scheduledLocalValue);
        const payload =
            answer === "TAKEN"
                ? { status: "TAKEN" as const, scheduledTime, takenAt: toUtcIsoFromPickerValue(takenAtValue) }
                : {
                      status: "NOT_TAKEN" as const,
                      scheduledTime,
                      notTakenReason: reason!,
                      notes: notes.trim() || undefined,
                  };

        recordMutation.mutate(
            { cycleId: cycle.id, payload },
            {
                onSuccess: () => {
                    onClose();
                    Toast.show({
                        type: "success",
                        text1: answer === "TAKEN" ? "Toma registrada" : "Registrado como no tomada",
                    });
                },
                onError: (err) => {
                    Toast.show({
                        type: "error",
                        text1: "No se pudo registrar la toma",
                        text2: isApiError(err) ? err.message : "Intenta de nuevo",
                    });
                },
            },
        );
    };

    return (
        <Modal
            title={event.data.name}
            onClose={onClose}
            footer={
                <>
                    <Button variant="secondary" onPress={onClose}>
                        Cancelar
                    </Button>
                    <Button onPress={handleSubmit} disabled={!canSubmit || recordMutation.isPending} loading={recordMutation.isPending}>
                        Guardar
                    </Button>
                </>
            }
        >
            <Text style={styles.subtitle}>
                Dosis de las {event.intakeTime} · {dayLabel}
            </Text>

            {!cycle ? (
                <Text style={styles.errorText}>
                    No se encontró el ciclo de tratamiento para esta fecha.
                </Text>
            ) : (
                <>
                    <View style={styles.section}>
                        <Text style={styles.label}>¿Tomaste esta dosis?</Text>
                        <View style={styles.answerRow}>
                            <TouchableOpacity
                                style={[styles.answerOption, answer === "TAKEN" && styles.answerOptionSelectedTaken]}
                                onPress={() => setAnswer("TAKEN")}
                                accessibilityRole="radio"
                                accessibilityState={{ selected: answer === "TAKEN" }}
                            >
                                <Check size={16} color={answer === "TAKEN" ? t.status.successFg : t.text.secondary} />
                                <Text
                                    style={[
                                        styles.answerOptionText,
                                        answer === "TAKEN" && { color: t.status.successFg, fontWeight: fontWeight.semibold },
                                    ]}
                                >
                                    Sí, la tomé
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.answerOption, answer === "NOT_TAKEN" && styles.answerOptionSelectedMissed]}
                                onPress={() => setAnswer("NOT_TAKEN")}
                                accessibilityRole="radio"
                                accessibilityState={{ selected: answer === "NOT_TAKEN" }}
                            >
                                <X size={16} color={answer === "NOT_TAKEN" ? t.status.errorFg : t.text.secondary} />
                                <Text
                                    style={[
                                        styles.answerOptionText,
                                        answer === "NOT_TAKEN" && { color: t.status.errorFg, fontWeight: fontWeight.semibold },
                                    ]}
                                >
                                    No la tomé
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {answer === "TAKEN" ? (
                        <View style={styles.section}>
                            <DateTimePicker
                                label="¿A qué hora la tomaste?"
                                value={takenAtValue}
                                onChange={(value) => setTakenAtValue(clampPickerValueToMax(value))}
                                maxDate={toISOLocal(new Date())}
                            />
                        </View>
                    ) : null}

                    {answer === "NOT_TAKEN" ? (
                        <View style={styles.section}>
                            <Text style={styles.label}>¿Por qué no la tomaste?</Text>
                            <View style={styles.reasonRow} accessibilityRole="radiogroup">
                                {REASON_OPTIONS.map((option) => {
                                    const isSelected = reason === option.value;
                                    return (
                                        <TouchableOpacity
                                            key={option.value}
                                            style={[styles.reasonChip, isSelected && styles.reasonChipSelected]}
                                            onPress={() => setReason(option.value)}
                                            accessibilityRole="radio"
                                            accessibilityState={{ selected: isSelected }}
                                        >
                                            <Text style={[styles.reasonChipText, isSelected && styles.reasonChipTextSelected]}>
                                                {option.label}
                                            </Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>

                            <View style={styles.notesField}>
                                <TextField
                                    label="Detalles (opcional)"
                                    value={notes}
                                    onChange={setNotes}
                                    placeholder="Agrega más contexto si quieres"
                                />
                            </View>
                        </View>
                    ) : null}
                </>
            )}
        </Modal>
    );
}

function makeStyles(t: ThemeContextValue) {
    return StyleSheet.create({
        subtitle: {
            fontSize: fontSize.sm,
            color: t.text.secondary,
            marginBottom: spacing[4],
            textTransform: "capitalize",
        },
        section: {
            marginBottom: spacing[4],
        },
        label: {
            fontSize: fontSize.sm,
            fontWeight: fontWeight.semibold,
            color: t.text.primary,
            marginBottom: spacing[2],
        },
        errorText: {
            fontSize: fontSize.sm,
            color: t.status.errorFg,
        },
        answerRow: {
            flexDirection: "row",
            gap: spacing[3],
        },
        answerOption: {
            flex: 1,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: spacing[1],
            paddingVertical: spacing[3],
            borderRadius: radii.md,
            borderWidth: 1,
            borderColor: t.border.light,
        },
        answerOptionSelectedTaken: {
            borderColor: t.status.successFg,
            backgroundColor: t.status.successBg,
        },
        answerOptionSelectedMissed: {
            borderColor: t.status.errorFg,
            backgroundColor: t.status.errorBg,
        },
        answerOptionText: {
            fontSize: fontSize.sm,
            color: t.text.secondary,
        },
        reasonRow: {
            flexDirection: "row",
            flexWrap: "wrap",
            gap: spacing[2],
        },
        reasonChip: {
            paddingHorizontal: spacing[3],
            paddingVertical: spacing[2],
            borderRadius: radii.full,
            borderWidth: 1,
            borderColor: t.border.light,
        },
        reasonChipSelected: {
            borderColor: t.brand.fg,
            backgroundColor: t.brand.tintMed,
        },
        reasonChipText: {
            fontSize: fontSize.sm,
            color: t.text.secondary,
        },
        reasonChipTextSelected: {
            color: t.brand.fg,
            fontWeight: fontWeight.semibold,
        },
        notesField: {
            marginTop: spacing[3],
        },
    });
}
