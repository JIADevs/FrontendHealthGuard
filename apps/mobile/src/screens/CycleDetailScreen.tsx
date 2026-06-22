import { useMemo, useState } from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";
import Toast from "react-native-toast-message";
import {
  Pill,
  CalendarDays,
  Clock,
  FileText,
  Activity,
  Pencil,
  Trash2,
} from "lucide-react-native";
import {
  colors,
  radii,
  spacing,
  fontSize,
  fontWeight,
  useAppTheme,
  Spinner,
  ConfirmModal,
} from "@helu/ui";
import type { ThemeContextValue } from "@helu/ui";
import {
  useMedicationByIdQuery,
  useUpdateMedicationCycleMutation,
  useDeleteMedicationCycleMutation,
} from "@helu/api/hooks";
import { isApiError, type MedicationCycle } from "@helu/api";
import { DetailHeader } from "../components/DetailHeader";
import { DetailFooter } from "../components/DetailFooter";
import type { FooterAction } from "../components/DetailFooter";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function isCycleActive(cycle: MedicationCycle): boolean {
  if (!cycle.endDate) return true;
  return new Date(cycle.endDate) >= new Date();
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("es-CO", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function formatShort(iso: string): string {
  return new Date(iso).toLocaleDateString("es-CO", {
    day: "2-digit",
    month: "short",
  });
}

// ─── Detail cell ──────────────────────────────────────────────────────────────

function DetailCell({
  label,
  value,
  icon,
}: {
  label: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  icon: any;
  value: string;
}) {
  const t = useAppTheme();
  return (
    <View style={[cellStyles.cell, { backgroundColor: t.surface.bgCard }]}>
      <Text style={[cellStyles.label, { color: t.text.secondary }]}>{label}</Text>
      <View style={cellStyles.row}>
        <View style={cellStyles.iconWrap}>{icon}</View>
        <Text style={[cellStyles.value, { color: t.text.primary }]} numberOfLines={4}>
          {value}
        </Text>
      </View>
    </View>
  );
}

const cellStyles = StyleSheet.create({
  cell:     { borderRadius: radii.lg, padding: spacing[3], gap: spacing[2] },
  label:    { fontSize: fontSize.xs, fontWeight: fontWeight.medium },
  row:      { flexDirection: "row", alignItems: "center", gap: spacing[2] },
  iconWrap: { width: 20, alignItems: "center" },
  value:    { fontSize: fontSize.sm, fontWeight: fontWeight.medium, flex: 1 },
});

// ─── Screen ──────────────────────────────────────────────────────────────────

export function CycleDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { cycleId, medicationId, medicationName } = route.params as {
    cycleId: string;
    medicationId: string;
    medicationName: string;
  };

  const t = useAppTheme();
  const styles = useMemo(() => makeStyles(t), [t]);

  const [showFinalize, setShowFinalize] = useState(false);
  const [showDelete, setShowDelete] = useState(false);

  const { data: med, isLoading } = useMedicationByIdQuery(medicationId);
  const updateMut = useUpdateMedicationCycleMutation();
  const deleteMut = useDeleteMedicationCycleMutation();

  const cycle = med?.cycles.find((c: MedicationCycle) => c.id === cycleId);
  const active = cycle ? isCycleActive(cycle) : false;

  function handleFinalize() {
    const today = new Date().toISOString().slice(0, 10);
    updateMut.mutate(
      { id: cycleId, cycle: { endDate: today } },
      {
        onSuccess: () => {
          setShowFinalize(false);
          Toast.show({ type: "success", text1: "Ciclo finalizado" });
        },
        onError: (err) => {
          setShowFinalize(false);
          Toast.show({
            type: "error",
            text1: "Error al finalizar",
            text2: isApiError(err) ? err.message : "Intenta de nuevo",
          });
        },
      },
    );
  }

  function handleDelete() {
    deleteMut.mutate(cycleId, {
      onSuccess: () => {
        setShowDelete(false);
        Toast.show({ type: "success", text1: "Ciclo eliminado" });
        navigation.goBack();
      },
      onError: (err) => {
        setShowDelete(false);
        Toast.show({
          type: "error",
          text1: "Error al eliminar",
          text2: isApiError(err) ? err.message : "Intenta de nuevo",
        });
      },
    });
  }

  if (isLoading || !cycle) {
    return (
      <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
        <DetailHeader />
        <View style={styles.centered}>
          {isLoading
            ? <Spinner size="lg" />
            : <Text style={{ color: t.text.secondary }}>Ciclo no encontrado.</Text>}
        </View>
      </SafeAreaView>
    );
  }

  const footerActions: FooterAction[] = [
    {
      label: "Editar",
      variant: "outline",
      icon: <Pencil size={18} color={t.text.primary} />,
      onPress: () =>
        (navigation as any).navigate("MedicationCycleEdit", {
          cycleId,
          medicationId,
          medicationName,
        }),
    },
    ...(active
      ? [{
          label: "Finalizar",
          variant: "outline" as const,
          icon: <CalendarDays size={18} color={t.status.warningFg ?? t.text.primary} />,
          onPress: () => setShowFinalize(true),
        }]
      : []),
    {
      label: "Eliminar ciclo",
      variant: "destructive" as const,
      onPress: () => setShowDelete(true),
    },
  ];

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <DetailHeader
        actions={[
          {
            icon: Pencil,
            label: "Editar",
            onPress: () =>
              (navigation as any).navigate("MedicationCycleEdit", {
                cycleId,
                medicationId,
                medicationName,
              }),
          },
          {
            icon: Trash2,
            label: "Eliminar",
            onPress: () => setShowDelete(true),
            destructive: true,
          },
        ]}
      />

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>

        {/* Hero card */}
        <View style={[styles.heroCard, { backgroundColor: t.brand.solid }]}>
          <View style={styles.heroTop}>
            <View style={[styles.heroIcon, { backgroundColor: "rgba(255,255,255,0.2)" }]}>
              <Pill size={28} color={colors.white} />
            </View>
            <View style={styles.heroInfo}>
              <Text style={styles.heroMedName}>{medicationName}</Text>
              <Text style={styles.heroDosage}>
                {cycle.dosage} · cada {cycle.frequency}h
              </Text>
            </View>
          </View>
          <View style={styles.heroBadgeRow}>
            <View style={[
              styles.heroBadge,
              { backgroundColor: active ? "rgba(255,255,255,0.25)" : "rgba(0,0,0,0.18)" },
            ]}>
              <View style={[
                styles.heroBadgeDot,
                { backgroundColor: active ? "#4ade80" : "rgba(255,255,255,0.55)" },
              ]} />
              <Text style={styles.heroBadgeText}>{active ? "Activo" : "Finalizado"}</Text>
            </View>
          </View>
        </View>

        {/* Stats strip */}
        <View style={[styles.statsStrip, { backgroundColor: t.surface.bgCard }]}>
          <View style={styles.statItem}>
            <CalendarDays size={16} color={t.text.secondary} />
            <Text style={[styles.statMain, { color: t.text.primary }]}>
              {formatShort(cycle.startDate)}
            </Text>
            <Text style={[styles.statSub, { color: t.text.secondary }]}>Inicio</Text>
          </View>

          <View style={[styles.statDivider, { backgroundColor: t.border.medium }]} />

          <View style={styles.statItem}>
            <Activity size={16} color={t.text.secondary} />
            <Text style={[styles.statMain, { color: t.text.primary }]}>{cycle.frequency}h</Text>
            <Text style={[styles.statSub, { color: t.text.secondary }]}>Frecuencia</Text>
          </View>

          <View style={[styles.statDivider, { backgroundColor: t.border.medium }]} />

          <View style={styles.statItem}>
            <CalendarDays size={16} color={t.text.secondary} />
            <Text style={[styles.statMain, { color: t.text.primary }]}>
              {cycle.endDate ? formatShort(cycle.endDate) : "En curso"}
            </Text>
            <Text style={[styles.statSub, { color: t.text.secondary }]}>Fin</Text>
          </View>
        </View>

        {/* Detail cells */}
        <Text style={[styles.sectionTitle, { color: t.text.primary }]}>Detalles</Text>

        <View style={styles.grid}>
          <DetailCell
            label="Dosis"
            value={cycle.dosage}
            icon={<Pill size={18} color={t.accent.medFg} />}
          />

          <DetailCell
            label="Inicio del ciclo"
            value={[
              formatDate(cycle.startDate),
              cycle.firstIntakeTime
                ? new Date(cycle.firstIntakeTime).toLocaleTimeString("es-CO", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : null,
            ].filter(Boolean).join("\n")}
            icon={<CalendarDays size={18} color={t.text.secondary} />}
          />

          {cycle.endDate ? (
            <DetailCell
              label="Fin del ciclo"
              value={formatDate(cycle.endDate)}
              icon={<CalendarDays size={18} color={t.text.secondary} />}
            />
          ) : null}

          {cycle.nextIntakeTime && active ? (
            <DetailCell
              label="Próxima toma"
              value={new Date(cycle.nextIntakeTime).toLocaleString("es-CO", {
                day: "2-digit",
                month: "short",
                hour: "2-digit",
                minute: "2-digit",
              })}
              icon={<Clock size={18} color={t.text.secondary} />}
            />
          ) : null}

          {cycle.reason ? (
            <DetailCell
              label="Razón / indicación"
              value={cycle.reason}
              icon={<FileText size={18} color={t.text.secondary} />}
            />
          ) : null}

          {cycle.notes ? (
            <DetailCell
              label="Notas"
              value={cycle.notes}
              icon={<FileText size={18} color={t.text.secondary} />}
            />
          ) : null}
        </View>

      </ScrollView>

      <DetailFooter actions={footerActions} />

      {showFinalize && (
        <ConfirmModal
          title="Finalizar ciclo"
          message="Se marcará hoy como fecha de fin. Esta acción se puede revertir editando el ciclo."
          confirmLabel="Finalizar"
          loading={updateMut.isPending}
          onConfirm={handleFinalize}
          onCancel={() => setShowFinalize(false)}
        />
      )}

      {showDelete && (
        <ConfirmModal
          title="Eliminar ciclo"
          message={`¿Eliminar este ciclo de ${medicationName}? Esta acción no se puede deshacer.`}
          confirmLabel="Eliminar"
          loading={deleteMut.isPending}
          onConfirm={handleDelete}
          onCancel={() => setShowDelete(false)}
        />
      )}
    </SafeAreaView>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

function makeStyles(t: ThemeContextValue) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: t.surface.bg },
    centered:  { flex: 1, justifyContent: "center", alignItems: "center" },
    scroll:    { flex: 1 },
    content:   { padding: spacing[4], gap: spacing[4], paddingBottom: spacing[8] },

    // Hero
    heroCard:     { borderRadius: radii.xl, padding: spacing[4], gap: spacing[3] },
    heroTop:      { flexDirection: "row", alignItems: "center", gap: spacing[3] },
    heroIcon:     {
      width: 52, height: 52, borderRadius: 26,
      justifyContent: "center", alignItems: "center", flexShrink: 0,
    },
    heroInfo:     { flex: 1, gap: 4 },
    heroMedName:  { fontSize: fontSize.xl, fontWeight: fontWeight.bold, color: colors.white, lineHeight: 26 },
    heroDosage:   { fontSize: fontSize.sm, color: "rgba(255,255,255,0.85)" },
    heroBadgeRow: { flexDirection: "row", gap: spacing[2] },
    heroBadge:    {
      flexDirection: "row", alignItems: "center", gap: spacing[1],
      paddingHorizontal: spacing[2], paddingVertical: 4, borderRadius: radii.full,
    },
    heroBadgeDot: { width: 6, height: 6, borderRadius: 3 },
    heroBadgeText:{ fontSize: fontSize.xs, fontWeight: fontWeight.semibold, color: colors.white },

    // Stats strip
    statsStrip:  { flexDirection: "row", borderRadius: radii.lg, overflow: "hidden" },
    statItem:    { flex: 1, alignItems: "center", paddingVertical: spacing[3], paddingHorizontal: spacing[2], gap: 2 },
    statMain:    { fontSize: fontSize.sm, fontWeight: fontWeight.semibold, textAlign: "center" },
    statSub:     { fontSize: fontSize.xs, textAlign: "center" },
    statDivider: { width: 1, marginVertical: spacing[3] },

    // Section
    sectionTitle: { fontSize: fontSize.base, fontWeight: fontWeight.bold },
    grid:         { gap: spacing[2] },
  });
}
