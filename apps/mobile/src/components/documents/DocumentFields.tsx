import { useMemo, useState, type Ref } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Plus, Sparkles, X } from "lucide-react-native";
import type { MissionType, TagCategoryOut } from "@helu/api";
import {
  Chip,
  ChoiceChips,
  DatePicker,
  Skeleton,
  SkeletonGroup,
  TextField,
  nativeFont,
  radii,
  spacing,
  useAppTheme,
  type ThemeContextValue,
} from "@helu/ui";
import { SelectField } from "../SelectField";
import { TagPickerSheet } from "./TagPickerSheet";
import { CATEGORY_HINT, CATEGORY_META, documentTypeLabel, typeCategory } from "./documentCategories";
import { MissionTypeIcon } from "../missions/MissionTypeIcon";

/** Mission each subtype suggests, for its chip icon (mirrors the backend's SUBTYPE_MISSION_TYPE). */
const SUBTYPE_MISSION: Record<string, MissionType> = {
  Examen: "medical_exam",
  Procedimiento: "medical_exam",
  Terapia: "therapy",
  "Cita con especialista": "medical_appointment",
  Cita: "medical_appointment",
  Medicamento: "medication",
};

/** Label of the subtype field for the document types that suggest a mission (mockup 4c «D1»). */
const SUBTYPE_LABEL: Record<string, string> = {
  medical_order: "Orden de (opcional)",
  eps_authorization: "Autorización para (opcional)",
};

export interface DocumentFieldValues {
  title: string;
  typeId: string | undefined;
  /** «Orden de» / «Autorización para»: only for the types that suggest a mission (Misiones DU-45). */
  subtypeId?: string | undefined;
  specialtyId: string | undefined;
  /** YYYY-MM-DD */
  date: string;
  treatmentId: string | null;
  tagIds: string[];
  description: string;
}

export interface DocumentFieldsProps {
  values: DocumentFieldValues;
  onChange: (patch: Partial<DocumentFieldValues>) => void;
  types: {
    id: string;
    name: string;
    code?: string | null;
    subtypes?: { id: string; name: string }[];
    specialties: { id: string; name: string }[];
  }[];
  treatments: { id: string; name: string }[];
  tagCategories: TagCategoryOut[];
  onAddTagValue: (categoryId: string, value: string) => Promise<void>;
  addingTagCategoryId: string | null;
  /** Fields the AI filled in, marked so the person reviews them (mockup «La IA lo clasificó…»). */
  aiFilled?: { title?: boolean; type?: boolean; subtype?: boolean; specialty?: boolean };
  titleError?: string;
  /** «Elige el tipo del documento.»: the type is required (it decides the mission suggestion). */
  typeError?: string;
  onTitleBlur?: () => void;
  titleRef?: Ref<unknown>;
  /** While the file uploads and the AI reads it, the fields are a skeleton. */
  loading?: boolean;
}

/**
 * Card «Datos del documento» (mockups «Subir documento» and «Editar documento»): one column with
 * Título, Tipo, Fecha, Especialidad, Tratamiento, Etiquetas and Descripción, everything but the
 * title and the type marked «(opcional)». Server lists (type, specialty, treatment) use the selector
 * sheet with search; the subtype, four fixed options, uses option chips (formularios.md §2).
 */
