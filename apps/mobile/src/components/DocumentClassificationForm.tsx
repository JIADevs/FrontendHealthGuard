import { useEffect, useMemo, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  TextInput,
  Animated,
  Easing,
} from "react-native";
import { Sparkles } from "lucide-react-native";
import type { DocumentFormState, DocumentFormActions, FileSource } from "../hooks/useDocumentForm";
import { useAppTheme, colors, palette, radii, spacing, fontSize, fontWeight, Chip, TextField } from "@helu/ui";
import type { ThemeContextValue } from "@helu/ui";

type Props = DocumentFormState &
  DocumentFormActions<FileSource> & {
    file?: FileSource;
  };

export function DocumentClassificationForm({
  file,
  catalogs,
  catalogsLoading,
  selectedType,
  selectedSpecialty,
  selectedTags,
  title,
  newTagValues,
  addingTag,
  classificationResult,
  newCategoryName,
  newTagValue,
  addingCustomTag,
  classifying,
  setSelectedType,
  setSelectedSpecialty,
  toggleTag,
  setTitle,
  setNewTagValue,
  setNewCategoryName,
  setNewTagValueField,
  handleAIClassify,
  handleAddCustomTag,
  handleAddCategoryAndTag,
}: Props) {
  const t = useAppTheme();
  const styles = useMemo(() => makeStyles(t), [t]);
  const catalogContentOpacity = useRef(new Animated.Value(0)).current;
  const skeletonOpacity = useRef(new Animated.Value(0.45)).current;
  const currentType = catalogs.types.find((tp: { id: string; name: string; specialties: any[] }) => tp.id === selectedType);
  const canRunAI = !!file;

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
      <Text style={styles.formTitle}>Clasificar Documento</Text>

      <TouchableOpacity
        style={[styles.aiBtn, (!canRunAI || classifying) && styles.aiBtnDisabled]}
        onPress={() => {
          if (!file) return;
          handleAIClassify(file);
        }}
        disabled={!canRunAI || classifying}
      >
        <Sparkles color={colors.white} size={20} />
        <Text style={styles.aiBtnText}>
          {classifying ? "Clasificando..." : "Clasificar con IA"}
        </Text>
      </TouchableOpacity>

      {classificationResult && (
        <ClassificationResultCard
          result={classificationResult}
          catalogs={catalogs}
          selectedTags={selectedTags}
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

          {catalogs.tags.map((category: { id: string; name: string; values: { id: string; value: string }[] }) => (
            <View key={category.id} style={styles.field}>
              <Text style={styles.label}>{category.name}</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll} contentContainerStyle={{ gap: spacing[2] }}>
                {category.values.map((val: { id: string; value: string }) => (
                  <Chip
                    key={val.id}
                    label={val.value}
                    selected={selectedTags.includes(val.id)}
                    onPress={() => toggleTag(val.id)}
                  />
                ))}

                <View style={styles.addTagContainer}>
                  <TextInput
                    style={styles.addTagInput}
                    placeholder="Nueva..."
                    placeholderTextColor={t.text.muted}
                    value={newTagValues[category.id] || ""}
                    onChangeText={(text) => setNewTagValue(category.id, text)}
                    onSubmitEditing={() => handleAddCustomTag(category.id)}
                  />
                  <TouchableOpacity
                    style={styles.addTagBtn}
                    onPress={() => handleAddCustomTag(category.id)}
                    disabled={addingTag === category.id}
                  >
                    {addingTag === category.id ? (
                      <ActivityIndicator size="small" color={palette.brand[500]} />
                    ) : (
                      <Text style={styles.addTagBtnText}>+</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </View>
          ))}
        </Animated.View>
      )}

      <View style={styles.field}>
        <Text style={styles.label}>Nueva etiqueta (categoría + valor)</Text>
        <View style={{ gap: spacing[2] }}>
          <TextField
            label="Categoría"
            value={newCategoryName}
            onChange={setNewCategoryName}
            placeholder="Ej. Médico, Institución"
          />
          <TextField
            label="Valor"
            value={newTagValue}
            onChange={setNewTagValueField}
            placeholder="Valor"
          />
          <TouchableOpacity
            style={styles.newTagSubmitBtn}
            onPress={handleAddCategoryAndTag}
            disabled={addingCustomTag || !newCategoryName.trim() || !newTagValue.trim()}
          >
            {addingCustomTag ? (
              <ActivityIndicator size="small" color={colors.white} />
            ) : (
              <Text style={styles.newTagSubmitText}>Agregar</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

function ClassificationResultCard({
  result,
  catalogs,
  selectedTags,
  t,
}: Readonly<{
  result: NonNullable<DocumentFormState["classificationResult"]>;
  catalogs: DocumentFormState["catalogs"];
  selectedTags: readonly string[];
  t: ThemeContextValue;
}>) {
  const styles = useMemo(() => makeStyles(t), [t]);
  const appliedNames = catalogs.tags.flatMap((c) =>
    c.values.filter((v) => selectedTags.includes(v.id)).map((v) => `${c.name}: ${v.value}`)
  );
  const tagLabels = (result.customTags ?? []).map((ct) => ct.tagValueName ?? ct.tagValueId).filter(Boolean);
  const newTagLabels = (result.newTags ?? []).map((nt) => `${nt.categoryName ?? ""}: ${nt.value}`);
  const hasAnyTags = tagLabels.length > 0 || newTagLabels.length > 0 || appliedNames.length > 0;

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
          {appliedNames.length > 0 && <Text style={styles.resultLine}><Text style={styles.resultLabel}>Aplicadas: </Text>{appliedNames.join(", ")}</Text>}
        </>
      )}
    </View>
  );
}

function makeStyles(t: ThemeContextValue) {
  return StyleSheet.create({
    form:      { padding: spacing[5], backgroundColor: t.surface.bgCard, flex: 1 },
    formTitle: { fontSize: fontSize.xl, fontWeight: fontWeight.extrabold, color: t.text.primary, marginBottom: spacing[4] },

    aiBtn:         { backgroundColor: colors.violet[500], flexDirection: "row", alignItems: "center", justifyContent: "center", padding: spacing[3], borderRadius: radii.md, marginBottom: spacing[6], gap: spacing[2] },
    aiBtnDisabled: { opacity: 0.7 },
    aiBtnText:     { color: colors.white, fontWeight: fontWeight.bold, fontSize: 14 },

    classificationResult:      { backgroundColor: palette.brand[50], padding: 14, borderRadius: radii.md, marginBottom: spacing[5], borderWidth: 1, borderColor: palette.brand[200] },
    classificationResultTitle: { fontSize: 14, fontWeight: fontWeight.bold, color: palette.brand[700], marginBottom: spacing[2] },
    resultLine:                { fontSize: fontSize.sm, color: palette.brand[900], marginBottom: 4 },
    resultLabel:               { fontWeight: fontWeight.semibold },

    field: { marginBottom: spacing[5] },
    label: { fontSize: 14, fontWeight: fontWeight.semibold, color: t.text.secondary, marginBottom: spacing[2] },

    chipScroll:  { marginHorizontal: -20, paddingHorizontal: 20 },
    catalogLoadingState: { marginBottom: spacing[5], gap: spacing[3] },
    catalogLoadingText: { fontSize: fontSize.sm, color: t.text.secondary, fontWeight: fontWeight.medium },
    skeletonSection: { gap: spacing[2] },
    skeletonLabel: { width: 140, height: 14, borderRadius: radii.sm, backgroundColor: t.border.light },
    skeletonChipsRow: { flexDirection: "row", gap: spacing[2] },
    skeletonChip: { width: 86, height: 34, borderRadius: radii.full, backgroundColor: t.border.light },

    addTagContainer: { flexDirection: "row", alignItems: "center", backgroundColor: t.surface.bg, borderRadius: radii.full, paddingLeft: spacing[3], paddingRight: 4, borderWidth: 1, borderColor: t.border.medium, height: 36, marginLeft: 4 },
    addTagInput:     { fontSize: fontSize.sm, color: t.text.primary, width: 80, padding: 0 },
    addTagBtn:       { width: 28, height: 28, borderRadius: 14, backgroundColor: t.surface.bgCard, alignItems: "center", justifyContent: "center", marginLeft: 4 },
    addTagBtnText:   { color: palette.brand[500], fontSize: 18, fontWeight: fontWeight.bold },

    newTagSubmitBtn: { backgroundColor: palette.brand[500], paddingHorizontal: spacing[4], paddingVertical: spacing[3], borderRadius: radii.md, justifyContent: "center", alignSelf: "flex-start" },
    newTagSubmitText: { color: colors.white, fontWeight: fontWeight.semibold, fontSize: 14 },
  });
}
