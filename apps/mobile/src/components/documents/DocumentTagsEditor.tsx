import { useCallback, useEffect, useMemo, useRef, useState, Fragment } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Keyboard,
  Platform,
  Modal,
  KeyboardAvoidingView,
  Pressable,
  ScrollView,
  type TextInput as TextInputType,
} from "react-native";
import { Check, FolderPlus, Plus, Sparkles, X } from "lucide-react-native";
import type { TagCategoryOut, ClassificationSuggestion } from "@helu/api";
import { Chip, fontSize, fontWeight, radii, spacing, useAppTheme } from "@helu/ui";
import type { ThemeContextValue } from "@helu/ui";
import {
  flattenTagValues,
  pickDefaultCategoryId,
  tagDisplayName,
  textEqualsSearch,
  textMatchesSearch,
} from "./utils/groupTagsByCategory";

export interface DocumentTagsEditorProps {
  categories: TagCategoryOut[];
  selectedTagIds: string[];
  onToggleTag: (tagId: string) => void;
  onCreateTag: (value: string, categoryId: string) => Promise<void>;
  onCreateCategoryAndTag?: (categoryName: string, value: string) => Promise<void>;
  /** ID de categoría en la que se está creando un valor (desde el form core). */
  addingTagCategoryId?: string | null;
  loading?: boolean;
  creating?: boolean;
  classificationResult?: ClassificationSuggestion | null;
  classifying?: boolean;
}

function parseCategoryValueInput(text: string): { category: string; value: string } | null {
  const colon = text.indexOf(":");
  if (colon <= 0) return null;
  const category = text.slice(0, colon).trim();
  const value = text.slice(colon + 1).trim();
  if (!category || !value) return null;
  return { category, value };
}

