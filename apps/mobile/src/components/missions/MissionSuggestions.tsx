import { useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import Animated, { FadeIn, FadeOut, LinearTransition } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  useDismissSuggestionMutation,
  useMissionSuggestionsQuery,
  useRestoreSuggestionMutation,
  type Mission,
  type MissionSuggestion,
} from "@helu/api";
import {
  Button,
  IconTile,
  PullRefreshIndicator,
  Skeleton,
  SkeletonGroup,
  motion,
  nativeFont,
  spacing,
  useAppTheme,
  usePullRefresh,
  useSkeletonVisible,
} from "@helu/ui";
import { ScreenHeader } from "../ScreenHeader";
import { Mascot } from "../brand/Mascot";
import { LoadError } from "../states/LoadError";
import { useIsOnline } from "../states/OfflineBanner";
import { notify } from "../../lib/notify";
import { haptics } from "../../lib/haptics";
import { MissionTypeIcon } from "./MissionTypeIcon";
import { SuggestionAcceptSheet } from "./SuggestionAcceptSheet";
import { missionTypeTone, suggestionGroupLabel, suggestionOrigin, suggestionTitle } from "./missionCopy";

interface Group {
  sourceId: string;
  label: string;
  items: MissionSuggestion[];
}

/** Grouped by origin, the most recent first (RF-55); the API already sends them newest first. */
function groupBySource(suggestions: MissionSuggestion[]): Group[] {
  const groups = new Map<string, Group>();
  for (const s of suggestions) {
    const g = groups.get(s.sourceMission.id);
    if (g) g.items.push(s);
    else groups.set(s.sourceMission.id, { sourceId: s.sourceMission.id, label: suggestionGroupLabel(s.sourceMission, s.createdAt), items: [s] });
  }
  return [...groups.values()];
}

/**
 * «Misiones sugeridas» (v2.28, RF-53, RF-55): needs found after your missions, grouped by origin. No
 * primary button on the screen: each suggestion decides on its own with «Crear misión» or «Ahora no»
 * (recoverable: toast with «Deshacer», no modal, MASTER §7).
 */
