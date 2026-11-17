import { useEffect, useMemo, useState, type ComponentType } from "react";
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
  { label: "30 min", value: 30 },
  { label: "1 hora", value: 60 },
  { label: "2 horas", value: 120 },
];

interface PickerItem {
  id: string;
  label: string;
  sub?: string;
}

interface PickerModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  items: PickerItem[];
  selected: string[];
  onToggle: (id: string) => void;
  Icon: ComponentType<{ size?: number; color?: string }>;
}

function PickerModal({
  visible,
  onClose,
  title,
  items,
  selected,
  onToggle,
  Icon,
}: PickerModalProps) {
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
          <View style={styles.sheetDivider} />
          <View style={styles.searchRow}>
            <Search size={16} color={t.text.secondary} />
            <TextInput
              style={styles.searchInput}
              value={search}
              onChangeText={setSearch}
              placeholder="Buscar..."
              placeholderTextColor={t.text.muted}
            />
            {search.length > 0 ? (
              <TouchableOpacity onPress={() => setSearch("")}>
                <X size={16} color={t.text.secondary} />
              </TouchableOpacity>
            ) : null}
          </View>
          <ScrollView
            style={styles.list}
            contentContainerStyle={{ gap: spacing[2], paddingBottom: spacing[2] }}
          >
            {filtered.length === 0 ? (
              <Text style={styles.empty}>No hay elementos disponibles</Text>
            ) : (
              filtered.map((item) => {
                const isSelected = selected.includes(item.id);
                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[styles.pickerCard, isSelected && styles.pickerCardSelected]}
                    onPress={() => onToggle(item.id)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.pickerCardIcon}>
                      <Icon size={20} color={t.text.secondary} />
                    </View>
                    <View style={styles.pickerCardText}>
                      <Text style={styles.rowTitle} numberOfLines={1}>
                        {item.label}
                      </Text>
                      {item.sub ? (
                        <Text style={styles.rowSub} numberOfLines={1}>
                          {item.sub}
                        </Text>
                      ) : null}
                    </View>
                    <View style={[styles.addBtn, isSelected && styles.addBtnSelected]}>
                      {isSelected ? <X size={22} color="#fff" /> : <Plus size={22} color="#fff" />}
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

function SelectedLinkRow({
  label,
  onRemove,
  Icon,
}: {
  label: string;
  onRemove: () => void;
  Icon: ComponentType<{ size?: number; color?: string }>;
}) {
  const t = useAppTheme();
  const styles = useMemo(() => makeSelectedStyles(t), [t]);

  return (
    <View style={styles.row}>
      <View style={styles.iconWrap}>
        <Icon size={18} color={t.text.secondary} />
      </View>
      <Text style={styles.label} numberOfLines={1}>
        {label}
      </Text>
      <TouchableOpacity
        onPress={onRemove}
        accessibilityLabel={`Quitar ${label}`}
        hitSlop={8}
        style={styles.removeBtn}
      >
        <X size={18} color={t.text.secondary} />
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
      <SafeAreaView style={{ flex: 1, backgroundColor: t.surface.bgCard }} edges={["top", "bottom"]}>
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
        saveButtonText={form.isEdit ? "Guardar cambios" : "Guardar"}
        saving={form.saving}
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

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <ListTodo size={20} color={t.accent.backpackFg} />
              <Text style={styles.sectionTitle}>Información</Text>
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
              placeholder=""
              multiline
            />

            {!form.isEdit ? (
              <View style={styles.dateTimeStack}>
                <DatePicker
                  label="Fecha"
                  value={form.date}
                  onChange={form.setDate}
                  placeholder="Seleccionar fecha"
                  required
                />
                <TimePicker
                  label="Hora"
                  value={form.time}
                  onChange={form.setTime}
                  placeholder="Seleccionar hora"
                  required
                />
              </View>
            ) : null}
          </View>

          <View style={styles.divider} />

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Bell size={20} color={t.accent.backpackFg} />
              <Text style={styles.sectionTitle}>Avisarme antes</Text>
            </View>
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

          <View style={styles.divider} />

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <FileText size={20} color={t.accent.backpackFg} />
              <Text style={styles.sectionTitle}>Documentos</Text>
            </View>
            {form.documentIds.length > 0 ? (
              <View style={styles.linkList}>
                {form.documentIds.map((id) => (
                  <SelectedLinkRow
                    key={id}
                    Icon={FileText}
                    label={labelForId(id, docItems)}
                    onRemove={() => form.setDocumentIds(form.documentIds.filter((x) => x !== id))}
                  />
                ))}
              </View>
            ) : null}
            <TouchableOpacity style={styles.addButton} onPress={() => setShowDocPicker(true)}>
              <Plus size={18} color={t.brand.fg} />
              <Text style={styles.addButtonText}>Agregar documentos</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.divider} />

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Backpack size={20} color={t.accent.backpackFg} />
              <Text style={styles.sectionTitle}>Mochilas</Text>
            </View>
            {form.backpackIds.length > 0 ? (
              <View style={styles.linkList}>
                {form.backpackIds.map((id) => (
                  <SelectedLinkRow
                    key={id}
                    Icon={Backpack}
                    label={labelForId(id, bpItems)}
                    onRemove={() => form.setBackpackIds(form.backpackIds.filter((x) => x !== id))}
                  />
                ))}
              </View>
            ) : null}
            <TouchableOpacity style={styles.addButton} onPress={() => setShowBpPicker(true)}>
              <Plus size={18} color={t.brand.fg} />
              <Text style={styles.addButtonText}>Agregar mochilas</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <PickerModal
        visible={showDocPicker}
        onClose={() => setShowDocPicker(false)}
        title="Documentos"
        Icon={FileText}
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
        Icon={Backpack}
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
    container: { flex: 1, backgroundColor: t.surface.bgCard },
    content: { padding: spacing[4], gap: spacing[4], paddingBottom: spacing[10] },
    section: { gap: spacing[3] },
    sectionHeader: { flexDirection: "row", alignItems: "center", gap: spacing[2] },
    sectionTitle: { fontSize: fontSize.base, fontWeight: fontWeight.bold, color: t.text.primary },
    divider: { height: StyleSheet.hairlineWidth, backgroundColor: t.border.light },
    dateTimeStack: { gap: spacing[3] },
    pillRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing[2] },
    pill: {
      paddingHorizontal: spacing[3],
      paddingVertical: spacing[2],
      borderRadius: radii.full,
      borderWidth: 1,
      borderColor: t.border.medium,
      backgroundColor: t.surface.bgCard,
    },
    pillActive: { backgroundColor: t.accent.backpackBg, borderColor: t.accent.backpackFg },
    pillText: { fontSize: fontSize.sm, color: t.text.primary },
    pillTextActive: { color: t.accent.backpackFg, fontWeight: fontWeight.semibold },
    linkList: { gap: spacing[2] },
    addButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: spacing[2],
      paddingVertical: spacing[3],
      borderRadius: radii.md,
      borderWidth: 1,
      borderColor: t.border.medium,
      borderStyle: "dashed",
      backgroundColor: t.surface.bgCard,
    },
    addButtonText: { fontSize: fontSize.sm, color: t.brand.fg, fontWeight: fontWeight.medium },
    errorBox: {
      backgroundColor: t.status.errorBg,
      borderRadius: radii.md,
      padding: spacing[3],
    },
    errorText: { color: t.status.errorFg, fontSize: fontSize.sm },
  });
}

