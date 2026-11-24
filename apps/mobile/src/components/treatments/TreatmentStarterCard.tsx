import { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { CalendarDays, FileText, Pill } from "lucide-react-native";
import { Button, IconTile, fontSize, nativeFont, spacing, useAppTheme, type ThemeContextValue } from "@helu/ui";
import { AddLink } from "./TreatmentSection";

/**
 * m9 «Tratamiento · recién creado» (module 12, decision 6): the detail of a treatment with nothing
 * linked. One primary action, the most common one (the medication), and the others as links. No
 * mascot: it is clinical data. Here the tiles keep their module color, since they tell the options apart.
 */
export function TreatmentStarterCard({
  onAddMedication,
  onAddAppointment,
  onAddDocument,
}: {
  onAddMedication: () => void;
  onAddAppointment: () => void;
  onAddDocument: () => void;
}) {
  const t = useAppTheme();
  const styles = useMemo(() => makeStyles(t), [t]);
  return (
    <View style={styles.card}>
      <View style={styles.copy}>
        <Text style={styles.title} accessibilityRole="header">
          ¿Qué incluye este tratamiento?
        </Text>
        <Text style={styles.meta}>Agrupa lo que tengas de esta condición. Puedes agregarlo ahora o después.</Text>
      </View>
      <Button fullWidth icon={<Pill size={17} strokeWidth={2.4} color={t.text.onSolid} />} onPress={onAddMedication}>
        Agregar medicamento
      </Button>
      <View style={styles.rows}>
        <View style={styles.row}>
          <IconTile tone="appointment" icon={<CalendarDays size={19} strokeWidth={2.2} color={t.accent.calFg} />} />
          <View style={styles.copy}>
            <Text style={styles.title}>Una cita</Text>
            <Text style={styles.meta}>Control o examen</Text>
          </View>
          <AddLink label="Agregar" accessibilityLabel="Agregar una cita" onPress={onAddAppointment} />
        </View>
        <View style={styles.row}>
          <IconTile tone="document" icon={<FileText size={19} strokeWidth={2.2} color={t.accent.docFg} />} />
          <View style={styles.copy}>
            <Text style={styles.title}>Un documento</Text>
            <Text style={styles.meta}>Orden, resultado o fórmula</Text>
          </View>
          <AddLink label="Agregar" accessibilityLabel="Agregar un documento" onPress={onAddDocument} />
        </View>
      </View>
    </View>
  );
}

function makeStyles(t: ThemeContextValue) {
  return StyleSheet.create({
    // Kit `.card` with a dashed border and no bottom edge
    card: {
      gap: spacing[3],
      padding: spacing[4],
      borderRadius: 18,
      borderWidth: 1.5,
      borderStyle: "dashed",
      borderColor: t.border.default,
      backgroundColor: t.surface.bgCard,
    },
    rows: { gap: spacing[2], marginTop: 2 },
    row: { flexDirection: "row", alignItems: "center", gap: spacing[3] },
    copy: { flex: 1, minWidth: 0, gap: 2 },
    title: { fontSize: 14, lineHeight: 18, fontFamily: nativeFont("body", 600), color: t.text.primary },
    meta: { fontSize: fontSize.sm, lineHeight: 18, fontFamily: nativeFont("body", 400), color: t.text.secondary },
  });
}
