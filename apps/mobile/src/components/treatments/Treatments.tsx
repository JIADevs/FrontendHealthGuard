import { useCallback, useEffect, useMemo, useState } from "react";
import { FlatList, Keyboard, ScrollView, StyleSheet, View } from "react-native";
import Animated, { FadeIn, FadeOut, LayoutAnimationConfig, LinearTransition } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { Plus } from "lucide-react-native";
import type { Treatment } from "@helu/api";
import { useTreatmentsQuery } from "@helu/api/hooks";
import {
  Button,
  PullRefreshIndicator,
  SearchField,
  SegmentedControl,
  SkeletonGroup,
  contentEntering,
  motion,
  spacing,
  useAppTheme,
  useFadeThrough,
  usePullRefresh,
  useSkeletonVisible,
  type ThemeContextValue,
} from "@helu/ui";
import { ScreenHeader } from "../ScreenHeader";
import { useRecentlySaved } from "../../lib/recentlySaved";
import { TreatmentCard, TreatmentCardSkeleton } from "./TreatmentCard";
import { TreatmentCreateSheet } from "./TreatmentCreateSheet";
import { TreatmentsEmpty, TreatmentsSearchEmpty, TreatmentsTabEmpty } from "./TreatmentsEmpty";
import {
  TREATMENT_STATUS,
  TREATMENT_STATUS_ORDER,
  isTreatmentStatus,
  treatmentMatches,
  type TreatmentStatus,
} from "./treatmentFormat";

export interface TreatmentsProps {
  onBack: () => void;
  onOpen: (treatment: Treatment) => void;
}

const STAGGER_MAX = 6;
const SEGMENT_OPTIONS = TREATMENT_STATUS_ORDER.map((status) => ({ value: status, label: TREATMENT_STATUS[status].tab }));

/**
 * Mockup «Tratamientos» (m3) with its states: back, title and «Crear»; «Buscar tratamiento» and the
 * «Activos · Inactivos · Completados» segmented control; one card per treatment. With no treatments
 * at all it is m7 «Tratamientos · vacío» (no «Crear» in the header, the empty state carries it).
 * Both «Crear» open the «Nuevo tratamiento» sheet over the list.
 */
