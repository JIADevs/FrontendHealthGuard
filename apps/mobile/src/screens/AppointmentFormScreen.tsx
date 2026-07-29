import React, { useRef, useEffect } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  KeyboardAvoidingView, Platform, Modal, Pressable, TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute, type RouteProp } from "@react-navigation/native";
import { useMemo, useState } from "react";
import {
  useAppTheme,
  TextField,
  DatePicker,
  TimePicker,
  Spinner,
  spacing,
} from "@helu/ui";
import type { ThemeContextValue } from "@helu/ui";
import { useAppointmentForm } from "../hooks/useAppointmentForm";
import {
  useDoctorsQuery,
  useAppointmentByIdQuery,
  useAppointmentOptionsQuery,
  useTreatmentsQuery,
  useDocumentsQuery,
  useBackpacksQuery,
} from "@helu/api/hooks";
import {
  Plus, ChevronDown, ChevronUp, Calendar, Clock, MapPin, Video, Phone,
  User, Building2, FileText, Stethoscope, Briefcase, ClipboardList, Timer,
  DollarSign, Activity, FolderOpen, Backpack, Bell, X, Search,
} from "lucide-react-native";
import type { RootStackParamList } from "../navigation/RootNavigator";
import { MODALITIES } from "../constants/appointments";
import { SelectField } from "../components/SelectField";
import { FormHeader } from "../components/FormHeader";
import { AddDoctorModal } from "../components/AddDoctorModal";

type AppointmentFormRouteProp = RouteProp<RootStackParamList, "AppointmentForm">;

// ─── Reminder offset presets ───────────────────────────────────────────────────
const REMINDER_PRESET_MINUTES = [
  { label: "30 min", value: 30 },
  { label: "1 hora", value: 60 },
  { label: "2 horas", value: 120 },
  { label: "1 día antes", value: 1440 },
];

// ─── Chip picker modal (multi-select) ─────────────────────────────────────────

interface PickerModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  items: { id: string; label: string; sub?: string }[];
  selected: string[];
  onToggle: (id: string) => void;
}

