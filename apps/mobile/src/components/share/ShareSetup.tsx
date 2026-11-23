import { useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Backpack as BackpackIcon, Check } from "lucide-react-native";
import { useQueryClient } from "@tanstack/react-query";
import {
  addDocToBackpack,
  createBackpack,
  invalidateShareQueries,
  isApiError,
  shareBackpackWithOptions,
  shareDocumentWithOptions,
  type Document,
  type ShareExpiresIn,
  type ShareResourceType,
} from "@helu/api";
import {
  BOTTOM_ACTION_BAR_HEIGHT,
  BottomActionBar,
  Chip,
  IconTile,
  fontSize,
  nativeFont,
  radii,
  spacing,
  useAppTheme,
  type ThemeContextValue,
} from "@helu/ui";
import { ScreenHeader } from "../ScreenHeader";
import { MascotHint } from "../brand/MascotHint";
import { CATEGORY_META, categoryOf } from "../documents/documentCategories";
import { documentDateLabel } from "../documents/utils/groupDocumentsByDate";
import { documentCountLabel } from "../backpacks/backpackCopy";
import { notify } from "../../lib/notify";
import { SHARE_EXPIRATION_OPTIONS } from "./shareUtils";

/** What step 2 shares: one or several documents, or a backpack. */
export type ShareTarget =
  | { kind: "documents"; documents: Pick<Document, "id" | "title" | "kind" | "documentType" | "documentDate" | "uploadedAt">[] }
  | { kind: "backpack"; id: string; name: string; documentCount: number };

export interface ShareCreated {
  shareUrl: string;
  expiresAt: string | null;
  resourceType: ShareResourceType;
  title: string;
  documentCount: number;
  expiresIn: ShareExpiresIn;
}

export interface ShareSetupProps {
  target: ShareTarget;
  /** «Paso 2 de 3» when the flow started at step 1; a document or backpack opens step 2 directly. */
  fromStepOne: boolean;
  onCreated: (result: ShareCreated) => void;
}

const MONTHS_SHORT = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sept", "oct", "nov", "dic"];

/**
 * Mockup «Configurar enlace» (paso 2 de 3): what is shared, «EXPIRACIÓN» (1 hora · 24 horas ·
 * 7 días, #61 decision 2), «PERMISOS» with «Ver documentos · Incluido» (no download, decision 3),
 * the hint about revoking and the fixed «Generar enlace».
 */