export function DocumentFields({
  values,
  onChange,
  types,
  treatments,
  tagCategories,
  onAddTagValue,
  addingTagCategoryId,
  aiFilled,
  titleError,
  typeError,
  onTitleBlur,
  titleRef,
  loading,
}: DocumentFieldsProps) {
  const t = useAppTheme();
  const styles = useMemo(() => makeStyles(t), [t]);
  const [tagsOpen, setTagsOpen] = useState(false);
  const selectedType = types.find((tp) => tp.id === values.typeId);
  const specialties = selectedType?.specialties ?? [];
  // Mockup 4c «D1»: the subtype field appears only for an order or an authorization.
  const subtypeLabel = selectedType?.code ? SUBTYPE_LABEL[selectedType.code] : undefined;
  const subtypes = subtypeLabel ? selectedType?.subtypes ?? [] : [];
  const tagName = useMemo(
    () => new Map(tagCategories.flatMap((c) => (c.values ?? []).map((v) => [v.id, v.value] as const))),
    [tagCategories],
  );

  if (loading) {
    return (
      <View style={styles.card}>
        <Text style={styles.h3}>Datos del documento</Text>
        {/* §6c: the fields stay as blocks until the AI finishes reading the document. */}
        <SkeletonGroup label="La IA está leyendo el documento" style={styles.fields}>
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} height={48} radius={14} />
          ))}
        </SkeletonGroup>
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <Text style={styles.h3} accessibilityRole="header">
        Datos del documento
      </Text>
      <View style={styles.fields}>
        <View>
          <TextField
            label="Título"
            value={values.title}
            onChange={(title) => onChange({ title })}
            placeholder="Ej: Orden médica · Resonancia de rodilla"
            autoCapitalize="sentences"
            error={titleError}
            onBlur={onTitleBlur}
            inputRef={titleRef}
            returnKeyType="next"
          />
          {aiFilled?.title ? <AiMark /> : null}
        </View>

        <View>
          <SelectField
            label="Tipo"
            placeholder="Elige el tipo"
            sheetTitle="Tipo de documento"
            options={[...types]
              // «Otro documento» goes last, as in the mockup, whatever the server's order.
              .sort((a, b) => Number(typeCategory(a.name) === "other") - Number(typeCategory(b.name) === "other"))
              .map((tp) => {
                // Mockup 13 «1B»: each type with its gray icon and a short help line.
                const category = typeCategory(tp.name);
                const Icon = CATEGORY_META[category].icon;
                return {
                  value: tp.id,
                  label: documentTypeLabel(tp.name) ?? tp.name,
                  icon: <Icon size={19} strokeWidth={2.2} color={t.text.secondary} />,
                  description: CATEGORY_HINT[category],
                };
              })}
            value={values.typeId}
            onChange={(typeId) => onChange({ typeId, subtypeId: undefined, specialtyId: undefined })}
            error={typeError}
          />
          {aiFilled?.type ? <AiMark /> : null}
        </View>

        {subtypeLabel && subtypes.length > 0 ? (
          <View style={styles.group}>
            <Text style={styles.lbl}>{subtypeLabel}</Text>
            {/* Optional: tapping the chosen chip again clears it. */}
            {/* Mockup 13 «2C»: the icon of the mission each subtype suggests. */}
            <ChoiceChips
              options={subtypes.map((s) => {
                const mission = SUBTYPE_MISSION[s.name];
                return {
                  value: s.id,
                  label: s.name,
                  icon: mission ? <MissionTypeIcon type={mission} size={14} color={t.text.secondary} /> : undefined,
                };
              })}
              value={values.subtypeId ?? null}
              onChange={(subtypeId) => onChange({ subtypeId: subtypeId === values.subtypeId ? undefined : subtypeId })}
            />
            <Text style={styles.help}>Con esto te sugerimos la misión correcta.</Text>
            {aiFilled?.subtype ? <AiMark /> : null}
          </View>
        ) : null}

        <DatePicker label="Fecha (opcional)" value={values.date} onChange={(date) => onChange({ date })} />

        {specialties.length > 0 ? (
          <View>
            <SelectField
              label="Especialidad (opcional)"
              placeholder="Elige la especialidad"
              options={specialties.map((s) => ({ value: s.id, label: s.name }))}
              value={values.specialtyId}
              onChange={(specialtyId) => onChange({ specialtyId })}
            />
            {aiFilled?.specialty ? <AiMark /> : null}
          </View>
        ) : null}

        {treatments.length > 0 ? (
          <SelectField
            label="Tratamiento (opcional)"
            placeholder="Sin tratamiento"
            options={treatments.map((tr) => ({ value: tr.id, label: tr.name }))}
            value={values.treatmentId ?? undefined}
            onChange={(treatmentId) => onChange({ treatmentId })}
          />
        ) : null}

        <View style={styles.group}>
          <Text style={styles.lbl}>Etiquetas (opcional)</Text>
          <View style={styles.chips}>
            {values.tagIds.map((id) => (
              <Pressable
                key={id}
                onPress={() => onChange({ tagIds: values.tagIds.filter((x) => x !== id) })}
                accessibilityRole="button"
                accessibilityLabel={`Quitar la etiqueta ${tagName.get(id) ?? ""}`}
                hitSlop={6}
              >
                <Chip label={tagName.get(id) ?? "Etiqueta"} tone="neutral" icon={<X size={11} strokeWidth={2.6} color={t.text.onMuted} />} />
              </Pressable>
            ))}
            <Chip
              label="Agregar"
              variant="option"
              icon={<Plus size={13} strokeWidth={2.6} color={t.text.secondary} />}
              onPress={() => setTagsOpen(true)}
            />
          </View>
        </View>

        <TextField
          label="Descripción (opcional)"
          value={values.description}
          onChange={(description) => onChange({ description })}
          placeholder="Ej: Orden del Dr. Mejía para la rodilla"
          multiline
          numberOfLines={3}
          autoCapitalize="sentences"
        />
      </View>

      {tagsOpen ? (
        <TagPickerSheet
          categories={tagCategories}
          selected={values.tagIds}
          onChange={(tagIds) => onChange({ tagIds })}
          onAddValue={onAddTagValue}
          addingCategoryId={addingTagCategoryId}
          onClose={() => setTagsOpen(false)}
        />
      ) : null}
    </View>
  );
}

/** Under a field the AI filled: the person should check it before saving. */
function AiMark() {
  const t = useAppTheme();
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 6 }}>
      <Sparkles size={13} color={t.accent.aiFg} />
      <Text style={{ fontSize: 12, fontFamily: nativeFont("body", 600), color: t.accent.aiFg }}>Lo completó la IA</Text>
    </View>
  );
}

function makeStyles(t: ThemeContextValue) {
  return StyleSheet.create({
    card: {
      backgroundColor: t.surface.bgCard,
      borderColor: t.border.default,
      borderRadius: radii.card,
      borderWidth: 1,
      borderBottomWidth: 4,
      padding: spacing[4],
      gap: spacing[4],
    },
    h3: { fontSize: 16, fontFamily: nativeFont("heading", 800), color: t.text.primary },
    fields: { gap: spacing[4] },
    group: { gap: spacing[2] },
    lbl: { fontSize: 13, fontFamily: nativeFont("heading", 800), color: t.text.primary },
    help: { fontSize: 13, lineHeight: 18, fontFamily: nativeFont("body", 400), color: t.text.secondary },
    chips: { flexDirection: "row", flexWrap: "wrap", gap: spacing[2], alignItems: "center" },
  });
}
