import { useState, useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";
import Toast from "react-native-toast-message";
import { Modal, Button, TextField, DateTimePicker, spacing, fontSize, fontWeight, radii, useAppTheme } from "@helu/ui";
import type { ThemeContextValue } from "@helu/ui";
import { useCreateDailyCheckInMutation } from "@helu/api/hooks";
import type { MoodEnum } from "@helu/api";
import { MoodPicker } from "./MoodPicker";

interface DailyCheckInFormProps {
    onClose: () => void;
}

export function DailyCheckInForm({ onClose }: DailyCheckInFormProps) {
    const t = useAppTheme();
    const styles = useMemo(() => makeStyles(t), [t]);

    const [mood, setMood] = useState<MoodEnum | null>(null);
    const [notes, setNotes] = useState("");
    const [recordedAt, setRecordedAt] = useState(new Date().toISOString());

    const createMutation = useCreateDailyCheckInMutation();

    const handleSubmit = () => {
        if (!mood) return;

        createMutation.mutate(
            { mood, recordedAt, notes: notes.trim() || undefined },
            {
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
            },
        );
    };

    return (
        <Modal
            title="Nuevo check-in"
            onClose={onClose}
            footer={
                <>
                    <Button variant="secondary" onPress={onClose}>
                        Cancelar
                    </Button>
                    <Button
                        onPress={handleSubmit}
                        disabled={!mood || createMutation.isPending}
                        loading={createMutation.isPending}
                    >
                        Registrar
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
