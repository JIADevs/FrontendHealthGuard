import { useMemo } from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRoute, type RouteProp } from "@react-navigation/native";
import { useAgendaTaskByIdQuery } from "@helu/api/hooks";
import {
  useAppTheme,
  Spinner,
  spacing,
  fontSize,
  fontWeight,
  radii,
} from "@helu/ui";
import type { ThemeContextValue } from "@helu/ui";
import { Calendar, Clock, Bell, ListTodo } from "lucide-react-native";
import type { RootStackParamList } from "../navigation/RootNavigator";
import { DetailHeader } from "../components/DetailHeader";

type AgendaTaskDetailRoute = RouteProp<RootStackParamList, "AgendaTaskDetail">;

function formatStart(iso: string): { date: string; time: string } {
  const d = new Date(iso);
  return {
    date: d.toLocaleDateString("es-CO", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    }),
    time: d.toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" }),
  };
}

function statusLabel(status: string): string {
  return status === "completed" ? "Completada" : "Pendiente";
}

export function AgendaTaskDetailScreen() {
  const t = useAppTheme();
  const styles = useMemo(() => makeStyles(t), [t]);
  const route = useRoute<AgendaTaskDetailRoute>();
  const { id } = route.params;

  const { data: task, isLoading, isError } = useAgendaTaskByIdQuery(id);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <DetailHeader />
        <View style={styles.center}>
          <Spinner size="lg" />
        </View>
      </SafeAreaView>
    );
  }

  if (isError || !task) {
    return (
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <DetailHeader />
        <View style={styles.center}>
          <Text style={styles.errorText}>No se pudo cargar la tarea.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const { date, time } = formatStart(task.startAt);
  const offsetsLabel =
    task.reminderOffsets.length > 0
      ? task.reminderOffsets.map((m) => `${m} min antes`).join(", ")
      : "Sin avisos";

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <DetailHeader />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.titleRow}>
          <View style={styles.iconWrap}>
            <ListTodo size={22} color={t.accent.backpackFg} strokeWidth={2.25} />
          </View>
          <View style={styles.titleText}>
            <Text style={styles.eyebrow}>Tarea</Text>
            <Text style={styles.title}>{task.title}</Text>
          </View>
        </View>

        <View style={[styles.badge, task.status === "completed" ? styles.badgeDone : styles.badgePending]}>
          <Text
            style={[
              styles.badgeText,
              task.status === "completed" ? styles.badgeTextDone : styles.badgeTextPending,
            ]}
          >
            {statusLabel(task.status)}
          </Text>
        </View>

        {task.description ? <Text style={styles.description}>{task.description}</Text> : null}

        <View style={styles.metaCard}>
          <View style={styles.metaRow}>
            <Calendar size={18} color={t.text.secondary} />
            <Text style={styles.metaText}>{date}</Text>
          </View>
          <View style={styles.metaRow}>
            <Clock size={18} color={t.text.secondary} />
            <Text style={styles.metaText}>{time}</Text>
          </View>
          <View style={styles.metaRow}>
            <Bell size={18} color={t.text.secondary} />
            <Text style={styles.metaText}>{offsetsLabel}</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function makeStyles(t: ThemeContextValue) {
  return StyleSheet.create({
    safe: {
      flex: 1,
      backgroundColor: t.surface.bg,
    },
    center: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      padding: spacing[5],
    },
    errorText: {
      fontSize: fontSize.sm,
      color: t.status.errorFg,
      textAlign: "center",
    },
    content: {
      padding: spacing[4],
      gap: spacing[4],
      paddingBottom: spacing[8],
    },
    titleRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: spacing[3],
    },
    iconWrap: {
      width: 44,
      height: 44,
      borderRadius: radii.full,
      backgroundColor: t.accent.backpackBg,
      alignItems: "center",
      justifyContent: "center",
    },
    titleText: {
      flex: 1,
      gap: spacing[1],
    },
    eyebrow: {
      fontSize: fontSize.xs,
      fontWeight: fontWeight.medium,
      color: t.text.secondary,
      textTransform: "uppercase",
    },
    title: {
      fontSize: fontSize.xl,
      fontWeight: fontWeight.bold,
      color: t.text.primary,
    },
    description: {
      fontSize: fontSize.base,
      color: t.text.secondary,
      lineHeight: 22,
    },
    badge: {
      alignSelf: "flex-start",
      paddingHorizontal: spacing[3],
      paddingVertical: spacing[1],
      borderRadius: radii.full,
    },
    badgePending: {
      backgroundColor: t.accent.backpackBg,
    },
    badgeDone: {
      backgroundColor: t.status.successBg,
    },
    badgeText: {
      fontSize: fontSize.xs,
      fontWeight: fontWeight.semibold,
    },
    badgeTextPending: {
      color: t.accent.backpackFg,
    },
    badgeTextDone: {
      color: t.status.successFg,
    },
    metaCard: {
      backgroundColor: t.surface.bgCard,
      borderRadius: radii.lg,
      padding: spacing[4],
      gap: spacing[3],
    },
    metaRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing[3],
    },
    metaText: {
      flex: 1,
      fontSize: fontSize.sm,
      color: t.text.primary,
    },
  });
}
