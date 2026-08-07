import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { memo, useCallback, useMemo } from "react";
import { type Notification } from "@helu/api";
import { useNotificationsScreen } from "../hooks/useNotificationsScreen";
import { palette, spacing, fontWeight, useAppTheme, Button, Typography, Spinner, EmptyState } from "@helu/ui";
import type { ThemeContextValue } from "@helu/ui";
import { Bell, Calendar, Pill, Activity, Info, CheckCircle, Users } from "lucide-react-native";
import { navigateForNotification, buildRoutePayloadFromNotification } from "../navigation/notificationRouting";

const TYPE_CONFIG: Record<string, { icon: typeof Bell; color: string; bg: string }> = {
  APPOINTMENT: { icon: Calendar, color: palette.brand[500],              bg: palette.brand[100] },
  MEDICATION:  { icon: Pill,     color: palette.status.warning[500],     bg: palette.status.warning[50] },
  CHECKIN:     { icon: Activity, color: palette.accent.notification[500], bg: palette.accent.notification[100] },
  DELEGATION_INVITE: { icon: Users, color: palette.brand[500],            bg: palette.brand[100] },
  SYSTEM:      { icon: Bell,     color: palette.accent.ai[500],          bg: palette.accent.ai[100] },
  INFO:        { icon: Info,     color: palette.surface[500],            bg: palette.surface[100] },
};

const NotificationItem = memo(function NotificationItem({
  item,
  onPress,
}: {
  item: Notification;
  onPress: (item: Notification) => void;
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
    onPress(item);
  }, [item, onPress]);

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
        <Typography variant="bodySm" color="secondary" numberOfLines={2}>{item.body}</Typography>
        <View style={{ marginTop: 4 }}>
          <Typography variant="caption" color="muted">{formattedDate}</Typography>
        </View>
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

  const screen = useNotificationsScreen();

  const handleNotificationPress = useCallback(
    (item: Notification) => {
      if (!item.isRead) screen.markRead(item.id);
      navigateForNotification(buildRoutePayloadFromNotification(item));
    },
    [screen.markRead],
  );

  const handleEndReached = useCallback(() => {
    if (screen.hasNextPage && !screen.isFetchingNextPage) screen.fetchNextPage();
  }, [screen.hasNextPage, screen.isFetchingNextPage, screen.fetchNextPage]);

  const renderItem = useCallback(
    ({ item }: { item: Notification }) => (
      <NotificationItem item={item} onPress={handleNotificationPress} />
    ),
    [handleNotificationPress],
  );

  return (
    <View style={styles.container}>
      {screen.unreadCount > 0 && (
        <View style={styles.header}>
          <Typography variant="bodySm" color="secondary">{screen.unreadCount} sin leer</Typography>
          <View style={{ flex: 1 }} />
          <Button variant="ghost" size="sm" onPress={screen.markAllRead}>
            Marcar todo leído
          </Button>
        </View>
      )}

      {screen.isLoading ? (
        <View style={styles.center}>
          <Spinner size="lg" />
        </View>
      ) : screen.notifications.length === 0 ? (
        <EmptyState
          icon={<Bell size={48} color={t.border.medium} />}
          message="Sin notificaciones"
          description="Aquí aparecerán tus recordatorios de citas, medicamentos y más."
        />
      ) : (
        <FlatList
          data={screen.notifications}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          refreshControl={
            <RefreshControl
              refreshing={screen.isRefetching}
              onRefresh={screen.refetch}
              tintColor={t.brand.fg}
            />
          }
          onEndReached={handleEndReached}
          onEndReachedThreshold={0.3}
          ListFooterComponent={
            screen.isFetchingNextPage ? (
              <ActivityIndicator style={styles.loadingFooter} color={t.brand.fg} />
            ) : null
          }
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={Separator}
        />
      )}
    </View>
  );
}

function makeStyles(t: ThemeContextValue) {
  return StyleSheet.create({
    container:     { flex: 1, backgroundColor: t.surface.bg },
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
    center:        { flex: 1, alignItems: "center", justifyContent: "center", padding: 32, gap: spacing[3] },
    list:          { paddingBottom: spacing[6] },
    loadingFooter: { paddingVertical: spacing[4] },
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
    itemUnread:    { backgroundColor: t.brand.tint },
    iconWrap: {
      width: 36,
      height: 36,
      borderRadius: 10,
      alignItems: "center",
      justifyContent: "center",
      marginTop: 2,
    },
    itemBody:      { flex: 1, gap: 2 },
    itemTitle:     { fontSize: 14, fontWeight: fontWeight.semibold, color: t.text.secondary, marginBottom: 2 },
    itemTitleBold: { color: t.text.primary, fontWeight: fontWeight.bold },
    readIcon:      { alignSelf: "center" },
    unreadDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: t.brand.fg,
      alignSelf: "center",
    },
  });
}
