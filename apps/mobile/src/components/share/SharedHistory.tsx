import { useMemo, useState } from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";
import Animated, { FadeIn, FadeOut, LinearTransition } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { Link2, Plus, RefreshCw, Share2 } from "lucide-react-native";
import type { ShareLink } from "@helu/api";
import { useShareHistoryQuery } from "@helu/api/hooks";
import {
  Button,
  Chip,
  IconTile,
  PullRefreshIndicator,
  SegmentedControl,
  Skeleton,
  SkeletonGroup,
  fontSize,
  motion,
  nativeFont,
  spacing,
  useAppTheme,
  usePullRefresh,
  useSkeletonVisible,
  type ThemeContextValue,
} from "@helu/ui";
import { ScreenHeader } from "../ScreenHeader";
import { EmptyHero } from "../backpacks/BackpacksEmpty";
import { SharedLinkRow } from "./SharedLinkRow";

type Filter = "all" | "active" | "inactive";

const FILTERS = [
  { value: "all", label: "Todos" },
  { value: "active", label: "Activos" },
  { value: "inactive", label: "Inactivos" },
];

const STAGGER_MS = 40;
const STAGGER_MAX = 6;

export interface SharedHistoryProps {
  onOpen: (link: ShareLink) => void;
  onNew: () => void;
}

/**
 * Mockup «Compartidos» (module 7) and m9 «Compartidos · vacío»: back bar with a small «Nuevo»,
 * segmented «Todos · Activos · Inactivos» (inactive = expired; revoked links are deleted, #61
 * decision 4) and one row per link.
 */
export function SharedHistory({ onOpen, onNew }: SharedHistoryProps) {
  const t = useAppTheme();
  const styles = useMemo(() => makeStyles(t), [t]);
  const shares = useShareHistoryQuery();
  const [filter, setFilter] = useState<Filter>("all");
  const pull = usePullRefresh(shares.refetch, shares.dataUpdatedAt || undefined);
  const showSkeleton = useSkeletonVisible(shares.isLoading);
  const [entered, setEntered] = useState(false);

  const all = shares.data ?? [];
  const items = useMemo(
    () => all.filter((l) => (filter === "all" ? true : filter === "active" ? l.status === "active" : l.status !== "active")),
    [all, filter],
  );

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScreenHeader
        title="Compartidos"
        right={
          // m9 «Compartidos · vacío» has no «Nuevo»: «Compartir un documento» is the one action there.
          all.length > 0 ? (
            <Button size="sm" icon={<Plus size={15} strokeWidth={2.6} color={t.text.onSolid} />} onPress={onNew}>
              Nuevo
            </Button>
          ) : undefined
        }
      />

      {showSkeleton ? (
        <SkeletonGroup label="Cargando enlaces" style={styles.skeleton}>
          <Skeleton height={44} radius={14} />
          {[0, 1, 2, 3].map((i) => (
            <View key={i} style={styles.rowSkeleton}>
              <Skeleton width={40} height={40} radius={13} />
              <View style={{ flex: 1, gap: 6 }}>
                <Skeleton width="60%" height={14} />
                <Skeleton width="45%" height={12} />
              </View>
              <Skeleton width={58} height={24} radius={12} />
            </View>
          ))}
        </SkeletonGroup>
      ) : shares.isError && !shares.data ? (
        <View style={styles.state}>
          <EmptyHero pose="think" title="No se pudieron cargar tus enlaces" description="Revisa tu conexión e intenta de nuevo.">
            <Button fullWidth icon={<RefreshCw size={17} strokeWidth={2.4} color={t.text.onSolid} />} onPress={() => void shares.refetch()}>
              Reintentar
            </Button>
          </EmptyHero>
        </View>
      ) : all.length === 0 ? (
        <View style={styles.state}>
          <SharedEmpty onNew={onNew} />
        </View>
      ) : (
        <View style={{ flex: 1 }}>
          <FlatList
            data={items}
            keyExtractor={(l) => `${l.resourceType}-${l.linkId}`}
            contentContainerStyle={styles.content}
            onLayout={() => setEntered(true)}
            refreshControl={pull.refreshControl}
            onScroll={pull.onScroll}
            scrollEventThrottle={16}
            ListHeaderComponent={
              <View style={styles.filters}>
                <SegmentedControl
                  options={FILTERS}
                  value={filter}
                  onChange={(v) => setFilter(v as Filter)}
                  accessibilityLabel="Filtrar enlaces"
                />
              </View>
            }
            ItemSeparatorComponent={() => <View style={{ height: spacing[3] }} />}
            renderItem={({ item, index }) => (
              <Animated.View
                entering={
                  entered
                    ? FadeIn.duration(motion.fast)
                    : FadeIn.duration(motion.base).delay(Math.min(index, STAGGER_MAX) * STAGGER_MS)
                }
                exiting={FadeOut.duration(motion.base)}
                layout={LinearTransition.duration(motion.base)}
              >
                <SharedLinkRow link={item} onPress={() => onOpen(item)} />
              </Animated.View>
            )}
            ListEmptyComponent={
              <Animated.View entering={FadeIn.duration(motion.fast)} style={styles.noMatch}>
                <Text style={styles.meta}>
                  {filter === "active" ? "No tienes enlaces activos ahora." : "No hay enlaces vencidos."}
                </Text>
              </Animated.View>
            }
          />
          <PullRefreshIndicator state={pull} />
        </View>
      )}
    </SafeAreaView>
  );
}

