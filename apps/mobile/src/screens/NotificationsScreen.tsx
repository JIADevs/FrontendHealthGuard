import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { memo, useCallback, useEffect, useMemo } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getNotifications, markNotificationAsRead, type Notification } from "@healthguard/api";
import { useNotifStore } from "@healthguard/stores";
import { colors, radii, spacing, fontSize, fontWeight, useAppTheme } from "@healthguard/ui";
import type { ThemeContextValue } from "@healthguard/ui";
import { Bell, Calendar, Pill, Activity, Info, CheckCircle } from "lucide-react-native";

const LIMIT = 20;

const TYPE_CONFIG: Record<string, { icon: typeof Bell; color: string; bg: string }> = {
  APPOINTMENT: { icon: Calendar, color: colors.sky[500],     bg: colors.sky[100] },
  MEDICATION:  { icon: Pill,     color: colors.warning[500], bg: colors.warning[50] },
  CHECKIN:     { icon: Activity, color: colors.emerald[500],  bg: colors.emerald[100] },
  SYSTEM:      { icon: Bell,     color: colors.violet[500],  bg: colors.violet[100] },
  INFO:        { icon: Info,     color: colors.slate[500],   bg: colors.slate[100] },
};

const NotificationItem = memo(function NotificationItem({
  item,
  onPress,
}: {
  item: Notification;
  onPress: (id: string) => void;
}) {
  const t = useAppTheme();
  const styles = useMemo(() => makeItemStyles(t), [t]);

  const cfg = TYPE_CONFIG[item.type] ?? TYPE_CONFIG.INFO;
  const IconComp = cfg.icon;

  const formattedDate = new Date(item.createdAt).toLocaleDateString("es-AR", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

  const handlePress = useCallback(() => {
    if (!item.isRead) onPress(item.id);
  }, [item.id, item.isRead, onPress]);

  return (
    <TouchableOpacity
      style={[styles.item, !item.isRead && styles.itemUnread]}
      onPress={handlePress}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={`${item.title}. ${item.isRead ? "Leída" : "No leída"}`}
    >
      <View style={[styles.iconWrap, { backgroundColor: cfg.bg }]}>
        <IconComp size={18} color={cfg.color} />
      </View>

      <View style={styles.itemBody}>
        <Text style={[styles.itemTitle, !item.isRead && styles.itemTitleBold]}>
          {item.title}
        </Text>
        <Text style={styles.itemText} numberOfLines={2}>
          {item.body}
        </Text>
        <Text style={styles.itemDate}>{formattedDate}</Text>
      </View>

      {item.isRead
        ? <CheckCircle size={16} color={t.border.medium} style={styles.readIcon} />
        : <View style={styles.unreadDot} />
      }
    </TouchableOpacity>
  );
});

const Separator = () => {
  const t = useAppTheme();
  return <View style={{ height: 1, backgroundColor: t.border.light, marginLeft: 68 }} />;
};

export function NotificationsScreen() {
  const t = useAppTheme();
  const styles = useMemo(() => makeStyles(t), [t]);

  const queryClient = useQueryClient();
  const { decrementUnread, markAllRead, setUnreadCount } = useNotifStore();

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isRefetching,
    refetch,
  } = useInfiniteQuery({
    queryKey: ["notifications"],
    queryFn: ({ pageParam = 1 }) =>
      getNotifications({ page: pageParam as number, limit: LIMIT }),
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      const fetched = allPages.length * LIMIT;
      return fetched < lastPage.total ? allPages.length + 1 : undefined;
    },
  });

  useEffect(() => {
    if (!data) return;
    const unread = data.pages.flatMap((p) => p.items).filter((n) => !n.isRead).length;
    setUnreadCount(unread);
  }, [data, setUnreadCount]);

  const markReadMutation = useMutation({
    mutationFn: (id: string) => markNotificationAsRead(id),
    onSuccess: (_, id) => {
      decrementUnread();
      queryClient.setQueryData(["notifications"], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          pages: old.pages.map((page: any) => ({
            ...page,
            items: page.items.map((n: Notification) =>
              n.id === id ? { ...n, isRead: true } : n
            ),
          })),
        };
      });
    },
  });

  const handleMarkRead = useCallback(
    (id: string) => markReadMutation.mutate(id),
    [markReadMutation]
  );

  const handleMarkAllRead = useCallback(async () => {
    const unread = data?.pages.flatMap((p) => p.items).filter((n) => !n.isRead) ?? [];
    await Promise.allSettled(unread.map((n) => markNotificationAsRead(n.id)));
    markAllRead();
    refetch();
  }, [data, markAllRead, refetch]);

  const handleEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) fetchNextPage();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const renderItem = useCallback(
    ({ item }: { item: Notification }) => (
      <NotificationItem item={item} onPress={handleMarkRead} />
    ),
    [handleMarkRead]
  );

  const notifications = data?.pages.flatMap((p) => p.items) ?? [];
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Notificaciones</Text>
          {unreadCount > 0 && (
            <Text style={styles.subtitle}>{unreadCount} sin leer</Text>
          )}
        </View>
        {unreadCount > 0 && (
          <TouchableOpacity
            style={styles.markAllBtn}
            onPress={handleMarkAllRead}
            accessibilityRole="button"
            accessibilityLabel="Marcar todas como leídas"
          >
            <Text style={styles.markAllText}>Marcar todo leído</Text>
          </TouchableOpacity>
        )}
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.sky[500]} />
        </View>
      ) : notifications.length === 0 ? (
        <View style={styles.center}>
          <Bell size={48} color={t.border.medium} />
          <Text style={styles.emptyTitle}>Sin notificaciones</Text>
          <Text style={styles.emptyText}>
            Aquí aparecerán tus recordatorios de citas, medicamentos y más.
          </Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching && !isFetchingNextPage}
              onRefresh={refetch}
              tintColor={colors.sky[500]}
            />
          }
          onEndReached={handleEndReached}
          onEndReachedThreshold={0.3}
          ListFooterComponent={
            isFetchingNextPage ? (
              <ActivityIndicator style={styles.loadingFooter} color={colors.sky[500]} />
            ) : null
          }
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={Separator}
        />
      )}
    </SafeAreaView>
  );
}

