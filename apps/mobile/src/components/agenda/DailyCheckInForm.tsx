import { useState, useMemo, useEffect, useRef } from "react";
import { View, Text, StyleSheet } from "react-native";
import { Heart, Trash2 } from "lucide-react-native";
import {
    BottomSheet,
    Button,
    ChoiceChips,
    DangerLink,
    IconTile,
    TextField,
    DateTimePicker,
    toISOLocal,
    toUtcIsoFromPickerValue,
    pickerValueFromUtcIso,
    clampPickerValueToMax,
    ConfirmModal,
    spacing,
    fontSize,
    nativeFont,
    useAppTheme,
    palette,
} from "@helu/ui";
import type { ThemeContextValue } from "@helu/ui";
import {
    useCreateDailyCheckInMutation,
    useUpdateDailyCheckInMutation,
    useDeleteDailyCheckInMutation,
    useFetchCurrentStreak,
    useTreatmentsQuery,
} from "@helu/api/hooks";
import { useUserProgressQuery, type DailyCheckIn, type MoodEnum, type Treatment } from "@helu/api";
import { notify } from "../../lib/notify";
import { useOptimisticStreak } from "../../hooks/useOptimisticStreak";

/** Inicio's flame (600 ms) and number bounce end here; the streak toast waits for them (movimiento §6). */
const CELEBRATION_MS = 700;
import { MoodPicker } from "./MoodPicker";

interface DailyCheckInFormProps {
    onClose: () => void;
    initialValues?: DailyCheckIn;
}

/**
 * Check-in sheet (mockup «Check-in de hoy»). New: eyebrow «CHECK-IN DE HOY», the question as the
 * title, the five faces, optional treatment and notes, and «Guardar check-in» in the streak color.
 * v2.15: a check-in for today is optimistic end to end — the sheet closes, the day fills, the flame
 * and the number animate and the streak toast («¡13 días seguidos cuidándote!») follows, all on tap;
 * a failed save rolls the streak back and says so (movimiento §6 «Check-in guardado»).
 */
