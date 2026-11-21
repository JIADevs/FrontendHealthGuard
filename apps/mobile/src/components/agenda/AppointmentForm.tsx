import React, { useRef, useEffect, type ComponentRef } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  KeyboardAvoidingView, Platform, Pressable, AccessibilityInfo,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useMemo, useState } from "react";
import {
  useAppTheme,
  TextField,
  DatePicker,
  TimePicker,
  SkeletonGroup,
  Skeleton,
  useSkeletonVisible,
  DiscardChangesDialog,
  BottomActionBar,
  BOTTOM_ACTION_BAR_HEIGHT,
  BottomSheet,
  Button,
  ChoiceChips,
  SegmentedControl,
  IconTile,
  type Tone,
  spacing,
  fontSize,
  radii,
  nativeFont,
} from "@helu/ui";
import type { ThemeContextValue } from "@helu/ui";
import { useAppointmentForm } from "../../hooks/useAppointmentForm";
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
  DollarSign, Activity, FolderOpen, Backpack, Bell, X, Check, AlertCircle,
} from "lucide-react-native";
import { MODALITIES } from "../../constants/appointments";
import { SelectField } from "../SelectField";
import { AddRow, ChipTag, PickerModal } from "./LinkPicker";
import { DoctorSheet } from "./DoctorSheet";
import { ScreenHeader } from "../ScreenHeader";
import { haptics } from "../../lib/haptics";


// ─── Reminder offset presets ───────────────────────────────────────────────────
const REMINDER_PRESET_MINUTES = [
  { label: "30 min", value: 30 },
  { label: "1 hora", value: 60 },
  { label: "2 horas", value: 120 },
  { label: "1 día antes", value: 1440 },
];

// ─── Loader wrapper ───────────────────────────────────────────────────────────

/**
 * Lets the form stop a back gesture or the header back while it has unsaved changes. The screen
 * adapts React Navigation's `beforeRemove` to this, so the form never reaches the navigator.
 * The handler calls `prevent()` to cancel leaving; the return value unsubscribes.
 */
export type SubscribeBeforeLeave = (handler: (prevent: () => void) => void) => () => void;

export interface AppointmentFormNav {
  /** Leaves the form (after saving, or after confirming «Descartar») */
  onClose: () => void;
  subscribeBeforeLeave: SubscribeBeforeLeave;
}

export interface AppointmentFormProps extends AppointmentFormNav {
  /** Set to edit an existing appointment */
  id?: string;
}

export function AppointmentForm({ id, ...nav }: AppointmentFormProps) {
  if (id) {
    return <AppointmentFormEditor id={id} nav={nav} />;
  }
  return <AppointmentFormBody appointment={null} nav={nav} />;
}

function AppointmentFormEditor({ id, nav }: { id: string; nav: AppointmentFormNav }) {
  const t = useAppTheme();
  const { data: appointment, isLoading } = useAppointmentByIdQuery(id);
  const showSkeleton = useSkeletonVisible(isLoading);

  if (showSkeleton) {
    // §6c: la cabecera se ve real; las secciones del formulario son esqueleto.
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: t.surface.bg }} edges={["top", "bottom"]}>
        <ScreenHeader title="Editar cita" />
        <SkeletonGroup label="Cargando la cita" style={{ padding: spacing[4], gap: spacing[4] }}>
          {[0, 1].map((i) => (
            <View
              key={i}
              style={{
                padding: spacing[4], gap: spacing[3], borderRadius: 18, borderWidth: 1, borderBottomWidth: 4,
                borderColor: t.border.default, backgroundColor: t.surface.bgCard,
              }}
            >
              <Skeleton width="40%" height={16} />
              <Skeleton width="25%" height={12} />
              <Skeleton height={48} radius={14} />
              <Skeleton width="25%" height={12} />
              <Skeleton height={48} radius={14} />
            </View>
          ))}
        </SkeletonGroup>
      </SafeAreaView>
    );
  }

  return <AppointmentFormBody appointment={appointment ?? null} nav={nav} />;
}

