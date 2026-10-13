import { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Modal,
  Pressable,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute, type RouteProp } from "@react-navigation/native";
import {
  useAppTheme,
  TextField,
  DatePicker,
  TimePicker,
  Spinner,
  spacing,
  fontSize,
  fontWeight,
  radii,
} from "@helu/ui";
import type { ThemeContextValue } from "@helu/ui";
import {
  useAgendaTaskByIdQuery,
  useDocumentsQuery,
  useBackpacksQuery,
} from "@helu/api/hooks";
import {
  Calendar,
  Clock,
  Bell,
  FileText,
  Backpack,
  ListTodo,
  Plus,
  X,
  Search,
} from "lucide-react-native";
import type { RootStackParamList } from "../navigation/RootNavigator";
import { FormHeader } from "../components/FormHeader";
import { useAgendaTaskForm } from "../hooks/useAgendaTaskForm";

type AgendaTaskFormRoute = RouteProp<RootStackParamList, "AgendaTaskForm">;

const REMINDER_PRESETS = [
  { label: "15 min", value: 15 },
  { label: "30 min", value: 30 },
  { label: "1 hora", value: 60 },
  { label: "2 horas", value: 120 },
];

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
  const styles = useMemo(() => makePickerStyles(t), [t]);
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
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>{title}</Text>
            <TouchableOpacity onPress={onClose} accessibilityLabel="Cerrar">
              <X size={22} color={t.text.primary} />
            </TouchableOpacity>
          </View>
          <View style={styles.searchRow}>
            <Search size={16} color={t.text.secondary} />
            <TextInput
              style={styles.searchInput}
              value={search}
              onChangeText={setSearch}
              placeholder="Buscar..."
              placeholderTextColor={t.text.muted}
            />
          </View>
          <ScrollView style={styles.list} contentContainerStyle={{ gap: spacing[2], paddingBottom: spacing[2] }}>
            {filtered.length === 0 ? (
              <Text style={styles.empty}>No hay elementos disponibles</Text>
            ) : (
              filtered.map((item) => {
                const isSelected = selected.includes(item.id);
                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[styles.row, isSelected && styles.rowSelected]}
                    onPress={() => onToggle(item.id)}
                    activeOpacity={0.7}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={styles.rowTitle} numberOfLines={1}>
                        {item.label}
                      </Text>
                      {item.sub ? <Text style={styles.rowSub}>{item.sub}</Text> : null}
                    </View>
                    <View style={[styles.addBtn, isSelected && styles.addBtnSelected]}>
                      {isSelected ? <X size={18} color="#fff" /> : <Plus size={18} color="#fff" />}
                    </View>
                  </TouchableOpacity>
                );
              })
            )}
          </ScrollView>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Text style={styles.closeBtnText}>Cerrar</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function ChipTag({ label, onRemove }: { label: string; onRemove: () => void }) {
  const t = useAppTheme();
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        backgroundColor: t.accent.backpackBg,
        borderRadius: 12,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderWidth: 1,
        borderColor: t.accent.backpackFg,
      }}
    >
      <Text style={{ fontSize: 13, color: t.accent.backpackFg }}>{label}</Text>
      <TouchableOpacity onPress={onRemove} accessibilityLabel={`Quitar ${label}`}>
        <X size={13} color={t.accent.backpackFg} />
      </TouchableOpacity>
    </View>
  );
}

export function AgendaTaskFormScreen() {
  const route = useRoute<AgendaTaskFormRoute>();
  const id = route.params?.id;

  if (id) {
    return <AgendaTaskFormEditor id={id} />;
  }
  return <AgendaTaskFormBody task={null} />;
}

function AgendaTaskFormEditor({ id }: { id: string }) {
  const t = useAppTheme();
  const { data: task, isLoading } = useAgendaTaskByIdQuery(id);

  if (isLoading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: t.surface.bg }} edges={["top", "bottom"]}>
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <Spinner size="lg" />
        </View>
      </SafeAreaView>
    );
  }

  return <AgendaTaskFormBody task={task ?? null} />;
}

