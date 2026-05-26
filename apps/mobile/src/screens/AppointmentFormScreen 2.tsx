import { View, Text, StyleSheet, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute, type RouteProp } from "@react-navigation/native";
import { useMemo, useState } from "react";
import {
  useAppTheme,
  TextField,
  DatePicker,
  TimePicker,
  spacing,
} from "@helu/ui";
import type { ThemeContextValue } from "@helu/ui";
import { useAppointmentForm } from "../hooks/useAppointmentForm";
import { useDoctorsQuery, useAppointmentsQuery, useAppointmentOptionsQuery } from "@helu/api/hooks";
import { Plus, ChevronDown, ChevronUp, Calendar, Clock, MapPin, Video, Phone, User, Building2, FileText, Stethoscope, Briefcase, ClipboardList, Timer, DollarSign } from "lucide-react-native";
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
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0}
      >
        <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        {/* ============== INFORMACIÓN BÁSICA (OBLIGATORIA) ============== */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Calendar size={20} color={t.brand.fg} />
            <Text style={styles.cardTitle}>Información básica</Text>
          </View>

          {/* Fecha y Hora */}
          <View style={styles.row}>
            <View style={styles.halfField}>
              <View style={styles.labelWithIcon}>
                <Calendar size={16} color={t.text.secondary} />
                <Text style={styles.label}>Fecha *</Text>
              </View>
              <DatePicker
                label=""
                value={form.date}
                onChange={form.setDate}
                placeholder="Seleccionar fecha"
                required
              />
            </View>
            <View style={styles.halfField}>
              <View style={styles.labelWithIcon}>
                <Clock size={16} color={t.text.secondary} />
                <Text style={styles.label}>Hora *</Text>
              </View>
              <TimePicker
                label=""
                value={form.time}
                onChange={form.setTime}
                placeholder="Seleccionar hora"
                required
              />
            </View>
          </View>

          {/* Modalidad pills */}
          <View>
            <Text style={styles.label}>Modalidad *</Text>
            <View style={styles.pillRow}>
              {MODALITIES.map((mod) => {
                const icon = mod.value === "PRESENCIAL" ? MapPin : mod.value === "VIRTUAL" ? Video : Phone;
                const IconComponent = icon;
                return (
                  <TouchableOpacity
                    key={mod.value}
                    style={[
                      styles.pill,
                      form.modality === mod.value && styles.pillActive,
                    ]}
                    onPress={() => form.setModality(mod.value)}
                  >
                    <IconComponent
                      size={16}
                      color={form.modality === mod.value ? t.brand.fg : t.text.secondary}
                    />
                    <Text
                      style={[
                        styles.pillText,
                        form.modality === mod.value && styles.pillTextActive,
                      ]}
                    >
                      {mod.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Lugar (conditional) */}
          {form.modality === "PRESENCIAL" && (
            <View>
              <View style={styles.labelWithIcon}>
                <MapPin size={16} color={t.text.secondary} />
                <Text style={styles.label}>Lugar *</Text>
              </View>
              <TextField
                label=""
                value={form.location}
                onChange={form.setLocation}
                placeholder="Ej: Calle 123, Bogotá"
              />
            </View>
          )}

          {/* Video call link (conditional) */}
          {form.modality === "VIRTUAL" && (
            <View>
              <View style={styles.labelWithIcon}>
                <Video size={16} color={t.text.secondary} />
                <Text style={styles.label}>Link de videollamada *</Text>
              </View>
              <TextField
                label=""
                value={form.videoCallLink}
                onChange={form.setVideoCallLink}
                placeholder="https://meet.google.com/..."
              />
            </View>
          )}
        </View>

        {/* ============== INFORMACIÓN RECOMENDADA ============== */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Stethoscope size={20} color={t.brand.fg} />
            <Text style={styles.cardTitle}>Profesional de salud</Text>
          </View>

          {/* Profesional */}
          <View>
            <View style={styles.labelWithIcon}>
              <User size={16} color={t.text.secondary} />
              <Text style={styles.label}>Profesional</Text>
            </View>
            <SelectField
              label=""
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
          <View>
            <View style={styles.labelWithIcon}>
              <Briefcase size={16} color={t.text.secondary} />
              <Text style={styles.label}>Especialidad</Text>
            </View>
            <SelectField
              label=""
              value={form.specialty}
              placeholder="Seleccionar especialidad"
              options={specialties}
              onChange={form.setSpecialty}
            />
          </View>

          {/* Clínica / Hospital / IPS */}
          <View>
            <View style={styles.labelWithIcon}>
              <Building2 size={16} color={t.text.secondary} />
              <Text style={styles.label}>Clínica / Hospital / IPS</Text>
            </View>
            <TextField
              label=""
              value={form.clinic}
              onChange={form.setClinic}
              placeholder="Ej: Hospital San José"
            />
          </View>
        </View>

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
          <View style={styles.card}>
            <View style={styles.collapsibleContent}>
              {/* Name */}
              <View>
                <View style={styles.labelWithIcon}>
                  <FileText size={16} color={t.text.secondary} />
                  <Text style={styles.label}>Nombre de la cita</Text>
                </View>
                <TextField
                  label=""
                  value={form.name}
                  onChange={form.setName}
                  placeholder="Ej: Neurología — Dr. Rivera"
                />
              </View>

              {/* Servicio */}
              <View>
                <View style={styles.labelWithIcon}>
                  <ClipboardList size={16} color={t.text.secondary} />
                  <Text style={styles.label}>Servicio</Text>
                </View>
                <SelectField
                  label=""
                  value={form.service}
                  placeholder="Seleccionar servicio"
                  options={services}
                  onChange={form.setService}
                />
              </View>

              {/* Tipo de consulta */}
              <View>
                <View style={styles.labelWithIcon}>
                  <Stethoscope size={16} color={t.text.secondary} />
                  <Text style={styles.label}>Tipo de consulta</Text>
                </View>
                <SelectField
                  label=""
                  value={form.consultationType}
                  placeholder="Seleccionar tipo de consulta"
                  options={consultationTypes}
                  onChange={form.setConsultationType}
                />
              </View>

              {/* Duración y Costo */}
              <View style={styles.row}>
                <View style={styles.halfField}>
                  <View style={styles.labelWithIcon}>
                    <Timer size={16} color={t.text.secondary} />
                    <Text style={styles.label}>Duración (min)</Text>
                  </View>
                  <TextField
                    label=""
                    value={form.duration}
                    onChange={form.setDuration}
                    placeholder="30"
                    keyboardType="numeric"
                  />
                </View>
                <View style={styles.halfField}>
                  <View style={styles.labelWithIcon}>
                    <DollarSign size={16} color={t.text.secondary} />
                    <Text style={styles.label}>Costo</Text>
                  </View>
                  <TextField
                    label=""
                    value={form.cost}
                    onChange={form.setCost}
                    placeholder="0"
                    keyboardType="numeric"
                  />
                </View>
              </View>

              {/* Notas */}
              <View>
                <View style={styles.labelWithIcon}>
                  <FileText size={16} color={t.text.secondary} />
                  <Text style={styles.label}>Notas</Text>
                </View>
                <TextField
                  label=""
                  value={form.notes}
                  onChange={form.setNotes}
                  placeholder="Agregar notas"
                  multiline
                  numberOfLines={4}
                />
              </View>
            </View>
          </View>
        )}

        {/* Error message */}
        {form.error && <Text style={styles.errorText}>{form.error}</Text>}
      </ScrollView>
      </KeyboardAvoidingView>

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
    keyboardView: {
      flex: 1,
    },
    scroll: {
      flex: 1,
    },
    content: {
      padding: spacing[4],
      gap: spacing[4],
    },
    card: {
      backgroundColor: t.surface.bgCard,
      borderRadius: 16,
      padding: spacing[4],
      gap: spacing[4],
      shadowColor: "#000",
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.06,
      shadowRadius: 8,
      elevation: 2,
      borderWidth: 1,
      borderColor: t.border.light,
    },
    cardHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing[2],
      marginBottom: spacing[2],
    },
    cardTitle: {
      fontSize: 17,
      fontWeight: "700",
      color: t.text.primary,
    },
    labelWithIcon: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing[1],
      marginBottom: spacing[2],
    },
    label: {
      fontSize: 14,
      fontWeight: "600",
      color: t.text.primary,
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
      flexDirection: "row",
      alignItems: "center",
      gap: spacing[1],
      paddingHorizontal: spacing[3],
      paddingVertical: spacing[2],
      borderRadius: 20,
      backgroundColor: t.surface.bg,
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