function TagCategoryCatalog({
  categories,
  selectedSet,
  onToggleTag,
  onCreateTag,
  addingTagCategoryId,
  creating,
  styles,
  t,
  filterActive = false,
}: {
  categories: TagCategoryOut[];
  selectedSet: Set<string>;
  onToggleTag: (tagId: string) => void;
  onCreateTag: (value: string, categoryId: string) => Promise<void>;
  addingTagCategoryId?: string | null;
  creating: boolean;
  styles: ReturnType<typeof makeStyles>;
  t: ThemeContextValue;
  filterActive?: boolean;
}) {
  const [openAddCategoryId, setOpenAddCategoryId] = useState<string | null>(null);
  const [draftByCategory, setDraftByCategory] = useState<Record<string, string>>({});
  const addInputRef = useRef<TextInputType>(null);

  const submitInlineAdd = useCallback(
    async (categoryId: string) => {
      const value = (draftByCategory[categoryId] ?? "").trim();
      if (!value || creating) return;
      await onCreateTag(value, categoryId);
      setDraftByCategory((prev) => ({ ...prev, [categoryId]: "" }));
      setOpenAddCategoryId(null);
    },
    [creating, draftByCategory, onCreateTag],
  );

  const openAdd = useCallback((categoryId: string) => {
    setOpenAddCategoryId(categoryId);
    requestAnimationFrame(() => addInputRef.current?.focus());
  }, []);

  return (
    <View style={styles.catalogCard}>
      <Text style={styles.catalogTitle}>Categorías y valores</Text>
      <Text style={styles.catalogHint}>
        {filterActive
          ? "Categorías que coinciden con tu búsqueda."
          : "Toca una etiqueta para seleccionarla. Usa «+» en cada categoría para un valor nuevo."}
      </Text>

      {categories.length === 0 && filterActive ? (
        <Text style={styles.catalogEmptyFilter}>
          Ninguna etiqueta coincide. Pulsa Enter en el buscador para crear una nueva.
        </Text>
      ) : null}

      {categories.map((cat, index) => {
        const values = cat.values ?? [];
        const isAdding = openAddCategoryId === cat.id;
        const isSaving = addingTagCategoryId === cat.id;

        return (
          <View
            key={cat.id}
            style={[styles.catalogCategory, index === 0 && styles.catalogCategoryFirst]}
          >
            <View style={styles.catalogCategoryHeader}>
              <Text style={styles.catalogCategoryName}>{cat.name}</Text>
              <Text style={styles.catalogCategoryCount}>{values.length}</Text>
            </View>

            <View style={styles.catalogValuesRow}>
              {values.map((val) => (
                <Chip
                  key={val.id}
                  label={val.value}
                  selected={selectedSet.has(val.id)}
                  onPress={() => onToggleTag(val.id)}
                />
              ))}

              {!isAdding ? (
                <TouchableOpacity
                  style={styles.addValueBtn}
                  onPress={() => openAdd(cat.id)}
                  disabled={creating}
                  accessibilityRole="button"
                  accessibilityLabel={`Agregar valor en ${cat.name}`}
                >
                  <Plus size={12} color={t.brand.fg} strokeWidth={2.5} />
                </TouchableOpacity>
              ) : null}
            </View>

            {isAdding ? (
              <View style={styles.inlineAddRow}>
                <TextInput
                  ref={openAddCategoryId === cat.id ? addInputRef : undefined}
                  style={styles.inlineAddInput}
                  value={draftByCategory[cat.id] ?? ""}
                  onChangeText={(text) =>
                    setDraftByCategory((prev) => ({ ...prev, [cat.id]: text }))
                  }
                  placeholder="Nuevo valor"
                  placeholderTextColor={t.text.muted}
                  returnKeyType="done"
                  onSubmitEditing={() => void submitInlineAdd(cat.id)}
                  editable={!creating}
                  accessibilityLabel={`Nuevo valor para ${cat.name}`}
                />
                <TouchableOpacity
                  style={[
                    styles.inlineAddConfirm,
                    (!(draftByCategory[cat.id] ?? "").trim() || creating) &&
                      styles.inlineAddConfirmDisabled,
                  ]}
                  onPress={() => void submitInlineAdd(cat.id)}
                  disabled={!(draftByCategory[cat.id] ?? "").trim() || creating}
                  accessibilityRole="button"
                  accessibilityLabel="Confirmar nuevo valor"
                >
                  {isSaving ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Check size={18} color="#fff" strokeWidth={2.5} />
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.inlineAddCancel}
                  onPress={() => {
                    setOpenAddCategoryId(null);
                    setDraftByCategory((prev) => ({ ...prev, [cat.id]: "" }));
                  }}
                  accessibilityRole="button"
                  accessibilityLabel="Cancelar"
                >
                  <X size={18} color={t.text.secondary} />
                </TouchableOpacity>
              </View>
            ) : null}
          </View>
        );
      })}
    </View>
  );
}