function AgendaTaskFormBody({ task }: { task: Parameters<typeof useAgendaTaskForm>[0]["initial"] }) {
  const t = useAppTheme();
  const styles = useMemo(() => makeStyles(t), [t]);
  const navigation = useNavigation();
  const form = useAgendaTaskForm({
    initial: task,
    onClose: () => navigation.goBack(),
  });

  const [showDocPicker, setShowDocPicker] = useState(false);
  const [showBpPicker, setShowBpPicker] = useState(false);

  const documentsQuery = useDocumentsQuery("", 1, 100);
  const backpacksQuery = useBackpacksQuery("", 100);
  const documents = documentsQuery.data?.items ?? [];
  const backpacks = backpacksQuery.data?.items ?? [];

  const docItems = documents.map((d) => ({ id: d.id, label: d.title, sub: d.format ?? undefined }));
  const bpItems = backpacks.map((b) => ({
    id: b.id,
    label: b.name,
    sub: b.description ?? undefined,
  }));

  function labelForId(id: string, list: { id: string; label: string }[]) {
    return list.find((i) => i.id === id)?.label ?? id.slice(0, 8);
  }

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <FormHeader
        title={task ? "Editar tarea" : "Nueva tarea"}
        onSave={form.handleSave}
        saveButtonText={form.saving ? "Guardando…" : form.isEdit ? "Guardar cambios" : "Guardar"}
      />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {form.error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{form.error}</Text>
            </View>
          ) : null}

          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <ListTodo size={20} color={t.accent.backpackFg} />
              <Text style={styles.cardTitle}>Información</Text>
            </View>

            <TextField
              label="Título *"
              value={form.title}
              onChange={form.setTitle}
              placeholder="Ej: Recoger resultados de laboratorio"
            />
            <TextField
              label="Descripción"
              value={form.description}
              onChange={form.setDescription}
              placeholder="Opcional"
              multiline
            />

            {!form.isEdit ? (
              <View style={styles.row}>
                <View style={styles.half}>
                  <View style={styles.labelRow}>
                    <Calendar size={16} color={t.text.secondary} />
                    <Text style={styles.label}>Fecha *</Text>
                  </View>
                  <DatePicker
                    label=""
                    value={form.date}
                    onChange={form.setDate}
                    placeholder="Fecha"
                    required
                  />
                </View>
                <View style={styles.half}>
                  <View style={styles.labelRow}>
                    <Clock size={16} color={t.text.secondary} />
                    <Text style={styles.label}>Hora *</Text>
                  </View>
                  <TimePicker
                    label=""
                    value={form.time}
                    onChange={form.setTime}
                    placeholder="Hora"
                    required
                  />
                </View>
              </View>
            ) : (
              <Text style={styles.hint}>
                Para cambiar la fecha u hora usá Reagendar desde el detalle.
              </Text>
            )}
          </View>

          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Bell size={20} color={t.accent.backpackFg} />
              <Text style={styles.cardTitle}>Avisarme antes</Text>
            </View>
            <Text style={styles.hint}>Siempre hay al menos un aviso (por defecto 15 min).</Text>
            <View style={styles.pillRow}>
              {REMINDER_PRESETS.map(({ label, value }) => {
                const selected = form.reminderOffsets.includes(value);
                return (
                  <TouchableOpacity
                    key={value}
                    style={[styles.pill, selected && styles.pillActive]}
                    onPress={() => form.toggleReminderOffset(value)}
                  >
                    <Text style={[styles.pillText, selected && styles.pillTextActive]}>{label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <FileText size={20} color={t.accent.backpackFg} />
              <Text style={styles.cardTitle}>Documentos (opcional)</Text>
            </View>
            {form.documentIds.length > 0 ? (
              <View style={styles.chipWrap}>
                {form.documentIds.map((id) => (
                  <ChipTag
                    key={id}
                    label={labelForId(id, docItems)}
                    onRemove={() => form.setDocumentIds(form.documentIds.filter((x) => x !== id))}
                  />
                ))}
              </View>
            ) : null}
            <TouchableOpacity style={styles.addLink} onPress={() => setShowDocPicker(true)}>
              <Plus size={16} color={t.brand.fg} />
              <Text style={styles.addLinkText}>Agregar documento</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Backpack size={20} color={t.accent.backpackFg} />
              <Text style={styles.cardTitle}>Mochilas (opcional)</Text>
            </View>
            {form.backpackIds.length > 0 ? (
              <View style={styles.chipWrap}>
                {form.backpackIds.map((id) => (
                  <ChipTag
                    key={id}
                    label={labelForId(id, bpItems)}
                    onRemove={() => form.setBackpackIds(form.backpackIds.filter((x) => x !== id))}
                  />
                ))}
              </View>
            ) : null}
            <TouchableOpacity style={styles.addLink} onPress={() => setShowBpPicker(true)}>
              <Plus size={16} color={t.brand.fg} />
              <Text style={styles.addLinkText}>Agregar mochila</Text>
            </TouchableOpacity>
          </View>

          {form.saving ? (
            <View style={styles.savingRow}>
              <ActivityIndicator color={t.brand.fg} />
              <Text style={styles.hint}>Guardando…</Text>
            </View>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>

      <PickerModal
        visible={showDocPicker}
        onClose={() => setShowDocPicker(false)}
        title="Documentos"
        items={docItems}
        selected={form.documentIds}
        onToggle={(id) =>
          form.setDocumentIds(
            form.documentIds.includes(id)
              ? form.documentIds.filter((x) => x !== id)
              : [...form.documentIds, id],
          )
        }
      />
      <PickerModal
        visible={showBpPicker}
        onClose={() => setShowBpPicker(false)}
        title="Mochilas"
        items={bpItems}
        selected={form.backpackIds}
        onToggle={(id) =>
          form.setBackpackIds(
            form.backpackIds.includes(id)
              ? form.backpackIds.filter((x) => x !== id)
              : [...form.backpackIds, id],
          )
        }
      />
    </SafeAreaView>
  );
}

function makeStyles(t: ThemeContextValue) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: t.surface.bg },
    content: { padding: spacing[4], gap: spacing[4], paddingBottom: spacing[10] },
    card: {
      backgroundColor: t.surface.bgCard,
      borderRadius: radii.lg,
      padding: spacing[4],
      gap: spacing[3],
    },
    cardHeader: { flexDirection: "row", alignItems: "center", gap: spacing[2] },
    cardTitle: { fontSize: fontSize.base, fontWeight: fontWeight.bold, color: t.text.primary },
    row: { flexDirection: "row", gap: spacing[3] },
    half: { flex: 1 },
    labelRow: { flexDirection: "row", alignItems: "center", gap: spacing[1], marginBottom: spacing[1] },
    label: { fontSize: fontSize.sm, color: t.text.secondary, fontWeight: fontWeight.medium },
    hint: { fontSize: fontSize.xs, color: t.text.secondary },
    pillRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing[2] },
    pill: {
      paddingHorizontal: spacing[3],
      paddingVertical: spacing[2],
      borderRadius: radii.full,
      borderWidth: 1,
      borderColor: t.border.medium,
      backgroundColor: t.surface.bg,
    },
    pillActive: { backgroundColor: t.accent.backpackBg, borderColor: t.accent.backpackFg },
    pillText: { fontSize: fontSize.sm, color: t.text.primary },
    pillTextActive: { color: t.accent.backpackFg, fontWeight: fontWeight.semibold },
    chipWrap: { flexDirection: "row", flexWrap: "wrap", gap: spacing[2] },
    addLink: { flexDirection: "row", alignItems: "center", gap: spacing[1] },
    addLinkText: { fontSize: fontSize.sm, color: t.brand.fg, fontWeight: fontWeight.medium },
    errorBox: {
      backgroundColor: t.status.errorBg,
      borderRadius: radii.md,
      padding: spacing[3],
    },
    errorText: { color: t.status.errorFg, fontSize: fontSize.sm },
    savingRow: { flexDirection: "row", alignItems: "center", gap: spacing[2] },
  });
}

