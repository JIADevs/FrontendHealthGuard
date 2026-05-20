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
import { useDoctorsQuery, useAppointmentsQuery, useAppointmentOptionsQuery } from "@helu/api/hooks";
import { Plus, ChevronDown, ChevronUp } from "lucide-react-native";
import type { RootStackParamList } from "../navigation/RootNavigator";
import {
  MODALITIES,
} from "../constants/appointments";
import { SelectField } from "../components/SelectField";
import { FormHeader } from "../components/FormHeader";
import { AddDoctorModal } from "../components/AddDoctorModal";

type AppointmentFormRouteProp = RouteProp<RootStackParamList, "AppointmentForm">;

export function AppointmentFormScreen() {
  const t = useAppTheme();
  const styles = useMemo(() => makeStyles(t), [t]);
  const navigation = useNavigation();
  const route = useRoute<AppointmentFormRouteProp>();
  const appointmentId = route.params?.id;

  const [showAdditionalDetails, setShowAdditionalDetails] = useState(false);
  const [showAddDoctorModal, setShowAddDoctorModal] = useState(false);

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

  // Query appointment options from backend
  const optionsQuery = useAppointmentOptionsQuery();
  const specialties = optionsQuery.data?.specialties ?? [];
  const services = optionsQuery.data?.services ?? [];
  const consultationTypes = optionsQuery.data?.consultation_types ?? [];

  const handleAddDoctor = () => setShowAddDoctorModal(true);

  function handleDoctorSelect(name: string) {
    const selected = doctors.find((d: any) => d.name === name);
    form.setDoctor(name);
    if (selected) {
      form.setDoctorId(selected.id);
      if (!form.specialty) form.setSpecialty(selected.specialty ?? "");
      if (!form.clinic) form.setClinic(selected.clinic ?? "");
    }
  }

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <FormHeader
        title={appointmentId ? "Editar cita" : "Nueva cita"}
        onSave={form.handleSave}
        saveButtonText={form.isEdit ? "Guardar cambios" : "Guardar"}
      />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        {/* ============== INFORMACIÓN BÁSICA (OBLIGATORIA) ============== */}

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
          <Text style={styles.label}>Modalidad *</Text>
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
          <TextField
            label="Lugar *"
            value={form.location}
            onChange={form.setLocation}
            placeholder="Ej: Calle 123, Bogotá"
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

        {/* ============== INFORMACIÓN RECOMENDADA ============== */}

        {/* Profesional */}
        <View>
          <SelectField
            label="Profesional"
            value={form.doctor}
            placeholder="Seleccionar profesional"
            options={doctors.map((d: any) => d.name)}
            onChange={handleDoctorSelect}
          />
          <TouchableOpacity
            style={styles.addButton}
            onPress={handleAddDoctor}
          >
            <Plus size={16} color={t.brand.fg} />
            <Text style={styles.addButtonText}>Agregar nuevo profesional</Text>
          </TouchableOpacity>
        </View>

        {/* Especialidad */}
        <SelectField
          label="Especialidad"
          value={form.specialty}
          placeholder="Seleccionar especialidad"
          options={specialties}
          onChange={form.setSpecialty}
        />

        {/* Clínica / Hospital / IPS */}
        <TextField
          label="Clínica / Hospital / IPS"
          value={form.clinic}
          onChange={form.setClinic}
          placeholder="Ej: Hospital San José"
        />

        {/* ============== DETALLES ADICIONALES (COLAPSABLE) ============== */}

        <TouchableOpacity
          style={styles.collapsibleHeader}
          onPress={() => setShowAdditionalDetails(!showAdditionalDetails)}
        >
          <Text style={styles.collapsibleHeaderText}>Detalles adicionales</Text>
          {showAdditionalDetails ? (
            <ChevronUp size={20} color={t.text.secondary} />
          ) : (
            <ChevronDown size={20} color={t.text.secondary} />
          )}
        </TouchableOpacity>

        {showAdditionalDetails && (
          <View style={styles.collapsibleContent}>
            {/* Name */}
            <TextField
              label="Nombre de la cita"
              value={form.name}
              onChange={form.setName}
              placeholder="Ej: Neurología — Dr. Rivera"
            />

            {/* Servicio */}
            <SelectField
              label="Servicio"
              value={form.service}
              placeholder="Seleccionar servicio"
              options={services}
              onChange={form.setService}
            />

            {/* Tipo de consulta */}
            <SelectField
              label="Tipo de consulta"
              value={form.consultationType}
              placeholder="Seleccionar tipo de consulta"
              options={consultationTypes}
              onChange={form.setConsultationType}
            />

            {/* Duración y Costo */}
            <View style={styles.row}>
              <View style={styles.halfField}>
                <TextField
                  label="Duración (minutos)"
                  value={form.duration}
                  onChange={form.setDuration}
                  placeholder="30"
                  keyboardType="numeric"
                />
              </View>
              <View style={styles.halfField}>
                <TextField
                  label="Costo"
                  value={form.cost}
                  onChange={form.setCost}
                  placeholder="0"
                  keyboardType="numeric"
                />
              </View>
            </View>

            {/* Notas */}
            <TextField
              label="Notas"
              value={form.notes}
              onChange={form.setNotes}
              placeholder="Agregar notas"
              multiline
              numberOfLines={4}
            />
          </View>
        )}

        {/* Error message */}
        {form.error && <Text style={styles.errorText}>{form.error}</Text>}
      </ScrollView>

      <AddDoctorModal
        visible={showAddDoctorModal}
        onClose={() => setShowAddDoctorModal(false)}
        onCreated={(name) => {
          form.setDoctor(name);
          setShowAddDoctorModal(false);
        }}
      />
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
    collapsibleHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingVertical: spacing[3],
      paddingHorizontal: spacing[4],
      backgroundColor: t.surface.bgCard,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: t.border.light,
    },
    collapsibleHeaderText: {
      fontSize: 15,
      fontWeight: "600",
      color: t.text.primary,
    },
    collapsibleContent: {
      gap: spacing[4],
    },
    errorText: {
      color: t.status.errorFg,
      fontSize: 14,
      marginTop: spacing[2],
    },
    doctorInitials: {
      fontSize: 16,
      fontWeight: "600",
      color: t.text.primary,
    },
  });