export function Treatments({ onBack, onOpen }: TreatmentsProps) {
  const t = useAppTheme();
  const styles = useMemo(() => makeStyles(t), [t]);
  const query = useTreatmentsQuery(1, 100);
  const items = useMemo(() => query.data?.items ?? [], [query.data?.items]);
  const showSkeleton = useSkeletonVisible(query.isLoading);
  const pull = usePullRefresh(query.refetch, query.dataUpdatedAt);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<TreatmentStatus>("ACTIVE");
  // Staggered entry only for the first paint of the list (§2, §6c), not on every refetch or tab.
  const [entered, setEntered] = useState(false);
  // Segmented control: the content fades through (out 100 ms, in 250 ms rising 4 px), never two lists at once.
  const tabFade = useFadeThrough(tab, { fullView: true });

  // Leaving with the search focused makes iOS give it the focus back on return.
  const open = (treatment: Treatment) => {
    Keyboard.dismiss();
    onOpen(treatment);
  };
  const [creating, setCreating] = useState(false);
  const create = () => {
    Keyboard.dismiss();
    setCreating(true);
  };

  // Just saved: show it where it lives now (its tab, and without a search that would hide it).
  const savedId = useRecentlySaved((s) => s.treatmentId);
  useEffect(() => {
    const saved = savedId ? items.find((tr) => tr.id === savedId) : undefined;
    if (!saved) return;
    setTab(saved.status);
    setSearch((q) => (treatmentMatches(saved, q) ? q : ""));
  }, [savedId, items]);

  const searching = search.trim().length > 0;
  const visible = useMemo(
    () => items.filter((tr) => tr.status === tabFade.shown && treatmentMatches(tr, search)),
    [items, tabFade.shown, search],
  );
  // Decision 9: the search runs inside the tab; when it finds nothing here, say which tab has matches.
  const elsewhere = useMemo(() => {
    if (!searching || visible.length > 0) return null;
    let best: { status: TreatmentStatus; count: number } | null = null;
    for (const status of TREATMENT_STATUS_ORDER) {
      if (status === tabFade.shown) continue;
      const count = items.filter((tr) => tr.status === status && treatmentMatches(tr, search)).length;
      if (count > 0 && (!best || count > best.count)) best = { status, count };
    }
    return best;
  }, [searching, visible.length, items, tabFade.shown, search]);

  const onTabChange = useCallback((value: string) => {
    if (isTreatmentStatus(value)) setTab(value);
  }, []);

  const isEmpty = query.isSuccess && items.length === 0 && !showSkeleton;

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScreenHeader
        title="Tratamientos"
        onBack={onBack}
        right={
          isEmpty ? undefined : (
            <Button
              size="sm"
              icon={<Plus size={15} strokeWidth={2.6} color={t.text.onSolid} />}
              accessibilityLabel="Crear tratamiento"
              onPress={create}
            >
              Crear
            </Button>
          )
        }
      />

      {isEmpty ? (
        <View style={styles.flex}>
          <Animated.View entering={contentEntering} style={styles.flex}>
            <ScrollView
              contentContainerStyle={styles.emptyContent}
              refreshControl={pull.refreshControl}
              onScroll={pull.onScroll}
              scrollEventThrottle={16}
            >
              <TreatmentsEmpty onCreate={create} />
            </ScrollView>
          </Animated.View>
          <PullRefreshIndicator state={pull} />
        </View>
      ) : (
        <>
          <View style={styles.toolbar}>
            <SearchField value={search} onChange={setSearch} placeholder="Buscar tratamiento" accessibilityLabel="Buscar tratamiento" />
            <SegmentedControl accessibilityLabel="Estado de los tratamientos" options={SEGMENT_OPTIONS} value={tab} onChange={onTabChange} />
          </View>

          {showSkeleton ? (
            // §6c: header, search and tabs are real; the cards wait as 4 skeletons (tile, two lines, chips).
            <SkeletonGroup label="Cargando tratamientos" style={styles.skeleton}>
              <TreatmentCardSkeleton />
              <TreatmentCardSkeleton />
              <TreatmentCardSkeleton />
              <TreatmentCardSkeleton />
            </SkeletonGroup>
          ) : (
            <View style={styles.flex}>
              <Animated.View style={[styles.flex, tabFade.style]}>
                {/* A new tab is a new list: the fade through animates it, not each row (and the old rows do not fade out). */}
                <LayoutAnimationConfig key={tabFade.shown} skipEntering={entered} skipExiting>
                  <FlatList
                    data={visible}
                    keyExtractor={(tr) => tr.id}
                    contentContainerStyle={styles.content}
                    keyboardShouldPersistTaps="handled"
                    keyboardDismissMode="on-drag"
                    onLayout={() => setEntered(true)}
                    refreshControl={pull.refreshControl}
                    onScroll={pull.onScroll}
                    scrollEventThrottle={16}
                    renderItem={({ item, index }) => (
                      <Animated.View
                        // v2.13: search results update at once; rows that leave fade out in 100 ms, new ones fade
                        // in in 150 ms. With no search a row only leaves because it was deleted or changed
                        // status: it fades out in 250 ms while the others close the gap (§5).
                        entering={
                          entered
                            ? FadeIn.duration(motion.fast)
                            : FadeIn.duration(motion.base).delay(Math.min(index, STAGGER_MAX) * motion.stagger)
                        }
                        exiting={FadeOut.duration(searching ? motion.instant : motion.base)}
                        layout={LinearTransition.duration(motion.base)}
                        style={styles.rowWrap}
                      >
                        <TreatmentCard treatment={item} onPress={() => open(item)} />
                      </Animated.View>
                    )}
                    ListEmptyComponent={
                      <Animated.View entering={FadeIn.duration(motion.fast)}>
                        {searching ? (
                          <TreatmentsSearchEmpty query={search} status={tabFade.shown} elsewhere={elsewhere} onShowTab={setTab} />
                        ) : (
                          <TreatmentsTabEmpty status={tabFade.shown} />
                        )}
                      </Animated.View>
                    }
                  />
                </LayoutAnimationConfig>
              </Animated.View>
              <PullRefreshIndicator state={pull} />
            </View>
          )}
        </>
      )}

      {creating ? <TreatmentCreateSheet onClose={() => setCreating(false)} /> : null}
    </SafeAreaView>
  );
}

function makeStyles(t: ThemeContextValue) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: t.surface.bg },
    flex: { flex: 1 },
    toolbar: { paddingHorizontal: spacing[4], paddingTop: spacing[1], paddingBottom: spacing[3], gap: spacing[3] },
    content: { paddingHorizontal: spacing[4], paddingTop: spacing[1], paddingBottom: spacing[10] },
    emptyContent: { flexGrow: 1, justifyContent: "center", paddingBottom: spacing[10] },
    rowWrap: { marginBottom: spacing[3] },
    skeleton: { gap: spacing[3], paddingHorizontal: spacing[4], paddingTop: spacing[1] },
  });
}
