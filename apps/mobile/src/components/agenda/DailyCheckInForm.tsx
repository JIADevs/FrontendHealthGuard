import { useState, useMemo, useEffect } from "react";
import { View, Text, StyleSheet } from "react-native";
import Toast from "react-native-toast-message";
import {
    Modal,
    Button,
    TextField,
    DateTimePicker,
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
} from "@helu/api/hooks";
import type { DailyCheckIn, MoodEnum } from "@helu/api";
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
    const [recordedAt, setRecordedAt] = useState(
        initialValues?.recordedAt ?? new Date().toISOString(),
    );
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    useEffect(() => {
        if (!initialValues) return;
        setMood(initialValues.mood);
        setNotes(initialValues.notes ?? "");
        setRecordedAt(initialValues.recordedAt);
    }, [initialValues]);

    const createMutation = useCreateDailyCheckInMutation();
    const updateMutation = useUpdateDailyCheckInMutation();
    const deleteMutation = useDeleteDailyCheckInMutation();

    const isPending =
        createMutation.isPending || updateMutation.isPending || deleteMutation.isPending;

    const handleSubmit = () => {
        if (!mood) return;

        const payload = {
            mood,
            recordedAt,
            notes: notes.trim() || undefined,
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
                    <Text style={styles.label}>¿Cómo te sentís hoy?</Text>
                    <MoodPicker value={mood} onChange={setMood} />
                </View>

                <TextField
                    label="Notas (opcional)"
                    value={notes}
                    onChange={setNotes}
                    placeholder="¿Algo más que quieras registrar?"
                />

                <DateTimePicker
                    label="Fecha y hora (opcional)"
                    value={recordedAt}
                    onChange={setRecordedAt}
                />
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
        label: {
            fontSize: fontSize.sm,
            fontWeight: fontWeight.semibold,
            color: t.text.primary,
            marginBottom: spacing[2],
        },
    });
}