function appointmentDraft(form: {
  name: string;
  date: string;
  time: string;
  modality: string;
  location: string;
  videoCallLink: string;
  specialty: string;
  service: string;
  consultationType: string;
  duration: string;
  doctorId: string;
  doctor: string;
  clinic: string;
  cost: string;
  notes: string;
  treatmentIds: string[];
  preDocumentIds: string[];
  postDocumentIds: string[];
  preBackpackIds: string[];
  postBackpackIds: string[];
  reminderMode: string;
  reminderOffsets: number[];
}) {
  return JSON.stringify({
    name: form.name,
    date: form.date,
    time: form.time,
    modality: form.modality,
    location: form.location,
    videoCallLink: form.videoCallLink,
    specialty: form.specialty,
    service: form.service,
    consultationType: form.consultationType,
    duration: form.duration,
    doctorId: form.doctorId,
    doctor: form.doctor,
    clinic: form.clinic,
    cost: form.cost,
    notes: form.notes,
    treatmentIds: form.treatmentIds,
    preDocumentIds: form.preDocumentIds,
    postDocumentIds: form.postDocumentIds,
    preBackpackIds: form.preBackpackIds,
    postBackpackIds: form.postBackpackIds,
    reminderMode: form.reminderMode,
    reminderOffsets: [...form.reminderOffsets].sort((a, b) => a - b),
  });
}

// ─── Form body ────────────────────────────────────────────────────────────────

