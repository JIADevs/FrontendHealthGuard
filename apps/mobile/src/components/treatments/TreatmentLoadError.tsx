import { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { RefreshCw } from "lucide-react-native";
import { Button, nativeFont, spacing, useAppTheme, type ThemeContextValue } from "@helu/ui";
import { Mascot } from "../brand";

/**
 * Mockup m7 «Error al cargar» for Tratamientos: Helu thinking, the whole sentence as the title («No se
 * pudieron cargar tus tratamientos»), the likely cause and «Reintentar», in the place of the content.
 * Never a false «vacío» or «no encontrado» when the request failed.
 *
 * Same look as phase 14's `components/states/LoadError` (#79), which is not on `dev` yet: once it is,
 * this one can be replaced by it.
 */
export function TreatmentLoadError({
  title,
  onRetry,
  retrying = false,
}: {
  title: string;
  onRetry: () => void;
  retrying?: boolean;
}) {
  const t = useAppTheme();
  const styles = useMemo(() => makeStyles(t), [t]);
  return (
    <View style={styles.hero}>
      <Mascot pose="think" size={100} />
      <Text style={styles.h2} accessibilityRole="header">
        {title}
      </Text>
      <Text style={styles.sub}>Revisa tu conexión e intenta de nuevo.</Text>
      <View style={styles.actions}>
        <Button
          fullWidth
          icon={<RefreshCw size={17} strokeWidth={2.4} color={t.text.onSolid} />}
          onPress={onRetry}
          loading={retrying}
          loadingLabel="Cargando…"
        >
          Reintentar
        </Button>
      </View>
    </View>
  );
}

function makeStyles(t: ThemeContextValue) {
  return StyleSheet.create({
    // Kit `empty` (m9): mascot of 100 px, H2, a 14 px line and the action 270 px wide.
    hero: { alignItems: "center", gap: 10, paddingTop: 28, paddingHorizontal: spacing[3] },
    h2: { fontSize: 21, lineHeight: 26, fontFamily: nativeFont("heading", 900), color: t.text.primary, textAlign: "center" },
    sub: {
      maxWidth: 290,
      fontSize: 14,
      lineHeight: 21,
      fontFamily: nativeFont("body", 400),
      color: t.text.secondary,
      textAlign: "center",
    },
    actions: { width: 270, gap: spacing[3], marginTop: 6 },
  });
}
