import { useCallback, useEffect, useMemo, useRef, useState, type ComponentRef, type ReactNode } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import Animated, { FadeIn, FadeOut, LinearTransition } from "react-native-reanimated";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Trash2 } from "lucide-react-native";
import { useQueryClient } from "@tanstack/react-query";
import {
  invalidateBackpackQueries,
  useBackpackQuery,
  useCreateBackpackMutation,
  useInfiniteBackpackDocuments,
  useUpdateBackpackMutation,
} from "@helu/api/hooks";
import { addDocToBackpack, isApiError, type Backpack, type Document } from "@helu/api";
import {
  BOTTOM_ACTION_BAR_HEIGHT,
  BottomActionBar,
  Button,
  DangerLink,
  DiscardChangesDialog,
  SearchField,
  Skeleton,
  SkeletonGroup,
  TextField,
  motion,
  nativeFont,
  radii,
  spacing,
  useAppTheme,
  useSkeletonVisible,
  type ThemeContextValue,
} from "@helu/ui";
import { ScreenHeader } from "../ScreenHeader";
import { SkeletonField } from "../SkeletonPieces";
import type { SubscribeBeforeLeave } from "../agenda/AppointmentForm";
import { SelectableDocumentRow } from "../documents/SelectableDocumentRow";
import { notify } from "../../lib/notify";
import { useRecentlySaved } from "../../lib/recentlySaved";
import { usePickableDocuments } from "../../hooks/usePickableDocuments";
import { isDocPendingRemoval, useBackpackDeleteWithUndo, useBackpackDocRemoveWithUndo } from "../../hooks/useBackpackUndo";
import { BackpackDeleteConfirm } from "./BackpackDeleteConfirm";
import { BackpackDocumentLine } from "./BackpackDocumentLine";
import type { BackpackTemplate } from "./BackpacksEmpty";
import { withDocuments } from "./backpackCopy";

/** The API limit for `name` (`BackpackBase.name`, max_length 150). */
const NAME_MAX = 150;
const AFTER_BACK_MS = 380;

export interface BackpackFormProps {
  /** Set to edit an existing backpack. */
  id?: string;
  /** Template from «Mochilas · vacío» (#46, decision 1): only prefills the fields. */
  preset?: BackpackTemplate;
  onClose: () => void;
  /** After deleting from «Editar mochila»: back to the list (the detail is gone too). */
  onDeleted: () => void;
  onAddDocuments: (id: string) => void;
  onOpenDocument: (doc: Document) => void;
  subscribeBeforeLeave: SubscribeBeforeLeave;
}

/**
 * Mockups «Nueva mochila» and «Editar mochila» (m5): one form screen from the bottom (§3). Nombre and
 * Descripción in a card, then the documents — to pick when creating, the current ones with «×» and
 * «+ Agregar» when editing — and a fixed bar. Leaving with changes asks «¿Descartar los cambios?».
 */
