import { useMemo, useRef, useState } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { Check, Pill } from "lucide-react-native";
import { notify } from "../../lib/notify";
import { haptics } from "../../lib/haptics";
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
    nativeFont,
    useAppTheme,
    IconTile,
    formatClock,
} from "@helu/ui";
import type { ThemeContextValue, AgendaEvent, BottomSheetHandle } from "@helu/ui";
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
    const dayLabelRaw = new Date(`${event.dayKey}T12:00:00`).toLocaleDateString("es-CO", {
        weekday: "long",
        day: "numeric",
        month: "long",
    }).replace(",", "");
    const dayLabel = dayLabelRaw.charAt(0).toUpperCase() + dayLabelRaw.slice(1);

    // Pasos de la hoja (inicio-agenda.md · Hoja de toma): primero la pregunta; «No la tomé» y
    // «Cambiar hora» abren un segundo paso con una sola acción principal.
    const [step, setStep] = useState<"ask" | "missed" | "time">(
        existingIntake?.status === "NOT_TAKEN" ? "missed" : "ask",
    );
    const missed = step === "missed";
    const changeTime = step === "time";
    const [takenAtValue, setTakenAtValue] = useState(() =>
        existingIntake?.takenAt
            ? clampPickerValueToMax(pickerValueFromUtcIso(existingIntake.takenAt))
            : clampPickerValueToMax(scheduledLocalValue),
    );
    const [reason, setReason] = useState<NotTakenReason | null>(existingIntake?.notTakenReason ?? null);
    const [notes, setNotes] = useState(existingIntake?.notes ?? "");

    // La hoja se cierra con su animación de salida (movimiento-interacciones.md §4).
    const sheetRef = useRef<BottomSheetHandle>(null);
    const closeSheet = () => (sheetRef.current ? sheetRef.current.close() : onClose());
    const confirmMutation = useConfirmIntakeMutation();
    const recordMutation = useRecordIntakeMutation();
    const saving = confirmMutation.isPending || recordMutation.isPending;

    // Solo cuenta lo que la persona escribió o eligió; cambiar de paso no es un cambio que perder.
    const [initialTakenAt] = useState(takenAtValue);
    const dirty =
        (missed && reason !== (existingIntake?.notTakenReason ?? null)) ||
        (missed && notes !== (existingIntake?.notes ?? "")) ||
        (changeTime && takenAtValue !== initialTakenAt);

    const showError = (err: unknown) => {
        haptics.error();
        notify({
            tone: "error",
            message: "No se pudo registrar la toma",
            description: isApiError(err) ? err.message : "Revisa tu conexión e intenta de nuevo.",
        });
    };


    const saveTakenNow = () => {
        if (!cycle) return;
        haptics.success();
        confirmMutation.mutate(cycle.id, {
            onSuccess: () => {
                closeSheet();
                notify({ message: `Toma registrada a las ${formatClock(new Date())}` });
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
                    closeSheet();
                    notify({ message: `Toma registrada a las ${formatClock(new Date(toUtcIsoFromPickerValue(takenAtValue)))}` });
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
                    closeSheet();
                    notify({ message: "Registrada como no tomada" });
                },
                onError: showError,
            },
        );
    };

    const isToday = event.dayKey === toISOLocal(new Date()).slice(0, 10);
    const sheetTitle =
        step === "missed" ? "¿Por qué no la tomaste?" : step === "time" ? "¿A qué hora la tomaste?" : "¿Tomaste esta dosis?";

    // Mockup «Registrar toma»: ícono redondo del módulo, eyebrow «NOMBRE · HORA» y la pregunta como título.
    return (
        <BottomSheet
            ref={sheetRef}
            title={sheetTitle}
            eyebrow={`${event.data.name} · ${formatClock(event.intakeTime)}`.toUpperCase()}
            icon={<IconTile tone="medication" size="lg" round icon={<Pill size={24} strokeWidth={2.4} color={t.accent.medFg} />} />}
            dirty={dirty}
            onClose={onClose}
        >
            {!isToday ? <Text style={styles.subtitle}>{dayLabel}</Text> : null}

            {!cycle ? (
                <Text style={styles.errorText}>No se encontró el ciclo de tratamiento para esta fecha.</Text>
            ) : step === "ask" ? (
                // v2.11: the two answers sit together and the time line goes right under them (8 px).
                <View style={styles.askActions}>
                    <Button
                        variant="success"
                        fullWidth
                        icon={<Check size={17} strokeWidth={3} color={t.text.onSolid} />}
                        onPress={saveTakenNow}
                        disabled={saving}
                        loading={confirmMutation.isPending}
                        loadingLabel="Guardando…"
                    >
                        Sí, la tomé
                    </Button>
                    <Button variant="secondary" fullWidth onPress={() => setStep("missed")} disabled={saving}>
                        No la tomé
                    </Button>
                    <View style={styles.timeRow}>
                        <Text style={styles.meta}>Se registra a las {formatClock(new Date())}</Text>
                        <Pressable
                            onPress={() => setStep("time")}
                            disabled={saving}
                            accessibilityRole="button"
                            hitSlop={INLINE_LINK_HIT_SLOP}
                        >
                            <Text style={styles.link}>Cambiar hora</Text>
                        </Pressable>
                    </View>
                </View>
            ) : step === "time" ? (
                <View style={styles.actions}>
                    <DateTimePicker
                        label="Hora de la toma"
                        value={takenAtValue}
                        onChange={(value) => setTakenAtValue(clampPickerValueToMax(value))}
                        maxDate={toISOLocal(new Date())}
                    />
                    <Button
                        fullWidth
                        onPress={saveChangedTime}
                        disabled={saving}
                        loading={recordMutation.isPending}
                        loadingLabel="Guardando…"
                    >
                        Guardar hora
                    </Button>
                </View>
            ) : (
                <View style={styles.actions}>
                    <ChoiceChips
                        options={REASON_OPTIONS}
                        value={reason}
                        onChange={(value) => {
                            const match = REASON_OPTIONS.find((option) => option.value === value);
                            if (match) setReason(match.value);
                        }}
                    />
                    <TextField
                        label="Detalles (opcional)"
                        value={notes}
                        onChange={setNotes}
                        placeholder="Ej: Se me acabaron las pastillas"
                    />
                    <Button
                        fullWidth
                        onPress={saveMissed}
                        disabled={!reason || saving}
                        loading={recordMutation.isPending}
                        loadingLabel="Guardando…"
                    >
                        Guardar motivo
                    </Button>
                    <Text style={[styles.meta, styles.center]}>No pasa nada: mañana sigues sumando.</Text>
                </View>
            )}
        </BottomSheet>
    );
}

/** «Cambiar hora» keeps a 44 px touch target without pushing the line away from the buttons. */
const INLINE_LINK_HIT_SLOP = { top: 13, bottom: 13, left: 8, right: 8 };

function makeStyles(t: ThemeContextValue) {
    return StyleSheet.create({
        subtitle: {
            fontSize: fontSize.sm,
            fontFamily: nativeFont("body", 400),
            color: t.text.secondary,
            marginBottom: spacing[3],
        },
        errorText: {
            fontSize: fontSize.sm,
            fontFamily: nativeFont("body", 400),
            color: t.status.errorFg,
        },
        actions: {
            gap: spacing[3],
        },
        askActions: {
            gap: spacing[2],
        },
        timeRow: {
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            flexWrap: "wrap",
            columnGap: 6,
        },
        meta: {
            fontSize: fontSize.sm,
            fontFamily: nativeFont("body", 400),
            color: t.text.secondary,
        },
        center: { textAlign: "center" },
        link: {
            fontSize: fontSize.sm,
            fontFamily: nativeFont("heading", 800),
            color: t.brand.text,
        },
    });
}
