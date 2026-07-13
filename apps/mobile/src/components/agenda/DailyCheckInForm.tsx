import { useState, useMemo, useEffect } from "react";
import { ScrollView, TouchableOpacity, View, Text, StyleSheet } from "react-native";
import Toast from "react-native-toast-message";
import {
    Modal,
    Button,
    TextField,
    DateTimePicker,
    toISOLocal,
    toUtcIsoFromPickerValue,
    pickerValueFromUtcIso,
    clampPickerValueToMax,
    ConfirmModal,
    spacing,
    fontSize,
    fontWeight,
    useAppTheme,
    palette,
} from "@helu/ui";
import type { ThemeContextValue } from "@helu/ui";
import {
    useCreateDailyCheckInMutation,
    useUpdateDailyCheckInMutation,
    useDeleteDailyCheckInMutation,
    useTreatmentsQuery,
} from "@helu/api/hooks";
import type { DailyCheckIn, MoodEnum, Treatment } from "@helu/api";
import { Trash2 } from "lucide-react-native";
import { MoodPicker } from "./MoodPicker";

interface DailyCheckInFormProps {
    onClose: () => void;
    initialValues?: DailyCheckIn;
}

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
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    useEffect(() => {
        if (!initialValues) return;
        setMood(initialValues.mood);
        setNotes(initialValues.notes ?? "");
        setTreatmentId(initialValues.treatmentId ?? null);
        setRecordedAt(clampPickerValueToMax(pickerValueFromUtcIso(initialValues.recordedAt)));
    }, [initialValues]);

    const createMutation = useCreateDailyCheckInMutation();
    const updateMutation = useUpdateDailyCheckInMutation();
    const deleteMutation = useDeleteDailyCheckInMutation();
    const treatmentsQuery = useTreatmentsQuery(1, 100);
    const treatments = treatmentsQuery.data?.items ?? [];

    const isPending =
        createMutation.isPending || updateMutation.isPending || deleteMutation.isPending;

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
                        Toast.show({ type: "success", text1: "Check-in actualizado" });
                    },
                    onError: () => {
                        Toast.show({
                            type: "error",
                            text1: "No se pudo actualizar el check-in",
                        });
                    },
                },
            );
            return;
        }

        createMutation.mutate(payload, {
            onSuccess: () => {
                onClose();
                Toast.show({ type: "success", text1: "Check-in registrado" });
            },
            onError: () => {
                Toast.show({
                    type: "error",
                    text1: "No se pudo registrar el check-in",
                });
            },
        });
    };

    const handleDelete = () => {
        if (!initialValues) return;
        deleteMutation.mutate(initialValues.id, {
            onSuccess: () => {
                setShowDeleteConfirm(false);
                onClose();
                Toast.show({ type: "success", text1: "Check-in eliminado" });
            },
            onError: () => {
                Toast.show({
                    type: "error",
                    text1: "No se pudo eliminar el check-in",
                });
            },
        });
    };

    return (
        <>
            <Modal
                title={isEdit ? "Editar check-in" : "Nuevo check-in"}
                onClose={onClose}
                footer={
                    <>
                        {isEdit ? (
                            <Button
                                variant="secondary"
                                onPress={() => setShowDeleteConfirm(true)}
                                disabled={isPending}
                            >
                                Eliminar
                            </Button>
                        ) : null}
                        <Button variant="secondary" onPress={onClose}>
                            Cancelar
                        </Button>
                        <Button
                            onPress={handleSubmit}
                            disabled={!mood || isPending}
                            loading={isPending && !deleteMutation.isPending}
                        >
                            {isEdit ? "Guardar" : "Registrar"}
                        </Button>
                    </>
                }
            >
                <View style={styles.section}>
                    <Text style={styles.label}>¿Cómo te sientes hoy?</Text>
                    <MoodPicker value={mood} onChange={setMood} />
                </View>

                <View style={styles.fields}>
                    {treatments.length > 0 ? (
                        <View style={styles.treatmentSection}>
                            <Text style={styles.label}>Tratamiento (opcional)</Text>
                            <ScrollView
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                contentContainerStyle={styles.treatmentChips}
                            >
                                {treatments.map((treatment: Treatment) => {
                                    const selected = treatmentId === treatment.id;
                                    return (
                                        <TouchableOpacity
                                            key={treatment.id}
                                            style={[
                                                styles.treatmentChip,
                                                {
                                                    borderColor: selected ? t.brand.fg : t.border.medium,
                                                    backgroundColor: selected ? t.brand.tint : t.surface.bgCard,
                                                },
                                            ]}
                                            onPress={() => setTreatmentId(selected ? null : treatment.id)}
                                        >
                                            <Text
                                                style={[
                                                    styles.treatmentChipText,
                                                    { color: selected ? t.brand.fg : t.text.secondary },
                                                ]}
                                                numberOfLines={1}
                                            >
                                                {treatment.name}
                                            </Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </ScrollView>
                        </View>
                    ) : null}

                    <TextField
                        label="Notas (opcional)"
                        value={notes}
                        onChange={setNotes}
                        placeholder="¿Algo más que quieras registrar?"
                    />

                    <DateTimePicker
                        label="Fecha y hora (opcional)"
                        value={recordedAt}
                        onChange={(value) => setRecordedAt(clampPickerValueToMax(value))}
                        maxDate={toISOLocal(new Date())}
                    />
                </View>
            </Modal>

            {showDeleteConfirm && (
                <ConfirmModal
                    title="¿Eliminar check-in?"
                    message="Esta acción no se puede deshacer."
                    confirmLabel="Eliminar"
                    loading={deleteMutation.isPending}
                    onConfirm={handleDelete}
                    onCancel={() => setShowDeleteConfirm(false)}
                    icon={<Trash2 size={26} color={palette.status.error[500]} strokeWidth={2.25} />}
                    iconTone="danger"
                />
            )}
        </>
    );
}

function makeStyles(t: ThemeContextValue) {
    return StyleSheet.create({
        section: {
            marginBottom: spacing[4],
        },
        fields: {
            gap: spacing[4],
        },
        treatmentSection: {
            gap: spacing[2],
        },
        treatmentChips: {
            gap: spacing[2],
            paddingRight: spacing[2],
        },
        treatmentChip: {
            maxWidth: 180,
            paddingHorizontal: spacing[3],
            paddingVertical: spacing[2],
            borderRadius: 999,
            borderWidth: 1,
        },
        treatmentChipText: {
            fontSize: fontSize.sm,
            fontWeight: fontWeight.medium,
        },
        label: {
            fontSize: fontSize.sm,
            fontWeight: fontWeight.semibold,
            color: t.text.primary,
            marginBottom: spacing[2],
        },
    });
}