function makeSelectedStyles(t: ThemeContextValue) {
  return StyleSheet.create({
    row: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing[2],
      paddingVertical: spacing[2],
      paddingHorizontal: spacing[3],
      borderRadius: radii.md,
      borderWidth: 1,
      borderColor: t.border.light,
      backgroundColor: t.surface.bgCard,
      minHeight: 48,
    },
    iconWrap: {
      width: 32,
      height: 32,
      borderRadius: radii.sm,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: t.surface.bg,
      flexShrink: 0,
    },
    label: {
      flex: 1,
      flexShrink: 1,
      fontSize: fontSize.sm,
      fontWeight: fontWeight.medium,
      color: t.text.primary,
      minWidth: 0,
    },
    removeBtn: {
      width: 32,
      height: 32,
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0,
    },
  });
}

function makePickerStyles(t: ThemeContextValue) {
  return StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.5)",
      justifyContent: "flex-end",
    },
    sheet: {
      backgroundColor: t.surface.bg,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      maxHeight: "75%",
      paddingBottom: spacing[4],
    },
    sheetHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: spacing[4],
      paddingVertical: spacing[4],
    },
    sheetTitle: { fontSize: 17, fontWeight: fontWeight.semibold, color: t.text.primary },
    sheetDivider: { height: 1, backgroundColor: t.border.light, marginBottom: spacing[2] },
    searchRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing[2],
      marginHorizontal: spacing[4],
      marginBottom: spacing[3],
      borderWidth: 1,
      borderColor: t.border.medium,
      borderRadius: 10,
      paddingHorizontal: spacing[3],
      paddingVertical: spacing[2],
      backgroundColor: t.surface.bgCard,
    },
    searchInput: { flex: 1, fontSize: 15, color: t.text.primary, padding: 0 },
    list: { paddingHorizontal: spacing[4], maxHeight: 360 },
    empty: { textAlign: "center", color: t.text.secondary, padding: spacing[6] },
    pickerCard: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing[3],
      padding: spacing[3],
      borderRadius: 16,
      borderWidth: 1,
      borderColor: t.border.light,
      backgroundColor: t.surface.bgCard,
    },
    pickerCardSelected: {
      borderColor: t.brand.fg,
      backgroundColor: t.brand.bg,
    },
    pickerCardIcon: {
      width: 46,
      height: 46,
      borderRadius: 12,
      backgroundColor: t.surface.bg,
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0,
    },
    pickerCardText: { flex: 1, minWidth: 0 },
    rowTitle: { fontSize: 15, fontWeight: fontWeight.medium, color: t.text.primary },
    rowSub: { fontSize: 13, color: t.text.secondary, marginTop: 2 },
    addBtn: {
      width: 52,
      height: 52,
      borderRadius: 14,
      backgroundColor: t.brand.fg,
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0,
    },
    addBtnSelected: { backgroundColor: "#e53e3e" },
    closeBtn: {
      margin: spacing[4],
      padding: spacing[4],
      backgroundColor: t.surface.bgCard,
      borderRadius: 16,
      alignItems: "center",
      borderWidth: 1,
      borderColor: t.border.light,
    },
    closeBtnText: { fontSize: 16, fontWeight: fontWeight.semibold, color: t.text.primary },
  });
}
