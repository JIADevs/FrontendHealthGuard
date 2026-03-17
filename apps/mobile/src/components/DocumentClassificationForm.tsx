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

type Props = DocumentFormState &
  DocumentFormActions & {
    file: FileSource;
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

  return (
    <View style={styles.form}>
      <Text style={styles.formTitle}>Clasificar Documento</Text>

      {/* AI Button */}
      <TouchableOpacity
        style={[styles.aiBtn, classifying && styles.aiBtnDisabled]}
        onPress={() => handleAIClassify(file)}
        disabled={classifying}
      >
        <Sparkles color="#fff" size={20} />
        <Text style={styles.aiBtnText}>
          {classifying ? "Clasificando..." : "Clasificar con IA"}
        </Text>
      </TouchableOpacity>

      {/* AI Result */}
      {classificationResult && (
        <ClassificationResultCard
          result={classificationResult}
          catalogs={catalogs}
          selectedTags={selectedTags}
        />
      )}

      {/* Title */}
      <View style={styles.field}>
        <Text style={styles.label}>Título del Documento</Text>
        <TextInput
          style={styles.input}
          value={title}
          onChangeText={setTitle}
          placeholder="Ej. Resultados Laboratorio"
          placeholderTextColor="#94a3b8"
        />
      </View>

      {/* Document Type */}
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

      {/* Specialty */}
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

      {/* Tags per category */}
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
                <Text
                  style={[styles.chipText, selectedTags.includes(val.id) && styles.chipTextActive]}
                >
                  {val.value}
                </Text>
              </TouchableOpacity>
            ))}

            <View style={styles.addTagContainer}>
              <TextInput
                style={styles.addTagInput}
                placeholder="Nueva..."
                placeholderTextColor="#94a3b8"
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
                  <ActivityIndicator size="small" color="#0ea5e9" />
                ) : (
                  <Text style={styles.addTagBtnText}>+</Text>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      ))}

      {/* New category + tag */}
      <View style={styles.field}>
        <Text style={styles.label}>Nueva etiqueta (categoría + valor)</Text>
        <View style={styles.newTagRow}>
          <TextInput
            style={[styles.input, styles.newTagInput]}
            value={newCategoryName}
            onChangeText={setNewCategoryName}
            placeholder="Ej. Médico, Institución"
            placeholderTextColor="#94a3b8"
          />
          <TextInput
            style={[styles.input, styles.newTagInput]}
            value={newTagValue}
            onChangeText={setNewTagValueField}
            placeholder="Valor"
            placeholderTextColor="#94a3b8"
          />
          <TouchableOpacity
            style={styles.newTagSubmitBtn}
            onPress={handleAddCategoryAndTag}
            disabled={addingCustomTag || !newCategoryName.trim() || !newTagValue.trim()}
          >
            {addingCustomTag ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.newTagSubmitText}>Agregar</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

// ── Classification result sub-component ──────────────────

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
    c.values
      .filter((v) => selectedTags.includes(v.id))
      .map((v) => `${c.name}: ${v.value}`)
  );

  const tagLabels = (result.customTags ?? [])
    .map((ct) => ct.tagValueName ?? ct.tagValueId)
    .filter(Boolean);

  const newTagLabels = (result.newTags ?? []).map(
    (nt) => `${nt.categoryName ?? ""}: ${nt.value}`
  );

  const hasAnyTags = tagLabels.length > 0 || newTagLabels.length > 0 || appliedNames.length > 0;

  return (
    <View style={styles.classificationResult}>
      <Text style={styles.classificationResultTitle}>Resultado de la clasificación</Text>

      {result.type && (
        <Text style={styles.resultLine}>
          <Text style={styles.resultLabel}>Tipo: </Text>
          {result.type.name}
        </Text>
      )}

      {(result.specialties ?? []).length > 0 && (
        <Text style={styles.resultLine}>
          <Text style={styles.resultLabel}>Especialidad: </Text>
          {(result.specialties ?? []).map((s) => s.name).join(", ")}
        </Text>
      )}

      {hasAnyTags && (
        <>
          {tagLabels.length > 0 && (
            <Text style={styles.resultLine}>
              <Text style={styles.resultLabel}>Etiquetas: </Text>
              {tagLabels.join(", ")}
            </Text>
          )}
          {newTagLabels.length > 0 && (
            <Text style={styles.resultLine}>
              <Text style={styles.resultLabel}>Nuevas sugeridas: </Text>
              {newTagLabels.join(", ")}
            </Text>
          )}
          {appliedNames.length > 0 && (
            <Text style={styles.resultLine}>
              <Text style={styles.resultLabel}>Aplicadas: </Text>
              {appliedNames.join(", ")}
            </Text>
          )}
        </>
      )}
    </View>
  );
}

// ── Styles ───────────────────────────────────────────────

const styles = StyleSheet.create({
  form: {
    padding: 20,
    backgroundColor: "#fff",
    flex: 1,
  },
  formTitle: { fontSize: 20, fontWeight: "800", color: "#0f172a", marginBottom: 16 },

  aiBtn: {
    backgroundColor: "#8b5cf6",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
    borderRadius: 12,
    marginBottom: 24,
    gap: 8,
  },
  aiBtnDisabled: { opacity: 0.7 },
  aiBtnText: { color: "#fff", fontWeight: "700", fontSize: 14 },

  classificationResult: {
    backgroundColor: "#f0f9ff",
    padding: 14,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#bae6fd",
  },
  classificationResultTitle: { fontSize: 14, fontWeight: "700", color: "#0369a1", marginBottom: 8 },
  resultLine: { fontSize: 13, color: "#0c4a6e", marginBottom: 4 },
  resultLabel: { fontWeight: "600" },

  field: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: "600", color: "#64728b", marginBottom: 8 },
  input: {
    backgroundColor: "#f1f5f9",
    padding: 12,
    borderRadius: 12,
    fontSize: 16,
    color: "#0f172a",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },

  chipScroll: { marginHorizontal: -20, paddingHorizontal: 20 },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "#f1f5f9",
    marginRight: 8,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  chipActive: { backgroundColor: "#0ea5e9", borderColor: "#0ea5e9" },
  chipText: { fontSize: 13, color: "#475569", fontWeight: "600" },
  chipTextActive: { color: "#fff" },

  addTagContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    borderRadius: 999,
    paddingLeft: 12,
    paddingRight: 4,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    height: 36,
    marginLeft: 4,
  },
  addTagInput: { fontSize: 13, color: "#0f172a", width: 80, padding: 0 },
  addTagBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 4,
  },
  addTagBtnText: { color: "#0ea5e9", fontSize: 18, fontWeight: "bold" },

  newTagRow: { flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" },
  newTagInput: { flex: 1, minWidth: 100 },
  newTagSubmitBtn: {
    backgroundColor: "#0ea5e9",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    justifyContent: "center",
  },
  newTagSubmitText: { color: "#fff", fontWeight: "600", fontSize: 14 },
});
