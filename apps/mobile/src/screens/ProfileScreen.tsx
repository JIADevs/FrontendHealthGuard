import { useState, useMemo } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useProfileQuery } from "@healthguard/api/hooks";
import { useProfileForm } from "../hooks/useProfileForm";
import {
  colors,
  radii,
  spacing,
  fontSize,
  fontWeight,
  shadows,
  useAppTheme,
} from "@healthguard/ui";
import type { ThemeContextValue } from "@healthguard/ui";
import { Save, User, Phone, Heart, Shield, ChevronDown } from "lucide-react-native";

const GENDER_OPTIONS = [
  { value: "", label: "Sin especificar" },
  { value: "M", label: "Masculino" },
  { value: "F", label: "Femenino" },
  { value: "O", label: "Otro" },
];

const BLOOD_TYPE_OPTIONS = ["", "A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map(
  (bt) => ({ value: bt, label: bt || "Sin especificar" }),
);

export function ProfileScreen() {
  const t = useAppTheme();
  const styles = useMemo(() => makeStyles(t), [t]);

  const profile = useProfileQuery();
  const form = useProfileForm();

  const initials =
    profile.data?.name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() ??
    profile.data?.email?.[0]?.toUpperCase() ??
    "U";

  if (form.loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color={colors.primary[500]} style={{ marginTop: 48 }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {/* Avatar card */}
        <View style={styles.avatarCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.avatarName}>{profile.data?.name || "Sin nombre"}</Text>
            <Text style={styles.avatarEmail}>{profile.data?.email}</Text>
          </View>
        </View>

        {/* Información personal */}
        <SectionHeader icon={<User size={16} color={t.text.secondary} />} title="Información Personal" />
        <View style={styles.card}>
          <Field label="Nombre completo" value={form.name} onChangeText={form.setName} placeholder="Tu nombre" styles={styles} />
          <Field label="Documento de identidad" value={form.documentId} onChangeText={form.setDocumentId} placeholder="Cédula / Pasaporte" styles={styles} />
          <Field label="Fecha de nacimiento" value={form.birthDate} onChangeText={form.setBirthDate} placeholder="YYYY-MM-DD" styles={styles} />
          <PickerField label="Género" value={form.gender} options={GENDER_OPTIONS} onSelect={form.setGender} styles={styles} t={t} last />
        </View>

        {/* Contacto */}
        <SectionHeader icon={<Phone size={16} color={t.text.secondary} />} title="Contacto" />
        <View style={styles.card}>
          <Field label="Teléfono" value={form.phone} onChangeText={form.setPhone} placeholder="+57 300 000 0000" keyboardType="phone-pad" styles={styles} />
          <Field label="Dirección" value={form.address} onChangeText={form.setAddress} placeholder="Ciudad, dirección" styles={styles} last />
        </View>

        {/* Información médica */}
        <SectionHeader icon={<Heart size={16} color={t.text.secondary} />} title="Información Médica" />
        <View style={styles.card}>
          <PickerField label="Tipo de sangre" value={form.bloodType} options={BLOOD_TYPE_OPTIONS} onSelect={form.setBloodType} styles={styles} t={t} last />
        </View>

        {/* Contacto de emergencia */}
        <SectionHeader icon={<Shield size={16} color={t.text.secondary} />} title="Contacto de Emergencia" />
        <View style={styles.card}>
          <Field label="Nombre" value={form.emergencyContactName} onChangeText={form.setEmergencyContactName} placeholder="Nombre del contacto" styles={styles} />
          <Field label="Teléfono" value={form.emergencyContactPhone} onChangeText={form.setEmergencyContactPhone} placeholder="+57 300 000 0000" keyboardType="phone-pad" styles={styles} last />
        </View>

        {/* Save button */}
        <TouchableOpacity
          style={[styles.saveBtn, form.saving && styles.saveBtnDisabled]}
          onPress={form.handleSave}
          disabled={form.saving}
        >
          {form.saving
            ? <ActivityIndicator size="small" color={colors.white} />
            : <Save size={18} color={colors.white} />}
          <Text style={styles.saveBtnText}>
            {form.saving ? "Guardando..." : "Guardar Cambios"}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── helpers ──────────────────────────────────────────────────────────────────

function SectionHeader({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 8, marginTop: 4 }}>
      {icon}
      <Text style={{ fontSize: fontSize.xs, fontWeight: fontWeight.semibold, color: "gray", textTransform: "uppercase", letterSpacing: 0.5 }}>
        {title}
      </Text>
    </View>
  );
}

type StylesType = ReturnType<typeof makeStyles>;

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  styles,
  last,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  keyboardType?: "default" | "phone-pad" | "email-address";
  styles: StylesType;
  last?: boolean;
}) {
  return (
    <View style={[styles.fieldRow, last && styles.fieldRowLast]}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        style={styles.fieldInput}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="gray"
        keyboardType={keyboardType ?? "default"}
        autoCapitalize="none"
      />
    </View>
  );
}

