import { useMemo, useState } from "react";
import { FlatList, Keyboard, StyleSheet, Text, View } from "react-native";
import Animated, { FadeIn, FadeOut, LinearTransition, useAnimatedStyle, withTiming } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import type { Backpack } from "@helu/api";
import {
  PullRefreshIndicator,
  SearchField,
  Skeleton,
  SkeletonGroup,
  motion,
  nativeFont,
  spacing,
  useAppTheme,
  usePullRefresh,
  useSkeletonVisible,
  type ThemeContextValue,
} from "@helu/ui";
import { Fab } from "../Fab";
import { MascotHint } from "../brand/MascotHint";
import { useBackpacksList } from "../../hooks/useBackpacksList";
import { useBackpackDeleteWithUndo } from "../../hooks/useBackpackUndo";
import { BackpackCard } from "./BackpackCard";
import { BackpackDeleteConfirm } from "./BackpackDeleteConfirm";
import { BackpacksEmpty, BackpacksError, BackpacksSearchEmpty, type BackpackTemplate } from "./BackpacksEmpty";

export interface BackpacksProps {
  onOpen: (backpack: Backpack) => void;
  onEdit: (backpack: Backpack) => void;
  onShare: (backpack: Backpack) => void;
  /** «Nueva mochila», optionally from a template of the empty state. */
  onCreate: (preset?: BackpackTemplate) => void;
}

const STAGGER_MS = 40;
const STAGGER_MAX = 6;

/**
 * Mockup «Mochilas» (m5, module 6) with its states (m9 «Mochilas · vacío», m7 «Error al cargar»):
 * the title on the background, «Buscar mochilas», a flat list of cards, the mascot hint and the «+».
 */
export function Backpacks(props: BackpacksProps) {
  const t = useAppTheme();
  const styles = useMemo(() => makeStyles(t), [t]);
  const list = useBackpacksList();
  const pull = usePullRefresh(list.refetch, list.updatedAt);
  const showSkeleton = useSkeletonVisible(list.isLoading);
  const deleteWithUndo = useBackpackDeleteWithUndo();
  const [toDelete, setToDelete] = useState<Backpack | null>(null);
  // Staggered entry only for the first paint of the list (§2, §6c), not on every refetch.
  const [entered, setEntered] = useState(false);

  // Leaving the list with the search focused would bring the keyboard back on return (phase 9).
  const away = <A extends unknown[]>(fn: (...args: A) => void) => (...args: A) => {
    Keyboard.dismiss();
    fn(...args);
  };
  const onOpen = away(props.onOpen);
  const onEdit = away(props.onEdit);
  const onShare = away(props.onShare);
  const onCreate = away(props.onCreate);

  const searching = list.debouncedSearch.trim().length > 0;
  const busy = !list.settled && (list.search.trim().length > 0 || searching);
  const dim = useAnimatedStyle(() => ({ opacity: withTiming(busy ? 0.5 : 1, { duration: motion.fast }) }));

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.title} accessibilityRole="header">
          Mochilas
        </Text>
        <SearchField
          value={list.search}
          onChange={list.setSearch}
          placeholder="Buscar mochilas"
          accessibilityLabel="Buscar mochilas"
          loading={busy}
        />
      </View>

      {showSkeleton ? (
        // §6c: title and search are real; each backpack is a card with its tile, name and chips.
        <SkeletonGroup label="Cargando mochilas" style={styles.skeleton}>
          <BackpackCardSkeleton />
          <BackpackCardSkeleton />
          <BackpackCardSkeleton />
          <BackpackCardSkeleton />
        </SkeletonGroup>
      ) : list.isError ? (
        <View style={styles.state}>
          <BackpacksError onRetry={() => void list.refetch()} />
        </View>
      ) : (
        <Animated.View style={[{ flex: 1 }, dim]} aria-busy={busy}>
          <FlatList
            data={list.items}
            keyExtractor={(bp) => bp.id}
            contentContainerStyle={list.items.length === 0 ? styles.emptyContent : styles.content}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            onLayout={() => setEntered(true)}
            refreshControl={pull.refreshControl}
            onScroll={pull.onScroll}
            scrollEventThrottle={16}
            renderItem={({ item, index }) => (
              <Animated.View
                entering={
                  entered
                    ? FadeIn.duration(motion.fast)
                    : FadeIn.duration(motion.base).delay(Math.min(index, STAGGER_MAX) * STAGGER_MS)
                }
                // Deleting: the card fades out (250 ms) and the rest slide up into its place.
                exiting={FadeOut.duration(motion.base)}
                layout={LinearTransition.duration(motion.base)}
                style={styles.rowWrap}
              >
                <BackpackCard
                  backpack={item}
                  onPress={() => onOpen(item)}
                  actions={{
                    onView: () => onOpen(item),
                    onShare: () => onShare(item),
                    onEdit: () => onEdit(item),
                    onDelete: () => setToDelete(item),
                  }}
                />
              </Animated.View>
            )}
            ListFooterComponent={
              list.items.length > 0 && !searching ? (
                <Animated.View entering={FadeIn.duration(motion.base)} layout={LinearTransition.duration(motion.base)}>
                  <MascotHint pose="happy" text="Arma una mochila antes de cada cita y compártela con un QR." />
                </Animated.View>
              ) : undefined
            }
            ListEmptyComponent={
              !list.settled ? undefined : (
                <Animated.View entering={FadeIn.duration(motion.fast)}>
                  {searching ? (
                    <BackpacksSearchEmpty query={list.debouncedSearch} onClear={() => list.setSearch("")} />
                  ) : (
                    <BackpacksEmpty onCreate={onCreate} />
                  )}
                </Animated.View>
              )
            }
          />
          <PullRefreshIndicator state={pull} />
        </Animated.View>
      )}

      {/* m9 «Mochilas · vacío» has no «+»: «Crear mochila» is the one primary action there. */}
      {list.items.length > 0 || searching || showSkeleton || list.isError ? (
        <Fab onPress={() => onCreate()} accessibilityLabel="Nueva mochila" />
      ) : null}

      {toDelete ? (
        <BackpackDeleteConfirm
          name={toDelete.name}
          onConfirm={() => {
            deleteWithUndo(toDelete);
            setToDelete(null);
          }}
          onCancel={() => setToDelete(null)}
        />
      ) : null}
    </SafeAreaView>
  );
}

