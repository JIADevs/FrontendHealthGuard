import { Pressable, StyleSheet, Text, View } from "react-native";
import { Plus, QrCode } from "lucide-react-native";
import { Chip, nativeFont, spacing, useAppTheme } from "@helu/ui";
import { BackpackDocumentLine } from "../backpacks/BackpackDocumentLine";
import type { MissionDocumentView } from "./missionDocuments";

export interface MissionDocumentsCardProps {
  documents: MissionDocumentView[];
  onAttach: () => void;
  onShare: () => void;
  onOpen: (documentId: string) => void;
  onRemove: (document: MissionDocumentView) => void;
}

/**
 * «Documentos de la misión» (mockups «Misión de cita · detalle», «Misión completada · detalle»):
 * what the mission gathered, with «Adjuntar» and «Compartir documentos» (RF-60, RF-63). It stays on a
 * completed mission, so documents can still be added and shared without reopening it (DU-18).
 */
export function MissionDocumentsCard({ documents, onAttach, onShare, onOpen, onRemove }: MissionDocumentsCardProps) {
  const t = useAppTheme();
  const empty = documents.length === 0;
  return (
    <View style={[styles.card, { backgroundColor: t.surface.bgCard, borderColor: t.border.default }]}>
      <View style={styles.head}>
        <Text style={[styles.title, { color: t.text.primary }]} accessibilityRole="header">
          Documentos de la misión
        </Text>
        <Chip label={String(documents.length)} tone="neutral" />
      </View>
      {empty ? (
        <Text style={[styles.empty, { color: t.text.secondary }]}>
          Adjunta órdenes, fórmulas o resultados para tenerlos juntos y compartirlos con un QR.
        </Text>
      ) : (
        documents.map((doc) => (
          <BackpackDocumentLine
            key={doc.id}
            document={doc}
            onPress={() => onOpen(doc.id)}
            onRemove={() => onRemove(doc)}
            removeLabel="de la misión"
          />
        ))
      )}
      <View style={[styles.actions, empty && { justifyContent: "flex-start" }]}>
        <Pressable onPress={onAttach} hitSlop={10} accessibilityRole="button" style={styles.link}>
          <Plus size={15} strokeWidth={2.6} color={t.brand.text} />
          <Text style={[styles.linkText, { color: t.brand.text }]}>Adjuntar</Text>
        </Pressable>
        {empty ? null : (
          <Pressable onPress={onShare} hitSlop={10} accessibilityRole="button" style={styles.link}>
            <QrCode size={15} strokeWidth={2.4} color={t.brand.text} />
            <Text style={[styles.linkText, { color: t.brand.text }]}>Compartir documentos</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { gap: spacing[2], paddingHorizontal: 14, paddingVertical: 14, borderRadius: 18, borderWidth: 1, borderBottomWidth: 4 },
  head: { flexDirection: "row", alignItems: "center", gap: spacing[2] },
  title: { flex: 1, fontSize: 17, fontFamily: nativeFont("heading", 800) },
  empty: { fontSize: 14, lineHeight: 20, fontFamily: nativeFont("body", 400) },
  actions: { flexDirection: "row", justifyContent: "space-between", paddingTop: spacing[1] },
  link: { flexDirection: "row", alignItems: "center", gap: 6, minHeight: 32 },
  linkText: { fontSize: 13, fontFamily: nativeFont("body", 700) },
});