export function DailyCheckInForm({ onClose, initialValues }: DailyCheckInFormProps) {
    const t = useAppTheme();
    const styles = useMemo(() => makeStyles(t), [t]);
    const isEdit = Boolean(initialValues);

    const [mood, setMood] = useState<MoodEnum | null>(initialValues?.mood ?? null);
    const [notes, setNotes] = useState(initialValues?.notes ?? "");
    const [treatmentId, setTreatmentId] = useState<string | null>(initialValues?.treatmentId ?? null);
    const [recordedAt, setRecordedAt] = useState(() => {
        const initial = initialValues?.recordedAt
            ? pickerValueFromUtcIso(initialValues.recordedAt)
            : toISOLocal(new Date());
        return clampPickerValueToMax(initial);
    });
    const initialRecordedAt = useRef(recordedAt);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    useEffect(() => {
        if (!initialValues) return;
        setMood(initialValues.mood);
        setNotes(initialValues.notes ?? "");
        setTreatmentId(initialValues.treatmentId ?? null);
        const nextRecordedAt = clampPickerValueToMax(pickerValueFromUtcIso(initialValues.recordedAt));
        initialRecordedAt.current = nextRecordedAt;
        setRecordedAt(nextRecordedAt);
    }, [initialValues]);

    const createMutation = useCreateDailyCheckInMutation();
    const updateMutation = useUpdateDailyCheckInMutation();
    const deleteMutation = useDeleteDailyCheckInMutation();
    const fetchCurrentStreak = useFetchCurrentStreak();
    const optimisticStreak = useOptimisticStreak();
    // «Mostrar racha y nivel» off: the confirmation never mentions the count (RF-93).
    const showProgress = useUserProgressQuery().data?.showProgress ?? true;
    const treatmentsQuery = useTreatmentsQuery(1, 100);
    const treatments = treatmentsQuery.data?.items ?? [];

    const isPending =
        createMutation.isPending || updateMutation.isPending || deleteMutation.isPending;
    const dirty =
        mood !== (initialValues?.mood ?? null) ||
        notes !== (initialValues?.notes ?? "") ||
        treatmentId !== (initialValues?.treatmentId ?? null) ||
        recordedAt !== initialRecordedAt.current;

    const toastStreak = (streak: number) => {
        if (!showProgress) {
            notify({ message: "Check-in registrado" });
        } else if (streak >= 2) {
            notify({ tone: "streak", message: `¡${streak} días seguidos cuidándote!` });
        } else if (streak === 1) {
            notify({ tone: "streak", message: "Check-in registrado", description: "Es el primer día de tu racha." });
        } else {
            notify({ message: "Check-in registrado" });
        }
    };

    /** A check-in for another day does not move today's streak: read it from the server. */
    const notifyStreak = async () => toastStreak((await fetchCurrentStreak()) ?? 0);

    const handleSubmit = () => {
        if (!mood) return;

        const payload = {
            mood,
            recordedAt: toUtcIsoFromPickerValue(clampPickerValueToMax(recordedAt)),
            notes: notes.trim() || undefined,
            treatmentId,
        };

        if (isEdit && initialValues) {
            updateMutation.mutate(
                { id: initialValues.id, payload },
                {
                    onSuccess: () => {
                        onClose();
                        notify({ message: "Check-in actualizado" });
                    },
                    onError: () => {
                        notify({ tone: "error", message: "No se pudo actualizar el check-in", description: "Revisa tu conexión e intenta de nuevo." });
                    },
                },
            );
            return;
        }

        // v2.15: low risk and reversible (movimiento §8), so everything happens on tap — the sheet
        // closes, the day fills (optimistic in @helu/api) and the streak counts today here, so Inicio's
        // flame and number animate at once; the toast follows the animation. mutateAsync: the sheet
        // unmounts right away.
        const optimistic = optimisticStreak(recordedAt.slice(0, 10));
        let failed = false;
        createMutation
            .mutateAsync(payload)
            .then(
                // Not optimistic (another day): confirm with the server's streak, as before.
                () => {
                    if (!optimistic) void notifyStreak().catch(() => notify({ message: "Check-in registrado" }));
                },
                () => {
                    failed = true;
                    optimistic?.rollback();
                    notify({ tone: "error", message: "No se pudo registrar el check-in", description: "Revisa tu conexión e intenta de nuevo." });
                },
            );
        if (optimistic) {
            setTimeout(() => {
                if (!failed) toastStreak(optimistic.streak);
            }, CELEBRATION_MS);
        }
        onClose();
    };

    const handleDelete = () => {
        if (!initialValues) return;
        deleteMutation.mutate(initialValues.id, {
            onSuccess: () => {
                setShowDeleteConfirm(false);
                onClose();
                notify({ message: "Check-in eliminado" });
            },
            onError: () => {
                notify({ tone: "error", message: "No se pudo eliminar el check-in", description: "Revisa tu conexión e intenta de nuevo." });
            },
        });
    };

    const treatmentOptions = treatments.map((treatment: Treatment) => ({
        value: treatment.id,
        label: treatment.name,
    }));

    return (
        <>
            <BottomSheet
                eyebrow={isEdit ? "CHECK-IN" : "CHECK-IN DE HOY"}
                title={isEdit ? "Editar check-in" : "¿Cómo te sientes hoy?"}
                icon={
                    <IconTile
                        tone="wellbeing"
                        size="lg"
                        round
                        icon={<Heart size={24} strokeWidth={2.4} color={t.accent.wellbeingFg} />}
                    />
                }
                dirty={dirty}
                onClose={onClose}
            >
                <View style={styles.fields}>
                    {isEdit ? <Text style={styles.label}>¿Cómo te sentías?</Text> : null}
                    <MoodPicker value={mood} onChange={setMood} />

                    {treatmentOptions.length > 0 ? (
                        <View style={styles.group}>
                            <Text style={styles.label}>Tratamiento (opcional)</Text>
                            <ChoiceChips
                                options={treatmentOptions}
                                value={treatmentId}
                                onChange={(id) => setTreatmentId(id === treatmentId ? null : id)}
                            />
                        </View>
                    ) : null}

                    <TextField
                        label="Notas (opcional)"
                        value={notes}
                        onChange={setNotes}
                        placeholder="Ej: Dormí mal anoche"
                        multiline
                        numberOfLines={3}
                    />

                    <DateTimePicker
                        label="Fecha y hora (opcional)"
                        value={recordedAt}
                        onChange={(value) => setRecordedAt(clampPickerValueToMax(value))}
                        maxDate={toISOLocal(new Date())}
                    />
                </View>

                <View style={styles.actions}>
                    <Button
                        variant={isEdit ? "primary" : "streak"}
                        size="lg"
                        fullWidth
                        icon={isEdit ? undefined : <Heart size={18} strokeWidth={2.4} color={t.text.onSolid} />}
                        onPress={handleSubmit}
                        disabled={!mood || isPending}
                        loading={isPending && !deleteMutation.isPending}
                        loadingLabel="Guardando…"
                    >
                        {isEdit ? "Guardar cambios" : "Guardar check-in"}
                    </Button>
                    {isEdit ? (
                        <DangerLink
                            label="Eliminar check-in"
                            icon={<Trash2 size={16} color={t.status.dangerSolid} />}
                            onPress={() => setShowDeleteConfirm(true)}
                            disabled={isPending}
                        />
                    ) : (
                        <Text style={styles.hint}>Tu check-in ayuda a ver cómo evolucionas entre citas.</Text>
                    )}
                </View>
            </BottomSheet>

            {showDeleteConfirm && (
                <ConfirmModal
                    title="¿Eliminar este check-in?"
                    message="Se borra de tu historial de bienestar. No se puede deshacer."
                    keepLabel="Mantener check-in"
                    confirmLabel="Eliminar"
                    loading={deleteMutation.isPending}
                    onConfirm={handleDelete}
                    onCancel={() => setShowDeleteConfirm(false)}
                    icon={<Trash2 size={26} color={palette.status.error[700]} strokeWidth={2.25} />}
                    iconTone="danger"
                />
            )}
        </>
    );
}

function makeStyles(t: ThemeContextValue) {
    return StyleSheet.create({
        fields: {
            gap: spacing[4],
        },
        group: {
            gap: spacing[2],
        },
        // MASTER «Campo»: etiqueta visible, Nunito 800 13
        label: {
            fontSize: 13,
            fontFamily: nativeFont("heading", 800),
            color: t.text.primary,
        },
        actions: {
            gap: spacing[3],
            marginTop: spacing[5],
            alignItems: "stretch",
        },
        hint: {
            fontSize: fontSize.sm,
            fontFamily: nativeFont("body", 400),
            color: t.text.secondary,
            textAlign: "center",
        },
    });
}