function makeStyles(t: ThemeContextValue) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: t.surface.bg },
    header: { paddingHorizontal: spacing[4], paddingTop: spacing[3], paddingBottom: spacing[3], gap: spacing[3] },
    title: { fontSize: 26, lineHeight: 30, fontFamily: nativeFont("heading", 900), color: t.text.primary },
    content: { paddingHorizontal: spacing[4], paddingTop: spacing[1], paddingBottom: spacing[12] + 58 },
    emptyContent: { flexGrow: 1, paddingHorizontal: spacing[4], paddingBottom: spacing[12] + 58 },
    rowWrap: { marginBottom: spacing[3] },
    state: { flex: 1, paddingHorizontal: spacing[4] },
    skeleton: { gap: spacing[3], paddingHorizontal: spacing[4], paddingTop: spacing[1] },
  });
}

/** A `BackpackCard` while it loads: tile, name, description, «⋯» and one chip. */
function BackpackCardSkeleton() {
  const t = useAppTheme();
  return (
    <View
      style={{
        gap: 10,
        padding: 14,
        borderRadius: 18,
        borderWidth: 1,
        borderBottomWidth: 4,
        borderColor: t.border.default,
        backgroundColor: t.surface.bgCard,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: spacing[3] }}>
        <Skeleton width={40} height={40} radius={13} />
        <View style={{ flex: 1, gap: 6 }}>
          <Skeleton width="55%" height={15} />
          <Skeleton width="75%" height={12} />
        </View>
        <View style={{ width: 44, height: 44, alignItems: "center", justifyContent: "center" }}>
          <Skeleton width={4} height={16} radius={2} />
        </View>
      </View>
      <Skeleton width={110} height={26} radius={13} />
    </View>
  );
}