function makePickerStyles(t: ThemeContextValue) {
  return StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.45)",
      justifyContent: "flex-end",
    },
    sheet: {
      backgroundColor: t.surface.bgCard,
      borderTopLeftRadius: radii.xl,
      borderTopRightRadius: radii.xl,
      maxHeight: "75%",
      padding: spacing[4],
      gap: spacing[3],
    },
    sheetHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    sheetTitle: { fontSize: fontSize.lg, fontWeight: fontWeight.bold, color: t.text.primary },
    searchRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing[2],
      borderWidth: 1,
      borderColor: t.border.light,
      borderRadius: radii.md,
      paddingHorizontal: spacing[3],
      paddingVertical: spacing[2],
    },
    searchInput: { flex: 1, fontSize: fontSize.sm, color: t.text.primary, padding: 0 },
    list: { maxHeight: 320 },
    empty: { textAlign: "center", color: t.text.secondary, padding: spacing[4] },
    row: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing[3],
      padding: spacing[3],
      borderRadius: radii.md,
      borderWidth: 1,
      borderColor: t.border.light,
    },
    rowSelected: { borderColor: t.accent.backpackFg, backgroundColor: t.accent.backpackBg },
    rowTitle: { fontSize: fontSize.sm, fontWeight: fontWeight.medium, color: t.text.primary },
    rowSub: { fontSize: fontSize.xs, color: t.text.secondary, marginTop: 2 },
    addBtn: {
      width: 32,
      height: 32,
      borderRadius: radii.full,
      backgroundColor: t.brand.fg,
      alignItems: "center",
      justifyContent: "center",
    },
    addBtnSelected: { backgroundColor: t.accent.backpackFg },
    closeBtn: {
      backgroundColor: t.surface.bg,
      borderRadius: radii.md,
      paddingVertical: spacing[3],
      alignItems: "center",
    },
    closeBtnText: { fontWeight: fontWeight.semibold, color: t.text.primary },
  });
}
