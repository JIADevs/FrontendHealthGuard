import { useMemo } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";
import Toast from "react-native-toast-message";
import { ArrowLeft, Activity } from "lucide-react-native";
import {
  Button,
  DatePicker,
  Spinner,
  TextField,
  Typography,
  fontSize,
  fontWeight,
  radii,
  spacing,
  useAppTheme,
} from "@helu/ui";
import type { ThemeContextValue } from "@helu/ui";
import {
  useTreatmentByIdQuery,
  useTreatmentFormCore,
  type TreatmentStatus,
} from "@helu/api/hooks";

const STATUS_OPTIONS: Array<{ value: TreatmentStatus; label: string }> = [
  { value: "ACTIVE", label: "Activo" },
  { value: "COMPLETED", label: "Completado" },
  { value: "INACTIVE", label: "Inactivo" },
];

export function TreatmentFormScreen() {
  const route = useRoute();
  const params = route.params as { id?: string } | undefined;

  if (params?.id) {
    return <EditGate id={params.id} />;
  }
  return <TreatmentFormContent />;
}

function EditGate({ id }: { id: string }) {
  const navigation = useNavigation();
  const t = useAppTheme();
  const styles = useMemo(() => makeStyles(t), [t]);
  const query = useTreatmentByIdQuery(id);

  if (query.isLoading || !query.data) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <ArrowLeft size={22} color={t.text.primary} />
          </TouchableOpacity>
          <Typography variant="h3" style={styles.headerTitle}>Editar tratamiento</Typography>
          <View style={styles.backBtn} />
        </View>
        <View style={styles.center}>
          {query.isLoading ? <Spinner size="lg" /> : <Text style={{ color: t.text.secondary }}>Tratamiento no encontrado.</Text>}
        </View>
      </SafeAreaView>
    );
  }

  return <TreatmentFormContent initial={query.data} />;
}

function TreatmentFormContent({ initial }: { initial?: any }) {
  const navigation = useNavigation();
  const t = useAppTheme();
  const styles = useMemo(() => makeStyles(t), [t]);

  const form = useTreatmentFormCore({
    initial,
    adapters: {
      onSaveSuccess: () => Toast.show({ type: "success", text1: initial ? "Tratamiento actualizado" : "Tratamiento creado" }),
      afterSave: () => navigation.goBack(),
    },
  });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <ArrowLeft size={22} color={t.text.primary} />
        </TouchableOpacity>
        <Typography variant="h3" style={styles.headerTitle}>
          {initial ? "Editar tratamiento" : "Nuevo tratamiento"}
        </Typography>
        <View style={styles.backBtn} />
      </View>

      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView style={styles.flex} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionIcon, { backgroundColor: t.brand.tint }]}>
                <Activity size={16} color={t.brand.fg} />
              </View>
              <Text style={styles.sectionTitle}>Informacion general</Text>
            </View>

            <TextField
              label="Nombre"
              value={form.name}
              onChange={form.setName}
              placeholder="Ej: Migrana, Alopecia, Dolor lumbar"
              required
            />
            <TextField
              label="Descripcion (opcional)"
              value={form.description}
              onChange={form.setDescription}
              placeholder="Notas generales del proceso"
              multiline
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Estado</Text>
            <View style={styles.chipRow}>
              {STATUS_OPTIONS.map((option) => {
                const selected = form.status === option.value;
                return (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.chip,
                      { borderColor: selected ? t.brand.fg : t.border.medium },
                      selected && { backgroundColor: t.brand.tint },
                    ]}
                    onPress={() => form.setStatus(option.value)}
                  >
                    <Text style={[styles.chipText, { color: selected ? t.brand.fg : t.text.secondary }]}>
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Periodo</Text>
            <DatePicker
              label="Fecha de inicio (opcional)"
              value={form.startDate}
              onChange={form.setStartDate}
            />
            {form.startDate ? (
              <TouchableOpacity onPress={() => form.setStartDate("")}>
                <Text style={styles.clearDate}>Quitar fecha de inicio</Text>
              </TouchableOpacity>
            ) : null}
            <DatePicker
              label="Fecha de fin (opcional)"
              value={form.endDate}
              onChange={form.setEndDate}
              minDate={form.startDate || undefined}
            />
            {form.endDate ? (
              <TouchableOpacity onPress={() => form.setEndDate("")}>
                <Text style={styles.clearDate}>Quitar fecha de fin</Text>
              </TouchableOpacity>
            ) : null}
          </View>

          {form.error && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{form.error}</Text>
            </View>
          )}
        </ScrollView>

        <View style={styles.footer}>
          <View style={styles.footerBtn}>
            <Button variant="secondary" onPress={() => navigation.goBack()} fullWidth>
              Cancelar
            </Button>
          </View>
          <View style={styles.footerBtn}>
            <Button onPress={form.handleSave} disabled={form.saving} loading={form.saving} fullWidth>
              Guardar
            </Button>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function makeStyles(t: ThemeContextValue) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: t.surface.bg },
    flex: { flex: 1 },
    center: { flex: 1, alignItems: "center", justifyContent: "center" },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: spacing[4],
      paddingVertical: spacing[3],
      backgroundColor: t.surface.bgCard,
      borderBottomWidth: 1,
      borderBottomColor: t.border.medium,
    },
    headerTitle: { flex: 1, textAlign: "center" },
    backBtn: { width: 40, alignItems: "center" },
    content: { padding: spacing[4], gap: spacing[4], paddingBottom: spacing[8] },
    section: {
      gap: spacing[3],
      backgroundColor: t.surface.bgCard,
      borderRadius: radii.lg,
      padding: spacing[4],
      borderWidth: 1,
      borderColor: t.border.light,
    },
    sectionHeader: { flexDirection: "row", alignItems: "center", gap: spacing[2] },
    sectionIcon: {
      width: 28,
      height: 28,
      borderRadius: radii.full,
      alignItems: "center",
      justifyContent: "center",
    },
    sectionTitle: {
      color: t.text.primary,
      fontSize: fontSize.base,
      fontWeight: fontWeight.semibold,
    },
    chipRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing[2] },
    chip: {
      paddingHorizontal: spacing[3],
      paddingVertical: spacing[2],
      borderRadius: radii.full,
      borderWidth: 1,
    },
    chipText: {
      fontSize: fontSize.sm,
      fontWeight: fontWeight.medium,
    },
    clearDate: {
      color: t.brand.fg,
      fontSize: fontSize.sm,
      fontWeight: fontWeight.medium,
    },
    errorBox: {
      padding: spacing[3],
      borderRadius: radii.sm,
      backgroundColor: t.status.errorBg,
    },
    errorText: {
      color: t.status.errorFg,
      fontSize: fontSize.sm,
    },
    footer: {
      flexDirection: "row",
      gap: spacing[3],
      padding: spacing[4],
      borderTopWidth: 1,
      borderTopColor: t.border.medium,
      backgroundColor: t.surface.bgCard,
    },
    footerBtn: { flex: 1 },
  });
}
