import { useEffect, useRef, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Check, FileText, Route } from "lucide-react-native";
import {
  BottomSheet,
  Button,
  IconTile,
  PressableScale,
  Skeleton,
  SkeletonGroup,
  TextField,
  nativeFont,
  spacing,
  useAppTheme,
  useSkeletonVisible,
  type BottomSheetHandle,
} from "@helu/ui";
import { useAcceptSuggestionMutation, useSuggestionSourceDocumentsQuery, type Mission, type MissionSuggestion } from "@helu/api";
import { notify } from "../../lib/notify";
import { haptics } from "../../lib/haptics";
import { useIsOnline } from "../states/OfflineBanner";
import { MissionTypeIcon } from "./MissionTypeIcon";
import { missionField, missionTypeLabel, missionTypeShort, missionTypeTone, originPhrase, shortDate } from "./missionCopy";

/**
 * «Crear misión desde una sugerencia» (DU-25, RF-57, DA-11): the type is fixed, the minimum datum, and
 * the documents of the source final step preselected («¿Usamos estos documentos de tu cita?»). The
 * confirmed ones are linked, never copied. Creating waits for the server; on error the sheet stays
 * open with «Reintentar».
 */
export function SuggestionAcceptSheet({
  suggestion,
  onCreated,
  onClose,
}: {
  suggestion: MissionSuggestion;
  onCreated: (mission: Mission) => void;
  onClose: () => void;
}) {
  const t = useAppTheme();
  const online = useIsOnline();
  const ref = useRef<BottomSheetHandle>(null);
  const accept = useAcceptSuggestionMutation();
  const docs = useSuggestionSourceDocumentsQuery(suggestion.id);
  const docsSkeleton = useSkeletonVisible(docs.isLoading);
  const field = missionField[suggestion.type];
  const [value, setValue] = useState("");
  const [touched, setTouched] = useState(false);
  const [selected, setSelected] = useState<Set<string> | null>(null);

  // Preselect every source document once they arrive (RF-57); the user unticks what does not apply.
  useEffect(() => {
    if (docs.data && selected === null) setSelected(new Set(docs.data.map((d) => d.id)));
  }, [docs.data, selected]);

  const source = suggestion.sourceMission;
  const sourceNoun = missionTypeShort[source.type].toLowerCase();
  const error = touched && field.required && !value.trim() ? "Escribe cuál es para poder crear la misión." : undefined;

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev ?? []);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const submit = () => {
    setTouched(true);
    if (field.required && !value.trim()) return;
    if (!online) return notify({ tone: "warning", message: "Sin conexión", description: "Revisa tu conexión y vuelve a intentarlo." });
    const documentIds = (docs.data ?? []).map((d) => d.id).filter((id) => selected?.has(id));
    accept.mutate(
      { suggestionId: suggestion.id, payload: { details: value.trim() ? { [field.key]: value.trim() } : {}, documentIds } },
      {
        onSuccess: (mission) => {
          haptics.success();
          ref.current?.close(() => onCreated(mission));
        },
        onError: () => notify({ tone: "error", message: "No se pudo crear la misión", action: { label: "Reintentar", onPress: submit } }),
      },
    );
  };

  const documents = docs.data ?? [];

  return (
    <BottomSheet
      ref={ref}
      eyebrow="NUEVA MISIÓN"
      title={missionTypeLabel[suggestion.type]}
      icon={
        <IconTile
          round
          size="lg"
          tone={missionTypeTone[suggestion.type]}
          icon={<MissionTypeIcon type={suggestion.type} size={22} color={t.text.secondary} />}
        />
      }
      onClose={onClose}
    >
      <View style={styles.body}>
        <View style={styles.origin}>
          <Route size={14} strokeWidth={2.2} color={t.text.muted} />
          <Text style={[styles.originText, { color: t.text.secondary }]}>
            Surgió de <Text style={{ color: t.text.primary, fontFamily: nativeFont("body", 600) }}>{originPhrase(source)}</Text>
          </Text>
        </View>
        <TextField
          label={field.label}
          value={value}
          onChange={setValue}
          placeholder={field.placeholder}
          error={error}
          autoCapitalize="sentences"
          returnKeyType="done"
        />
        {docsSkeleton ? (
          <SkeletonGroup label="Cargando documentos" style={{ gap: spacing[2] }}>
            <Skeleton width="60%" height={16} />
            <Skeleton width="100%" height={60} radius={14} />
          </SkeletonGroup>
        ) : documents.length > 0 ? (
          <View style={{ gap: spacing[2] }}>
            <Text style={[styles.label, { color: t.text.primary }]}>¿Usamos estos documentos de tu {sourceNoun}?</Text>
            {documents.map((d) => {
              const on = !!selected?.has(d.id);
              return (
                <PressableScale
                  key={d.id}
                  onPress={() => toggle(d.id)}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: on }}
                  accessibilityLabel={d.title}
                  style={[
                    styles.doc,
                    { borderColor: on ? t.brand.solid : t.border.default, backgroundColor: on ? t.brand.tint : t.surface.bgCard },
                  ]}
                >
                  <IconTile tone="document" icon={<FileText size={18} strokeWidth={2.2} color={t.text.secondary} />} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.docTitle, { color: t.text.primary }]} numberOfLines={2}>
                      {d.title}
                    </Text>
                    <Text style={[styles.docMeta, { color: t.text.secondary }]}>
                      {[shortDate(d.uploadedAt ?? d.addedAt ?? null), `de tu ${sourceNoun}`].filter(Boolean).join(" · ")}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.check,
                      { borderColor: on ? t.brand.solid : t.border.default, backgroundColor: on ? t.brand.solid : "transparent" },
                    ]}
                  >
                    {on ? <Check size={14} strokeWidth={3} color={t.text.onSolid} /> : null}
                  </View>
                </PressableScale>
              );
            })}
          </View>
        ) : null}
        <Button variant="primary" fullWidth onPress={submit} loading={accept.isPending} loadingLabel="Creando…">
          Crear misión
        </Button>
        {documents.length > 0 ? (
          <Text style={[styles.note, { color: t.text.secondary }]}>No se duplican: el mismo documento queda en las dos misiones.</Text>
        ) : null}
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  body: { gap: spacing[3] },
  origin: { flexDirection: "row", alignItems: "center", gap: 6 },
  originText: { flex: 1, fontSize: 13, lineHeight: 18, fontFamily: nativeFont("body", 400) },
  label: { fontSize: 14, fontFamily: nativeFont("body", 700) },
  doc: { flexDirection: "row", alignItems: "center", gap: spacing[3], padding: 10, borderRadius: 14, borderWidth: 1.5, minHeight: 44 },
  docTitle: { fontSize: 14, fontFamily: nativeFont("body", 600) },
  docMeta: { fontSize: 12, fontFamily: nativeFont("body", 400) },
  check: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, alignItems: "center", justifyContent: "center" },
  note: { fontSize: 12, lineHeight: 17, textAlign: "center", fontFamily: nativeFont("body", 400) },
});
