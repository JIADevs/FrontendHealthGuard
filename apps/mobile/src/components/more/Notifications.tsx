import { memo, useCallback, useMemo, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { Bell, Calendar, CheckSquare, Heart, Pill, Settings as SettingsIcon, Users } from "lucide-react-native";
import type { Notification } from "@helu/api";
import {
  Button,
  IconTile,
  SegmentedControl,
  Skeleton,
  SkeletonGroup,
  fontSize,
  motion,
  nativeFont,
  spacing,
  useAppTheme,
  useSkeletonVisible,
  type ThemeContextValue,
} from "@helu/ui";
import { ScreenHeader } from "../ScreenHeader";
import { EmptyHero } from "../states/EmptyHero";
import { LoadError } from "../states/LoadError";
import { useNotificationsScreen } from "../../hooks/useNotificationsScreen";
import { buildRoutePayloadFromNotification, navigateForNotification } from "../../navigation/notificationRouting";

type Filter = "all" | "unread";
type Entry = { kind: "header"; key: string; label: string } | { kind: "item"; key: string; item: Notification };

const ICONS: Record<string, typeof Bell> = {
  MEDICATION: Pill,
  MEDICATION_FOLLOWUP: Pill,
  APPOINTMENT: Calendar,
  APPOINTMENT_FOLLOWUP: Calendar,
  AGENDA_TASK: CheckSquare,
  AGENDA_TASK_FOLLOWUP: CheckSquare,
  CHECKIN: Heart,
  DELEGATION_INVITE: Users,
};

/** Push titles start with an emoji («💊 Recordatorio…»); the tile already says what it is. */
const LEADING_EMOJI = /^(?:[\u2600-\u27BF]|[\uD83C-\uD83E][\uDC00-\uDFFF]|\uFE0F|\u200D|\s)+/;
export function cleanTitle(title: string) {
  return title.replace(LEADING_EMOJI, "") || title;
}

function isToday(date: Date, now: Date) {
  return date.toDateString() === now.toDateString();
}

/** «Hace 5 min», «Hace 1 h», «Ayer», «Lun», «3 nov». */
export function notificationWhen(iso: string, now = new Date()): string {
  const date = new Date(iso);
  const minutes = Math.max(0, Math.round((now.getTime() - date.getTime()) / 60_000));
  if (isToday(date, now)) {
    if (minutes < 1) return "Ahora";
    if (minutes < 60) return `Hace ${minutes} min`;
    return `Hace ${Math.floor(minutes / 60)} h`;
  }
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) return "Ayer";
  const days = (now.getTime() - date.getTime()) / 86_400_000;
  if (days < 7) {
    const day = date.toLocaleDateString("es-CO", { weekday: "short" }).replace(".", "");
    return day.charAt(0).toUpperCase() + day.slice(1);
  }
  return date.toLocaleDateString("es-CO", { day: "numeric", month: "short" }).replace(".", "");
}

/** HOY and ANTERIORES groups, in one card (kit `card tight`), as in the mockup. */
function toEntries(items: Notification[]): Entry[] {
  const now = new Date();
  const today = items.filter((n) => isToday(new Date(n.createdAt), now));
  const earlier = items.filter((n) => !isToday(new Date(n.createdAt), now));
  const out: Entry[] = [];
  if (today.length) {
    out.push({ kind: "header", key: "h-today", label: "Hoy" });
    today.forEach((item) => out.push({ kind: "item", key: item.id, item }));
  }
  if (earlier.length) {
    out.push({ kind: "header", key: "h-earlier", label: "Anteriores" });
    earlier.forEach((item) => out.push({ kind: "item", key: item.id, item }));
  }
  return out;
}

/**
 * Mockup «Notificaciones» (module 9): `mback` with «Marcar todo», «Todas / No leídas», and one card
 * with HOY and ANTERIORES. Unread rows are bold with a brand dot. Empty: mascot plus «Ajustar
 * notificaciones», which opens Configuración.
 */
