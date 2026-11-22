import { Fragment, useEffect, useMemo, useRef, useState, type ComponentRef } from "react";
import { AccessibilityInfo, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Backpack, FileText } from "lucide-react-native";
import {
  BOTTOM_ACTION_BAR_HEIGHT,
  BottomActionBar,
  ChoiceChips,
  DatePicker,
  DiscardChangesDialog,
  Skeleton,
  SkeletonGroup,
  TextField,
  TimePicker,
  formatClock,
  formatShortDay,
  nativeFont,
  radii,
  spacing,
  useAppTheme,
  useSkeletonVisible,
  type ThemeContextValue,
} from "@helu/ui";
import { useAgendaTaskByIdQuery, useAgendaTaskFormCore, useBackpacksQuery, useDocumentsQuery } from "@helu/api/hooks";
import type { AgendaTask } from "@helu/api";
import { ScreenHeader } from "../ScreenHeader";
import { SkeletonChips, SkeletonField } from "../SkeletonPieces";
import { notify } from "../../lib/notify";
import { haptics } from "../../lib/haptics";
import { FormCard } from "./FormCard";
import { AddRow, ChipTag, PickerModal } from "./LinkPicker";
import type { SubscribeBeforeLeave } from "./AppointmentForm";

/** Mockup «Nueva tarea»: «Avisarme antes». The API needs at least one reminder, so there is no «Sin avisos». */
const REMINDERS = [
  { value: "15", label: "15 min" },
  { value: "60", label: "1 hora" },
  { value: "1440", label: "1 día" },
];

export interface AgendaTaskFormProps {
  /** Set to edit an existing task */
  id?: string;
  /** Leaves the form (after saving, or after confirming «Descartar») */
  onClose: () => void;
  subscribeBeforeLeave: SubscribeBeforeLeave;
}

export function AgendaTaskForm({ id, ...rest }: AgendaTaskFormProps) {
  if (id) return <EditGate id={id} {...rest} />;
  return <AgendaTaskFormBody task={null} {...rest} />;
}

function EditGate({ id, ...rest }: AgendaTaskFormProps & { id: string }) {
  const t = useAppTheme();
  const { data: task, isLoading } = useAgendaTaskByIdQuery(id);
  const showSkeleton = useSkeletonVisible(isLoading);
  if (showSkeleton || !task) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: t.surface.bg }} edges={["top"]}>
        <ScreenHeader title="Editar tarea" />
        {showSkeleton ? (
          <>
            {/* §6c: the same cards and labels as «Editar tarea»; only the values are blocks. */}
            <SkeletonGroup label="Cargando la tarea" style={{ flex: 1, overflow: "hidden", padding: spacing[4], gap: spacing[4] }}>
              <FormCard title="Tarea">
                <SkeletonField label="Título" />
                <SkeletonField label="Descripción (opcional)" height={84} />
                <Skeleton height={76} radius={radii.input} />
              </FormCard>
              <FormCard title="Avisarme antes">
                <SkeletonChips widths={[84, 72, 92]} />
              </FormCard>
              <FormCard title="Para llevar" hint="(opcional)">
                {/* Fixed rows, not server data: real from the start. */}
                <AddRow tone="document" icon={FileText} label="Agregar documentos" onPress={() => undefined} />
                <AddRow tone="backpack" icon={Backpack} label="Agregar mochilas" onPress={() => undefined} />
              </FormCard>
            </SkeletonGroup>
            <BottomActionBar primary={{ label: "Guardar cambios", onPress: () => undefined, disabled: true }} />
          </>
        ) : (
          <Text style={{ padding: spacing[6], textAlign: "center", color: t.text.secondary }}>
            No encontramos esta tarea. Puede que la hayan eliminado.
          </Text>
        )}
      </SafeAreaView>
    );
  }
  return <AgendaTaskFormBody task={task} {...rest} />;
}

function snapshot(f: { title: string; description: string; date: string; time: string; reminderOffsets: number[]; documentIds: string[]; backpackIds: string[] }) {
  return JSON.stringify([f.title, f.description, f.date, f.time, f.reminderOffsets, f.documentIds, f.backpackIds]);
}

/**
 * Mockup «Nueva tarea»: «Tarea» (título, descripción, fecha y hora), «Avisarme antes» and «Para llevar
 * (opcional)», with «Guardar tarea» in the fixed bar. Editing keeps the date: it changes with «Reprogramar».
 */
