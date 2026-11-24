import { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import {
  Button,
  motion,
  nativeFont,
  spacing,
  useAppTheme,
  type ThemeContextValue,
} from "@helu/ui";
import { Mascot } from "../brand";

export interface AgendaFilterEmptyProps {
  /** Plural noun of the list: «medicamentos», «citas». */
  noun: string;
  /** «todos tus» / «todas tus», to agree with `noun`. */
  allYour: "todos tus" | "todas tus";
  search: string;
  hasActiveFilter: boolean;
  onClearFilters: () => void;
  onClearSearch: () => void;
}

/**
 * «Sin resultados» for Citas and Medicamentos (movimiento-interacciones.md §«Sin resultados» y
 * «Filtro sin resultados»; MASTER: Helu «pensativa»): says what leaves the list empty — the search,
 * the filters or both — and offers to undo it. Fades in over 150 ms.
 */
export function AgendaFilterEmpty({
  noun,
  allYour,
  search,
  hasActiveFilter,
  onClearFilters,
  onClearSearch,
}: AgendaFilterEmptyProps) {
  const t = useAppTheme();
  const styles = useMemo(() => makeStyles(t), [t]);
  const query = search.trim();

  const title = query
    ? hasActiveFilter
      ? `No encontramos «${query}» con estos filtros`
      : `No encontramos «${query}» en tus ${noun}`
    : `No hay ${noun} con estos filtros`;
  const sub = query
    ? hasActiveFilter
      ? `Quita los filtros para buscar en ${allYour} ${noun}.`
      : "Revisa cómo se escribe o busca otra palabra."
    : `Quita los filtros para ver ${allYour} ${noun}.`;

  return (
    <Animated.View entering={FadeIn.duration(motion.fast)} style={styles.wrap}>
      <Mascot pose="think" size={100} />
      <Text style={styles.h2} accessibilityRole="header">
        {title}
      </Text>
      <Text style={styles.sub}>{sub}</Text>
      <View style={styles.actions}>
        {hasActiveFilter ? (
          <Button fullWidth onPress={onClearFilters}>
            Quitar filtros
          </Button>
        ) : null}
        {query ? (
          <Button
            variant={hasActiveFilter ? "ghost" : "primary"}
            fullWidth
            onPress={onClearSearch}
          >
            Borrar la búsqueda
          </Button>
        ) : null}
      </View>
    </Animated.View>
  );
}

function makeStyles(t: ThemeContextValue) {
  return StyleSheet.create({
    wrap: {
      alignItems: "center",
      gap: 10,
      paddingTop: spacing[6],
      paddingHorizontal: spacing[6],
      paddingBottom: spacing[8],
    },
    h2: {
      fontSize: 21,
      lineHeight: 26,
      fontFamily: nativeFont("heading", 900),
      color: t.text.primary,
      textAlign: "center",
    },
    sub: {
      maxWidth: 290,
      fontSize: 14,
      lineHeight: 21,
      fontFamily: nativeFont("body", 400),
      color: t.text.secondary,
      textAlign: "center",
    },
    actions: { width: 270, marginTop: 6, gap: spacing[2] },
  });
}
