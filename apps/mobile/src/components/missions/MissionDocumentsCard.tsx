import { useEffect, useRef } from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated, { FadeIn, FadeOut, LinearTransition } from "react-native-reanimated";
import { Plus, QrCode } from "lucide-react-native";
import { Chip, motion, nativeFont, spacing, useAppTheme, useHighlight } from "@helu/ui";
import { BackpackDocumentLine } from "../backpacks/BackpackDocumentLine";
import { MissionLink } from "./MissionLink";
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
 *
 * Motion (movimiento §5 «Lista que se actualiza»): a document added while the card is on screen
 * comes in highlighted (1,2 s border); a removed one collapses with a fade. Nothing moves on load.
 */
export function MissionDocumentsCard({ documents, onAttach, onShare, onOpen, onRemove }: MissionDocumentsCardProps) {
  const t = useAppTheme();
  const empty = documents.length === 0;
  // Ids already on screen: only documents that arrive later are «new».
  const seen = useRef<Set<string> | null>(null);
  const fresh = new Set<string>();
  if (seen.current) documents.forEach((d) => !seen.current!.has(d.id) && fresh.add(d.id));
  useEffect(() => {
    seen.current = new Set(documents.map((d) => d.id));
  }, [documents]);

  return (
    <Animated.View
      layout={LinearTransition.duration(motion.base)}
      style={[styles.card, { backgroundColor: t.surface.bgCard, borderColor: t.border.default }]}
    >
      <View style={styles.head}>
        <Text style={[styles.title, { color: t.text.primary }]} accessibilityRole="header">
          Documentos de la misión
        </Text>
        <Chip label={String(documents.length)} tone="neutral" />
      </View>
      {empty ? (
        <Animated.Text entering={FadeIn.duration(motion.fast)} style={[styles.empty, { color: t.text.secondary }]}>
          Adjunta órdenes, fórmulas o resultados para tenerlos juntos y compartirlos con un QR.
        </Animated.Text>
      ) : (
        documents.map((doc) => (
          <DocumentRow
            key={doc.id}
            doc={doc}
            fresh={fresh.has(doc.id)}
            onOpen={() => onOpen(doc.id)}
            onRemove={() => onRemove(doc)}
          />
        ))
      )}
      <View style={[styles.actions, empty && { justifyContent: "flex-start" }]}>
        <MissionLink icon={<Plus size={15} strokeWidth={2.6} color={t.brand.text} />} label="Adjuntar" onPress={onAttach} />
        {empty ? null : (
          <MissionLink
            icon={<QrCode size={15} strokeWidth={2.4} color={t.brand.text} />}
            label="Compartir documentos"
            onPress={onShare}
          />
        )}
      </View>
    </Animated.View>
  );
}

function DocumentRow({
  doc,
  fresh,
  onOpen,
  onRemove,
}: {
  doc: MissionDocumentView;
  fresh: boolean;
  onOpen: () => void;
  onRemove: () => void;
}) {
  const highlight = useHighlight(fresh);
  return (
    <Animated.View
      entering={fresh ? FadeIn.duration(motion.fast) : undefined}
      exiting={FadeOut.duration(motion.instant)}
      layout={LinearTransition.duration(motion.base)}
    >
      <BackpackDocumentLine document={doc} onPress={onOpen} onRemove={onRemove} removeLabel="de la misión" />
      {fresh ? <Animated.View pointerEvents="none" style={[highlight, { borderRadius: 14 }]} /> : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: { gap: spacing[2], paddingHorizontal: 14, paddingVertical: 14, borderRadius: 18, borderWidth: 1, borderBottomWidth: 4 },
  head: { flexDirection: "row", alignItems: "center", gap: spacing[2] },
  title: { flex: 1, fontSize: 17, fontFamily: nativeFont("heading", 800) },
  empty: { fontSize: 14, lineHeight: 20, fontFamily: nativeFont("body", 400) },
  actions: { flexDirection: "row", justifyContent: "space-between", marginHorizontal: -10 },
});
