import { useCallback, useMemo, useState } from "react";
import { View, Text, StyleSheet, SectionList } from "react-native";
import { Heart } from "lucide-react-native";
import type { DailyCheckIn } from "@helu/api";
import {
  Chip,
  Skeleton,
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
import { DailyCheckInListItem, DailyCheckInListItemSkeleton } from "./DailyCheckInListItem";
import { Fab } from "../Fab";
import { AgendaEmpty } from "./AgendaEmpty";
import { Flame } from "../home/Flame";
import { useProfileQuery } from "@helu/api/hooks";
import { WellbeingSummary } from "./WellbeingSummary";
import { LoadError } from "../states/LoadError";

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

  // Mockup «Bienestar»: the streak chip (kit `fchip`) next to «Check-ins».
  const streak = useProfileQuery().data?.currentStreak ?? 0;
  const empty = !showSkeleton && !screen.isError && screen.sections.length === 0;

  const listHeader = (
    <>
      <WellbeingSummary />
      <View style={styles.listTitleRow}>
        <Text style={styles.listTitle} accessibilityRole="header">Check-ins</Text>
        {streak > 0 ? (
          <View accessible accessibilityLabel={`${streak} ${streak === 1 ? "día" : "días"} de racha`}>
            <Chip label={String(streak)} tone="streak" icon={<Flame size={15} />} />
          </View>
        ) : null}
      </View>
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
            <DailyCheckInListItemSkeleton />
            <DailyCheckInListItemSkeleton />
            <DailyCheckInListItemSkeleton />
          </SkeletonGroup>
        </View>
      );
    }
    if (screen.isError) {
      return (
        <View>
          {/* No chart either: it would be empty and push the message out of sight. */}
          <LoadError title="No se pudieron cargar tus check-ins" onRetry={() => void screen.refetch()} />
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
            <AgendaEmpty
              pose="happy"
              title="Aún no tienes check-ins"
              description="Cuéntanos cómo te sientes cada día y verás cómo evolucionas entre citas."
              actionLabel="Registrar check-in"
              onAction={() => setFormTarget("new")}
              example={{
                tone: "wellbeing",
                icon: <Heart size={19} strokeWidth={2.2} color={t.accent.wellbeingFg} />,
                title: "Bien",
                meta: "Hoy · 8:12 a. m. · Dormí bien",
              }}
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
                <DailyCheckInListItemSkeleton />
                <DailyCheckInListItemSkeleton />
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

      {/* One primary action: the empty state already offers «Registrar check-in» (MASTER §2). */}
      {empty ? null : <Fab icon={Heart} onPress={() => setFormTarget("new")} accessibilityLabel="Registrar check-in" />}

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
    listTitleRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: spacing[4],
      marginTop: spacing[5],
    },
    listTitle: {
      fontSize: 17,
      fontFamily: nativeFont("heading", 800),
      color: t.text.primary,
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
  });
}
