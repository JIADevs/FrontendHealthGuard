import { useRef } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Camera, ChevronRight, FilePlus2, Globe, Upload, type LucideIcon } from "lucide-react-native";
import {
  BottomSheet,
  IconTile,
  PressableScale,
  nativeFont,
  spacing,
  toneColors,
  useAppTheme,
  type BottomSheetHandle,
  type Tone,
} from "@helu/ui";

export interface DocumentsAddSheetProps {
  visible: boolean;
  onClose: () => void;
  onScan: () => void;
  onUpload: () => void;
  /** «Resultado de examen virtual»: a portal link, never the file picker. */
  onPortalLink: () => void;
}

/**
 * Mockup «Agregar documento»: «DOCUMENTOS · Agregar documento» and one card per way in, in this
 * order: scan papers, upload a file, save a lab portal link.
 */
export function DocumentsAddSheet({ visible, onClose, onScan, onUpload, onPortalLink }: DocumentsAddSheetProps) {
  const t = useAppTheme();
  const sheetRef = useRef<BottomSheetHandle>(null);
  if (!visible) return null;

  const options: { tone: Tone; icon: LucideIcon; title: string; subtitle: string; onPress: () => void }[] = [
    { tone: "ai", icon: Camera, title: "Escanear", subtitle: "Toma fotos de papeles, una o varias páginas", onPress: onScan },
    { tone: "brand", icon: Upload, title: "Subir archivo", subtitle: "PDF o imagen, hasta 25 MB", onPress: onUpload },
    { tone: "wellbeing", icon: Globe, title: "Resultado de examen virtual", subtitle: "Guarda el enlace del portal del laboratorio", onPress: onPortalLink },
  ];

  return (
    <BottomSheet
      ref={sheetRef}
      eyebrow="DOCUMENTOS"
      title="Agregar documento"
      icon={<IconTile tone="document" size="lg" round icon={<FilePlus2 size={24} strokeWidth={2.4} color={t.accent.docFg} />} />}
      onClose={onClose}
    >
      <View style={styles.list}>
        {options.map(({ tone, icon: Icon, title, subtitle, onPress }) => (
          <PressableScale
            key={title}
            // The sheet goes down first; the next screen or sheet comes in after (§3).
            onPress={() => (sheetRef.current ? sheetRef.current.close(onPress) : (onClose(), onPress()))}
            accessibilityRole="button"
            accessibilityLabel={`${title}, ${subtitle}`}
            style={[styles.card, { backgroundColor: t.surface.bgCard, borderColor: t.border.default }]}
          >
            <IconTile tone={tone} icon={<Icon size={19} strokeWidth={2.2} color={toneColors(tone, t.mode).fg} />} />
            <View style={styles.copy}>
              <Text style={[styles.title, { color: t.text.primary }]}>{title}</Text>
              <Text style={[styles.subtitle, { color: t.text.secondary }]}>{subtitle}</Text>
            </View>
            <ChevronRight size={18} color={t.text.muted} />
          </PressableScale>
        ))}
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  list: { gap: spacing[3] },
  // Kit `.card.tight`
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[3],
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderBottomWidth: 4,
  },
  copy: { flex: 1, gap: 2 },
  title: { fontSize: 14, fontFamily: nativeFont("body", 600) },
  subtitle: { fontSize: 13, fontFamily: nativeFont("body", 400) },
});
