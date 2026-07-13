import { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SectionList,
  TouchableOpacity,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Activity, Pencil, Plus, Trash2 } from "lucide-react-native";
import Toast from "react-native-toast-message";
import {
  EmptyState,
  Spinner,
  ConfirmModal,
  SearchField,
  colors,
  fontSize,
  fontWeight,
  palette,
  radii,
  shadows,
  spacing,
  useAppTheme,
} from "@helu/ui";
import type { ThemeContextValue } from "@helu/ui";
import { isApiError, type Treatment } from "@helu/api";
import {
  useDeleteTreatmentMutation,
  useTreatmentsQuery,
} from "@helu/api/hooks";
import type { RootStackParamList } from "../navigation/RootNavigator";
import { DocumentsSectionHeader } from "../components/documents/DocumentsSectionHeader";

type TreatmentSection = {
  title: string;
  data: Treatment[];
};

const STATUS_LABELS: Record<Treatment["status"], string> = {
  ACTIVE: "Activos",
  COMPLETED: "Completados",
  INACTIVE: "Inactivos",
};

function statusColor(status: Treatment["status"], t: ThemeContextValue) {
  if (status === "ACTIVE") return t.status.successFg;
  if (status === "COMPLETED") return t.brand.fg;
  return t.text.muted;
}

export function TreatmentsScreen() {
  const t = useAppTheme();
  const styles = useMemo(() => makeStyles(t), [t]);
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [search, setSearch] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Treatment | null>(null);

  const treatmentsQuery = useTreatmentsQuery(1, 100);
  const deleteMut = useDeleteTreatmentMutation();

  const filtered = useMemo(() => {
    const items = treatmentsQuery.data?.items ?? [];
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter((item) =>
      `${item.name} ${item.description ?? ""}`.toLowerCase().includes(q),
    );
  }, [search, treatmentsQuery.data?.items]);

  const sections = useMemo<TreatmentSection[]>(() => {
    return (["ACTIVE", "COMPLETED", "INACTIVE"] as Treatment["status"][])
      .map((status) => ({
        title: STATUS_LABELS[status],
        data: filtered.filter((item) => item.status === status),
      }))
      .filter((section) => section.data.length > 0);
  }, [filtered]);

  function confirmDelete() {
    if (!deleteTarget) return;
    deleteMut.mutate(deleteTarget.id, {
      onSuccess: () => {
        Toast.show({ type: "success", text1: "Tratamiento eliminado" });
        setDeleteTarget(null);
      },
      onError: (err) => {
        Toast.show({
          type: "error",
          text1: "No se pudo eliminar",
          text2: isApiError(err) ? err.message : "Intenta de nuevo",
        });
      },
    });
  }

  const isEmpty = sections.length === 0;

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.title}>Tratamientos</Text>
        <Text style={styles.subtitle}>
          {treatmentsQuery.data?.total ?? 0} registrados
        </Text>
        <SearchField
          value={search}
          onChange={setSearch}
          placeholder="Buscar tratamiento"
        />
      </View>

      {treatmentsQuery.isLoading ? (
        <View style={styles.center}>
          <Spinner size="lg" />
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          stickySectionHeadersEnabled={false}
          contentContainerStyle={isEmpty ? styles.emptyList : styles.list}
          refreshControl={
            <RefreshControl
              refreshing={treatmentsQuery.isRefetching}
              onRefresh={() => treatmentsQuery.refetch()}
              colors={[t.brand.fg]}
              tintColor={t.brand.fg}
            />
          }
          renderSectionHeader={({ section }) => (
            <DocumentsSectionHeader title={section.title} />
          )}
          renderItem={({ item }) => (
            <TreatmentRow
              treatment={item}
              onPress={() => navigation.navigate("TreatmentDetail", { id: item.id })}
              onEdit={() => navigation.navigate("TreatmentForm", { id: item.id })}
              onDelete={() => setDeleteTarget(item)}
            />
          )}
          ListEmptyComponent={
            <EmptyState
              message={
                search.trim()
                  ? "Sin tratamientos para esta busqueda."
                  : "Todavia no tienes tratamientos."
              }
            />
          }
        />
      )}

      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate("TreatmentForm", undefined)}
        activeOpacity={0.85}
        accessibilityRole="button"
        accessibilityLabel="Crear tratamiento"
      >
        <Plus color={colors.white} size={28} />
      </TouchableOpacity>

      {deleteTarget && (
        <ConfirmModal
          title="Eliminar tratamiento"
          message="Se quitara de medicamentos, citas, documentos y check-ins relacionados. Esta accion no se puede deshacer."
          confirmLabel="Eliminar"
          loading={deleteMut.isPending}
          onConfirm={confirmDelete}
          onCancel={() => setDeleteTarget(null)}
          icon={<Trash2 size={26} color={palette.status.error[500]} strokeWidth={2.25} />}
          iconTone="danger"
        />
      )}
    </SafeAreaView>
  );
}

