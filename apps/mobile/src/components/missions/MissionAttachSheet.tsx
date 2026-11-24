import { useRef } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Camera, ChevronRight, FilePlus2, FolderOpen, Upload, type LucideIcon } from "lucide-react-native";
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

export type AttachMode = "scan" | "upload" | "pick";

/**
 * «Adjuntar documento» (RF-61): upload a new one with the Documentos flow, or link one already
 * uploaded. Never copies a file. Same card pattern as «Agregar documento» in Documentos.
 */
export function MissionAttachSheet({ onClose, onChoose }: { onClose: () => void; onChoose: (mode: AttachMode) => void }) {
  const t = useAppTheme();
  const sheetRef = useRef<BottomSheetHandle>(null);

  const options: { mode: AttachMode; tone: Tone; icon: LucideIcon; title: string; subtitle: string }[] = [
    { mode: "pick", tone: "document", icon: FolderOpen, title: "Elegir de mis documentos", subtitle: "Uno que ya subiste a Helu" },
    { mode: "scan", tone: "ai", icon: Camera, title: "Escanear", subtitle: "Toma fotos de papeles, una o varias páginas" },
    { mode: "upload", tone: "brand", icon: Upload, title: "Subir archivo", subtitle: "PDF o imagen, hasta 25 MB" },
  ];

  return (
    <BottomSheet
      ref={sheetRef}
      eyebrow="MISIÓN"
      title="Adjuntar documento"
      icon={<IconTile tone="document" size="lg" round icon={<FilePlus2 size={24} strokeWidth={2.4} color={t.accent.docFg} />} />}
      onClose={onClose}
    >
      <View style={styles.list}>
        {options.map(({ mode, tone, icon: Icon, title, subtitle }) => (
          <PressableScale
            key={mode}
            onPress={() => sheetRef.current?.close(() => onChoose(mode))}
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