export function DocumentTagsEditor({
  categories,
  selectedTagIds,
  onToggleTag,
  onCreateTag,
  onCreateCategoryAndTag,
  addingTagCategoryId = null,
  loading = false,
  creating = false,
  classificationResult,
  classifying = false,
}: DocumentTagsEditorProps) {
  const t = useAppTheme();
  const styles = useMemo(() => makeStyles(t), [t]);
  const [search, setSearch] = useState("");
  const [showNewCategoryModal, setShowNewCategoryModal] = useState(false);
  const [modalKeyboardInset, setModalKeyboardInset] = useState(0);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryValue, setNewCategoryValue] = useState("");

  useEffect(() => {
    if (!showNewCategoryModal) {
      setModalKeyboardInset(0);
      return;
    }

    const showEvent = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";
    const showSub = Keyboard.addListener(showEvent, (e) => {
      setModalKeyboardInset(e.endCoordinates.height);
    });
    const hideSub = Keyboard.addListener(hideEvent, () => setModalKeyboardInset(0));
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, [showNewCategoryModal]);

  const allValues = useMemo(() => flattenTagValues(categories), [categories]);
  const selectedSet = useMemo(() => new Set(selectedTagIds), [selectedTagIds]);

  const searchQuery = search.trim();
  const hasSearchQuery = searchQuery.length > 0;

  const filteredCategories = useMemo(() => {
    if (!hasSearchQuery) return categories;
    return categories
      .map((cat) => ({
        ...cat,
        values: (cat.values ?? []).filter((v) =>
          textMatchesSearch(searchQuery, v.value, cat.name),
        ),
      }))
      .filter(
        (cat) =>
          (cat.values?.length ?? 0) > 0 || textMatchesSearch(searchQuery, cat.name),
      );
  }, [categories, hasSearchQuery, searchQuery]);

  const aiSuggestedLabels = useMemo(() => {
    if (!classificationResult) return [] as string[];
    const fromExisting = (classificationResult.customTags ?? [])
      .map((ct) => ct.tagValueName ?? "")
      .filter(Boolean);
    const fromNew = (classificationResult.newTags ?? []).map((nt) => nt.value).filter(Boolean);
    return [...fromExisting, ...fromNew].filter(
      (label, index, arr) => arr.findIndex((l) => l.toLowerCase() === label.toLowerCase()) === index,
    );
  }, [classificationResult]);

  const showAiBanner = classifying || aiSuggestedLabels.length > 0;

  const applyAiSuggestions = useCallback(() => {
    if (!classificationResult) return;

    for (const ct of classificationResult.customTags ?? []) {
      if (ct.tagValueId && !selectedSet.has(ct.tagValueId)) {
        onToggleTag(ct.tagValueId);
      }
    }

    for (const nt of classificationResult.newTags ?? []) {
      const match = allValues.find(
        (v) => v.value.toLowerCase() === (nt.value ?? "").toLowerCase(),
      );
      if (match && !selectedSet.has(match.id)) {
        onToggleTag(match.id);
      }
    }
  }, [allValues, classificationResult, onToggleTag, selectedSet]);

  const submitSearch = useCallback(async () => {
    const trimmed = search.trim();
    if (!trimmed || creating) return;

    const parsed = parseCategoryValueInput(trimmed);
    if (parsed) {
      const existingCat = categories.find((c) =>
        textEqualsSearch(c.name, parsed.category),
      );
      if (existingCat) {
        await onCreateTag(parsed.value, existingCat.id);
      } else if (onCreateCategoryAndTag) {
        await onCreateCategoryAndTag(parsed.category, parsed.value);
      }
      setSearch("");
      Keyboard.dismiss();
      return;
    }

    const exact = allValues.find(
      (v) =>
        textEqualsSearch(v.value, trimmed) || textEqualsSearch(tagDisplayName(v), trimmed),
    );
    if (exact) {
      onToggleTag(exact.id);
      setSearch("");
      Keyboard.dismiss();
      return;
    }

    const categoryId = pickDefaultCategoryId(categories);
    if (!categoryId) return;

    await onCreateTag(trimmed, categoryId);
    setSearch("");
    Keyboard.dismiss();
  }, [allValues, categories, creating, onCreateCategoryAndTag, onCreateTag, onToggleTag, search]);

  const submitNewCategory = useCallback(async () => {
    if (!onCreateCategoryAndTag || creating) return;
    const cat = newCategoryName.trim();
    const val = newCategoryValue.trim();
    if (!cat || !val) return;

    await onCreateCategoryAndTag(cat, val);
    setNewCategoryName("");
    setNewCategoryValue("");
    setShowNewCategoryModal(false);
    Keyboard.dismiss();
  }, [creating, newCategoryName, newCategoryValue, onCreateCategoryAndTag]);

  const closeNewCategoryModal = useCallback(() => {
    setShowNewCategoryModal(false);
    Keyboard.dismiss();
  }, []);

  if (loading) {
    return (
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Etiquetas</Text>
        <View style={styles.loadingBox}>
          <ActivityIndicator color={t.brand.fg} />
          <Text style={styles.loadingText}>Cargando etiquetas…</Text>
        </View>
      </View>
    );
  }

  return (
    <Fragment>
    <View style={styles.section}>
      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionLabel}>Etiquetas</Text>
        {onCreateCategoryAndTag ? (
          <TouchableOpacity
            style={styles.newCategoryLink}
            onPress={() => setShowNewCategoryModal(true)}
            accessibilityRole="button"
            accessibilityLabel="Crear nueva categoría de etiquetas"
          >
            <FolderPlus size={16} color={t.brand.fg} />
            <Text style={styles.newCategoryLinkText}>Nueva categoría</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      <View style={styles.searchCard}>
        <Text style={styles.searchLabel}>Buscar</Text>
        <View style={styles.searchRow}>
          <TextInput
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
            placeholder="Buscar etiquetas o Médico: Dr. Pérez"
            placeholderTextColor={t.text.muted}
            returnKeyType="search"
            blurOnSubmit={false}
            onSubmitEditing={() => void submitSearch()}
            editable={!creating}
            accessibilityLabel="Buscar etiquetas"
          />
          {hasSearchQuery ? (
            <TouchableOpacity
              onPress={() => setSearch("")}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Limpiar búsqueda"
            >
              <Text style={styles.clearSearchText}>Limpiar</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {categories.length > 0 || hasSearchQuery ? (
        <TagCategoryCatalog
          categories={filteredCategories}
          selectedSet={selectedSet}
          onToggleTag={onToggleTag}
          onCreateTag={onCreateTag}
          addingTagCategoryId={addingTagCategoryId}
          creating={creating}
          styles={styles}
          t={t}
          filterActive={hasSearchQuery}
        />
      ) : null}

      {creating && !addingTagCategoryId ? (
        <View style={styles.creatingRow}>
          <ActivityIndicator size="small" color={t.brand.fg} />
          <Text style={styles.creatingText}>Guardando…</Text>
        </View>
      ) : null}

      {showAiBanner ? (
        <TouchableOpacity
          style={styles.aiBanner}
          onPress={aiSuggestedLabels.length > 0 ? applyAiSuggestions : undefined}
          activeOpacity={aiSuggestedLabels.length > 0 ? 0.85 : 1}
          disabled={classifying || aiSuggestedLabels.length === 0}
          accessibilityRole="button"
          accessibilityLabel="Sugerencias de etiquetas por IA"
        >
          <Sparkles size={18} color={t.accent.aiFg} />
          <Text style={styles.aiBannerText}>
            {classifying
              ? "IA: Analizando el documento…"
              : `IA: Detectamos ${aiSuggestedLabels.length} etiqueta${aiSuggestedLabels.length === 1 ? "" : "s"}.`}
          </Text>
        </TouchableOpacity>
      ) : null}
    </View>

      <Modal
        visible={showNewCategoryModal}
        animationType="slide"
        transparent
        statusBarTranslucent
        presentationStyle="overFullScreen"
        onRequestClose={closeNewCategoryModal}
      >
        <KeyboardAvoidingView
          style={styles.modalKeyboardRoot}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <Pressable style={styles.modalBackdropTouch} onPress={closeNewCategoryModal} />
          <ScrollView
            style={styles.modalScroll}
            contentContainerStyle={[
              styles.modalScrollContent,
              { paddingBottom: modalKeyboardInset },
            ]}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="interactive"
            bounces={false}
          >
            <View
              style={[
                styles.modalSheet,
                modalKeyboardInset > 0 && { marginBottom: spacing[2] },
              ]}
            >
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Nueva categoría</Text>
                <TouchableOpacity
                  onPress={closeNewCategoryModal}
                  hitSlop={12}
                  accessibilityRole="button"
                  accessibilityLabel="Cerrar"
                >
                  <X size={22} color={t.text.secondary} />
                </TouchableOpacity>
              </View>

              <Text style={styles.fieldLabel}>Nombre de la categoría</Text>
              <TextInput
                style={styles.fieldInput}
                value={newCategoryName}
                onChangeText={setNewCategoryName}
                placeholder="Ej. Médico, Institución"
                placeholderTextColor={t.text.muted}
                editable={!creating}
              />

              <Text style={styles.fieldLabel}>Primer valor</Text>
              <TextInput
                style={styles.fieldInput}
                value={newCategoryValue}
                onChangeText={setNewCategoryValue}
                placeholder="Ej. Dr. Rivera"
                placeholderTextColor={t.text.muted}
                returnKeyType="done"
                onSubmitEditing={() => void submitNewCategory()}
                editable={!creating}
              />

              <TouchableOpacity
                style={[
                  styles.createCategoryBtn,
                  (creating || !newCategoryName.trim() || !newCategoryValue.trim()) &&
                    styles.createCategoryBtnDisabled,
                ]}
                onPress={() => void submitNewCategory()}
                disabled={creating || !newCategoryName.trim() || !newCategoryValue.trim()}
                accessibilityRole="button"
                accessibilityLabel="Crear categoría y etiqueta"
              >
                {creating ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.createCategoryBtnText}>Crear categoría y etiqueta</Text>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </Fragment>
  );
}

function makeStyles(t: ThemeContextValue) {
  return StyleSheet.create({
    section: {
      gap: spacing[3],
    },
    sectionHeaderRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: spacing[2],
    },
    sectionLabel: {
      fontSize: fontSize.sm,
      fontWeight: fontWeight.semibold,
      color: t.text.secondary,
    },
    newCategoryLink: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing[1],
    },
    newCategoryLinkText: {
      fontSize: fontSize.sm,
      fontWeight: fontWeight.semibold,
      color: t.brand.fg,
    },
    loadingBox: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing[3],
      padding: spacing[4],
      borderRadius: radii.lg,
      borderWidth: 1,
      borderColor: t.border.light,
      backgroundColor: t.surface.bg,
    },
    loadingText: {
      fontSize: fontSize.sm,
      color: t.text.secondary,
    },
    catalogCard: {
      borderWidth: 1,
      borderColor: t.border.default,
      borderRadius: radii.lg,
      backgroundColor: t.surface.bgCard,
      padding: spacing[3],
      gap: spacing[3],
    },
    catalogTitle: {
      fontSize: fontSize.sm,
      fontWeight: fontWeight.bold,
      color: t.text.primary,
    },
    catalogHint: {
      fontSize: fontSize.xs,
      color: t.text.muted,
      lineHeight: 16,
      marginTop: -spacing[1],
    },
    catalogCategory: {
      gap: spacing[2],
      paddingTop: spacing[2],
      borderTopWidth: 1,
      borderTopColor: t.border.light,
    },
    catalogCategoryFirst: {
      borderTopWidth: 0,
      paddingTop: 0,
    },
    catalogCategoryHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    catalogCategoryName: {
      fontSize: fontSize.xs,
      fontWeight: fontWeight.bold,
      color: t.text.secondary,
      textTransform: "uppercase",
      letterSpacing: 0.4,
      flex: 1,
    },
    catalogCategoryCount: {
      fontSize: fontSize.xs,
      color: t.text.muted,
      fontWeight: fontWeight.semibold,
    },
    catalogValuesRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing[2],
      alignItems: "center",
    },
    catalogEmptyFilter: {
      fontSize: fontSize.sm,
      color: t.text.muted,
      fontStyle: "italic",
    },
    addValueBtn: {
      width: 28,
      height: 28,
      alignItems: "center",
      justifyContent: "center",
      alignSelf: "center",
      borderRadius: radii.full,
      borderWidth: 1,
      borderColor: t.brand.fg,
      borderStyle: "dashed",
    },
    inlineAddRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing[2],
    },
    inlineAddInput: {
      flex: 1,
      borderWidth: 1,
      borderColor: t.border.default,
      borderRadius: radii.md,
      backgroundColor: t.surface.bg,
      paddingHorizontal: spacing[3],
      paddingVertical: spacing[2],
      fontSize: fontSize.base,
      color: t.text.primary,
      minHeight: 44,
    },
    inlineAddConfirm: {
      width: 44,
      height: 44,
      borderRadius: radii.md,
      backgroundColor: t.brand.fg,
      alignItems: "center",
      justifyContent: "center",
    },
    inlineAddConfirmDisabled: {
      opacity: 0.45,
    },
    inlineAddCancel: {
      width: 44,
      height: 44,
      alignItems: "center",
      justifyContent: "center",
    },
    searchCard: {
      borderWidth: 1,
      borderColor: t.border.light,
      borderRadius: radii.lg,
      backgroundColor: t.surface.bg,
      padding: spacing[3],
      gap: spacing[2],
    },
    searchRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing[2],
    },
    clearSearchText: {
      fontSize: fontSize.sm,
      fontWeight: fontWeight.semibold,
      color: t.brand.fg,
    },
    searchLabel: {
      fontSize: fontSize.xs,
      fontWeight: fontWeight.semibold,
      color: t.text.secondary,
      textTransform: "uppercase",
      letterSpacing: 0.3,
    },
    searchInput: {
      flex: 1,
      fontSize: fontSize.base,
      color: t.text.primary,
      minHeight: 40,
    },
    creatingRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing[2],
    },
    creatingText: {
      fontSize: fontSize.sm,
      color: t.text.secondary,
    },
    aiBanner: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: spacing[3],
      padding: spacing[4],
      borderRadius: radii.lg,
      backgroundColor: t.accent.aiBg,
      borderWidth: 1,
      borderColor: t.border.light,
    },
    aiBannerText: {
      flex: 1,
      fontSize: fontSize.sm,
      lineHeight: 20,
      color: t.accent.aiFg,
      fontWeight: fontWeight.medium,
    },
    modalKeyboardRoot: {
      flex: 1,
      justifyContent: "flex-end",
    },
    modalBackdropTouch: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: "rgba(0,0,0,0.55)",
    },
    modalScroll: {
      flex: 1,
    },
    modalScrollContent: {
      flexGrow: 1,
      justifyContent: "flex-end",
    },
    modalSheet: {
      backgroundColor: t.surface.bgCard,
      borderTopLeftRadius: radii.xl,
      borderTopRightRadius: radii.xl,
      padding: spacing[5],
      paddingBottom: spacing[5],
      gap: spacing[3],
      shadowColor: "#000",
      shadowOffset: { width: 0, height: -4 },
      shadowOpacity: 0.15,
      shadowRadius: 12,
      elevation: 16,
    },
    modalHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    modalTitle: {
      fontSize: fontSize.lg,
      fontWeight: fontWeight.bold,
      color: t.text.primary,
    },
    fieldLabel: {
      fontSize: fontSize.xs,
      fontWeight: fontWeight.semibold,
      color: t.text.secondary,
    },
    fieldInput: {
      borderWidth: 1,
      borderColor: t.border.default,
      borderRadius: radii.md,
      backgroundColor: t.surface.bg,
      paddingHorizontal: spacing[3],
      paddingVertical: spacing[2],
      fontSize: fontSize.base,
      color: t.text.primary,
      minHeight: 48,
    },
    createCategoryBtn: {
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: t.brand.fg,
      borderRadius: radii.md,
      paddingVertical: spacing[3],
      minHeight: 48,
      marginTop: spacing[2],
    },
    createCategoryBtnDisabled: {
      opacity: 0.5,
    },
    createCategoryBtnText: {
      color: "#fff",
      fontSize: fontSize.sm,
      fontWeight: fontWeight.semibold,
    },
  });
}