function TreatmentRow({
  treatment,
  onPress,
  onEdit,
  onDelete,
}: {
  treatment: Treatment;
  onPress: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const t = useAppTheme();
  const styles = useMemo(() => makeStyles(t), [t]);
  const dateRange = [
    treatment.startDate ? `Inicio ${treatment.startDate}` : null,
    treatment.endDate ? `Fin ${treatment.endDate}` : null,
  ].filter(Boolean).join(" - ");

  return (
    <View style={styles.card}>
      <TouchableOpacity style={styles.cardBody} onPress={onPress} activeOpacity={0.7}>
        <View style={[styles.iconWrap, { backgroundColor: t.brand.tint }]}>
          <Activity size={22} color={t.brand.fg} />
        </View>
        <View style={styles.cardContent}>
          <Text style={styles.cardTitle} numberOfLines={1}>{treatment.name}</Text>
          {treatment.description ? (
            <Text style={styles.cardDescription} numberOfLines={2}>
              {treatment.description}
            </Text>
          ) : null}
          {dateRange ? <Text style={styles.cardMeta}>{dateRange}</Text> : null}
        </View>
      </TouchableOpacity>

      <View style={styles.rowActions}>
        <View style={[styles.statusDot, { backgroundColor: statusColor(treatment.status, t) }]} />
        <TouchableOpacity onPress={onEdit} hitSlop={8} style={styles.actionBtn}>
          <Pencil size={17} color={t.text.secondary} />
        </TouchableOpacity>
        <TouchableOpacity onPress={onDelete} hitSlop={8} style={styles.actionBtn}>
          <Trash2 size={17} color={t.status.errorFg} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

function makeStyles(t: ThemeContextValue) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: t.surface.bg },
    header: {
      gap: spacing[3],
      paddingHorizontal: spacing[5],
      paddingTop: spacing[4],
      paddingBottom: spacing[3],
      backgroundColor: t.surface.bgCard,
      borderBottomWidth: 1,
      borderBottomColor: t.border.medium,
    },
    title: {
      color: t.text.primary,
      fontSize: fontSize["2xl"],
      fontWeight: fontWeight.bold,
    },
    subtitle: {
      color: t.text.secondary,
      fontSize: fontSize.sm,
    },
    center: { flex: 1, alignItems: "center", justifyContent: "center" },
    list: { paddingBottom: spacing[12] + 56 },
    emptyList: { flexGrow: 1, paddingBottom: spacing[12] + 56 },
    card: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing[2],
      marginHorizontal: spacing[5],
      marginBottom: spacing[3],
      padding: spacing[4],
      backgroundColor: t.surface.bgCard,
      borderRadius: radii.lg,
      borderWidth: 1,
      borderColor: t.border.light,
      ...shadows.sm,
    },
    cardBody: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      gap: spacing[3],
    },
    iconWrap: {
      width: 44,
      height: 44,
      borderRadius: radii.md,
      alignItems: "center",
      justifyContent: "center",
    },
    cardContent: { flex: 1, gap: spacing[1] },
    cardTitle: {
      color: t.text.primary,
      fontSize: fontSize.base,
      fontWeight: fontWeight.semibold,
    },
    cardDescription: {
      color: t.text.secondary,
      fontSize: fontSize.sm,
      lineHeight: 19,
    },
    cardMeta: {
      color: t.text.muted,
      fontSize: fontSize.xs,
    },
    rowActions: {
      alignItems: "center",
      gap: spacing[2],
    },
    statusDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      marginBottom: spacing[1],
    },
    actionBtn: {
      width: 28,
      height: 28,
      borderRadius: radii.sm,
      alignItems: "center",
      justifyContent: "center",
    },
    fab: {
      position: "absolute",
      right: spacing[5],
      bottom: spacing[6],
      width: 56,
      height: 56,
      borderRadius: radii.full,
      backgroundColor: t.brand.solid,
      alignItems: "center",
      justifyContent: "center",
      elevation: 8,
      shadowColor: colors.black,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      zIndex: 90,
    },
  });
}