function makeStyles(t: ThemeContextValue) {
  return StyleSheet.create({
    container:      { flex: 1, backgroundColor: t.surface.bg },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      padding: spacing[6],
      paddingBottom: spacing[4],
      backgroundColor: t.surface.bgCard,
      borderBottomWidth: 1,
      borderBottomColor: t.border.medium,
    },
    title:          { fontSize: fontSize["3xl"], fontWeight: fontWeight.extrabold, color: t.text.primary },
    subtitle:       { fontSize: fontSize.sm, color: t.text.secondary, marginTop: 2 },
    markAllBtn:     { paddingHorizontal: spacing[3], paddingVertical: 6, backgroundColor: t.border.light, borderRadius: radii.sm },
    markAllText:    { fontSize: fontSize.sm, color: colors.sky[500], fontWeight: fontWeight.semibold },
    center:         { flex: 1, alignItems: "center", justifyContent: "center", padding: 32, gap: spacing[3] },
    emptyTitle:     { fontSize: fontSize.lg, fontWeight: fontWeight.bold, color: t.text.primary, marginTop: 4 },
    emptyText:      { fontSize: 14, color: t.text.muted, textAlign: "center", lineHeight: 20 },
    list:           { paddingBottom: spacing[6] },
    loadingFooter:  { paddingVertical: spacing[4] },
  });
}

function makeItemStyles(t: ThemeContextValue) {
  return StyleSheet.create({
    item: {
      flexDirection: "row",
      alignItems: "flex-start",
      padding: spacing[4],
      paddingHorizontal: spacing[5],
      backgroundColor: t.surface.bgCard,
      gap: spacing[3],
    },
    itemUnread:     { backgroundColor: colors.sky[50] },
    iconWrap: {
      width: 36,
      height: 36,
      borderRadius: 10,
      alignItems: "center",
      justifyContent: "center",
      marginTop: 2,
    },
    itemBody:       { flex: 1 },
    itemTitle:      { fontSize: 14, fontWeight: fontWeight.semibold, color: t.text.secondary, marginBottom: 2 },
    itemTitleBold:  { color: t.text.primary, fontWeight: fontWeight.bold },
    itemText:       { fontSize: fontSize.sm, color: t.text.secondary, lineHeight: 18 },
    itemDate:       { fontSize: fontSize.xs, color: t.text.muted, marginTop: 4 },
    readIcon:       { alignSelf: "center" },
    unreadDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: colors.sky[500],
      alignSelf: "center",
    },
  });
}
