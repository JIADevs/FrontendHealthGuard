import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  TextInput,
} from "react-native";
import { Sparkles } from "lucide-react-native";
import type { DocumentFormState, DocumentFormActions, FileSource } from "../hooks/useDocumentForm";
import { colors, surface, border, radii, spacing, fontSize, fontWeight } from "@healthguard/ui";

type Props = DocumentFormState &
  DocumentFormActions & {
    file?: FileSource;
  };

export function DocumentClassificationForm({
  file,
  catalogs,
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
  const currentType = catalogs.types.find((t) => t.id === selectedType);
  const canRunAI = !!file;

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
        />
      )}

      <View style={styles.field}>
        <Text style={styles.label}>Título del Documento</Text>
        <TextInput
          style={styles.input}
          value={title}
          onChangeText={setTitle}
          placeholder="Ej. Resultados Laboratorio"
          placeholderTextColor={colors.slate[400]}
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Tipo de Documento</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
          {catalogs.types.map((t) => (
            <TouchableOpacity
              key={t.id}
              style={[styles.chip, selectedType === t.id && styles.chipActive]}
              onPress={() => {
                setSelectedType(t.id);
                setSelectedSpecialty(undefined);
              }}
            >
              <Text style={[styles.chipText, selectedType === t.id && styles.chipTextActive]}>
                {t.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {currentType && currentType.specialties.length > 0 && (
        <View style={styles.field}>
          <Text style={styles.label}>Especialidad</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
            {currentType.specialties.map((s) => (
              <TouchableOpacity
                key={s.id}
                style={[styles.chip, selectedSpecialty === s.id && styles.chipActive]}
                onPress={() => setSelectedSpecialty(s.id)}
              >
                <Text style={[styles.chipText, selectedSpecialty === s.id && styles.chipTextActive]}>
                  {s.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {catalogs.tags.map((category) => (
        <View key={category.id} style={styles.field}>
          <Text style={styles.label}>{category.name}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
            {category.values.map((val) => (
              <TouchableOpacity
                key={val.id}
                style={[styles.chip, selectedTags.includes(val.id) && styles.chipActive]}
                onPress={() => toggleTag(val.id)}
              >
                <Text style={[styles.chipText, selectedTags.includes(val.id) && styles.chipTextActive]}>
                  {val.value}
                </Text>
              </TouchableOpacity>
            ))}

            <View style={styles.addTagContainer}>
              <TextInput
                style={styles.addTagInput}
                placeholder="Nueva..."
                placeholderTextColor={colors.slate[400]}
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
                  <ActivityIndicator size="small" color={colors.sky[500]} />
                ) : (
                  <Text style={styles.addTagBtnText}>+</Text>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      ))}

      <View style={styles.field}>
        <Text style={styles.label}>Nueva etiqueta (categoría + valor)</Text>
        <View style={styles.newTagRow}>
          <TextInput
            style={[styles.input, styles.newTagInput]}
            value={newCategoryName}
            onChangeText={setNewCategoryName}
            placeholder="Ej. Médico, Institución"
            placeholderTextColor={colors.slate[400]}
          />
          <TextInput
            style={[styles.input, styles.newTagInput]}
            value={newTagValue}
            onChangeText={setNewTagValueField}
            placeholder="Valor"
            placeholderTextColor={colors.slate[400]}
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
}: {
  result: NonNullable<DocumentFormState["classificationResult"]>;
  catalogs: DocumentFormState["catalogs"];
  selectedTags: string[];
}) {
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

const styles = StyleSheet.create({
  form:      { padding: spacing[5], backgroundColor: surface.bgCard, flex: 1 },
  formTitle: { fontSize: fontSize.xl, fontWeight: fontWeight.extrabold, color: colors.slate[900], marginBottom: spacing[4] },

  aiBtn:         { backgroundColor: colors.violet[500], flexDirection: "row", alignItems: "center", justifyContent: "center", padding: spacing[3], borderRadius: radii.md, marginBottom: spacing[6], gap: spacing[2] },
  aiBtnDisabled: { opacity: 0.7 },
  aiBtnText:     { color: colors.white, fontWeight: fontWeight.bold, fontSize: 14 },

  classificationResult:      { backgroundColor: colors.sky[50], padding: 14, borderRadius: radii.md, marginBottom: spacing[5], borderWidth: 1, borderColor: colors.sky[200] },
  classificationResultTitle: { fontSize: 14, fontWeight: fontWeight.bold, color: colors.sky[700], marginBottom: spacing[2] },
  resultLine:                { fontSize: fontSize.sm, color: colors.sky[900], marginBottom: 4 },
  resultLabel:               { fontWeight: fontWeight.semibold },

  field: { marginBottom: spacing[5] },
  label: { fontSize: 14, fontWeight: fontWeight.semibold, color: colors.slate[500], marginBottom: spacing[2] },
  input: {
    backgroundColor: colors.slate[100],
    padding: spacing[3],
    borderRadius: radii.md,
    fontSize: fontSize.md,
    color: colors.slate[900],
    borderWidth: 1,
    borderColor: border.medium,
  },

  chipScroll:  { marginHorizontal: -20, paddingHorizontal: 20 },
  chip:        { paddingHorizontal: spacing[4], paddingVertical: spacing[2], borderRadius: radii.full, backgroundColor: colors.slate[100], marginRight: spacing[2], borderWidth: 1, borderColor: border.medium },
  chipActive:  { backgroundColor: colors.sky[500], borderColor: colors.sky[500] },
  chipText:    { fontSize: fontSize.sm, color: colors.slate[600], fontWeight: fontWeight.semibold },
  chipTextActive: { color: colors.white },

  addTagContainer: { flexDirection: "row", alignItems: "center", backgroundColor: surface.bg, borderRadius: radii.full, paddingLeft: spacing[3], paddingRight: 4, borderWidth: 1, borderColor: border.medium, height: 36, marginLeft: 4 },
  addTagInput:     { fontSize: fontSize.sm, color: colors.slate[900], width: 80, padding: 0 },
  addTagBtn:       { width: 28, height: 28, borderRadius: 14, backgroundColor: surface.bgCard, alignItems: "center", justifyContent: "center", marginLeft: 4 },
  addTagBtnText:   { color: colors.sky[500], fontSize: 18, fontWeight: fontWeight.bold },

  newTagRow:       { flexDirection: "row", alignItems: "center", gap: spacing[2], flexWrap: "wrap" },
  newTagInput:     { flex: 1, minWidth: 100 },
  newTagSubmitBtn: { backgroundColor: colors.sky[500], paddingHorizontal: spacing[4], paddingVertical: spacing[3], borderRadius: radii.md, justifyContent: "center" },
  newTagSubmitText: { color: colors.white, fontWeight: fontWeight.semibold, fontSize: 14 },
});
