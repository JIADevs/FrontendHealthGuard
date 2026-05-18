import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute, type RouteProp } from "@react-navigation/native";
import { useMemo, useState } from "react";
import {
  useAppTheme,
  TextField,
  spacing,
} from "@helu/ui";
import type { ThemeContextValue } from "@helu/ui";
import { useAppointmentForm } from "../hooks/useAppointmentForm";
import { useDoctorsQuery, useAppointmentsQuery } from "@helu/api/hooks";
import { Plus } from "lucide-react-native";
import type { RootStackParamList } from "../navigation/RootNavigator";
import {
  MODALITIES,
  SPECIALTIES,
  SERVICES,
  CONSULTATION_TYPES,
  APPOINTMENT_STATUSES,
} from "../constants/appointments";
import { FormSelector } from "../components/FormSelector";
import { FormHeader } from "../components/FormHeader";

type AppointmentFormRouteProp = RouteProp<RootStackParamList, "AppointmentForm">;

export function AppointmentFormScreen() {
  const t = useAppTheme();
  const styles = useMemo(() => makeStyles(t), [t]);
  const navigation = useNavigation();
  const route = useRoute<AppointmentFormRouteProp>();
  const appointmentId = route.params?.id;

  // Find appointment if editing
  const appointmentsQuery = useAppointmentsQuery("", 1, 100);
  const appointment = appointmentId
    ? appointmentsQuery.data?.items.find((a) => a.id === appointmentId)
    : null;

  const form = useAppointmentForm({
    initial: appointment,
    onClose: () => navigation.goBack(),
  });

  // Query doctors for selector
  const doctorsQuery = useDoctorsQuery("", 1, 100);
  const doctors = doctorsQuery.data?.items ?? [];

  const handleAddDoctor = () => {
    navigation.navigate("DoctorForm" as any);
  };

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <FormHeader
        title={appointmentId ? "Editar cita" : "Nueva cita"}
        onSave={form.handleSave}
        saveButtonText={form.isEdit ? "Guardar" : "Guardar"}
      />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        {/* Name */}
        <TextField
          label="Nombre de la cita (opcional)"
          value={form.name}
          onChange={form.setName}
          placeholder="Ej: Neurología — Dr. Rivera"
        />

        {/* Especialidad */}
        <FormSelector
          label="Especialidad"
          value={form.specialty}
          placeholder="Seleccionar especialidad"
          onPress={() => {
            // TODO: Navigate to specialty selector
          }}
        />

        {/* Profesional */}
        <View>
          <FormSelector
            label="Profesional"
            value={form.doctor}
            placeholder="Seleccionar profesional"
            onPress={() => {
              // TODO: Navigate to doctor selector
            }}
          />
          <TouchableOpacity
            style={styles.addButton}
            onPress={handleAddDoctor}
          >
            <Plus size={16} color={t.brand.fg} />
            <Text style={styles.addButtonText}>Agregar nuevo profesional</Text>
          </TouchableOpacity>
        </View>

        {/* Fecha y Hora */}
        <View style={styles.row}>
          <View style={styles.halfField}>
            <TextField
              label="Fecha *"
              value={form.date}
              onChange={form.setDate}
              placeholder="24/04/2026"
            />
          </View>
          <View style={styles.halfField}>
            <TextField
              label="Hora *"
              value={form.time}
              onChange={form.setTime}
              placeholder="09:00"
            />
          </View>
        </View>

        {/* Modalidad pills */}
        <View>
          <Text style={styles.label}>Modalidad</Text>
          <View style={styles.pillRow}>
            {MODALITIES.map((mod) => (
              <TouchableOpacity
                key={mod.value}
                style={[
                  styles.pill,
                  form.modality === mod.value && styles.pillActive,
                ]}
                onPress={() => form.setModality(mod.value)}
              >
                <Text
                  style={[
                    styles.pillText,
                    form.modality === mod.value && styles.pillTextActive,
                  ]}
                >
                  {mod.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Lugar (conditional) */}
        {form.modality === "PRESENCIAL" && (
          <FormSelector
            label="Lugar"
            value={form.location}
            placeholder="Seleccionar lugar"
            onPress={() => {
              // TODO: Navigate to location selector
            }}
          />
        )}

        {/* Video call link (conditional) */}
        {form.modality === "VIRTUAL" && (
          <TextField
            label="Link de videollamada *"
            value={form.videoCallLink}
            onChange={form.setVideoCallLink}
            placeholder="https://meet.google.com/..."
          />
        )}

        {/* Notas */}
        <TextField
          label="Notas (opcional)"
          value={form.notes}
          onChange={form.setNotes}
          placeholder="Agregar notas"
          multiline
          numberOfLines={4}
        />

        {/* Error message */}
        {form.error && <Text style={styles.errorText}>{form.error}</Text>}
      </ScrollView>
    </SafeAreaView>
  );
}

const makeStyles = (t: ThemeContextValue) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: t.surface.bg,
    },
    scroll: {
      flex: 1,
    },
    content: {
      padding: spacing[4],
      gap: spacing[4],
    },
    label: {
      fontSize: 14,
      fontWeight: "600",
      color: t.text.primary,
      marginBottom: spacing[2],
    },
    addButton: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing[1],
      paddingVertical: spacing[2],
      marginTop: spacing[1],
    },
    addButtonText: {
      fontSize: 14,
      color: t.brand.fg,
      fontWeight: "500",
    },
    row: {
      flexDirection: "row",
      gap: spacing[2],
    },
    halfField: {
      flex: 1,
    },
    pillRow: {
      flexDirection: "row",
      gap: spacing[2],
      flexWrap: "wrap",
    },
    pill: {
      paddingHorizontal: spacing[3],
      paddingVertical: spacing[2],
      borderRadius: 20,
      backgroundColor: t.surface.bgCard,
      borderWidth: 1,
      borderColor: t.border.medium,
    },
    pillActive: {
      backgroundColor: t.brand.bg,
      borderColor: t.brand.fg,
    },
    pillText: {
      fontSize: 14,
      color: t.text.primary,
    },
    pillTextActive: {
      color: t.brand.fg,
      fontWeight: "600",
    },
    footer: {
      padding: spacing[4],
      backgroundColor: t.surface.bgCard,
      borderTopWidth: 1,
      borderTopColor: t.border.light,
    },
    errorText: {
      color: t.status.errorFg,
      fontSize: 14,
      marginTop: spacing[2],
    },
  });