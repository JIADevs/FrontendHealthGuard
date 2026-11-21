import { useMemo, useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import Toast from "react-native-toast-message";
import {
    BottomSheet,
    Button,
    ChoiceChips,
    TextField,
    DateTimePicker,
    toISOLocal,
    toUtcIsoFromPickerValue,
    pickerValueFromUtcIso,
    clampPickerValueToMax,
    resolveCycleForDay,
    NOT_TAKEN_REASON_LABELS_ES,
    spacing,
    fontSize,
    useAppTheme,
} from "@helu/ui";
import type { ThemeContextValue, AgendaEvent } from "@helu/ui";
import { useConfirmIntakeMutation, useRecordIntakeMutation } from "@helu/api/hooks";
import { isApiError, type NotTakenReason } from "@helu/api";

type MedicationEvent = Extract<AgendaEvent, { type: "medication" }>;

const REASON_OPTIONS = (Object.entries(NOT_TAKEN_REASON_LABELS_ES) as [NotTakenReason, string][]).map(
    ([value, label]) => ({ value, label }),
);

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

    const [missed, setMissed] = useState(existingIntake?.status === "NOT_TAKEN");
    const [changeTime, setChangeTime] = useState(false);
    const [takenAtValue, setTakenAtValue] = useState(() =>
        existingIntake?.takenAt
            ? clampPickerValueToMax(pickerValueFromUtcIso(existingIntake.takenAt))
            : clampPickerValueToMax(scheduledLocalValue),
    );
    const [reason, setReason] = useState<NotTakenReason | null>(existingIntake?.notTakenReason ?? null);
    const [notes, setNotes] = useState(existingIntake?.notes ?? "");

    const confirmMutation = useConfirmIntakeMutation();
    const recordMutation = useRecordIntakeMutation();
    const saving = confirmMutation.isPending || recordMutation.isPending;

    const dirty =
        missed !== (existingIntake?.status === "NOT_TAKEN") ||
        changeTime ||
        reason !== (existingIntake?.notTakenReason ?? null) ||
        notes !== (existingIntake?.notes ?? "");

    const showError = (err: unknown) => {
        Toast.show({
            type: "error",
            text1: "No se pudo registrar la toma",
            text2: isApiError(err) ? err.message : "Intenta de nuevo",
        });
    };

    const saveTakenNow = () => {
        if (!cycle) return;
        confirmMutation.mutate(cycle.id, {
            onSuccess: () => {
                onClose();
                Toast.show({ type: "success", text1: "Toma registrada" });
            },
            onError: showError,
        });
    };

    const saveChangedTime = () => {
        if (!cycle) return;
        recordMutation.mutate(
            {
                cycleId: cycle.id,
                payload: {
                    status: "TAKEN",
                    scheduledTime: toUtcIsoFromPickerValue(scheduledLocalValue),
                    takenAt: toUtcIsoFromPickerValue(takenAtValue),
                },
            },
            {
                onSuccess: () => {
                    onClose();
                    Toast.show({ type: "success", text1: "Toma registrada" });
                },
                onError: showError,
            },
        );
    };

    const saveMissed = () => {
        if (!cycle || !reason) return;
        recordMutation.mutate(
            {
                cycleId: cycle.id,
                payload: {
                    status: "NOT_TAKEN",
                    scheduledTime: toUtcIsoFromPickerValue(scheduledLocalValue),
                    notTakenReason: reason,
                    notes: notes.trim() || undefined,
                },
            },
            {
                onSuccess: () => {
                    onClose();
                    Toast.show({ type: "success", text1: "Registrado como no tomada" });
                },
                onError: showError,
            },
        );
    };

    return (
        <BottomSheet
            title={event.data.name}
            eyebrow={`Dosis de las ${event.intakeTime}`}
            dirty={dirty}
            onClose={onClose}
        >
            <Text style={styles.subtitle}>{dayLabel}</Text>

            {!cycle ? (
                <Text style={styles.errorText}>No se encontró el ciclo de tratamiento para esta fecha.</Text>
            ) : (
                <>
                    <Text style={styles.label}>¿Tomaste esta dosis?</Text>
                    <View style={styles.actions}>
                        <Button
                            variant="success"
                            fullWidth
                            onPress={saveTakenNow}
                            disabled={saving}
                            loading={confirmMutation.isPending}
                            loadingLabel="Guardando…"
                        >
                            Sí, la tomé
                        </Button>
                        <Button
                            variant="secondary"
                            fullWidth
                            onPress={() => {
                                setMissed(true);
                                setChangeTime(false);
                            }}
                            disabled={saving}
                        >
                            No la tomé
                        </Button>
                        <Button variant="ghost" fullWidth onPress={() => setChangeTime(true)} disabled={saving}>
                            Cambiar hora
                        </Button>
                    </View>

                    {changeTime ? (
                        <View style={styles.section}>
                            <DateTimePicker
                                label="¿A qué hora la tomaste?"
                                value={takenAtValue}
                                onChange={(value) => setTakenAtValue(clampPickerValueToMax(value))}
                                maxDate={toISOLocal(new Date())}
                            />
                            <Button
                                variant="primary"
                                fullWidth
                                onPress={saveChangedTime}
                                disabled={saving}
                                loading={recordMutation.isPending && !missed}
                                loadingLabel="Guardando…"
                            >
                                Guardar hora
                            </Button>
                        </View>
                    ) : null}

                    {missed ? (
                        <View style={styles.section}>
                            <Text style={styles.label}>¿Por qué no la tomaste?</Text>
                            <ChoiceChips
                                options={REASON_OPTIONS}
                                value={reason}
                                onChange={(value) => {
                                    const match = REASON_OPTIONS.find((option) => option.value === value);
                                    if (match) setReason(match.value);
                                }}
                            />
                            <View style={styles.notesField}>
                                <TextField
                                    label="Detalles (opcional)"
                                    value={notes}
                                    onChange={setNotes}
                                    placeholder="Agrega más contexto si quieres"
                                />
                            </View>
                            <Button
                                variant="danger"
                                fullWidth
                                onPress={saveMissed}
                                disabled={!reason || saving}
                                loading={recordMutation.isPending && missed}
                                loadingLabel="Guardando…"
                            >
                                Guardar
                            </Button>
                        </View>
                    ) : null}
                </>
            )}
        </BottomSheet>
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
        label: {
            fontSize: fontSize.sm,
            color: t.text.primary,
            marginBottom: spacing[2],
        },
        errorText: {
            fontSize: fontSize.sm,
            color: t.status.errorFg,
        },
        actions: {
            gap: spacing[2],
        },
        section: {
            marginTop: spacing[4],
            gap: spacing[3],
        },
        notesField: {
            marginTop: spacing[3],
        },
    });
}