function PickerField({
  label,
  value,
  options,
  onSelect,
  styles,
  t,
  last,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onSelect: (v: string) => void;
  styles: StylesType;
  t: ThemeContextValue;
  last?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.value === value)?.label ?? "Sin especificar";

  return (
    <View style={[styles.fieldRow, last && styles.fieldRowLast]}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TouchableOpacity style={styles.pickerTrigger} onPress={() => setOpen(!open)}>
        <Text style={[styles.fieldInput, { flex: 1, paddingVertical: 0, borderWidth: 0 }]}>{selected}</Text>
        <ChevronDown size={16} color={t.text.secondary} />
      </TouchableOpacity>
      {open && (
        <View style={[styles.pickerDropdown, { backgroundColor: t.surface.bgCard }]}>
          {options.map((opt) => (
            <TouchableOpacity
              key={opt.value}
              style={[styles.pickerOption, opt.value === value && { backgroundColor: colors.primary[50] }]}
              onPress={() => { onSelect(opt.value); setOpen(false); }}
            >
              <Text style={[
                styles.pickerOptionText,
                opt.value === value && { color: colors.primary[600], fontWeight: fontWeight.semibold },
              ]}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

function makeStyles(t: ThemeContextValue) {
  return StyleSheet.create({
    container:        { flex: 1, backgroundColor: t.surface.bg },
    content:          { padding: spacing[4], gap: spacing[3] },
    avatarCard:       { flexDirection: "row", alignItems: "center", gap: spacing[4], backgroundColor: t.surface.bgCard, padding: spacing[4], borderRadius: radii.lg, ...shadows.sm },
    avatar:           { width: 56, height: 56, borderRadius: 28, backgroundColor: colors.primary[500], alignItems: "center", justifyContent: "center" },
    avatarText:       { color: colors.white, fontSize: fontSize.xl, fontWeight: fontWeight.bold },
    avatarName:       { fontSize: fontSize.lg, fontWeight: fontWeight.bold, color: t.text.primary },
    avatarEmail:      { fontSize: fontSize.sm, color: t.text.secondary, marginTop: 2 },
    card:             { backgroundColor: t.surface.bgCard, borderRadius: radii.lg, ...shadows.sm, overflow: "hidden" },
    fieldRow:         { paddingHorizontal: spacing[4], paddingVertical: spacing[3], borderBottomWidth: 1, borderBottomColor: t.border.light },
    fieldRowLast:     { borderBottomWidth: 0 },
    fieldLabel:       { fontSize: fontSize.xs, color: t.text.secondary, fontWeight: fontWeight.medium, marginBottom: 4 },
    fieldInput:       { fontSize: fontSize.base, color: t.text.primary },
    pickerTrigger:    { flexDirection: "row", alignItems: "center" },
    pickerDropdown:   { marginTop: spacing[2], borderRadius: radii.md, borderWidth: 1, borderColor: t.border.medium, overflow: "hidden" },
    pickerOption:     { paddingHorizontal: spacing[4], paddingVertical: spacing[3] },
    pickerOptionText: { fontSize: fontSize.base, color: t.text.primary },
    saveBtn:          { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: spacing[2], backgroundColor: colors.primary[500], borderRadius: radii.md, padding: spacing[4], marginTop: spacing[2] },
    saveBtnDisabled:  { opacity: 0.7 },
    saveBtnText:      { color: colors.white, fontWeight: fontWeight.semibold, fontSize: fontSize.base },
  });
}
