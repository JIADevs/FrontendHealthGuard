import { useMemo, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Check, Palette } from "lucide-react-native";
import {
  BottomSheet,
  Button,
  IconTile,
  colors,
  fontSize,
  nativeFont,
  spacing,
  useAppTheme,
  type BottomSheetHandle,
  type ThemeContextValue,
} from "@helu/ui";
import { DELEGATION_COLOR_OPTIONS } from "./colorTokens";
import { initialsOf } from "./PersonCard";

const NAMES: Record<(typeof DELEGATION_COLOR_OPTIONS)[number]["id"], string> = {
  brand: "Azul",
  pink: "Rosado",
  violet: "Violeta",
  amber: "Ámbar",
  orange: "Naranja",
  emerald: "Esmeralda",
  green: "Verde",
  sky: "Celeste",
  red: "Rojo",
};

interface ContextColorPickerProps {
  /** Whose color this is: shown in the preview and the title. */
  name: string;
  currentColor: string;
  onClose: () => void;
  onSelectColor: (color: string) => void;
}

/**
 * «Cambiar color» for a managed account, as a kit BottomSheet (m9 sheets): a preview of their
 * initials with the ring in the picked color — the cue Inicio shows while you manage them — the
 * nine swatches as 44 px circles with a check on the chosen one, and «Guardar color».
 */
export function ContextColorPicker({ name, currentColor, onClose, onSelectColor }: ContextColorPickerProps) {
  const t = useAppTheme();
  const styles = useMemo(() => makeStyles(t), [t]);
  const sheetRef = useRef<BottomSheetHandle>(null);
  const [picked, setPicked] = useState(currentColor);
  const changed = picked !== currentColor;

  return (
    <BottomSheet
      ref={sheetRef}
      eyebrow="DEPENDIENTES"
      title={`Color de ${name}`}
      icon={<IconTile tone="mission" size="lg" round icon={<Palette size={24} strokeWidth={2.4} color={t.brand.solid} />} />}
      onClose={onClose}
    >
      <Text style={styles.sub}>Lo ves en Inicio mientras gestionas su cuenta, para saber siempre en cuál estás.</Text>

      <View style={styles.preview} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        <View style={[styles.ring, { borderColor: picked }]}>
          <View style={[styles.avatar, { backgroundColor: picked }]}>
            <Text style={styles.initials}>{initialsOf(name)}</Text>
          </View>
        </View>
      </View>

      <View style={styles.palette} accessibilityRole="radiogroup">
        {DELEGATION_COLOR_OPTIONS.map((option) => {
          const selected = option.color === picked;
          return (
            <Pressable
              key={option.id}
              onPress={() => setPicked(option.color)}
              hitSlop={4}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              accessibilityLabel={NAMES[option.id]}
              style={({ pressed }) => [styles.swatch, { backgroundColor: option.color }, selected && styles.swatchSelected, pressed && { opacity: 0.8 }]}
            >
              {selected ? <Check size={20} strokeWidth={3} color={colors.white} /> : null}
            </Pressable>
          );
        })}
      </View>

      <Button fullWidth disabled={!changed} onPress={() => sheetRef.current?.close(() => onSelectColor(picked))}>
        Guardar color
      </Button>
    </BottomSheet>
  );
}

function makeStyles(t: ThemeContextValue) {
  return StyleSheet.create({
    sub: { fontSize: fontSize.sm, lineHeight: 20, fontFamily: nativeFont("body", 400), color: t.text.secondary },
    preview: { alignItems: "center", paddingVertical: spacing[2] },
    ring: { width: 64, height: 64, borderRadius: 32, borderWidth: 3, padding: 3 },
    avatar: { flex: 1, borderRadius: 29, alignItems: "center", justifyContent: "center" },
    initials: { color: colors.white, fontSize: 18, fontFamily: nativeFont("heading", 900) },
    palette: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: spacing[3], paddingBottom: spacing[2] },
    swatch: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
    swatchSelected: { borderWidth: 3, borderColor: t.surface.bgCard, outlineWidth: 2, outlineColor: t.text.primary },
  });
}
