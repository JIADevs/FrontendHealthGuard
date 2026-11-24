import { useRef } from "react";
import { StyleSheet, Text, View } from "react-native";
import { QrCode } from "lucide-react-native";
import type { Mission } from "@helu/api";
import { BottomSheet, Button, IconTile, nativeFont, spacing, useAppTheme, type BottomSheetHandle } from "@helu/ui";
import { CATEGORY_META, categoryOf } from "../documents/documentCategories";
import { documentDateLabel } from "../documents/utils/groupDocumentsByDate";
import type { MissionDocumentView } from "./missionDocuments";

const SHARE_TITLE: Record<Mission["type"], string> = {
  medical_appointment: "Documentos de tu cita",
  medical_exam: "Documentos de tu examen",
  medication: "Documentos de tu medicamento",
  therapy: "Documentos de tu terapia",
};

/**
 * Mockup «Compartir documentos de la misión»: what goes in the link and «Crear enlace y QR», which
 * continues in Compartir («Configurar enlace» → «Enlace listo · QR», RF-63). The server composes or
 * reuses the mission backpack. The device-only warning (RF-66) waits for local storage (DU-40).
 */
export function MissionShareSheet({
  mission,
  documents,
  onClose,
  onContinue,
}: {
  mission: Mission;
  documents: MissionDocumentView[];
  onClose: () => void;
  onContinue: () => void;
}) {
  const t = useAppTheme();
  const ref = useRef<BottomSheetHandle>(null);
  return (
    <BottomSheet
      ref={ref}
      eyebrow="COMPARTIR"
      title={SHARE_TITLE[mission.type]}
      icon={<IconTile round size="lg" tone="brand" icon={<QrCode size={22} strokeWidth={2.2} color={t.brand.text} />} />}
      onClose={onClose}
    >
      <View style={styles.body}>
        <Text style={[styles.text, { color: t.text.primary }]}>
          Armamos una mochila con estos documentos y te damos un enlace y un QR para tu médico.
        </Text>
        <View>
          {documents.map((doc) => {
            const Icon = CATEGORY_META[categoryOf(doc)].icon;
            return (
              <View key={doc.id} style={styles.row}>
                <IconTile tone="document" icon={<Icon size={19} strokeWidth={2.2} color={t.accent.docFg} />} />
                <View style={styles.copy}>
                  <Text style={[styles.title, { color: t.text.primary }]} numberOfLines={2}>
                    {doc.title}
                  </Text>
                  <Text style={[styles.meta, { color: t.text.secondary }]}>{documentDateLabel(doc)}</Text>
                </View>
              </View>
            );
          })}
        </View>
        <Button
          variant="primary"
          fullWidth
          icon={<QrCode size={16} strokeWidth={2.4} color={t.text.onSolid} />}
          onPress={() => ref.current?.close(onContinue)}
        >
          Crear enlace y QR
        </Button>
        <Text style={[styles.meta, styles.center, { color: t.text.secondary }]}>Después eliges cuánto tiempo dura el enlace.</Text>
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  body: { gap: spacing[3], paddingBottom: spacing[2] },
  text: { fontSize: 15, lineHeight: 22, fontFamily: nativeFont("body", 400) },
  row: { flexDirection: "row", alignItems: "center", gap: spacing[3], paddingVertical: 6 },
  copy: { flex: 1, minWidth: 0, gap: 2 },
  title: { fontSize: 14, lineHeight: 18, fontFamily: nativeFont("body", 600) },
  meta: { fontSize: 13, lineHeight: 18, fontFamily: nativeFont("body", 400) },
  center: { textAlign: "center" },
});