export function ShareSetup({ target, fromStepOne, onCreated }: ShareSetupProps) {
  const t = useAppTheme();
  const styles = useMemo(() => makeStyles(t), [t]);
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const [expiresIn, setExpiresIn] = useState<ShareExpiresIn>("24h");
  const [creating, setCreating] = useState(false);

  const count = target.kind === "backpack" ? target.documentCount : target.documents.length;
  const subtitle = `${fromStepOne ? "Paso 2 de 3 · " : ""}${documentCountLabel(count)}`;

  const generate = async () => {
    setCreating(true);
    try {
      let resourceType: ShareResourceType;
      let title: string;
      let result: { shareUrl: string; expiresAt: string | null };
      if (target.kind === "backpack") {
        resourceType = "backpack";
        title = target.name;
        result = await shareBackpackWithOptions(target.id, { expiresIn });
      } else if (target.documents.length === 1) {
        resourceType = "document";
        title = target.documents[0]!.title;
        result = await shareDocumentWithOptions(target.documents[0]!.id, { expiresIn });
      } else {
        // #61 decision 1: several documents travel in a backpack «Compartido · 23 nov».
        const now = new Date();
        title = `Compartido · ${now.getDate()} ${MONTHS_SHORT[now.getMonth()]}`;
        const backpack = await createBackpack({ name: title, description: "Creada al compartir varios documentos.", type: "CUSTOM" });
        for (const doc of target.documents) await addDocToBackpack(backpack.id, doc.id);
        resourceType = "backpack";
        result = await shareBackpackWithOptions(backpack.id, { expiresIn });
        void qc.invalidateQueries({ queryKey: ["backpacks"] });
      }
      invalidateShareQueries(qc);
      onCreated({ ...result, resourceType, title, documentCount: count, expiresIn });
    } catch (err) {
      notify({
        tone: "error",
        message: "No se pudo generar el enlace",
        description: isApiError(err) ? "Intenta de nuevo en un momento." : "Revisa tu conexión e intenta de nuevo.",
        action: { label: "Reintentar", onPress: () => void generate() },
      });
    } finally {
      setCreating(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScreenHeader title="Compartir" subtitle={subtitle} />
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: BOTTOM_ACTION_BAR_HEIGHT + insets.bottom + spacing[6] }]}>
        <View style={styles.tightCard}>
          {target.kind === "backpack" ? (
            <View style={styles.line}>
              <IconTile tone="backpack" icon={<BackpackIcon size={19} strokeWidth={2.2} color={t.accent.backpackFg} />} />
              <View style={styles.copy}>
                <Text style={styles.title} numberOfLines={2}>
                  {target.name}
                </Text>
                <Text style={styles.meta}>{documentCountLabel(target.documentCount)}</Text>
              </View>
            </View>
          ) : (
            target.documents.map((doc) => {
              const Icon = CATEGORY_META[categoryOf(doc)].icon;
              return (
                <View key={doc.id} style={styles.line}>
                  <IconTile tone="document" icon={<Icon size={19} strokeWidth={2.2} color={t.accent.docFg} />} />
                  <View style={styles.copy}>
                    <Text style={styles.title} numberOfLines={2}>
                      {doc.title}
                    </Text>
                    <Text style={styles.meta}>{documentDateLabel(doc)}</Text>
                  </View>
                </View>
              );
            })
          )}
        </View>

        <View style={styles.group}>
          <Text style={styles.eyebrow}>Expiración</Text>
          <View style={styles.chips} accessibilityRole="radiogroup" accessibilityLabel="Expiración del enlace">
            {SHARE_EXPIRATION_OPTIONS.map((o) => (
              <Chip
                key={o.value}
                label={o.label}
                variant="option"
                selectionMode="single"
                selected={expiresIn === o.value}
                onPress={() => setExpiresIn(o.value)}
              />
            ))}
          </View>
        </View>

        <View style={styles.group}>
          <Text style={styles.eyebrow}>Permisos</Text>
          <View style={[styles.tightCard, styles.permRow]}>
            <View style={styles.copy}>
              <Text style={styles.title}>Ver documentos</Text>
              <Text style={styles.meta}>Quien reciba el enlace puede verlos, no descargarlos.</Text>
            </View>
            <Chip label="Incluido" tone="neutral" icon={<Check size={12} strokeWidth={3} color={t.text.onMuted} />} />
          </View>
        </View>

        <MascotHint text="Puedes revocar el acceso cuando quieras desde Compartidos." />
      </ScrollView>

      <BottomActionBar
        primary={{
          label: "Generar enlace",
          onPress: () => void generate(),
          loading: creating,
          loadingLabel: "Generando…",
          disabled: creating || count === 0,
        }}
      />
    </SafeAreaView>
  );
}

function makeStyles(t: ThemeContextValue) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: t.surface.bg },
    content: { padding: spacing[4], paddingTop: spacing[2], gap: spacing[5] },
    tightCard: {
      backgroundColor: t.surface.bgCard,
      borderColor: t.border.default,
      borderRadius: radii.card,
      borderWidth: 1,
      borderBottomWidth: 4,
      paddingHorizontal: 14,
      paddingVertical: 8,
    },
    permRow: { flexDirection: "row", alignItems: "center", gap: spacing[3], paddingVertical: 14 },
    line: { flexDirection: "row", alignItems: "center", gap: spacing[3], paddingVertical: 6 },
    copy: { flex: 1, minWidth: 0, gap: 2 },
    title: { fontSize: 14, lineHeight: 18, fontFamily: nativeFont("body", 600), color: t.text.primary },
    meta: { fontSize: fontSize.sm, lineHeight: 18, fontFamily: nativeFont("body", 400), color: t.text.secondary },
    group: { gap: spacing[2] },
    chips: { flexDirection: "row", flexWrap: "wrap", gap: spacing[2] },
    eyebrow: {
      fontSize: fontSize.xs,
      fontFamily: nativeFont("heading", 900),
      letterSpacing: 0.9,
      textTransform: "uppercase",
      color: t.text.secondary,
    },
  });
}