export function BackpackForm({ id, preset, onClose, onDeleted, onAddDocuments, onOpenDocument, subscribeBeforeLeave }: BackpackFormProps) {
  const t = useAppTheme();
  const styles = useMemo(() => makeStyles(t), [t]);
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const isEdit = !!id;

  const backpackQuery = useBackpackQuery(id ?? "");
  const backpack = isEdit ? backpackQuery.data : undefined;
  const showSkeleton = useSkeletonVisible(isEdit && backpackQuery.isLoading);

  const [name, setName] = useState(preset?.name ?? "");
  const [description, setDescription] = useState(preset?.description ?? "");
  const [selected, setSelected] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const nameRef = useRef<ComponentRef<typeof TextInput>>(null);

  // Fill the fields once with the saved backpack.
  const baseline = useRef<{ name: string; description: string } | null>(isEdit ? null : { name, description });
  useEffect(() => {
    if (!backpack || baseline.current) return;
    setName(backpack.name);
    setDescription(backpack.description ?? "");
    baseline.current = { name: backpack.name, description: backpack.description ?? "" };
  }, [backpack]);

  const dirty =
    baseline.current !== null &&
    (name !== baseline.current.name || description !== baseline.current.description || selected.length > 0);

  // ── Leaving: «¿Descartar los cambios?» (formularios.md §7) ──
  const allowLeave = useRef(false);
  const [askDiscard, setAskDiscard] = useState(false);
  const leave = useCallback(() => {
    allowLeave.current = true;
    onClose();
  }, [onClose]);
  useEffect(
    () =>
      subscribeBeforeLeave((prevent) => {
        if (!dirty || allowLeave.current) return;
        prevent();
        setAskDiscard(true);
      }),
    [subscribeBeforeLeave, dirty],
  );

  const createMut = useCreateBackpackMutation();
  const updateMut = useUpdateBackpackMutation();

  const trimmed = name.trim();
  const nameError = !submitted
    ? undefined
    : !trimmed
      ? "Escribe un nombre para la mochila."
      : trimmed.length > NAME_MAX
        ? `Usa máximo ${NAME_MAX} caracteres.`
        : undefined;

  const save = async () => {
    setSubmitted(true);
    if (!trimmed || trimmed.length > NAME_MAX) {
      nameRef.current?.focus();
      return;
    }
    const payload = { name: trimmed, description: description.trim() || undefined, type: (backpack?.type ?? "CUSTOM") as Backpack["type"] };
    setSaving(true);
    try {
      if (isEdit && id) {
        await updateMut.mutateAsync({ id, bp: payload });
        await qc.refetchQueries({ queryKey: ["backpack", id] }).catch(() => undefined);
        useRecentlySaved.getState().markBackpack(id);
        notify({ message: "Cambios guardados", description: trimmed });
        leave();
        return;
      }
      const created = await createMut.mutateAsync(payload);
      // The API adds documents one at a time; count what failed instead of stopping at the first.
      let failed = 0;
      for (const documentId of selected) {
        try {
          await addDocToBackpack(created.id, documentId);
        } catch {
          failed += 1;
        }
      }
      if (selected.length > 0) invalidateBackpackQueries(qc, created.id);
      // The new card is in the list (with its count) before the form closes, then it lights up.
      await qc.refetchQueries({ queryKey: ["backpacks"] }).catch(() => undefined);
      useRecentlySaved.getState().markBackpack(created.id);
      if (failed === 0) {
        notify({ message: "Mochila creada", description: selected.length > 0 ? `${trimmed} · ${withDocuments("con", selected.length)}` : trimmed });
      } else {
        notify({
          tone: "warning",
          message: "Mochila creada",
          description:
            failed === selected.length
              ? "No pudimos agregar los documentos. Agrégalos desde la mochila."
              : `Agregamos ${selected.length - failed} de ${selected.length} documentos. Agrega el resto desde la mochila.`,
        });
      }
      leave();
    } catch (err) {
      notify({
        tone: "error",
        message: isEdit ? "No se pudo guardar" : "No se pudo crear la mochila",
        description: isApiError(err) ? "Revisa los datos e intenta de nuevo." : "Revisa tu conexión e intenta de nuevo.",
        action: { label: "Reintentar", onPress: () => void save() },
      });
    } finally {
      setSaving(false);
    }
  };

  const fields = (
    <View style={styles.card}>
      <TextField
        label="Nombre"
        value={name}
        onChange={setName}
        placeholder="Ej: Chequeo anual"
        autoFocus={!isEdit && !preset}
        autoCapitalize="sentences"
        returnKeyType="next"
        error={nameError}
        inputRef={nameRef}
      />
      <TextField
        label="Descripción (opcional)"
        value={description}
        onChange={setDescription}
        placeholder="Ej: Para cita con especialista"
        multiline
        numberOfLines={3}
      />
    </View>
  );

  const [confirmDelete, setConfirmDelete] = useState(false);
  const deleteWithUndo = useBackpackDeleteWithUndo();

  const barLabel = isEdit ? "Guardar cambios" : selected.length > 0 ? withDocuments("Crear mochila con", selected.length) : "Crear mochila";

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScreenHeader title={isEdit ? "Editar mochila" : "Nueva mochila"} onBack={() => (dirty ? setAskDiscard(true) : leave())} />
      {isEdit && (showSkeleton || !backpack) ? (
        backpackQuery.isLoading || showSkeleton ? (
          <>
            <SkeletonGroup label="Cargando la mochila" style={[styles.content, { flex: 1 }]}>
              <View style={styles.card}>
                <SkeletonField label="Nombre" />
                <SkeletonField label="Descripción (opcional)" height={84} />
              </View>
              <Skeleton width={110} height={17} />
              <Skeleton height={180} radius={18} />
            </SkeletonGroup>
            <BottomActionBar primary={{ label: "Guardar cambios", onPress: () => undefined, disabled: true }} />
          </>
        ) : (
          <View style={styles.centered}>
            <Text style={styles.h3}>No encontramos esta mochila</Text>
            <Button variant="secondary" onPress={leave}>
              Volver
            </Button>
          </View>
        )
      ) : (
        <>
          <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0}
          >
            {isEdit && id && backpack ? (
              <ScrollView
                contentContainerStyle={[styles.content, { paddingBottom: BOTTOM_ACTION_BAR_HEIGHT + insets.bottom + spacing[6] }]}
                keyboardShouldPersistTaps="handled"
              >
                {fields}
                <EditDocuments id={id} onAdd={() => onAddDocuments(id)} onOpen={onOpenDocument} />
                <View style={styles.danger}>
                  <DangerLink
                    label="Eliminar mochila"
                    icon={<Trash2 size={16} strokeWidth={2.2} color={t.status.errorFg} />}
                    onPress={() => setConfirmDelete(true)}
                  />
                </View>
              </ScrollView>
            ) : (
              <PickDocuments
                header={fields}
                selected={selected}
                onToggle={(docId) => setSelected((ids) => (ids.includes(docId) ? ids.filter((x) => x !== docId) : [...ids, docId]))}
                bottomInset={BOTTOM_ACTION_BAR_HEIGHT + insets.bottom + spacing[6]}
              />
            )}
          </KeyboardAvoidingView>
          <BottomActionBar
            primary={{
              label: barLabel,
              onPress: () => void save(),
              loading: saving,
              loadingLabel: isEdit ? "Guardando…" : "Creando…",
              disabled: saving,
            }}
          />
        </>
      )}

      {askDiscard ? (
        <DiscardChangesDialog
          onKeep={() => setAskDiscard(false)}
          onDiscard={() => {
            setAskDiscard(false);
            leave();
          }}
        />
      ) : null}

      {confirmDelete && backpack ? (
        <BackpackDeleteConfirm
          name={backpack.name}
          onCancel={() => setConfirmDelete(false)}
          onConfirm={() => {
            setConfirmDelete(false);
            allowLeave.current = true;
            onDeleted();
            setTimeout(() => deleteWithUndo(backpack), AFTER_BACK_MS);
          }}
        />
      ) : null}
    </SafeAreaView>
  );
}

