import {
  View, Text, StyleSheet, ScrollView,
  Modal, Pressable, TouchableOpacity, KeyboardAvoidingView, Platform,
} from "react-native";
import { useMemo, useState } from "react";
import { useAppTheme, TextField, Button, spacing } from "@helu/ui";
import type { ThemeContextValue } from "@helu/ui";
import { X } from "lucide-react-native";
import { useCreateDoctorMutation, useAppointmentOptionsQuery } from "@helu/api/hooks";
import { isApiError } from "@helu/api";
import { SelectField } from "./SelectField";

interface AddDoctorModalProps {
  visible: boolean;
  onClose: () => void;
  onCreated: (name: string) => void;
}

export function AddDoctorModal({ visible, onClose, onCreated }: AddDoctorModalProps) {
  const t = useAppTheme();
  const styles = useMemo(() => makeStyles(t), [t]);

  const [name, setName] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [clinic, setClinic] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);

  const createMut = useCreateDoctorMutation();
  const optionsQuery = useAppointmentOptionsQuery();
  const specialties = optionsQuery.data?.specialties ?? [];

  function resetForm() {
    setName("");
    setSpecialty("");
    setClinic("");
    setPhone("");
    setNotes("");
    setError(null);
  }

  function handleClose() {
    resetForm();
    onClose();
  }

  function handleSave() {
    if (!name.trim()) {
      setError("El nombre del profesional es obligatorio.");
      return;
    }
    setError(null);

    createMut.mutate(
      {
        name: name.trim(),
        specialty: specialty.trim() || undefined,
        clinic: clinic.trim() || undefined,
        phone: phone.trim() || undefined,
        notes: notes.trim() || undefined,
      },
      {
        onSuccess: () => {
          const savedName = name.trim();
          resetForm();
          onCreated(savedName);
        },
        onError: (err) =>
          setError(isApiError(err) ? err.message : "Error guardando el profesional."),
      },
    );
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <Pressable style={styles.overlay} onPress={handleClose}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.kvContainer}
        >
          <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
            <View style={styles.header}>
              <Text style={styles.title}>Agregar profesional</Text>
              <TouchableOpacity onPress={handleClose}>
                <X size={24} color={t.text.primary} />
              </TouchableOpacity>
            </View>

            <View style={styles.divider} />

            <ScrollView
              style={styles.scroll}
              contentContainerStyle={styles.content}
              keyboardShouldPersistTaps="handled"
            >
              <TextField
                label="Nombre *"
                value={name}
                onChange={setName}
                placeholder="Dr. Juan Pérez"
              />

              <SelectField
                label="Especialidad"
                value={specialty}
                placeholder="Seleccionar especialidad"
                options={specialties}
                onChange={setSpecialty}
              />

              <TextField
                label="Clínica / Hospital / IPS"
                value={clinic}
                onChange={setClinic}
                placeholder="Ej: Clínica del Country"
              />

              <TextField
                label="Teléfono"
                value={phone}
                onChange={setPhone}
                placeholder="Ej: 3001234567"
                keyboardType="phone-pad"
              />

              <TextField
                label="Notas"
                value={notes}
                onChange={setNotes}
                placeholder="Información adicional"
                multiline
                numberOfLines={3}
              />

              {error && <Text style={styles.errorText}>{error}</Text>}
            </ScrollView>

            <View style={styles.footer}>
              <Button
                onPress={handleSave}
                disabled={createMut.isPending}
                loading={createMut.isPending}
              >
                Guardar profesional
              </Button>
            </View>
          </Pressable>
        </KeyboardAvoidingView>
      </Pressable>
    </Modal>
  );
}

const makeStyles = (t: ThemeContextValue) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.5)",
      justifyContent: "flex-end",
    },
    kvContainer: {
      justifyContent: "flex-end",
    },
    sheet: {
      backgroundColor: t.surface.bg,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      maxHeight: "90%",
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: spacing[4],
      paddingVertical: spacing[4],
    },
    title: {
      fontSize: 18,
      fontWeight: "600",
      color: t.text.primary,
    },
    divider: {
      height: 1,
      backgroundColor: t.border.light,
    },
    scroll: {
      flexGrow: 0,
    },
    content: {
      padding: spacing[4],
      gap: spacing[4],
    },
    footer: {
      padding: spacing[4],
      borderTopWidth: 1,
      borderTopColor: t.border.light,
      backgroundColor: t.surface.bgCard,
    },
    errorText: {
      color: t.status.errorFg,
      fontSize: 14,
    },
  });
