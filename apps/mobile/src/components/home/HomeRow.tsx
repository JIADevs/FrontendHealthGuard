import type { ReactNode } from "react";
import { View, Text } from "react-native";
import { IconTile, PressableScale, nativeFont, spacing, useAppTheme } from "@helu/ui";
import type { Tone } from "@helu/ui";

interface HomeRowProps {
  tone: Tone;
  icon: ReactNode;
  title: string;
  meta?: string;
  right?: ReactNode;
  onPress?: () => void;
}

/** Fila de Inicio (kit `row()`): cuadro de 40 px, dato Inter 600 14, metadato 13; tocable con escala 0,98 (§5). */
export function HomeRow({ tone, icon, title, meta, right, onPress }: HomeRowProps) {
  const t = useAppTheme();
  const body = (
    <>
      <IconTile tone={tone} icon={icon} />
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text numberOfLines={2} style={{ fontSize: 14, lineHeight: 18, fontFamily: nativeFont("body", 600), color: t.text.primary }}>
          {title}
        </Text>
        {meta ? (
          <Text numberOfLines={2} style={{ fontSize: 13, lineHeight: 18, fontFamily: nativeFont("body", 400), color: t.text.secondary, marginTop: 2 }}>
            {meta}
          </Text>
        ) : null}
      </View>
      {right}
    </>
  );
  const row = { flexDirection: "row" as const, alignItems: "center" as const, gap: spacing[3], minHeight: 44 };
  if (!onPress) return <View style={row}>{body}</View>;
  return (
    <PressableScale onPress={onPress} accessibilityRole="button" accessibilityLabel={meta ? `${title}, ${meta}` : title} style={row}>
      {body}
    </PressableScale>
  );
}
