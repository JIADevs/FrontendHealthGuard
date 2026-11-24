import { useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import Animated, { FadeIn, LinearTransition } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { ChevronRight, Plus, Sparkles } from "lucide-react-native";
import { useMissionsOverviewQuery, useMissionsQuery } from "@helu/api";
import {
  Button,
  IconTile,
  PressableScale,
  PullRefreshIndicator,
  SegmentedControl,
  Skeleton,
  SkeletonGroup,
  motion,
  nativeFont,
  spacing,
  useAppTheme,
  useFadeThrough,
  usePullRefresh,
  useSkeletonVisible,
} from "@helu/ui";
import { ScreenHeader } from "../ScreenHeader";
import { Mascot } from "../brand/Mascot";
import { LoadError } from "../states/LoadError";
import { MissionRow } from "./MissionRow";
import { NextStepCard } from "./NextStepCard";

export interface MissionsProps {
  onOpen: (missionId: string, openStep?: string) => void;
  onCreate: () => void;
  /** «Tienes n misiones sugeridas» → «Misiones sugeridas» (v2.28). */
  onOpenSuggestions: () => void;
  onBack?: () => void;
}

type Tab = "active" | "completed";

const STAGGER_MS = 40;

/**
 * Lista de Misiones «H2» (DU-37, mockups «Misiones» y sus estados): «Tu próximo paso» arriba con su
 * acción, pestañas «En curso | Completadas» y, en «En curso», el resto ordenado por cercanía.
 * Las sugerencias se resumen en una sola fila al final de «En curso» (M5); sin sugerencias no se muestra.
 */
export function Missions({ onOpen, onCreate, onOpenSuggestions, onBack }: MissionsProps) {
  const t = useAppTheme();
  const [tab, setTab] = useState<Tab>("active");
  const overview = useMissionsOverviewQuery();
  // Same place, other content: fade through (movimiento §2/§3 «Pestañas internas»). The list asks
  // for the tab once the old content is gone, so two lists never overlap.
  const { shown: shownTab, style: tabFade } = useFadeThrough(tab);
  const list = useMissionsQuery(shownTab);
  const refetch = () => Promise.all([overview.refetch(), list.refetch()]);
  const pull = usePullRefresh(refetch, Math.max(overview.dataUpdatedAt, list.dataUpdatedAt) || undefined);
  const showSkeleton = useSkeletonVisible(overview.isLoading || (list.isLoading && !list.data));

  const counts = overview.data?.counts;
  const nextStep = overview.data?.nextStep ?? null;
  // «En curso · n» lists every active mission, also the one in «Tu próximo paso»: hiding it left the
  // list empty with a count of 1 when it was the only one. The hero is a shortcut to its next step.
  const items = list.data?.items ?? [];
  const settled = !list.isPlaceholderData;
  const failed = overview.isError || list.isError;
  const suggestions = counts?.suggestions ?? 0;
  const suggestionsRow =
    shownTab === "active" && suggestions > 0 ? (
      <Animated.View entering={FadeIn.duration(motion.base)} layout={LinearTransition.duration(motion.base)}>
        <SuggestionsRow count={suggestions} summary={overview.data?.suggestionsSummary} onPress={onOpenSuggestions} />
      </Animated.View>
    ) : null;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: t.surface.bg }]} edges={["top"]}>
      <ScreenHeader
        title="Misiones"
        onBack={onBack}
        right={
          <Button variant="secondary" size="sm" onPress={onCreate} icon={<Plus size={15} strokeWidth={2.6} color={t.brand.solid} />}>
            Nueva
          </Button>
        }
      />
      {showSkeleton ? (
        <SkeletonGroup label="Cargando misiones" style={styles.content}>
          <Skeleton width="100%" height={196} radius={18} />
          <Skeleton width="100%" height={44} radius={14} />
          <Skeleton width="100%" height={86} radius={18} />
          <Skeleton width="100%" height={86} radius={18} />
        </SkeletonGroup>
      ) : failed ? (
        <View style={styles.content}>
          <LoadError title="No se pudieron cargar tus misiones" onRetry={() => void refetch()} />
        </View>
      ) : (
        <View style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={pull.refreshControl}
          onScroll={pull.onScroll}
          scrollEventThrottle={16}
        >
          {nextStep ? (
            <Animated.View entering={FadeIn.duration(motion.base)} layout={LinearTransition.duration(motion.base)} style={{ gap: spacing[2] }}>
              <Text style={[styles.eyebrow, { color: t.text.secondary }]}>TU PRÓXIMO PASO</Text>
              <NextStepCard step={nextStep} onAct={() => onOpen(nextStep.missionId, nextStep.stepKey)} />
            </Animated.View>
          ) : null}

          <SegmentedControl
            accessibilityLabel="Misiones"
            value={tab}
            onChange={(v) => setTab(v as Tab)}
            options={[
              { value: "active", label: `En curso · ${counts?.active ?? 0}` },
              { value: "completed", label: `Completadas · ${counts?.completed ?? 0}` },
            ]}
          />

          <Animated.View style={[{ gap: spacing[3] }, tabFade]}>
          {shownTab === "active" && (counts?.active ?? 0) === 0 ? (
            <Animated.View entering={FadeIn.duration(motion.fast)} style={styles.empty}>
              <Mascot pose="happy" size={100} />
              <Text style={[styles.emptyTitle, { color: t.text.primary }]}>No tienes misiones en curso</Text>
              <Text style={[styles.emptyText, { color: t.text.secondary }]}>
                Tus citas, medicamentos y documentos siguen en Agenda y Documentos. Una misión te acompaña paso a paso hasta
                cumplir un objetivo.
              </Text>
              <Button variant="primary" fullWidth onPress={onCreate} icon={<Plus size={17} strokeWidth={2.6} color={t.text.onSolid} />}>
                Iniciar una misión
              </Button>
              {suggestionsRow ? <View style={{ alignSelf: "stretch" }}>{suggestionsRow}</View> : null}
            </Animated.View>
          ) : !settled ? null : shownTab === "completed" && items.length === 0 ? (
            <Text style={[styles.emptyText, { color: t.text.secondary, paddingTop: spacing[4] }]}>
              Cuando completes una misión, la verás aquí con sus documentos.
            </Text>
          ) : (
            items.map((m, i) => (
              <Animated.View
                key={m.id}
                entering={FadeIn.duration(motion.base).delay(Math.min(i, 6) * STAGGER_MS)}
                layout={LinearTransition.duration(motion.base)}
              >
                <MissionRow mission={m} onPress={() => onOpen(m.id)} />
              </Animated.View>
            )).concat(suggestionsRow ? [<View key="suggestions">{suggestionsRow}</View>] : [])
          )}
          </Animated.View>
        </ScrollView>
        <PullRefreshIndicator state={pull} />
        </View>
      )}
    </SafeAreaView>
  );
}