/** m9 «Compartidos · vacío»: one action and an example that teaches that links expire. */
function SharedEmpty({ onNew }: { onNew: () => void }) {
  const t = useAppTheme();
  const styles = useMemo(() => makeStyles(t), [t]);
  return (
    <View style={{ gap: spacing[6] }}>
      <EmptyHero
        pose="happy"
        title="No has compartido nada"
        description="Comparte un documento o una mochila con un enlace seguro. Tú decides cuándo vence."
      >
        <Button fullWidth icon={<Share2 size={17} strokeWidth={2.2} color={t.text.onSolid} />} onPress={onNew}>
          Compartir un documento
        </Button>
      </EmptyHero>
      <View style={{ gap: spacing[2] }} accessible accessibilityLabel="Ejemplo: Cita de ortopedia, 3 documentos, vence en 7 días, visto 2 veces">
        <View style={styles.exampleHead}>
          <Text style={styles.eyebrow}>Así se verá</Text>
          <Chip label="Ejemplo" tone="neutral" />
        </View>
        <View style={styles.example}>
          <IconTile tone="mission" icon={<Link2 size={19} strokeWidth={2.2} color={t.brand.solid} />} />
          <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
            <Text style={styles.title} numberOfLines={1}>
              Cita de ortopedia
            </Text>
            <Text style={styles.meta}>3 documentos · vence en 7 días · visto 2 veces</Text>
          </View>
          <Chip label="Activo" tone="success" />
        </View>
      </View>
    </View>
  );
}

function makeStyles(t: ThemeContextValue) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: t.surface.bg },
    content: { paddingHorizontal: spacing[4], paddingBottom: spacing[10] },
    filters: { paddingTop: spacing[2], paddingBottom: spacing[3] },
    state: { flex: 1, paddingHorizontal: spacing[4] },
    skeleton: { gap: spacing[3], paddingHorizontal: spacing[4], paddingTop: spacing[2] },
    rowSkeleton: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing[3],
      padding: 14,
      borderRadius: 18,
      borderWidth: 1,
      borderBottomWidth: 4,
      borderColor: t.border.default,
      backgroundColor: t.surface.bgCard,
    },
    noMatch: { alignItems: "center", paddingTop: spacing[8] },
    title: { fontSize: 14, lineHeight: 18, fontFamily: nativeFont("body", 600), color: t.text.primary },
    meta: { fontSize: fontSize.sm, lineHeight: 18, fontFamily: nativeFont("body", 400), color: t.text.secondary },
    exampleHead: { flexDirection: "row", alignItems: "center", gap: spacing[2] },
    eyebrow: {
      flex: 1,
      fontSize: fontSize.xs,
      fontFamily: nativeFont("heading", 900),
      letterSpacing: 0.9,
      textTransform: "uppercase",
      color: t.text.secondary,
    },
    example: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing[3],
      padding: 14,
      borderRadius: 18,
      borderWidth: 1.5,
      borderStyle: "dashed",
      borderColor: t.border.default,
      backgroundColor: t.surface.muted,
    },
  });
}