function AppointmentFormBody({ appointment, nav }: { appointment: any; nav: AppointmentFormNav }) {
  const t = useAppTheme();
  const styles = useMemo(() => makeStyles(t), [t]);
  const allowLeave = useRef(false);
  const baseline = useRef<string | null>(null);
  const nameTouched = useRef(Boolean(appointment?.name));
  const [askDiscard, setAskDiscard] = useState(false);
  const [addingDoctor, setAddingDoctor] = useState(false);

  const [showAdditionalDetails, setShowAdditionalDetails] = useState(
    !!(
      appointment?.duration || appointment?.notes || appointment?.service || appointment?.consultationType || appointment?.cost
      || appointment?.treatmentIds?.length || appointment?.preDocumentIds?.length || appointment?.postDocumentIds?.length
      || appointment?.preBackpackIds?.length || appointment?.postBackpackIds?.length
    )
  );
  // Picker modals for documents/backpacks/treatments
  const [showTreatmentPicker, setShowTreatmentPicker] = useState(false);
  const [showPreDocPicker, setShowPreDocPicker] = useState(false);
  const [showPostDocPicker, setShowPostDocPicker] = useState(false);
  const [showPreBpPicker, setShowPreBpPicker] = useState(false);
  const [showPostBpPicker, setShowPostBpPicker] = useState(false);

  const scrollViewRef = useRef<ComponentRef<typeof ScrollView>>(null);
  const insets = useSafeAreaInsets();
  // formularios.md §6: al enviar con errores, bajar al primer campo con error y anunciar cuántos.
  const sectionY = useRef({ dateTime: 0, place: 0 });
  const [saveAttempt, setSaveAttempt] = useState(0);

  const form = useAppointmentForm({
    initial: appointment,
    onClose: () => {
      allowLeave.current = true;
      nav.onClose();
    },
  });

  const suggestedName = [form.specialty, form.doctor].filter(Boolean).join(" — ");

  const fieldErrorCount = Object.keys(form.fieldErrors).length;
  useEffect(() => {
    if (saveAttempt === 0 || fieldErrorCount === 0) return;
    const firstY = form.fieldErrors.date || form.fieldErrors.time ? sectionY.current.dateTime : sectionY.current.place;
    haptics.warning();
    scrollViewRef.current?.scrollTo({ y: Math.max(0, firstY - spacing[4]), animated: true });
    AccessibilityInfo.announceForAccessibility(fieldErrorCount === 1 ? "Revisa 1 campo" : `Revisa ${fieldErrorCount} campos`);
    // Solo al intentar guardar; la corrección en vivo no vuelve a mover la pantalla.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [saveAttempt]);

  const handleSave = () => {
    form.handleSave();
    setSaveAttempt((n) => n + 1);
  };

  useEffect(() => {
    if (nameTouched.current || !suggestedName) return;
    form.setName(suggestedName);
  }, [suggestedName, form]);

  if (baseline.current === null) {
    baseline.current = appointmentDraft(form);
  }
  const nameForCompare = !nameTouched.current && (form.name === "" || form.name === suggestedName) ? "" : form.name;
  const dirty = appointmentDraft({ ...form, name: nameForCompare }) !== baseline.current;

  const { subscribeBeforeLeave } = nav;
  useEffect(() => {
    return subscribeBeforeLeave((prevent) => {
      if (!dirty || allowLeave.current) return;
      prevent();
      setAskDiscard(true);
    });
  }, [subscribeBeforeLeave, dirty]);

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

  // A professional just created in «Nuevo profesional» arrives in the list after the refetch: link its id then.
  useEffect(() => {
    if (!form.doctor || form.doctorId) return;
    const match = doctors.find((d: any) => d.name === form.doctor);
    if (match) form.setDoctorId(match.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doctors, form.doctor]);

  function handleDoctorSelect(name: string) {
    const selected = doctors.find((d: any) => d.name === name);
    form.setDoctor(name);
    if (selected) {
      form.setDoctorId(selected.id);
      if (!form.specialty) form.setSpecialty(selected.specialty ?? "");
      if (!form.clinic) form.setClinic(selected.clinic ?? "");
    }
  }

  const togglePick = (list: string[], setter: (v: string[]) => void, id: string) =>
    setter(list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);

  const reminderValue =
    form.reminderMode === "none"
      ? "none"
      : form.reminderMode === "before" && form.reminderOffsets.length === 1
        ? String(form.reminderOffsets[0])
        : null;

  const chipsFor = (ids: string[], items: { id: string; label: string }[], setter: (v: string[]) => void) =>
    ids.length > 0 ? (
      <View style={styles.chipRow}>
        {ids.map((id) => (
          <React.Fragment key={id}>
            <ChipTag label={labelForId(id, items)} onRemove={() => setter(ids.filter((x) => x !== id))} />
          </React.Fragment>
        ))}
      </View>
    ) : null;

  // Mockup «Nueva cita» (v2): lo esencial primero (cuándo, con quién, dónde y recordatorio);
  // lo opcional queda plegado en «Más detalles». Barra fija con «Guardar cita».
  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScreenHeader title={appointment ? "Editar cita" : "Nueva cita"} />
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0}
      >
        <ScrollView
          ref={scrollViewRef}
          style={styles.scroll}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[
            styles.content,
            { paddingBottom: BOTTOM_ACTION_BAR_HEIGHT + insets.bottom + spacing[8] },
          ]}
        >
          <View style={styles.card} onLayout={(e) => { sectionY.current.dateTime = e.nativeEvent.layout.y; }}>
            <Text style={styles.cardTitle}>Fecha y hora</Text>
            <View style={styles.row}>
              <View style={styles.halfField}>
                <DatePicker label="Fecha" value={form.date} onChange={form.setDate} placeholder="Elige la fecha" error={form.fieldErrors.date} />
              </View>
              <View style={styles.halfField}>
                <TimePicker label="Hora" value={form.time} onChange={form.setTime} placeholder="Elige la hora" error={form.fieldErrors.time} />
              </View>
            </View>
            <TextField label="Duración" value={form.duration} onChange={form.setDuration} placeholder="30" keyboardType="number-pad" unit="min" />
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Profesional</Text>
            <View style={{ gap: 6 }}>
              <Text style={styles.label}>Tipo de consulta</Text>
              <SegmentedControl
                accessibilityLabel="Tipo de consulta"
                options={[
                  { value: "APPOINTMENT", label: "Cita médica" },
                  { value: "EXAM", label: "Examen" },
                ]}
                value={form.type}
                onChange={(value) => form.setType(value as "APPOINTMENT" | "EXAM")}
              />
            </View>
            <SelectField
              label="Especialidad" value={form.specialty} placeholder="Seleccionar especialidad"
              options={specialties} onChange={form.setSpecialty}
            />
            <View>
              <SelectField
                label="Profesional de salud" value={form.doctor} placeholder="Seleccionar profesional"
                options={doctors.map((d: any) => d.name)} onChange={handleDoctorSelect}
              />
              <Pressable style={styles.addButton} onPress={() => setAddingDoctor(true)} accessibilityRole="button">
                <Text style={styles.addButtonText}>+ Agregar nuevo profesional</Text>
              </Pressable>
            </View>
            <TextField
              label="Nombre de la cita (opcional)"
              value={form.name}
              onChange={(value) => {
                nameTouched.current = true;
                form.setName(value);
              }}
              placeholder="Ej: Odontología · Dra. Ruiz"
              helper="Si lo dejas vacío, se completa solo."
            />
          </View>

          <View style={styles.card} onLayout={(e) => { sectionY.current.place = e.nativeEvent.layout.y; }}>
            <Text style={styles.cardTitle}>Modalidad y lugar</Text>
            <SegmentedControl
              accessibilityLabel="Modalidad"
              options={MODALITIES.map((mod) => ({ value: mod.value, label: mod.label }))}
              value={form.modality}
              onChange={(value) => form.setModality(value as (typeof MODALITIES)[number]["value"])}
            />
            {form.modality === "VIRTUAL" ? (
              <TextField
                label="Enlace de la videollamada"
                value={form.videoCallLink}
                onChange={form.setVideoCallLink}
                placeholder="https://meet.google.com/..."
                autoCapitalize="none"
                leadingIcon={<Video size={18} color={t.text.muted} />}
                error={form.fieldErrors.videoCallLink}
              />
            ) : (
              <TextField
                label="Lugar"
                value={form.location}
                onChange={form.setLocation}
                placeholder="Ej: Calle 123, Bogotá"
                leadingIcon={<MapPin size={18} color={t.text.muted} />}
                error={form.fieldErrors.location}
              />
            )}
            <TextField label="Clínica / Hospital / IPS (opcional)" value={form.clinic} onChange={form.setClinic} placeholder="Ej: Hospital San José" />
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Recordatorio</Text>
            <ChoiceChips
              options={[
                { value: "none", label: "Sin recordatorio" },
                { value: "60", label: "1 hora antes" },
                { value: "1440", label: "1 día antes" },
                { value: "2880", label: "2 días antes" },
              ]}
              value={reminderValue}
              onChange={(value) => {
                if (value === "none") {
                  form.setReminderMode("none");
                  return;
                }
                form.setReminderMode("before");
                form.setReminderOffsets([Number(value)]);
              }}
            />
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityState={{ expanded: showAdditionalDetails }}
            style={styles.moreRow}
            onPress={() => {
              const opening = !showAdditionalDetails;
              setShowAdditionalDetails(opening);
              if (opening) setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 150);
            }}
          >
            <View style={styles.collapsibleCopy}>
              <Text style={styles.moreTitle}>Más detalles (opcional)</Text>
              <Text style={styles.collapsibleHint}>Documentos para llevar, tratamiento, notas y costo</Text>
            </View>
            {showAdditionalDetails
              ? <ChevronUp size={18} strokeWidth={2.4} color={t.brand.solid} />
              : <ChevronDown size={18} strokeWidth={2.4} color={t.brand.solid} />}
          </Pressable>

          {showAdditionalDetails ? (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Más detalles</Text>

              <Text style={styles.label}>Para llevar a la cita</Text>
              <AddRow tone="document" icon={FileText} label="Agregar documentos" onPress={() => setShowPreDocPicker(true)} />
              {chipsFor(form.preDocumentIds as string[], docItems, form.setPreDocumentIds)}
              <AddRow tone="backpack" icon={Backpack} label="Agregar mochilas" onPress={() => setShowPreBpPicker(true)} />
              {chipsFor(form.preBackpackIds as string[], bpItems, form.setPreBackpackIds)}

              <View style={{ gap: 6 }}>
                <Text style={styles.label}>Tratamiento (opcional)</Text>
                <Pressable style={styles.selectBox} onPress={() => setShowTreatmentPicker(true)} accessibilityRole="button">
                  <Text style={styles.selectPlaceholder}>Agregar tratamiento</Text>
                  <ChevronDown size={18} color={t.text.muted} />
                </Pressable>
                {chipsFor(form.treatmentIds as string[], treatmentItems, form.setTreatmentIds)}
              </View>

              <TextField label="Notas (opcional)" value={form.notes} onChange={form.setNotes} placeholder="Ej: Llevar los exámenes anteriores" multiline numberOfLines={4} />
              <TextField label="Costo (opcional)" value={form.cost} onChange={form.setCost} placeholder="Ej: $ 45.000" keyboardType="number-pad" />

              {/* Campos que el mockup no muestra pero la cita ya guarda: se conservan al final. */}
              <SelectField
                label="Servicio (opcional)" value={form.service} placeholder="Seleccionar servicio"
                options={services} onChange={form.setService}
              />
              <SelectField
                label="Tipo de atención (opcional)" value={form.consultationType} placeholder="Seleccionar tipo de atención"
                options={consultationTypes} onChange={form.setConsultationType}
              />
              <Text style={styles.label}>Obtenidos después de la cita</Text>
              <AddRow tone="document" icon={FileText} label="Agregar documentos obtenidos" onPress={() => setShowPostDocPicker(true)} />
              {chipsFor(form.postDocumentIds as string[], docItems, form.setPostDocumentIds)}
              <AddRow tone="backpack" icon={Backpack} label="Agregar mochilas obtenidas" onPress={() => setShowPostBpPicker(true)} />
              {chipsFor(form.postBackpackIds as string[], bpItems, form.setPostBackpackIds)}
            </View>
          ) : null}

          {/* Error del servidor o de red (los de validación van en cada campo). */}
          {form.error && fieldErrorCount === 0 ? (
            <View style={styles.errorBanner} accessibilityRole="alert" accessibilityLiveRegion="polite">
              <AlertCircle size={18} color={t.status.errorFg} />
              <Text style={styles.errorText}>{form.error}</Text>
            </View>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>
      <BottomActionBar
        primary={{
          label: form.isEdit ? "Guardar cambios" : "Guardar cita",
          onPress: handleSave,
          loading: form.saving,
          loadingLabel: "Guardando…",
          disabled: form.saving,
        }}
      />

      {addingDoctor ? <DoctorSheet onSaved={handleDoctorSelect} onClose={() => setAddingDoctor(false)} /> : null}

      {askDiscard ? (
        <DiscardChangesDialog
          onKeep={() => setAskDiscard(false)}
          onDiscard={() => {
            allowLeave.current = true;
            setAskDiscard(false);
            nav.onClose();
          }}
        />
      ) : null}

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
    // MASTER §6–7: tarjeta radio 18, borde 1 px + canto inferior de 3 px
    card: {
      backgroundColor: t.surface.bgCard,
      borderRadius: radii.card,
      padding: spacing[4],
      gap: spacing[3],
      borderWidth: 1,
      borderBottomWidth: 4,
      borderColor: t.border.default,
    },
    cardHeader: { flexDirection: "row", alignItems: "center", gap: spacing[2] },
    // MASTER §5: título de tarjeta (H3) Nunito 800 16
    cardTitle: { fontSize: fontSize.md, fontFamily: nativeFont("heading", 800), color: t.text.primary },
    labelWithIcon: { flexDirection: "row", alignItems: "center", gap: spacing[1], marginBottom: spacing[2] },
    // formularios.md §2: etiqueta Nunito 800 13
    label: { fontSize: fontSize.sm, fontFamily: nativeFont("heading", 800), color: t.text.primary },
    labelStandalone: { marginBottom: spacing[2] },
    // MASTER §5: eyebrow Nunito 900 11, mayúsculas, .08em
    sectionSubtitle: {
      fontSize: fontSize.xs, fontFamily: nativeFont("heading", 900), color: t.text.secondary,
      textTransform: "uppercase", letterSpacing: 0.9, marginBottom: spacing[2],
    },
    separator: { height: 1, backgroundColor: t.border.default },
    addButton: { flexDirection: "row", alignItems: "center", gap: spacing[1], minHeight: 44, alignSelf: "flex-start" },
    addButtonText: { fontSize: 13, color: t.brand.text, fontFamily: nativeFont("heading", 800) },
    row: { flexDirection: "row", gap: spacing[2] },
    halfField: { flex: 1 },
    chipRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing[2], marginBottom: spacing[2] },
    // Kit `.more`: borde punteado, texto azul Nunito 800 14 y chevron azul
    moreRow: {
      flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: spacing[2],
      minHeight: 48, paddingVertical: spacing[3], paddingHorizontal: 14,
      borderRadius: radii.input, borderWidth: 1.5, borderStyle: "dashed", borderColor: t.border.default,
    },
    moreTitle: { fontSize: 14, fontFamily: nativeFont("heading", 800), color: t.brand.text },
    selectBox: {
      flexDirection: "row", alignItems: "center", gap: 10, minHeight: 48, paddingHorizontal: 14,
      borderRadius: radii.input, borderWidth: 1.5, borderColor: t.border.default, backgroundColor: t.surface.bg,
    },
    selectPlaceholder: { flex: 1, fontSize: 15, fontFamily: nativeFont("body", 400), color: t.text.muted },
    collapsibleCopy: { flex: 1, gap: spacing[1] },
    collapsibleHeaderText: { fontSize: fontSize.md, fontFamily: nativeFont("heading", 800), color: t.text.primary },
    collapsibleHint: { fontSize: fontSize.sm, fontFamily: nativeFont("body", 400), color: t.text.secondary },
    collapsibleContent: { gap: spacing[4] },
    errorBanner: {
      flexDirection: "row", alignItems: "center", gap: spacing[2],
      padding: spacing[3], borderRadius: radii.input,
      backgroundColor: t.status.errorBg, borderWidth: 1, borderColor: t.status.dangerBorder,
    },
    errorText: { flex: 1, color: t.status.errorFg, fontSize: 14, fontFamily: nativeFont("body", 500) },
    // Hoja de selección múltiple
    pickerList: { gap: spacing[2], marginTop: spacing[3] },
    pickerRow: {
      flexDirection: "row", alignItems: "center", gap: spacing[3],
      minHeight: 56, padding: spacing[3],
      borderRadius: radii.input, borderWidth: 1.5, borderColor: t.border.default,
      backgroundColor: t.surface.bgCard,
    },
    pickerRowSelected: { borderColor: t.brand.solid, backgroundColor: t.brand.tint },
    pickerRowCopy: { flex: 1, gap: 2 },
    pickerRowTitle: { fontSize: 14, color: t.text.primary, fontFamily: nativeFont("body", 600) },
    pickerRowSub: { fontSize: 13, color: t.text.secondary, fontFamily: nativeFont("body", 400) },
    // formularios.md: casilla de 24 px con radio 8
    checkbox: {
      width: 24, height: 24, borderRadius: radii.sm, borderWidth: 1.5, borderColor: t.border.default,
      alignItems: "center", justifyContent: "center", backgroundColor: t.surface.bgCard,
    },
    checkboxOn: { backgroundColor: t.brand.solid, borderColor: t.brand.solid },
    pickerFooter: { marginTop: spacing[4] },
    emptyText: { fontSize: 14, color: t.text.secondary, textAlign: "center", paddingVertical: spacing[6], fontFamily: nativeFont("body", 400) },
  });