/** One row for every suggestion (v2.28): «Tienes 3 misiones sugeridas · De tu cita de ortopedia…». */
function SuggestionsRow({ count, summary, onPress }: { count: number; summary?: string | null; onPress: () => void }) {
  const t = useAppTheme();
  const title = count === 1 ? "Tienes 1 misión sugerida" : `Tienes ${count} misiones sugeridas`;
  return (
    <PressableScale
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={summary ? `${title}. ${summary}` : title}
      style={[styles.suggestions, { backgroundColor: t.brand.tint, borderColor: t.brand.tintBorder }]}
    >
      <IconTile tone="brand" icon={<Sparkles size={18} strokeWidth={2.2} color={t.brand.solid} />} />
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={[styles.suggestionsTitle, { color: t.text.primary }]}>{title}</Text>
        {summary ? (
          <Text style={[styles.suggestionsHint, { color: t.text.secondary }]} numberOfLines={1}>
            {summary}
          </Text>
        ) : null}
      </View>
      <ChevronRight size={18} strokeWidth={2.4} color={t.brand.solid} />
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  suggestions: { flexDirection: "row", alignItems: "center", gap: spacing[3], padding: 12, borderRadius: 18, borderWidth: 1, minHeight: 44 },
  suggestionsTitle: { fontSize: 15, fontFamily: nativeFont("body", 700) },
  suggestionsHint: { fontSize: 13, fontFamily: nativeFont("body", 400) },
  container: { flex: 1 },
  content: { gap: spacing[3], paddingHorizontal: spacing[4], paddingTop: spacing[2], paddingBottom: spacing[12] },
  eyebrow: { fontSize: 11, letterSpacing: 1.1, fontFamily: nativeFont("heading", 900) },
  empty: { alignItems: "center", gap: spacing[3], paddingTop: spacing[5], paddingHorizontal: spacing[2] },
  emptyTitle: { fontSize: 20, fontFamily: nativeFont("heading", 900), textAlign: "center" },
  emptyText: { fontSize: 14, lineHeight: 20, fontFamily: nativeFont("body", 400), textAlign: "center" },
});
