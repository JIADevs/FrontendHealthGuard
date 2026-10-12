import { useCallback, useEffect, useMemo, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Animated,
  Easing,
} from "react-native";
import { Sparkles } from "lucide-react-native";
import type { DocumentFormState, DocumentFormActions, FileSource } from "../hooks/useDocumentForm";
import { useAppTheme, colors, radii, spacing, fontSize, fontWeight, Chip, TextField } from "@helu/ui";
import type { ThemeContextValue } from "@helu/ui";
import { DocumentTagsEditor } from "./documents/DocumentTagsEditor";
import { DocumentDescriptionField } from "./documents/DocumentDescriptionField";

type Props = DocumentFormState &
  DocumentFormActions<FileSource> & {
    file?: FileSource;
    /** Mientras se descarga el adjunto actual para clasificar en edición */
    classifyFileLoading?: boolean;
    variant?: "upload" | "edit";
    /** AI classify is file-only; hide for LINK / portal documents. Default true. */
    showAiClassify?: boolean;
    /** Override section heading. Defaults: edit → "Editar documento"; upload+AI → "Clasificar documento"; upload without AI → "Datos del documento". */
    formTitle?: string;
  };

export function DocumentClassificationForm({
  file,
  classifyFileLoading = false,
  variant = "upload",
  showAiClassify = true,
  formTitle: formTitleOverride,
  catalogs,
  catalogsLoading,
  selectedType,
  selectedSpecialty,
  selectedTags,
  title,
  description,
  addingTag,
  classificationResult,
  addingCustomTag,
  classifying,
  setSelectedType,
  setSelectedSpecialty,
  toggleTag,
  setTitle,
  setDescription,
  handleAIClassify,
  handleAddCustomTag,
  handleAddCategoryAndTag,
}: Props) {
  const t = useAppTheme();
  const styles = useMemo(() => makeStyles(t), [t]);

  const handleCreateTag = useCallback(
    async (value: string, categoryId: string) => {
      await handleAddCustomTag(categoryId, value);
    },
    [handleAddCustomTag],
  );

  const handleCreateCategoryAndTag = useCallback(
    async (categoryName: string, value: string) => {
      await handleAddCategoryAndTag(categoryName, value);
    },
    [handleAddCategoryAndTag],
  );
  const catalogContentOpacity = useRef(new Animated.Value(0)).current;
  const skeletonOpacity = useRef(new Animated.Value(0.45)).current;
  const currentType = catalogs.types.find((tp: { id: string; name: string; specialties: any[] }) => tp.id === selectedType);
  const canRunAI = showAiClassify && !!file && !classifyFileLoading;
  const aiHint = !showAiClassify
    ? null
    : classifyFileLoading
      ? "Preparando el adjunto para clasificar…"
      : !file && variant === "edit"
        ? "No se pudo cargar el adjunto para clasificar."
        : !file
          ? "Seleccioná un archivo para clasificar con IA."
          : null;

  useEffect(() => {
    if (!catalogsLoading) {
      Animated.timing(catalogContentOpacity, {
        toValue: 1,
        duration: 280,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
      return;
    }

    catalogContentOpacity.setValue(0);
  }, [catalogContentOpacity, catalogsLoading]);

  useEffect(() => {
    if (!catalogsLoading) {
      skeletonOpacity.setValue(0.45);
      return;
    }

    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(skeletonOpacity, {
          toValue: 1,
          duration: 650,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(skeletonOpacity, {
          toValue: 0.45,
          duration: 650,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );

    pulse.start();
    return () => pulse.stop();
  }, [catalogsLoading, skeletonOpacity]);

  return (
    <View style={styles.form}>
      <Text style={styles.formTitle}>
        {formTitleOverride ??
          (variant === "edit"
            ? "Editar documento"
            : showAiClassify
              ? "Clasificar documento"
              : "Datos del documento")}
      </Text>

      {showAiClassify ? (
        <>
          <TouchableOpacity
            style={[styles.aiBtn, (!canRunAI || classifying) && styles.aiBtnDisabled]}
            onPress={() => {
              if (!file) return;
              handleAIClassify(file);
            }}
            disabled={!canRunAI || classifying}
          >
            {classifyFileLoading ? (
              <ActivityIndicator color={colors.white} size="small" />
            ) : (
              <Sparkles color={colors.white} size={20} />
            )}
            <Text style={styles.aiBtnText}>
              {classifying
                ? "Clasificando…"
                : classifyFileLoading
                  ? "Preparando adjunto…"
                  : "Clasificar con IA"}
            </Text>
          </TouchableOpacity>

          {aiHint && !classifying ? (
            <Text style={styles.aiHint}>{aiHint}</Text>
          ) : null}
        </>
      ) : null}

      {classificationResult && (
        <ClassificationResultCard
          result={classificationResult}
          t={t}
        />
      )}

      <View style={styles.field}>
        <TextField
          label="Título del Documento"
          value={title}
          onChange={setTitle}
          placeholder="Ej. Resultados Laboratorio"
        />
      </View>

      <View style={styles.field}>
        <DocumentDescriptionField value={description} onChange={setDescription} />
      </View>

      {catalogsLoading ? (
        <View style={styles.catalogLoadingState}>
          <Text style={styles.catalogLoadingText}>Cargando tipos y etiquetas...</Text>
          {[0, 1, 2].map((section) => (
            <View key={`skeleton-section-${section}`} style={styles.skeletonSection}>
              <Animated.View style={[styles.skeletonLabel, { opacity: skeletonOpacity }]} />
              <View style={styles.skeletonChipsRow}>
                {[0, 1, 2, 3].map((chip) => (
                  <Animated.View key={`skeleton-chip-${section}-${chip}`} style={[styles.skeletonChip, { opacity: skeletonOpacity }]} />
                ))}
              </View>
            </View>
          ))}
        </View>
      ) : (
        <Animated.View style={{ opacity: catalogContentOpacity }}>
          <View style={styles.field}>
            <Text style={styles.label}>Tipo de Documento</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll} contentContainerStyle={{ gap: spacing[2] }}>
              {catalogs.types.map((tp: { id: string; name: string }) => (
                <Chip
                  key={tp.id}
                  label={tp.name}
                  selected={selectedType === tp.id}
                  onPress={() => { setSelectedType(tp.id); setSelectedSpecialty(undefined); }}
                />
              ))}
            </ScrollView>
          </View>

          {currentType && currentType.specialties.length > 0 && (
            <View style={styles.field}>
              <Text style={styles.label}>Especialidad</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll} contentContainerStyle={{ gap: spacing[2] }}>
                {currentType.specialties.map((s: { id: string; name: string }) => (
                  <Chip
                    key={s.id}
                    label={s.name}
                    selected={selectedSpecialty === s.id}
                    onPress={() => setSelectedSpecialty(s.id)}
                  />
                ))}
              </ScrollView>
            </View>
          )}

          <DocumentTagsEditor
            categories={catalogs.tags}
            selectedTagIds={selectedTags}
            onToggleTag={toggleTag}
            onCreateTag={handleCreateTag}
            onCreateCategoryAndTag={handleCreateCategoryAndTag}
            addingTagCategoryId={addingTag}
            loading={false}
            creating={addingTag !== null || addingCustomTag}
            classificationResult={classificationResult}
            classifying={classifying}
          />
        </Animated.View>
      )}
    </View>
  );
}

function ClassificationResultCard({
  result,
  t,
}: Readonly<{
  result: NonNullable<DocumentFormState["classificationResult"]>;
  t: ThemeContextValue;
}>) {
  const styles = useMemo(() => makeStyles(t), [t]);
  const tagLabels = (result.customTags ?? []).map((ct) => ct.tagValueName ?? ct.tagValueId).filter(Boolean);
  const newTagLabels = (result.newTags ?? []).map((nt) => `${nt.categoryName ?? ""}: ${nt.value}`);
  const hasAnyTags = tagLabels.length > 0 || newTagLabels.length > 0;

  return (
    <View style={styles.classificationResult}>
      <Text style={styles.classificationResultTitle}>Resultado de la clasificación</Text>
      {result.type && (
        <Text style={styles.resultLine}><Text style={styles.resultLabel}>Tipo: </Text>{result.type.name}</Text>
      )}
      {(result.specialties ?? []).length > 0 && (
        <Text style={styles.resultLine}><Text style={styles.resultLabel}>Especialidad: </Text>{(result.specialties ?? []).map((s) => s.name).join(", ")}</Text>
      )}
      {hasAnyTags && (
        <>
          {tagLabels.length > 0 && <Text style={styles.resultLine}><Text style={styles.resultLabel}>Etiquetas: </Text>{tagLabels.join(", ")}</Text>}
          {newTagLabels.length > 0 && <Text style={styles.resultLine}><Text style={styles.resultLabel}>Nuevas sugeridas: </Text>{newTagLabels.join(", ")}</Text>}
        </>
      )}
    </View>
  );
}

function makeStyles(t: ThemeContextValue) {
  return StyleSheet.create({
    form:      { padding: spacing[5], backgroundColor: t.surface.bgCard },
    formTitle: { fontSize: fontSize.xl, fontWeight: fontWeight.extrabold, color: t.text.primary, marginBottom: spacing[4] },

    aiBtn:         { backgroundColor: t.accent.aiFg, flexDirection: "row", alignItems: "center", justifyContent: "center", padding: spacing[3], borderRadius: radii.md, marginBottom: spacing[2], gap: spacing[2] },
    aiBtnDisabled: { opacity: 0.7 },
    aiBtnText:     { color: colors.white, fontWeight: fontWeight.bold, fontSize: 14 },
    aiHint:        { fontSize: fontSize.sm, color: t.text.secondary, marginBottom: spacing[5], lineHeight: 20 },

    classificationResult:      { backgroundColor: t.brand.tint, padding: 14, borderRadius: radii.md, marginBottom: spacing[5], borderWidth: 1, borderColor: t.brand.tintBorder },
    classificationResultTitle: { fontSize: 14, fontWeight: fontWeight.bold, color: t.brand.tintText, marginBottom: spacing[2] },
    resultLine:                { fontSize: fontSize.sm, color: t.brand.tintStrong, marginBottom: 4 },
    resultLabel:               { fontWeight: fontWeight.semibold },

    field: { marginBottom: spacing[5] },
    label: { fontSize: 14, fontWeight: fontWeight.semibold, color: t.text.secondary, marginBottom: spacing[2] },

    // Altura mínima: un ScrollView horizontal dentro de otro ScrollView suele medir 0 de alto en RN y los chips no se ven.
    chipScroll:  { marginHorizontal: -20, paddingHorizontal: 20, minHeight: 40 },
    catalogLoadingState: { marginBottom: spacing[5], gap: spacing[3] },
    catalogLoadingText: { fontSize: fontSize.sm, color: t.text.secondary, fontWeight: fontWeight.medium },
    skeletonSection: { gap: spacing[2] },
    skeletonLabel: { width: 140, height: 14, borderRadius: radii.sm, backgroundColor: t.border.light },
    skeletonChipsRow: { flexDirection: "row", gap: spacing[2] },
    skeletonChip: { width: 86, height: 34, borderRadius: radii.full, backgroundColor: t.border.light },

  });
}
