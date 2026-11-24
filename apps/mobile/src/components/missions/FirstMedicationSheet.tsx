import { useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Check, Pill, Route } from "lucide-react-native";
import { BottomSheet, Button, IconTile, nativeFont, spacing, useAppTheme, type BottomSheetHandle } from "@helu/ui";

type Choice = "have" | "need";

/**
 * «Tu primer medicamento · ¿Ya lo tienes?» (mockup «Primer medicamento · ¿lo tienes?», RF-36): «Ya lo
 * tengo» lo agrega a tus medicamentos sin misión; «Necesito conseguirlo» crea la misión de medicamento.
 */
export function FirstMedicationSheet({
  onHave,
  onNeed,
  onClose,
}: {
  onHave: () => void;
  onNeed: () => void;
  onClose: () => void;
}) {
  const t = useAppTheme();
  const ref = useRef<BottomSheetHandle>(null);
  const [choice, setChoice] = useState<Choice>("need");

  const option = (value: Choice, title: string, hint: string, icon: React.ReactNode, tone: "success" | "medication") => {
    const selected = choice === value;
    return (
      <Pressable
        key={value}
        onPress={() => setChoice(value)}
        accessibilityRole="radio"
        accessibilityState={{ selected }}
        style={({ pressed }) => [
          styles.option,
          {
            borderColor: selected ? t.brand.solid : t.border.default,
            backgroundColor: selected ? t.brand.tint : t.surface.bgCard,
            opacity: pressed ? 0.85 : 1,
          },
        ]}
      >
        <IconTile tone={tone} icon={icon} />
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={[styles.title, { color: t.text.primary }]}>{title}</Text>
          <Text style={[styles.hint, { color: t.text.secondary }]}>{hint}</Text>
        </View>
        <View style={[styles.radio, { borderColor: selected ? t.brand.solid : t.border.default }]}>
          {selected ? <View style={[styles.dot, { backgroundColor: t.brand.solid }]} /> : null}
        </View>
      </Pressable>
    );
  };

  return (
    <BottomSheet
      ref={ref}
      eyebrow="TU PRIMER MEDICAMENTO"
      title="¿Ya lo tienes?"
      icon={<IconTile round size="lg" tone="medication" icon={<Pill size={22} strokeWidth={2.2} color={t.text.secondary} />} />}
      onClose={onClose}
    >
      <View style={styles.body} accessibilityRole="radiogroup">
        {option("have", "Ya lo tengo", "Lo agregamos a tus medicamentos para tus tomas", <Check size={19} strokeWidth={2.4} color={t.status.successFg} />, "success")}
        {option("need", "Necesito conseguirlo", "Creamos una misión: autorización, reclamo y recepción", <Route size={19} strokeWidth={2.2} color={t.text.secondary} />, "medication")}
        <Button variant="primary" fullWidth onPress={() => ref.current?.close(choice === "have" ? onHave : onNeed)}>
          Seguir
        </Button>
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  body: { gap: spacing[3], paddingBottom: spacing[2] },
  option: { flexDirection: "row", alignItems: "center", gap: spacing[3], padding: 12, borderRadius: 16, borderWidth: 1.5 },
  title: { fontSize: 15, fontFamily: nativeFont("body", 600) },
  hint: { fontSize: 13, lineHeight: 18, fontFamily: nativeFont("body", 400) },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, alignItems: "center", justifyContent: "center" },
  dot: { width: 12, height: 12, borderRadius: 6 },
});
