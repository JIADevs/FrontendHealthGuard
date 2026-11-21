import type { ReactNode } from "react";
import { View, Text } from "react-native";
import { Camera, Share2, Upload } from "lucide-react-native";
import { IconTile, PressableScale, nativeFont, radii, spacing, useAppTheme } from "@helu/ui";

interface QuickActionsProps {
  onUpload: () => void;
  onScan: () => void;
  onShare: () => void;
}

/** Acciones rápidas (bloque 5): tres tarjetas iguales, un solo tinte de marca (v2.1). */
export function QuickActions({ onUpload, onScan, onShare }: QuickActionsProps) {
  const t = useAppTheme();
  const icon = (I: typeof Upload) => <I size={20} strokeWidth={2.2} color={t.brand.text} />;
  return (
    <View style={{ flexDirection: "row", gap: 10 }}>
      <Action label="Subir" icon={icon(Upload)} onPress={onUpload} />
      <Action label="Escanear" icon={icon(Camera)} onPress={onScan} />
      <Action label="Compartir" icon={icon(Share2)} onPress={onShare} />
    </View>
  );
}

function Action({ label, icon, onPress }: { label: string; icon: ReactNode; onPress: () => void }) {
  const t = useAppTheme();
  // `PressableScale` aplica `style` a su vista interna: el reparto del ancho va en un contenedor.
  return (
    <View style={{ flex: 1 }}>
    <PressableScale
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={{
        alignItems: "center",
        gap: spacing[2],
        paddingVertical: 14,
        paddingHorizontal: 6,
        backgroundColor: t.surface.bgCard,
        borderRadius: radii.card,
        borderWidth: 1,
        borderBottomWidth: 4,
        borderColor: t.border.default,
      }}
    >
      <IconTile tone="brand" icon={icon} />
      <Text style={{ fontSize: 12.5, fontFamily: nativeFont("heading", 800), color: t.text.primary }}>{label}</Text>
    </PressableScale>
    </View>
  );
}
