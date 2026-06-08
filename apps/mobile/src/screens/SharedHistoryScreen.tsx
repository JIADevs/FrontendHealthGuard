import { useCallback, useMemo, useState } from "react";
import { FlatList, RefreshControl, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { ShareLink, ShareStatusFilter } from "@helu/api";
import { useShareHistoryQuery } from "@helu/api/hooks";
import { isApiError } from "@helu/api";
import { Button, EmptyState, Spinner, Typography, spacing, useAppTheme } from "@helu/ui";
import type { ThemeContextValue } from "@helu/ui";
import { Share2 } from "lucide-react-native";
import type { RootStackParamList } from "../navigation/RootNavigator";
import { SharedHistoryFilters, SharedHistoryListItem, useShareFlow } from "../components/share";

function filterShares(items: ShareLink[], status: ShareStatusFilter): ShareLink[] {
  if (status === "all") return items;
  return items.filter((item) => item.status === status);
}

export function SharedHistoryScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const shareFlow = useShareFlow(navigation);
  const t = useAppTheme();
  const styles = useMemo(() => makeStyles(t), [t]);
  const [status, setStatus] = useState<ShareStatusFilter>("all");
  const shares = useShareHistoryQuery();

  const filteredItems = useMemo(
    () => filterShares(shares.data ?? [], status),
    [shares.data, status],
  );

  const errorMessage = shares.isError
    ? isApiError(shares.error)
      ? shares.error.message
      : shares.error instanceof Error
        ? shares.error.message
        : "No se pudieron cargar los enlaces compartidos."
    : null;

  const renderItem = useCallback(
    ({ item }: { item: ShareLink }) => (
      <SharedHistoryListItem item={item} onPress={() => shareFlow.openDetail(item, "Compartidos")} />
    ),
    [shareFlow],
  );

  if (errorMessage) {
    return (
      <SafeAreaView style={styles.container} edges={["bottom"]}>
        <View style={styles.header}>
          <Typography variant="caption" color="secondary">
            Historial y enlaces activos
          </Typography>
        </View>
        <SharedHistoryFilters value={status} onChange={setStatus} />
        <View style={styles.center}>
          <Typography variant="bodySm" color="error" style={styles.errorText}>
            {errorMessage}
          </Typography>
          <Button variant="secondary" size="sm" onPress={() => void shares.refetch()}>
            Reintentar
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  if (shares.isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={["bottom"]}>
        <View style={styles.header}>
          <Typography variant="caption" color="secondary">
            Historial y enlaces activos
          </Typography>
        </View>
        <SharedHistoryFilters value={status} onChange={setStatus} />
        <View style={styles.center}>
          <Spinner size="lg" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <View style={styles.header}>
        <Typography variant="caption" color="secondary">
          Historial y enlaces activos
        </Typography>
      </View>
      <SharedHistoryFilters value={status} onChange={setStatus} />
      <FlatList
        data={filteredItems}
        keyExtractor={(item) => `${item.resourceType}-${item.linkId}`}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={shares.isFetching && !shares.isLoading}
            onRefresh={() => void shares.refetch()}
            tintColor={t.brand.fg}
          />
        }
        ListEmptyComponent={
          <EmptyState
            icon={<Share2 size={40} color={t.border.medium} />}
            message={
              status === "all"
                ? "No tienes enlaces compartidos todavía."
                : `No hay enlaces ${status === "active" ? "activos" : "expirados"}.`
            }
          />
        }
      />
    </SafeAreaView>
  );
}

function makeStyles(t: ThemeContextValue) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: t.surface.bg,
    },
    header: {
      paddingHorizontal: spacing[5],
      paddingTop: spacing[2],
      paddingBottom: spacing[3],
    },
    list: {
      paddingBottom: spacing[10],
      flexGrow: 1,
    },
    center: {
      flex: 1,
      paddingVertical: spacing[10],
      paddingHorizontal: spacing[5],
      alignItems: "center",
      gap: spacing[3],
    },
    errorText: {
      textAlign: "center",
    },
  });
}