function PickerModal({ visible, onClose, title, items, selected, onToggle }: PickerModalProps) {
  const t = useAppTheme();
  const styles = useMemo(() => makeStyles(t), [t]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!visible) setSearch("");
  }, [visible]);

  const filtered = search.trim()
    ? items.filter((item) => item.label.toLowerCase().includes(search.toLowerCase()))
    : items;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(_e: any) => _e.stopPropagation()}>
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>{title}</Text>
            <TouchableOpacity onPress={onClose}>
              <X size={22} color={t.text.primary} />
            </TouchableOpacity>
          </View>
          <View style={styles.sheetDivider} />
          {/* Buscador */}
          <View style={styles.pickerSearchContainer}>
            <Search size={16} color={t.text.secondary} />
            <TextInput
              style={styles.pickerSearchInput}
              value={search}
              onChangeText={setSearch}
              placeholder="Buscar..."
              placeholderTextColor={t.text.muted}
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch("")}>
                <X size={16} color={t.text.secondary} />
              </TouchableOpacity>
            )}
          </View>
          <ScrollView
            style={styles.sheetScroll}
            contentContainerStyle={{ gap: spacing[2], paddingBottom: spacing[2] }}
          >
            {filtered.length === 0 && (
              <Text style={styles.emptyText}>No hay elementos disponibles</Text>
            )}
            {filtered.map((item) => {
              const isSelected = selected.includes(item.id);
              return (
                <TouchableOpacity
                  key={item.id}
                  style={[styles.pickerCard, isSelected && styles.pickerCardSelected]}
                  onPress={() => onToggle(item.id)}
                  activeOpacity={0.7}
                >
                  {/* Icono izquierda */}
                  <View style={styles.pickerCardIcon}>
                    <FileText size={20} color={t.text.secondary} />
                  </View>
                  {/* Texto */}
                  <View style={{ flex: 1 }}>
                    <Text style={styles.pickerRowTitle} numberOfLines={1}>{item.label}</Text>
                    {item.sub && <Text style={styles.pickerRowSub}>{item.sub}</Text>}
                  </View>
                  {/* Botón + / × */}
                  <View style={[styles.pickerAddBtn, isSelected && styles.pickerAddBtnSelected]}>
                    {isSelected
                      ? <X size={22} color="#fff" />
                      : <Plus size={22} color="#fff" />
                    }
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
          {/* Botón cerrar al estilo de la screenshot */}
          <TouchableOpacity style={styles.pickerCloseBtn} onPress={onClose}>
            <Text style={styles.pickerCloseBtnText}>Cerrar</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// ─── Chip tag ──────────────────────────────────────────────────────────────────

function ChipTag({ label, onRemove }: { label: string; onRemove: () => void }) {
  const t = useAppTheme();
  return (
    <View style={{
      flexDirection: "row", alignItems: "center", gap: 4,
      backgroundColor: t.brand.bg, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4,
      borderWidth: 1, borderColor: t.brand.fg,
    }}>
      <Text style={{ fontSize: 13, color: t.brand.fg }}>{label}</Text>
      <TouchableOpacity onPress={onRemove}>
        <X size={13} color={t.brand.fg} />
      </TouchableOpacity>
    </View>
  );
}

// ─── Loader wrapper ───────────────────────────────────────────────────────────

export function AppointmentFormScreen() {
  const route = useRoute<AppointmentFormRouteProp>();
  const appointmentId = route.params?.id;

  if (appointmentId) {
    return <AppointmentFormEditor id={appointmentId} />;
  }
  return <AppointmentFormBody appointment={null} />;
}

function AppointmentFormEditor({ id }: { id: string }) {
  const t = useAppTheme();
  const { data: appointment, isLoading } = useAppointmentByIdQuery(id);

  if (isLoading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: t.surface.bg }} edges={["top", "bottom"]}>
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <Spinner size="lg" />
        </View>
      </SafeAreaView>
    );
  }

  return <AppointmentFormBody appointment={appointment ?? null} />;
}

// ─── Form body ────────────────────────────────────────────────────────────────

function AppointmentFormBody({ appointment }: { appointment: any }) {
  const t = useAppTheme();
  const styles = useMemo(() => makeStyles(t), [t]);
  const navigation = useNavigation();

  const [showAdditionalDetails, setShowAdditionalDetails] = useState(
    !!(appointment?.duration || appointment?.notes || appointment?.service || appointment?.consultationType || appointment?.cost)
  );
  const [showAddDoctorModal, setShowAddDoctorModal] = useState(false);

  // Picker modals for documents/backpacks/treatments
  const [showTreatmentPicker, setShowTreatmentPicker] = useState(false);
  const [showPreDocPicker, setShowPreDocPicker] = useState(false);
  const [showPostDocPicker, setShowPostDocPicker] = useState(false);
  const [showPreBpPicker, setShowPreBpPicker] = useState(false);
  const [showPostBpPicker, setShowPostBpPicker] = useState(false);

  const scrollViewRef = useRef<ScrollView>(null);

  const form = useAppointmentForm({
    initial: appointment,
    onClose: () => navigation.goBack(),
  });

  const doctorsQuery = useDoctorsQuery("", 1, 100);
  const doctors = doctorsQuery.data?.items ?? [];

  const optionsQuery = useAppointmentOptionsQuery();
  const specialties = optionsQuery.data?.specialties ?? [];
  const services = optionsQuery.data?.services ?? [];
  const consultationTypes = optionsQuery.data?.consultation_types ?? [];

  const treatmentsQuery = useTreatmentsQuery(1, 100);
  const treatments = treatmentsQuery.data?.items ?? [];

  const documentsQuery = useDocumentsQuery("", 1, 100);
  const documents = documentsQuery.data?.items ?? [];

  const backpacksQuery = useBackpacksQuery("", 100);
  const backpacks = backpacksQuery.data?.items ?? [];

  // Derived labels for selected items
  const treatmentItems = treatments
    .filter((tx: any) => tx.status === "ACTIVE")
    .map((tx: any) => ({ id: tx.id, label: tx.name, sub: tx.description ?? undefined }));
  const docItems = documents.map((d: any) => ({ id: d.id, label: d.title, sub: d.format }));
  const bpItems = backpacks.map((b: any) => ({ id: b.id, label: b.name, sub: b.description ?? undefined }));

  function labelForId(id: string, list: { id: string; label: string }[]) {
    return list.find((i) => i.id === id)?.label ?? id.slice(0, 8);
  }

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
        title={appointment ? "Editar cita" : "Nueva cita"}
        onSave={form.handleSave}
        saveButtonText={form.isEdit ? "Guardar cambios" : "Guardar"}
      />
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0}
      >
        <ScrollView ref={scrollViewRef} style={styles.scroll} contentContainerStyle={styles.content}>

          {/* ── INFORMACIÓN BÁSICA ─────────────────────────────────────────── */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Calendar size={20} color={t.brand.fg} />
              <Text style={styles.cardTitle}>Información básica</Text>
            </View>

            <View style={styles.row}>
              <View style={styles.halfField}>
                <View style={styles.labelWithIcon}>
                  <Calendar size={16} color={t.text.secondary} />
                  <Text style={styles.label}>Fecha *</Text>
                </View>
                <DatePicker label="" value={form.date} onChange={form.setDate} placeholder="Seleccionar fecha" required />
              </View>
              <View style={styles.halfField}>
                <View style={styles.labelWithIcon}>
                  <Clock size={16} color={t.text.secondary} />
                  <Text style={styles.label}>Hora *</Text>
                </View>
                <TimePicker label="" value={form.time} onChange={form.setTime} placeholder="Seleccionar hora" required />
              </View>
            </View>

            <View>
              <Text style={styles.label}>Modalidad *</Text>
              <View style={styles.pillRow}>
                {MODALITIES.map((mod) => {
                  const icon = mod.value === "PRESENCIAL" ? MapPin : mod.value === "VIRTUAL" ? Video : Phone;
                  const IconComponent = icon;
                  return (
                    <TouchableOpacity
                      key={mod.value}
                      style={[styles.pill, form.modality === mod.value && styles.pillActive]}
                      onPress={() => form.setModality(mod.value)}
                    >
                      <IconComponent size={16} color={form.modality === mod.value ? t.brand.fg : t.text.secondary} />
                      <Text style={[styles.pillText, form.modality === mod.value && styles.pillTextActive]}>
                        {mod.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {form.modality === "PRESENCIAL" && (
              <View>
                <View style={styles.labelWithIcon}>
                  <MapPin size={16} color={t.text.secondary} />
                  <Text style={styles.label}>Lugar *</Text>
                </View>
                <TextField label="" value={form.location} onChange={form.setLocation} placeholder="Ej: Calle 123, Bogotá" />
              </View>
            )}

            {form.modality === "VIRTUAL" && (
              <View>
                <View style={styles.labelWithIcon}>
                  <Video size={16} color={t.text.secondary} />
                  <Text style={styles.label}>Link de videollamada *</Text>
                </View>
                <TextField label="" value={form.videoCallLink} onChange={form.setVideoCallLink} placeholder="https://meet.google.com/..." />
              </View>
            )}
          </View>

          {/* ── PROFESIONAL DE SALUD ───────────────────────────────────────── */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Stethoscope size={20} color={t.brand.fg} />
              <Text style={styles.cardTitle}>Profesional de salud</Text>
            </View>

            <View>
              <View style={styles.labelWithIcon}>
                <User size={16} color={t.text.secondary} />
                <Text style={styles.label}>Profesional</Text>
              </View>
              <SelectField
                label="" value={form.doctor} placeholder="Seleccionar profesional"
                options={doctors.map((d: any) => d.name)} onChange={handleDoctorSelect}
              />
              <TouchableOpacity style={styles.addButton} onPress={() => setShowAddDoctorModal(true)}>
                <Plus size={16} color={t.brand.fg} />
                <Text style={styles.addButtonText}>Agregar nuevo profesional</Text>
              </TouchableOpacity>
            </View>

            <View>
              <View style={styles.labelWithIcon}>
                <Briefcase size={16} color={t.text.secondary} />
                <Text style={styles.label}>Especialidad</Text>
              </View>
              <SelectField
                label="" value={form.specialty} placeholder="Seleccionar especialidad"
                options={specialties} onChange={form.setSpecialty}
              />
            </View>

            <View>
              <View style={styles.labelWithIcon}>
                <Building2 size={16} color={t.text.secondary} />
                <Text style={styles.label}>Clínica / Hospital / IPS</Text>
              </View>
              <TextField label="" value={form.clinic} onChange={form.setClinic} placeholder="Ej: Hospital San José" />
            </View>

            <View>
              <View style={styles.labelWithIcon}>
                <Activity size={16} color={t.text.secondary} />
                <Text style={styles.label}>Tratamiento</Text>
              </View>
              {form.treatmentIds.length > 0 && (
                <View style={styles.chipRow}>
                  {(form.treatmentIds as string[]).map((id: string) => (
                    <React.Fragment key={id}>
                      <ChipTag
                        label={labelForId(id, treatmentItems)}
                        onRemove={() => form.setTreatmentIds((form.treatmentIds as string[]).filter((x: string) => x !== id))}
                      />
                    </React.Fragment>
                  ))}
                </View>
              )}
              <TouchableOpacity style={styles.addButton} onPress={() => setShowTreatmentPicker(true)}>
                <Plus size={16} color={t.brand.fg} />
                <Text style={styles.addButtonText}>Agregar tratamiento</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* ── DOCUMENTOS Y MOCHILAS ─────────────────────────────────────── */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <FolderOpen size={20} color={t.brand.fg} />
              <Text style={styles.cardTitle}>Documentos y mochilas</Text>
            </View>

            {/* Antes de la cita — documentos */}
            <View>
              <Text style={styles.sectionSubtitle}>Antes de la cita</Text>
              <View style={styles.labelWithIcon}>
                <FileText size={16} color={t.text.secondary} />
                <Text style={styles.label}>Documentos a llevar</Text>
              </View>
              {form.preDocumentIds.length > 0 && (
                <View style={styles.chipRow}>
                  {(form.preDocumentIds as string[]).map((id: string) => (
                    <React.Fragment key={id}>
                      <ChipTag
                        label={labelForId(id, docItems)}
                        onRemove={() => form.setPreDocumentIds((form.preDocumentIds as string[]).filter((x: string) => x !== id))}
                      />
                    </React.Fragment>
                  ))}
                </View>
              )}
              <TouchableOpacity style={styles.addButton} onPress={() => setShowPreDocPicker(true)}>
                <Plus size={16} color={t.brand.fg} />
                <Text style={styles.addButtonText}>Agregar documentos</Text>
              </TouchableOpacity>

              <View style={[styles.labelWithIcon, { marginTop: spacing[2] }]}>
                <Backpack size={16} color={t.text.secondary} />
                <Text style={styles.label}>Mochilas a llevar</Text>
              </View>
              {form.preBackpackIds.length > 0 && (
                <View style={styles.chipRow}>
                  {(form.preBackpackIds as string[]).map((id: string) => (
                    <React.Fragment key={id}>
                      <ChipTag
                        label={labelForId(id, bpItems)}
                        onRemove={() => form.setPreBackpackIds((form.preBackpackIds as string[]).filter((x: string) => x !== id))}
                      />
                    </React.Fragment>
                  ))}
                </View>
              )}
              <TouchableOpacity style={styles.addButton} onPress={() => setShowPreBpPicker(true)}>
                <Plus size={16} color={t.brand.fg} />
                <Text style={styles.addButtonText}>Agregar mochilas</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.separator} />

            {/* Después de la cita — documentos */}
            <View>
              <Text style={styles.sectionSubtitle}>Después de la cita</Text>
              <View style={styles.labelWithIcon}>
                <FileText size={16} color={t.text.secondary} />
                <Text style={styles.label}>Documentos obtenidos</Text>
              </View>
              {form.postDocumentIds.length > 0 && (
                <View style={styles.chipRow}>
                  {(form.postDocumentIds as string[]).map((id: string) => (
                    <React.Fragment key={id}>
                      <ChipTag
                        label={labelForId(id, docItems)}
                        onRemove={() => form.setPostDocumentIds((form.postDocumentIds as string[]).filter((x: string) => x !== id))}
                      />
                    </React.Fragment>
                  ))}
                </View>
              )}
              <TouchableOpacity style={styles.addButton} onPress={() => setShowPostDocPicker(true)}>
                <Plus size={16} color={t.brand.fg} />
                <Text style={styles.addButtonText}>Agregar documentos</Text>
              </TouchableOpacity>

              <View style={[styles.labelWithIcon, { marginTop: spacing[2] }]}>
                <Backpack size={16} color={t.text.secondary} />
                <Text style={styles.label}>Mochilas obtenidas</Text>
              </View>
              {form.postBackpackIds.length > 0 && (
                <View style={styles.chipRow}>
                  {(form.postBackpackIds as string[]).map((id: string) => (
                    <React.Fragment key={id}>
                      <ChipTag
                        label={labelForId(id, bpItems)}
                        onRemove={() => form.setPostBackpackIds((form.postBackpackIds as string[]).filter((x: string) => x !== id))}
                      />
                    </React.Fragment>
                  ))}
                </View>
              )}
              <TouchableOpacity style={styles.addButton} onPress={() => setShowPostBpPicker(true)}>
                <Plus size={16} color={t.brand.fg} />
                <Text style={styles.addButtonText}>Agregar mochilas</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* ── RECORDATORIO ──────────────────────────────────────────────── */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Bell size={20} color={t.brand.fg} />
              <Text style={styles.cardTitle}>Recordatorio</Text>
            </View>

            <View style={styles.pillRow}>
              {(["none", "at_time", "before"] as const).map((mode) => {
                const label =
                  mode === "none" ? "Sin recordatorio" :
                  mode === "at_time" ? "A la hora de la cita" :
                  "Antes de la cita";
                const selected = form.reminderMode === mode;
                return (
                  <TouchableOpacity
                    key={mode}
                    style={[styles.pill, selected && styles.pillActive]}
                    onPress={() => form.setReminderMode(mode)}
                  >
                    <Text style={[styles.pillText, selected && styles.pillTextActive]}>
                      {label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {form.reminderMode === "before" && (
              <View style={{ marginTop: spacing[3] }}>
                <Text style={styles.label}>¿Con cuánta anticipación?</Text>
                <View style={[styles.pillRow, { marginTop: spacing[2] }]}>
                  {REMINDER_PRESET_MINUTES.map(({ label, value }) => {
                    const selected = form.reminderOffsets.includes(value);
                    return (
                      <TouchableOpacity
                        key={value}
                        style={[styles.pill, selected && styles.pillActive]}
                        onPress={() => form.toggleReminderOffset(value)}
                      >
                        <Text style={[styles.pillText, selected && styles.pillTextActive]}>
                          {label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}
          </View>

          {/* ── DETALLES ADICIONALES (colapsable) ─────────────────────────── */}
          <TouchableOpacity
            style={styles.collapsibleHeader}
            onPress={() => {
              const opening = !showAdditionalDetails;
              setShowAdditionalDetails(opening);
              if (opening) {
                setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 150);
              }
            }}
          >
            <Text style={styles.collapsibleHeaderText}>Detalles adicionales</Text>
            {showAdditionalDetails
              ? <ChevronUp size={20} color={t.text.secondary} />
              : <ChevronDown size={20} color={t.text.secondary} />
            }
          </TouchableOpacity>

          {showAdditionalDetails && (
            <View style={styles.card}>
              <View style={styles.collapsibleContent}>
                <View>
                  <View style={styles.labelWithIcon}>
                    <FileText size={16} color={t.text.secondary} />
                    <Text style={styles.label}>Nombre de la cita</Text>
                  </View>
                  <TextField label="" value={form.name} onChange={form.setName} placeholder="Ej: Neurología — Dr. Rivera" />
                </View>

                <View>
                  <View style={styles.labelWithIcon}>
                    <ClipboardList size={16} color={t.text.secondary} />
                    <Text style={styles.label}>Servicio</Text>
                  </View>
                  <SelectField
                    label="" value={form.service} placeholder="Seleccionar servicio"
                    options={services} onChange={form.setService}
                  />
                </View>

                <View>
                  <View style={styles.labelWithIcon}>
                    <Stethoscope size={16} color={t.text.secondary} />
                    <Text style={styles.label}>Tipo de consulta</Text>
                  </View>
                  <SelectField
                    label="" value={form.consultationType} placeholder="Seleccionar tipo de consulta"
                    options={consultationTypes} onChange={form.setConsultationType}
                  />
                </View>

                <View style={styles.row}>
                  <View style={styles.halfField}>
                    <View style={styles.labelWithIcon}>
                      <Timer size={16} color={t.text.secondary} />
                      <Text style={styles.label}>Duración (min)</Text>
                    </View>
                    <TextField label="" value={form.duration} onChange={form.setDuration} placeholder="30" keyboardType="numeric" />
                  </View>
                  <View style={styles.halfField}>
                    <View style={styles.labelWithIcon}>
                      <DollarSign size={16} color={t.text.secondary} />
                      <Text style={styles.label}>Costo</Text>
                    </View>
                    <TextField label="" value={form.cost} onChange={form.setCost} placeholder="0" keyboardType="numeric" />
                  </View>
                </View>

                <View>
                  <View style={styles.labelWithIcon}>
                    <FileText size={16} color={t.text.secondary} />
                    <Text style={styles.label}>Notas</Text>
                  </View>
                  <TextField label="" value={form.notes} onChange={form.setNotes} placeholder="Agregar notas" multiline numberOfLines={4} />
                </View>
              </View>
            </View>
          )}

          {form.error && <Text style={styles.errorText}>{form.error}</Text>}
        </ScrollView>
      </KeyboardAvoidingView>

      {/* ── Modals ─────────────────────────────────────────────────────────── */}
      <AddDoctorModal
        visible={showAddDoctorModal}
        onClose={() => setShowAddDoctorModal(false)}
        onCreated={(name) => { form.setDoctor(name); setShowAddDoctorModal(false); }}
      />

      <PickerModal
        visible={showTreatmentPicker} onClose={() => setShowTreatmentPicker(false)}
        title="Tratamientos" items={treatmentItems}
        selected={form.treatmentIds}
        onToggle={(id: string) => form.setTreatmentIds(
          (form.treatmentIds as string[]).includes(id)
            ? (form.treatmentIds as string[]).filter((x: string) => x !== id)
            : [...(form.treatmentIds as string[]), id]
        )}
      />

      <PickerModal
        visible={showPreDocPicker} onClose={() => setShowPreDocPicker(false)}
        title="Documentos a llevar" items={docItems}
        selected={form.preDocumentIds}
        onToggle={(id: string) => form.setPreDocumentIds(
          (form.preDocumentIds as string[]).includes(id)
            ? (form.preDocumentIds as string[]).filter((x: string) => x !== id)
            : [...(form.preDocumentIds as string[]), id]
        )}
      />
      <PickerModal
        visible={showPostDocPicker} onClose={() => setShowPostDocPicker(false)}
        title="Documentos obtenidos después" items={docItems}
        selected={form.postDocumentIds}
        onToggle={(id: string) => form.setPostDocumentIds(
          (form.postDocumentIds as string[]).includes(id)
            ? (form.postDocumentIds as string[]).filter((x: string) => x !== id)
            : [...(form.postDocumentIds as string[]), id]
        )}
      />
      <PickerModal
        visible={showPreBpPicker} onClose={() => setShowPreBpPicker(false)}
        title="Mochilas a llevar" items={bpItems}
        selected={form.preBackpackIds}
        onToggle={(id: string) => form.setPreBackpackIds(
          (form.preBackpackIds as string[]).includes(id)
            ? (form.preBackpackIds as string[]).filter((x: string) => x !== id)
            : [...(form.preBackpackIds as string[]), id]
        )}
      />
      <PickerModal
        visible={showPostBpPicker} onClose={() => setShowPostBpPicker(false)}
        title="Mochilas obtenidas después" items={bpItems}
        selected={form.postBackpackIds}
        onToggle={(id: string) => form.setPostBackpackIds(
          (form.postBackpackIds as string[]).includes(id)
            ? (form.postBackpackIds as string[]).filter((x: string) => x !== id)
            : [...(form.postBackpackIds as string[]), id]
        )}
      />
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const makeStyles = (t: ThemeContextValue) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: t.surface.bg },
    keyboardView: { flex: 1 },
    scroll: { flex: 1 },
    content: { padding: spacing[4], gap: spacing[4] },
    card: {
      backgroundColor: t.surface.bgCard,
      borderRadius: 16,
      padding: spacing[4],
      gap: spacing[4],
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 8,
      elevation: 2,
      borderWidth: 1,
      borderColor: t.border.light,
    },
    cardHeader: { flexDirection: "row", alignItems: "center", gap: spacing[2] },
    cardTitle: { fontSize: 17, fontWeight: "700", color: t.text.primary },
    labelWithIcon: { flexDirection: "row", alignItems: "center", gap: spacing[1], marginBottom: spacing[2] },
    label: { fontSize: 14, fontWeight: "600", color: t.text.primary },
    sectionSubtitle: {
      fontSize: 13, fontWeight: "700", color: t.brand.fg,
      textTransform: "uppercase", letterSpacing: 0.5, marginBottom: spacing[2],
    },
    separator: { height: 1, backgroundColor: t.border.light },
    addButton: { flexDirection: "row", alignItems: "center", gap: spacing[1], paddingVertical: spacing[2], marginTop: spacing[1] },
    addButtonText: { fontSize: 14, color: t.brand.fg, fontWeight: "500" },
    row: { flexDirection: "row", gap: spacing[2] },
    halfField: { flex: 1 },
    pillRow: { flexDirection: "row", gap: spacing[2], flexWrap: "wrap" },
    pill: {
      flexDirection: "row", alignItems: "center", gap: spacing[1],
      paddingHorizontal: spacing[3], paddingVertical: spacing[2],
      borderRadius: 20, backgroundColor: t.surface.bg, borderWidth: 1, borderColor: t.border.medium,
    },
    pillActive: { backgroundColor: t.brand.bg, borderColor: t.brand.fg },
    pillText: { fontSize: 14, color: t.text.primary },
    pillTextActive: { color: t.brand.fg, fontWeight: "600" },
    chipRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing[2], marginBottom: spacing[2] },
    collapsibleHeader: {
      flexDirection: "row", justifyContent: "space-between", alignItems: "center",
      paddingVertical: spacing[3], paddingHorizontal: spacing[4],
      backgroundColor: t.surface.bgCard, borderRadius: 12, borderWidth: 1, borderColor: t.border.light,
    },
    collapsibleHeaderText: { fontSize: 15, fontWeight: "600", color: t.text.primary },
    collapsibleContent: { gap: spacing[4] },
    errorText: { color: t.status.errorFg, fontSize: 14, marginTop: spacing[2] },
    numberInput: {
      width: 56, borderWidth: 1, borderColor: t.border.medium,
      borderRadius: 10, paddingHorizontal: spacing[3], paddingVertical: spacing[2],
      fontSize: 15, color: t.text.primary, backgroundColor: t.surface.bg, textAlign: "center",
    },
    // Picker modal
    overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
    sheet: {
      backgroundColor: t.surface.bg, borderTopLeftRadius: 20, borderTopRightRadius: 20,
      maxHeight: "75%", paddingBottom: spacing[4],
    },
    sheetHeader: {
      flexDirection: "row", justifyContent: "space-between", alignItems: "center",
      paddingHorizontal: spacing[4], paddingVertical: spacing[4],
    },
    sheetTitle: { fontSize: 17, fontWeight: "600", color: t.text.primary },
    sheetDivider: { height: 1, backgroundColor: t.border.light, marginBottom: spacing[2] },
    sheetScroll: { paddingHorizontal: spacing[4] },
    pickerRowTitle: { fontSize: 15, color: t.text.primary, fontWeight: "500" },
    pickerRowSub: { fontSize: 13, color: t.text.secondary },
    pickerSearchContainer: {
      flexDirection: "row", alignItems: "center", gap: spacing[2],
      marginHorizontal: spacing[4], marginBottom: spacing[3],
      borderWidth: 1, borderColor: t.border.medium, borderRadius: 10,
      paddingHorizontal: spacing[3], paddingVertical: spacing[2],
      backgroundColor: t.surface.bg,
    },
    pickerSearchInput: { flex: 1, fontSize: 15, color: t.text.primary },
    // Tarjeta estilo "agregar documento en mochila"
    pickerCard: {
      flexDirection: "row", alignItems: "center", gap: spacing[3],
      padding: spacing[3],
      borderRadius: 16, borderWidth: 1, borderColor: t.border.light,
      backgroundColor: t.surface.bgCard,
    },
    pickerCardSelected: {
      borderColor: t.brand.fg,
      backgroundColor: t.brand.bg,
    },
    pickerCardIcon: {
      width: 46, height: 46, borderRadius: 12,
      backgroundColor: t.surface.bg,
      alignItems: "center", justifyContent: "center",
    },
    pickerAddBtn: {
      width: 52, height: 52, borderRadius: 14,
      backgroundColor: t.brand.fg,
      alignItems: "center", justifyContent: "center",
    },
    pickerAddBtnSelected: {
      backgroundColor: "#e53e3e",
    },
    pickerCloseBtn: {
      margin: spacing[4],
      padding: spacing[4],
      backgroundColor: t.surface.bgCard,
      borderRadius: 16,
      alignItems: "center",
      borderWidth: 1,
      borderColor: t.border.light,
    },
    pickerCloseBtnText: { fontSize: 16, fontWeight: "600", color: t.text.primary },
    emptyText: { fontSize: 14, color: t.text.secondary, textAlign: "center", paddingVertical: spacing[6] },
    doctorInitials: { fontSize: 16, fontWeight: "600", color: t.text.primary },
  });