export function Notifications({ onOpenSettings }: { onOpenSettings: () => void }) {
  const t = useAppTheme();
  const styles = useMemo(() => makeStyles(t), [t]);
  const screen = useNotificationsScreen();
  const [filter, setFilter] = useState<Filter>("all");
  const [markingAll, setMarkingAll] = useState(false);
  // Only a pull shows the refresh spinner; «Marcar todo» refetches quietly.
  const [pulling, setPulling] = useState(false);
  const showSkeleton = useSkeletonVisible(screen.isLoading);

  const visible = useMemo(
    () => (filter === "unread" ? screen.notifications.filter((n) => !n.isRead) : screen.notifications),
    [filter, screen.notifications],
  );
  const entries = useMemo(() => toEntries(visible), [visible]);

  const { markRead, markAllRead } = screen;
  const open = useCallback(
    (item: Notification) => {
      if (!item.isRead) markRead(item.id);
      navigateForNotification(buildRoutePayloadFromNotification(item));
    },
    [markRead],
  );

  const markAll = () => {
    setMarkingAll(true);
    void markAllRead().finally(() => setMarkingAll(false));
  };

  const header = (
    <ScreenHeader
      title="Notificaciones"
      right={
        screen.unreadCount > 0 ? (
          <Pressable
            onPress={markAll}
            disabled={markingAll}
            hitSlop={8}
            style={styles.link}
            accessibilityRole="button"
            accessibilityLabel="Marcar todo como leído"
          >
            {markingAll ? <ActivityIndicator size="small" color={t.brand.fg} /> : <Text style={styles.linkText}>Marcar todo</Text>}
          </Pressable>
        ) : undefined
      }
    />
  );

  if (screen.isLoading || showSkeleton) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        {header}
        <View style={styles.content}>
          <SkeletonGroup label="Cargando notificaciones" style={[styles.card, { gap: 16, paddingVertical: 14 }]}>
            <Skeleton width={48} height={12} />
            {[0, 1, 2, 3].map((i) => (
              <View key={i} style={styles.row}>
                <Skeleton width={40} height={40} radius={12} />
                <View style={{ flex: 1, gap: 6 }}>
                  <Skeleton width="70%" height={14} />
                  <Skeleton width="50%" height={12} />
                </View>
              </View>
            ))}
          </SkeletonGroup>
        </View>
      </SafeAreaView>
    );
  }

  if (screen.isError) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        {header}
        <LoadError title="No se pudieron cargar tus notificaciones" top={96} onRetry={() => void screen.refetch()} retrying={screen.isRefetching} />
      </SafeAreaView>
    );
  }

  if (screen.notifications.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        {header}
        <EmptyHero
          pose="happy"
          top={96}
          title="Sin notificaciones"
          description="Aquí aparecerán tus recordatorios de citas, medicamentos y más."
        >
          <Button variant="secondary" fullWidth icon={<SettingsIcon size={16} color={t.brand.solid} />} onPress={onOpenSettings}>
            Ajustar notificaciones
          </Button>
        </EmptyHero>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {header}
      <FlatList
        data={entries}
        keyExtractor={(e) => e.key}
        contentContainerStyle={styles.content}
        ListHeaderComponent={
          <View style={{ marginBottom: spacing[4] }}>
            <SegmentedControl
              options={[
                { value: "all", label: "Todas" },
                { value: "unread", label: screen.unreadCount > 0 ? `No leídas (${screen.unreadCount})` : "No leídas" },
              ]}
              value={filter}
              onChange={(v) => setFilter(v as Filter)}
              accessibilityLabel="Filtrar notificaciones"
            />
          </View>
        }
        ListEmptyComponent={
          <Animated.View entering={FadeIn.duration(motion.base)} style={[styles.card, styles.allRead]}>
            <Text style={styles.title}>Estás al día</Text>
            <Text style={styles.meta}>No tienes notificaciones sin leer.</Text>
          </Animated.View>
        }
        renderItem={({ item: entry, index }) => (
          <View
            style={[
              styles.cardSlice,
              index === 0 && styles.cardTop,
              index === entries.length - 1 && styles.cardBottom,
            ]}
          >
            {entry.kind === "header" ? (
              <Text style={[styles.eyebrow, index > 0 && { marginTop: spacing[2] }]} accessibilityRole="header">
                {entry.label}
              </Text>
            ) : (
              <NotificationRow item={entry.item} onPress={open} />
            )}
          </View>
        )}
        refreshControl={
          <RefreshControl
            refreshing={pulling}
            onRefresh={() => {
              setPulling(true);
              void screen.refetch().finally(() => setPulling(false));
            }}
            tintColor={t.brand.fg}
          />
        }
        onEndReached={() => {
          if (screen.hasNextPage && !screen.isFetchingNextPage) void screen.fetchNextPage();
        }}
        onEndReachedThreshold={0.3}
        ListFooterComponent={screen.isFetchingNextPage ? <ActivityIndicator style={{ marginTop: spacing[4] }} color={t.brand.fg} /> : undefined}
      />
    </SafeAreaView>
  );
}