export function MissionSuggestions({ onOpenMission, onBack }: { onOpenMission: (mission: Mission) => void; onBack?: () => void }) {
  const t = useAppTheme();
  const online = useIsOnline();
  const query = useMissionSuggestionsQuery();
  const dismiss = useDismissSuggestionMutation();
  const restore = useRestoreSuggestionMutation();
  const pull = usePullRefresh(() => query.refetch(), query.dataUpdatedAt || undefined);
  const showSkeleton = useSkeletonVisible(query.isLoading);
  const [accepting, setAccepting] = useState<MissionSuggestion | null>(null);
  /** Hidden at once on «Ahora no»; back on «Deshacer» or if the server says no. */
  const [hidden, setHidden] = useState<Set<string>>(new Set());

  const visible = (query.data ?? []).filter((s) => !hidden.has(s.id));
  const groups = groupBySource(visible);

  const unhide = (id: string) =>
    setHidden((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });

  const onDismiss = (s: MissionSuggestion) => {
    if (!online) return notify({ tone: "warning", message: "Sin conexión", description: "Revisa tu conexión y vuelve a intentarlo." });
    haptics.light();
    setHidden((prev) => new Set(prev).add(s.id));
    dismiss.mutate(s.id, {
      onSuccess: () =>
        notify({
          tone: "info",
          message: "Sugerencia descartada",
          action: {
            label: "Deshacer",
            onPress: () => restore.mutate(s.id, { onSuccess: () => unhide(s.id), onError: () => notify({ tone: "error", message: "No se pudo deshacer" }) }),
          },
        }),
      onError: () => {
        unhide(s.id);
        notify({ tone: "error", message: "No se pudo descartar", action: { label: "Reintentar", onPress: () => onDismiss(s) } });
      },
    });
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: t.surface.bg }]} edges={["top"]}>
      <ScreenHeader title="Misiones sugeridas" onBack={onBack} />
      {showSkeleton ? (
        <SkeletonGroup label="Cargando sugerencias" style={styles.content}>
          <Skeleton width="85%" height={16} />
          <Skeleton width="50%" height={12} />
          <Skeleton width="100%" height={128} radius={18} />
          <Skeleton width="100%" height={128} radius={18} />
        </SkeletonGroup>
      ) : query.isError ? (
        <View style={styles.content}>
          <LoadError title="No se pudieron cargar tus sugerencias" onRetry={() => void query.refetch()} />
        </View>
      ) : (
        <View style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={styles.content} refreshControl={pull.refreshControl} onScroll={pull.onScroll} scrollEventThrottle={16}>
            {groups.length === 0 ? (
              <Animated.View entering={FadeIn.duration(motion.fast)} style={styles.empty}>
                <Mascot pose="happy" size={100} />
                <Text style={[styles.emptyTitle, { color: t.text.primary }]}>No tienes misiones sugeridas</Text>
                <Text style={[styles.sub, { color: t.text.secondary, textAlign: "center" }]}>
                  Cuando completes una misión te preguntamos si necesitas algo más.
                </Text>
              </Animated.View>
            ) : (
              <>
                <Text style={[styles.sub, { color: t.text.secondary }]}>
                  Necesidades que detectamos después de tus misiones. Ninguna es obligatoria.
                </Text>
                {groups.map((g) => (
                  <Animated.View key={g.sourceId} layout={LinearTransition.duration(motion.base)} style={{ gap: spacing[2] }}>
                    <Text style={[styles.eyebrow, { color: t.text.secondary }]}>{g.label}</Text>
                    {g.items.map((s) => (
                      <Animated.View
                        key={s.id}
                        exiting={FadeOut.duration(motion.fast)}
                        entering={FadeIn.duration(motion.fast)}
                        layout={LinearTransition.duration(motion.base)}
                        style={[styles.card, { backgroundColor: t.brand.tint, borderColor: t.brand.tintBorder }]}
                      >
                        <View style={styles.row}>
                          <IconTile tone={missionTypeTone[s.type]} icon={<MissionTypeIcon type={s.type} size={19} color={t.text.secondary} />} />
                          <View style={{ flex: 1, gap: 2 }}>
                            <Text style={[styles.title, { color: t.text.primary }]}>{suggestionTitle(s.type, s.sourceMission.type)}</Text>
                            <Text style={[styles.hint, { color: t.text.secondary }]}>{suggestionOrigin(s.sourceMission.type)}</Text>
                          </View>
                        </View>
                        <View style={styles.actions}>
                          <Button variant="secondary" size="sm" onPress={() => setAccepting(s)}>
                            Crear misión
                          </Button>
                          <Button variant="ghost" size="sm" onPress={() => onDismiss(s)}>
                            Ahora no
                          </Button>
                        </View>
                      </Animated.View>
                    ))}
                  </Animated.View>
                ))}
              </>
            )}
          </ScrollView>
          <PullRefreshIndicator state={pull} />
        </View>
      )}
      {accepting ? (
        <SuggestionAcceptSheet
          suggestion={accepting}
          onClose={() => setAccepting(null)}
          onCreated={(mission) =>
            notify({ message: "Misión creada", description: mission.title, action: { label: "Ver", onPress: () => onOpenMission(mission) } })
          }
        />
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { gap: spacing[3], paddingHorizontal: spacing[4], paddingTop: spacing[2], paddingBottom: spacing[12] },
  sub: { fontSize: 14, lineHeight: 20, fontFamily: nativeFont("body", 400) },
  eyebrow: { fontSize: 11, letterSpacing: 1.1, marginTop: spacing[2], fontFamily: nativeFont("heading", 900) },
  card: { gap: spacing[3], padding: 14, borderRadius: 18, borderWidth: 1, borderBottomWidth: 4 },
  row: { flexDirection: "row", alignItems: "center", gap: spacing[3] },
  title: { fontSize: 15, fontFamily: nativeFont("body", 700) },
  hint: { fontSize: 13, lineHeight: 18, fontFamily: nativeFont("body", 400) },
  actions: { flexDirection: "row", gap: spacing[2] },
  empty: { alignItems: "center", gap: spacing[3], paddingTop: spacing[6], paddingHorizontal: spacing[2] },
  emptyTitle: { fontSize: 20, fontFamily: nativeFont("heading", 900), textAlign: "center" },
});
