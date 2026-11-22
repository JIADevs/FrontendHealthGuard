import { useCallback, useMemo, useState } from "react";
import { View, Text, StyleSheet, SectionList } from "react-native";
import { Heart } from "lucide-react-native";
import type { DailyCheckIn } from "@helu/api";
import {
  Button,
  EmptyState,
  Skeleton,
  SkeletonCard,
  SkeletonGroup,
  nativeFont,
  spacing,
  useAppTheme,
  useSkeletonVisible,
  PullRefreshIndicator,
  usePullRefresh,
} from "@helu/ui";
import type { ThemeContextValue } from "@helu/ui";
import { useWellbeingScreen } from "../../hooks/useWellbeingScreen";
import { DailyCheckInForm } from "./DailyCheckInForm";
import { DailyCheckInListItem } from "./DailyCheckInListItem";
import { WellbeingFAB } from "./WellbeingFAB";
import { WellbeingSummary } from "./WellbeingSummary";

/**
 * Bienestar (mockup `m2-agenda.js` · Bienestar): the «Tu bienestar» summary card with the week of
 * moods, then «Check-ins» grouped by day as cards. The FAB and the empty state open the check-in sheet.
 */
export function WellbeingTab() {
  const t = useAppTheme();
  const styles = useMemo(() => makeStyles(t), [t]);

  const [formTarget, setFormTarget] = useState<DailyCheckIn | "new" | null>(null);
  const screen = useWellbeingScreen();
  const showSkeleton = useSkeletonVisible(screen.isLoading);
  // Only the pull gesture shows the pill; background refreshes (after saving) stay silent (§6c).
  const pull = usePullRefresh(screen.refetch, screen.updatedAt);

  const handleEndReached = useCallback(() => {
    if (screen.hasNextPage && !screen.isFetchingNextPage) {
      screen.fetchNextPage();
    }
  }, [screen.hasNextPage, screen.isFetchingNextPage, screen.fetchNextPage]);

  const listHeader = (
    <>
      <WellbeingSummary />
      <Text style={styles.listTitle} accessibilityRole="header">Check-ins</Text>
    </>
  );

  const renderList = () => {
    if (showSkeleton) {
      // §6c: el resumen es real (sus barras tienen su propio esqueleto); grupo y filas de check-in.
      return (
        <View>
          {listHeader}
          <SkeletonGroup label="Cargando check-ins" style={styles.skeletonList}>
            <Skeleton width={70} height={11} />
            <SkeletonCard lines={2} />
            <SkeletonCard lines={2} />
            <SkeletonCard lines={2} />
          </SkeletonGroup>
        </View>
      );
    }
    if (screen.isError) {
      return (
        <View>
          {listHeader}
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>
              No se pudieron cargar tus check-ins. Revisa tu conexión e intenta de nuevo.
            </Text>
            <Button variant="secondary" onPress={() => { void screen.refetch(); }}>
              Reintentar
            </Button>
          </View>
        </View>
      );
    }
    return (
      <View style={{ flex: 1 }}>
        <SectionList
          sections={screen.sections}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <DailyCheckInListItem checkIn={item} onEdit={(checkIn) => setFormTarget(checkIn)} />
          )}
          renderSectionHeader={({ section }) => (
            <Text style={styles.sectionTitle} accessibilityRole="header">{section.title}</Text>
          )}
          stickySectionHeadersEnabled={false}
          ListHeaderComponent={listHeader}
          ListEmptyComponent={
            <EmptyState
              icon={<Heart size={48} color={t.border.medium} />}
              message="Todavía no tienes check-ins."
              action={<Button onPress={() => setFormTarget("new")}>Registrar check-in</Button>}
            />
          }
          refreshControl={pull.refreshControl}
          onScroll={pull.onScroll}
          scrollEventThrottle={16}
          onEndReached={handleEndReached}
          onEndReachedThreshold={0.3}
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={() => <View style={styles.itemGap} />}
          ListFooterComponent={
            screen.isFetchingNextPage ? (
              // §6c «Página siguiente»: 2 filas de esqueleto al final.
              <SkeletonGroup label="Cargando más check-ins" style={styles.skeletonList}>
                <SkeletonCard lines={2} />
                <SkeletonCard lines={2} />
              </SkeletonGroup>
            ) : undefined
          }
        />
        <PullRefreshIndicator state={pull} />
      </View>
    );
  };

  return (
    <View style={styles.tabContent}>
      {renderList()}

      <WellbeingFAB onPress={() => setFormTarget("new")} />

      {formTarget !== null && (
        <DailyCheckInForm
          onClose={() => setFormTarget(null)}
          initialValues={formTarget === "new" ? undefined : formTarget}
        />
      )}
    </View>
  );
}

function makeStyles(t: ThemeContextValue) {
  return StyleSheet.create({
    tabContent: { flex: 1 },
    listContent: { paddingBottom: spacing[12] + 56 },
    listTitle: {
      fontSize: 17,
      fontFamily: nativeFont("heading", 800),
      color: t.text.primary,
      paddingHorizontal: spacing[4],
      marginTop: spacing[5],
    },
    // Mismo eyebrow que «PRÓXIMAS» / «ACTIVOS» (Nunito 900 11, mayúsculas, .08em)
    sectionTitle: {
      fontSize: 11,
      fontFamily: nativeFont("heading", 900),
      letterSpacing: 0.9,
      textTransform: "uppercase",
      color: t.text.secondary,
      paddingHorizontal: spacing[4],
      marginTop: spacing[4],
      marginBottom: spacing[2],
    },
    itemGap: { height: spacing[2] },
    skeletonList: { gap: spacing[3], paddingHorizontal: spacing[4], paddingTop: spacing[3] },
    errorBox: { margin: spacing[4], gap: spacing[3], alignItems: "flex-start" },
    errorText: { fontSize: 14, fontFamily: nativeFont("body", 400), color: t.status.errorFg },
  });
}