const NotificationRow = memo(function NotificationRow({ item, onPress }: { item: Notification; onPress: (n: Notification) => void }) {
  const t = useAppTheme();
  const styles = useMemo(() => makeStyles(t), [t]);
  const Icon = ICONS[item.type] ?? Bell;
  const unread = !item.isRead;
  const when = notificationWhen(item.createdAt);
  return (
    <Pressable
      onPress={() => onPress(item)}
      style={({ pressed }) => [styles.row, pressed && { opacity: 0.7 }]}
      accessibilityRole="button"
      accessibilityLabel={`${cleanTitle(item.title)}. ${item.body ?? ""}. ${when}. ${unread ? "No leída" : "Leída"}`}
    >
      <IconTile tone="neutral" icon={<Icon size={18} color={t.text.onMuted} />} />
      <View style={{ flex: 1, minWidth: 0, gap: 1 }}>
        <Text style={[styles.title, { fontFamily: nativeFont("body", unread ? 700 : 500) }]}>{cleanTitle(item.title)}</Text>
        {item.body ? (
          <Text style={styles.meta} numberOfLines={2}>
            {item.body}
          </Text>
        ) : null}
        <Text style={[styles.meta, { color: t.text.muted }]}>{when}</Text>
      </View>
      {unread ? <View style={[styles.dot, { backgroundColor: t.brand.solid }]} /> : null}
    </Pressable>
  );
});

function makeStyles(t: ThemeContextValue) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: t.surface.bg },
    content: { padding: spacing[4], paddingTop: spacing[2], paddingBottom: spacing[10] },
    link: { minHeight: 44, justifyContent: "center", paddingHorizontal: 4 },
    linkText: { fontSize: 13, fontFamily: nativeFont("heading", 800), color: t.brand.fg },
    card: {
      backgroundColor: t.surface.bgCard,
      borderColor: t.border.default,
      borderRadius: 18,
      borderWidth: 1,
      borderBottomWidth: 4,
      paddingHorizontal: 14,
    },
    cardSlice: {
      backgroundColor: t.surface.bgCard,
      borderColor: t.border.default,
      borderLeftWidth: 1,
      borderRightWidth: 1,
      paddingHorizontal: 14,
      paddingVertical: 6,
    },
    cardTop: { borderTopWidth: 1, borderTopLeftRadius: 18, borderTopRightRadius: 18, paddingTop: 14 },
    cardBottom: { borderBottomWidth: 4, borderBottomLeftRadius: 18, borderBottomRightRadius: 18, paddingBottom: 14 },
    allRead: { alignItems: "center", gap: 4, paddingVertical: spacing[6] },
    eyebrow: {
      fontSize: fontSize.xs,
      fontFamily: nativeFont("heading", 900),
      letterSpacing: 0.9,
      textTransform: "uppercase",
      color: t.text.secondary,
    },
    row: { flexDirection: "row", alignItems: "flex-start", gap: spacing[3] },
    title: { fontSize: 15, lineHeight: 20, fontFamily: nativeFont("body", 600), color: t.text.primary },
    meta: { fontSize: fontSize.sm, lineHeight: 18, fontFamily: nativeFont("body", 400), color: t.text.secondary },
    dot: { width: 8, height: 8, borderRadius: 4, marginTop: 6 },
  });
}
