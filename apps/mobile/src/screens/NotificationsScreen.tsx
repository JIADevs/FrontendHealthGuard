import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { memo, useCallback, useEffect } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getNotifications, markNotificationAsRead, type Notification } from "@healthguard/api";
import { useNotifStore } from "@healthguard/stores";
import { Bell, Calendar, Pill, Activity, Info, CheckCircle } from "lucide-react-native";

const LIMIT = 20;

const TYPE_CONFIG: Record<string, { icon: typeof Bell; color: string; bg: string }> = {
  APPOINTMENT: { icon: Calendar, color: "#0ea5e9", bg: "#e0f2fe" },
  MEDICATION:  { icon: Pill,     color: "#f59e0b", bg: "#fef3c7" },
  CHECKIN:     { icon: Activity, color: "#10b981", bg: "#d1fae5" },
  SYSTEM:      { icon: Bell,     color: "#8b5cf6", bg: "#ede9fe" },
  INFO:        { icon: Info,     color: "#64748b", bg: "#f1f5f9" },
};

const Separator = () => <View style={styles.separator} />;

const NotificationItem = memo(function NotificationItem({
  item,
  onPress,
}: {
  item: Notification;
  onPress: (id: string) => void;
}) {
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
        ? <CheckCircle size={16} color="#cbd5e1" style={styles.readIcon} />
        : <View style={styles.unreadDot} />
      }
    </TouchableOpacity>
  );
});

export function NotificationsScreen() {
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

  // Sincroniza el badge del store con los datos reales de la query
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
          <ActivityIndicator size="large" color="#0ea5e9" />
        </View>
      ) : notifications.length === 0 ? (
        <View style={styles.center}>
          <Bell size={48} color="#cbd5e1" />
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
              tintColor="#0ea5e9"
            />
          }
          onEndReached={handleEndReached}
          onEndReachedThreshold={0.3}
          ListFooterComponent={
            isFetchingNextPage ? (
              <ActivityIndicator style={styles.loadingFooter} color="#0ea5e9" />
            ) : null
          }
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={Separator}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 24,
    paddingBottom: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  title: { fontSize: 24, fontWeight: "800", color: "#0f172a" },
  subtitle: { fontSize: 13, color: "#64748b", marginTop: 2 },
  markAllBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "#f1f5f9",
    borderRadius: 8,
  },
  markAllText: { fontSize: 13, color: "#0ea5e9", fontWeight: "600" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32, gap: 12 },
  emptyTitle: { fontSize: 18, fontWeight: "700", color: "#334155", marginTop: 4 },
  emptyText: { fontSize: 14, color: "#94a3b8", textAlign: "center", lineHeight: 20 },
  list: { paddingBottom: 24 },
  loadingFooter: { paddingVertical: 16 },
  item: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 16,
    paddingHorizontal: 20,
    backgroundColor: "#fff",
    gap: 12,
  },
  itemUnread: { backgroundColor: "#f0f9ff" },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  itemBody: { flex: 1 },
  itemTitle: { fontSize: 14, fontWeight: "600", color: "#334155", marginBottom: 2 },
  itemTitleBold: { color: "#0f172a", fontWeight: "700" },
  itemText: { fontSize: 13, color: "#64748b", lineHeight: 18 },
  itemDate: { fontSize: 11, color: "#94a3b8", marginTop: 4 },
  readIcon: { alignSelf: "center" },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#0ea5e9",
    alignSelf: "center",
  },
  separator: { height: 1, backgroundColor: "#f1f5f9", marginLeft: 68 },
});