function AgendaTaskFormBody({ task, onClose, subscribeBeforeLeave }: Omit<AgendaTaskFormProps, "id"> & { task: AgendaTask | null }) {
  const t = useAppTheme();
  const styles = useMemo(() => makeStyles(t), [t]);
  const insets = useSafeAreaInsets();
  const isEdit = Boolean(task);

  const allowLeave = useRef(false);
  const leave = () => {
    allowLeave.current = true;
    onClose();
  };
  const savedTitle = useRef("");
  const form = useAgendaTaskFormCore({
    initial: task,
    adapters: {
      onSaveSuccess: () => {
        haptics.success();
        notify({ message: isEdit ? "Tarea actualizada" : "Tarea creada", description: savedTitle.current });
      },
      afterSave: leave,
    },
  });
  savedTitle.current = form.title.trim();

  // ── «¿Descartar los cambios?» (formularios.md §7) ──
  const [askDiscard, setAskDiscard] = useState(false);
  const baseline = useRef<string | null>(null);
  if (baseline.current === null) baseline.current = snapshot(form);
  const dirty = snapshot(form) !== baseline.current;
  useEffect(
    () =>
      subscribeBeforeLeave((prevent) => {
        if (!dirty || allowLeave.current) return;
        prevent();
        setAskDiscard(true);
      }),
    [subscribeBeforeLeave, dirty],
  );

  // ── Errors under each field after the first attempt (formularios.md §6) ──
  const [submitted, setSubmitted] = useState(false);
  const errors = {
    title: submitted && !form.title.trim() ? "Escribe el título de la tarea." : undefined,
    date: submitted && !isEdit && !form.date ? "Elige la fecha." : undefined,
    time: submitted && !isEdit && !form.time ? "Elige la hora." : undefined,
  };
  const titleRef = useRef<ComponentRef<typeof TextInput>>(null);
  const scrollRef = useRef<ComponentRef<typeof ScrollView>>(null);

  const handleSave = () => {
    setSubmitted(true);
    const count = [!form.title.trim(), !isEdit && !form.date, !isEdit && !form.time].filter(Boolean).length;
    if (count > 0) {
      haptics.warning();
      scrollRef.current?.scrollTo({ y: 0, animated: true });
      if (!form.title.trim()) setTimeout(() => titleRef.current?.focus(), 300);
      AccessibilityInfo.announceForAccessibility(count === 1 ? "Revisa 1 campo" : `Revisa ${count} campos`);
      return;
    }
    form.handleSave();
  };

  // ── «No se pudo guardar» ──
  useEffect(() => {
    if (!form.error) return;
    haptics.error();
    notify({
      tone: "error",
      message: "No se pudo guardar la tarea",
      description: "Revisa tu conexión e intenta de nuevo.",
      action: { label: "Reintentar", onPress: handleSave },
    });
    form.clearError();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.error]);

  // ── Para llevar ──
  const [picker, setPicker] = useState<"docs" | "packs" | null>(null);
  const docItems = (useDocumentsQuery("", 1, 100).data?.items ?? []).map((d) => ({ id: d.id, label: d.title }));
  const packItems = (useBackpacksQuery("", 100).data?.items ?? []).map((b) => ({ id: b.id, label: b.name }));
  const labelFor = (id: string, list: { id: string; label: string }[]) => list.find((i) => i.id === id)?.label ?? "…";
  const toggle = (ids: string[], id: string) => (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]);

  const reminderValue = String(form.reminderOffsets[0] ?? 15);
  const reminderOptions = REMINDERS.some((r) => r.value === reminderValue)
    ? REMINDERS
    : [...REMINDERS, { value: reminderValue, label: `${reminderValue} min` }];

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScreenHeader title={isEdit ? "Editar tarea" : "Nueva tarea"} />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0}
      >
        <ScrollView
          ref={scrollRef}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[styles.content, { paddingBottom: BOTTOM_ACTION_BAR_HEIGHT + insets.bottom + spacing[8] }]}
        >
          <FormCard title="Tarea">
            <TextField
              label="Título"
              value={form.title}
              onChange={form.setTitle}
              placeholder="Ej: Recoger resultados de laboratorio"
              error={errors.title}
              inputRef={titleRef}
              autoFocus={!isEdit}
            />
            <TextField
              label="Descripción (opcional)"
              value={form.description}
              onChange={form.setDescription}
              placeholder="Ej: Llevar carné y orden médica"
              multiline
              numberOfLines={3}
            />
            {isEdit ? (
              <View style={styles.readonly}>
                <Text style={styles.readonlyLabel}>Fecha y hora</Text>
                <Text style={styles.readonlyValue}>{`${formatShortDay(form.date)} · ${formatClock(form.time)}`}</Text>
                <Text style={styles.readonlyHint}>Para cambiarlas, usa «Reprogramar» en la tarea.</Text>
              </View>
            ) : (
              <View style={styles.row}>
                <View style={styles.half}>
                  <DatePicker label="Fecha" value={form.date} onChange={form.setDate} placeholder="Elige la fecha" error={errors.date} />
                </View>
                <View style={styles.half}>
                  <TimePicker label="Hora" value={form.time} onChange={form.setTime} placeholder="Elige la hora" error={errors.time} />
                </View>
              </View>
            )}
          </FormCard>

          <FormCard title="Avisarme antes">
            <ChoiceChips options={reminderOptions} value={reminderValue} onChange={(v) => form.setReminderOffsets([Number(v)])} />
          </FormCard>

          <FormCard title="Para llevar" hint="(opcional)">
            <AddRow tone="document" icon={FileText} label="Agregar documentos" onPress={() => setPicker("docs")} />
            {form.documentIds.length > 0 ? (
              <View style={styles.chips}>
                {form.documentIds.map((id) => (
                  <Fragment key={id}>
                    <ChipTag label={labelFor(id, docItems)} onRemove={() => form.setDocumentIds(toggle(form.documentIds, id))} />
                  </Fragment>
                ))}
              </View>
            ) : null}
            <AddRow tone="backpack" icon={Backpack} label="Agregar mochilas" onPress={() => setPicker("packs")} />
            {form.backpackIds.length > 0 ? (
              <View style={styles.chips}>
                {form.backpackIds.map((id) => (
                  <Fragment key={id}>
                    <ChipTag label={labelFor(id, packItems)} onRemove={() => form.setBackpackIds(toggle(form.backpackIds, id))} />
                  </Fragment>
                ))}
              </View>
            ) : null}
          </FormCard>
        </ScrollView>
      </KeyboardAvoidingView>

      <BottomActionBar
        primary={{
          label: isEdit ? "Guardar cambios" : "Guardar tarea",
          onPress: handleSave,
          loading: form.saving,
          loadingLabel: "Guardando…",
          disabled: form.saving,
        }}
      />

      <PickerModal
        visible={picker === "docs"}
        onClose={() => setPicker(null)}
        title="Documentos para llevar"
        items={docItems}
        selected={form.documentIds}
        onToggle={(id) => form.setDocumentIds(toggle(form.documentIds, id))}
      />
      <PickerModal
        visible={picker === "packs"}
        onClose={() => setPicker(null)}
        title="Mochilas para llevar"
        items={packItems}
        selected={form.backpackIds}
        onToggle={(id) => form.setBackpackIds(toggle(form.backpackIds, id))}
      />

      {askDiscard ? (
        <DiscardChangesDialog
          onKeep={() => setAskDiscard(false)}
          onDiscard={() => {
            setAskDiscard(false);
            leave();
          }}
        />
      ) : null}
    </SafeAreaView>
  );
}

function makeStyles(t: ThemeContextValue) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: t.surface.bg },
    content: { padding: spacing[4], gap: spacing[4] },
    row: { flexDirection: "row", gap: spacing[2] },
    half: { flex: 1 },
    chips: { flexDirection: "row", flexWrap: "wrap", gap: spacing[2] },
    readonly: { gap: 2, padding: spacing[3], borderRadius: radii.input, backgroundColor: t.surface.muted },
    readonlyLabel: { fontSize: 13, fontFamily: nativeFont("heading", 800), color: t.text.primary },
    readonlyValue: { fontSize: 15, fontFamily: nativeFont("body", 600), color: t.text.primary },
    readonlyHint: { fontSize: 13, fontFamily: nativeFont("body", 400), color: t.text.secondary },
  });
}
