import { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Button, nativeFont, spacing, useAppTheme, type ThemeContextValue } from "@helu/ui";
import { AgendaEmpty } from "../agenda/AgendaEmpty";
import { TREATMENT_STATUS, type TreatmentStatus } from "./treatmentFormat";

/** m7 «Tratamientos · vacío»: waving mascot, what a treatment is for and «Crear tratamiento» as the only action. */
export function TreatmentsEmpty({ onCreate }: { onCreate: () => void }) {
  return (
    <AgendaEmpty
      pose="wave"
      title="Todavía no tienes tratamientos"
      description="Agrupa medicamentos, citas y documentos de una misma condición."
      actionLabel="Crear tratamiento"
      onAction={onCreate}
    />
  );
}

/** A tab with nothing in it and no search (decision 9): one line, no mascot. */
export function TreatmentsTabEmpty({ status }: { status: TreatmentStatus }) {
  const t = useAppTheme();
  const styles = useMemo(() => makeStyles(t), [t]);
  return (
    <View style={styles.wrap}>
      <Text style={styles.sub}>{TREATMENT_STATUS[status].emptyTab}</Text>
    </View>
  );
}

/**
 * The search finds nothing in the selected tab (decision 9, v2.13). When another tab has matches it
 * says where they are and offers to go there: «No encontramos «migraña» en Activos» + «Ver en
 * Completados (1)».
 */
export function TreatmentsSearchEmpty({
  query,
  status,
  elsewhere,
  onShowTab,
}: {
  query: string;
  status: TreatmentStatus;
  elsewhere: { status: TreatmentStatus; count: number } | null;
  onShowTab: (status: TreatmentStatus) => void;
}) {
  const t = useAppTheme();
  const styles = useMemo(() => makeStyles(t), [t]);
  const q = query.trim();
  return (
    <View style={styles.wrap}>
      <Text style={styles.h3} accessibilityRole="header">
        {elsewhere ? `No encontramos «${q}» en ${TREATMENT_STATUS[status].tab}` : `No encontramos «${q}»`}
      </Text>
      {elsewhere ? (
        <Button variant="secondary" onPress={() => onShowTab(elsewhere.status)}>
          {`Ver en ${TREATMENT_STATUS[elsewhere.status].tab} (${elsewhere.count})`}
        </Button>
      ) : (
        <Text style={styles.sub}>Busca por el nombre o la descripción del tratamiento.</Text>
      )}
    </View>
  );
}

function makeStyles(t: ThemeContextValue) {
  return StyleSheet.create({
    wrap: { alignItems: "center", gap: spacing[3], paddingHorizontal: spacing[6], paddingTop: spacing[8] },
    h3: { fontSize: 17, lineHeight: 22, fontFamily: nativeFont("heading", 800), color: t.text.primary, textAlign: "center" },
    sub: { fontSize: 14, lineHeight: 21, fontFamily: nativeFont("body", 400), color: t.text.secondary, textAlign: "center" },
  });
}