/** «Editar mochila»: «Documentos» with «+ Agregar», and the rows in one card with «×». */
function EditDocuments({ id, onAdd, onOpen }: { id: string; onAdd: () => void; onOpen: (doc: Document) => void }) {
  const t = useAppTheme();
  const styles = useMemo(() => makeStyles(t), [t]);
  const docsQuery = useInfiniteBackpackDocuments(id);
  const removeWithUndo = useBackpackDocRemoveWithUndo(id);
  const { hasNextPage, isFetchingNextPage, fetchNextPage } = docsQuery;
  useEffect(() => {
    if (hasNextPage && !isFetchingNextPage) void fetchNextPage();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);
  const docs = useMemo(
    () => (docsQuery.data?.pages.flatMap((p) => p.items) ?? []).filter((d) => !isDocPendingRemoval(id, d.id)),
    [docsQuery.data, id],
  );

  return (
    <View style={styles.group}>
      <View style={styles.sectionHead}>
        <Text style={[styles.h3, { flex: 1 }]} accessibilityRole="header">
          Documentos
        </Text>
        <Pressable onPress={onAdd} hitSlop={12} accessibilityRole="button" accessibilityLabel="Agregar documentos">
          <Text style={styles.link}>+ Agregar</Text>
        </Pressable>
      </View>
      {docsQuery.isLoading ? (
        <Skeleton height={140} radius={18} />
      ) : docs.length === 0 ? (
        <Text style={styles.meta}>Aún no tiene documentos.</Text>
      ) : (
        <View style={styles.tightCard}>
          {docs.map((doc) => (
            <Animated.View key={doc.id} exiting={FadeOut.duration(motion.base)} layout={LinearTransition.duration(motion.base)}>
              <BackpackDocumentLine document={doc} onPress={() => onOpen(doc)} onRemove={() => removeWithUndo(doc)} />
            </Animated.View>
          ))}
        </View>
      )}
    </View>
  );
}

/** «Nueva mochila»: «Documentos» with «N seleccionados», search and selectable rows. */
function PickDocuments({
  header,
  selected,
  onToggle,
  bottomInset,
}: {
  header: ReactNode;
  selected: string[];
  onToggle: (id: string) => void;
  bottomInset: number;
}) {
  const t = useAppTheme();
  const styles = useMemo(() => makeStyles(t), [t]);
  const docs = usePickableDocuments();
  const searching = docs.debouncedSearch.trim().length > 0;

  return (
    <Animated.FlatList
      data={docs.items}
      keyExtractor={(d) => d.id}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
      contentContainerStyle={[styles.listContent, { paddingBottom: bottomInset }]}
      ListHeaderComponent={
        <View style={styles.group}>
          {header}
          <View style={styles.sectionHead}>
            <Text style={[styles.h3, { flex: 1 }]} accessibilityRole="header">
              Documentos
            </Text>
            <Text style={styles.meta}>{selected.length === 1 ? "1 seleccionado" : `${selected.length} seleccionados`}</Text>
          </View>
          {docs.total > 0 ? (
            <SearchField value={docs.search} onChange={docs.setSearch} placeholder="Buscar documentos" accessibilityLabel="Buscar documentos" />
          ) : null}
        </View>
      }
      ItemSeparatorComponent={() => <View style={{ height: spacing[3] }} />}
      renderItem={({ item }) => (
        <Animated.View entering={FadeIn.duration(motion.fast)} exiting={FadeOut.duration(motion.instant)} layout={LinearTransition.duration(motion.base)}>
          <SelectableDocumentRow document={item} selected={selected.includes(item.id)} onToggle={() => onToggle(item.id)} />
        </Animated.View>
      )}
      ListEmptyComponent={
        docs.isLoading ? (
          <SkeletonGroup label="Cargando documentos" style={{ gap: spacing[3] }}>
            <Skeleton height={72} radius={18} />
            <Skeleton height={72} radius={18} />
            <Skeleton height={72} radius={18} />
          </SkeletonGroup>
        ) : (
          <Text style={[styles.meta, styles.emptyLine]}>
            {searching
              ? `Ningún documento coincide con «${docs.debouncedSearch.trim()}».`
              : "Aún no tienes documentos. Puedes crear la mochila y agregarlos después."}
          </Text>
        )
      }
    />
  );
}

function makeStyles(t: ThemeContextValue) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: t.surface.bg },
    content: { padding: spacing[4], paddingTop: spacing[2], gap: spacing[4] },
    // A FlatList spaces its rows with the separator; a `gap` here would add to it.
    listContent: { padding: spacing[4], paddingTop: spacing[2] },
    centered: { flex: 1, alignItems: "center", justifyContent: "center", gap: spacing[3], padding: spacing[6] },
    group: { gap: spacing[3], marginBottom: spacing[3] },
    sectionHead: { flexDirection: "row", alignItems: "center", marginTop: spacing[1] },
    h3: { fontSize: 17, fontFamily: nativeFont("heading", 800), color: t.text.primary },
    meta: { fontSize: 13, lineHeight: 18, fontFamily: nativeFont("body", 400), color: t.text.secondary },
    link: { fontSize: 13, fontFamily: nativeFont("heading", 800), color: t.brand.text },
    emptyLine: { textAlign: "center", paddingVertical: spacing[4] },
    card: {
      backgroundColor: t.surface.bgCard,
      borderColor: t.border.default,
      borderRadius: radii.card,
      borderWidth: 1,
      borderBottomWidth: 4,
      padding: spacing[4],
      gap: spacing[4],
    },
    tightCard: {
      backgroundColor: t.surface.bgCard,
      borderColor: t.border.default,
      borderRadius: 18,
      borderWidth: 1,
      borderBottomWidth: 4,
      paddingHorizontal: 14,
      paddingVertical: 8,
    },
    danger: { alignItems: "center", marginTop: spacing[2] },
  });
}
