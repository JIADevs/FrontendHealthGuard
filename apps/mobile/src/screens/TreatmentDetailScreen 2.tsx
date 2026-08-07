import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import Toast from "react-native-toast-message";
import {
  Activity,
  CalendarDays,
  FileText,
  HeartPulse,
  Pencil,
  Pill,
  Trash2,
} from "lucide-react-native";
import {
  ConfirmModal,
  EmptyState,
  Spinner,
  fontSize,
  fontWeight,
  palette,
  radii,
  spacing,
  useAppTheme,
} from "@helu/ui";
import type { ThemeContextValue } from "@helu/ui";
import {
  isApiError,
} from "@helu/api";
import {
  useDeleteTreatmentMutation,
  useTreatmentByIdQuery,
} from "@helu/api/hooks";
import { DetailHeader } from "../components/DetailHeader";
import type { RootStackParamList } from "../navigation/RootNavigator";

const MOOD_LABELS: Record<string, string> = {
  excellent: "Excelente",
  good: "Bien",
  okay: "Normal",
  bad: "Mal",
  awful: "Muy mal",
};

function formatDate(value?: string | null) {
  if (!value) return null;
  return new Date(value).toLocaleDateString("es-CO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function statusLabel(status: string) {
  if (status === "ACTIVE") return "Activo";
  if (status === "COMPLETED") return "Completado";
  return "Inactivo";
}

export function TreatmentDetailScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute();
  const { id } = route.params as { id: string };
  const t = useAppTheme();
  const styles = useMemo(() => makeStyles(t), [t]);
  const [showDelete, setShowDelete] = useState(false);

  const query = useTreatmentByIdQuery(id);
  const deleteMut = useDeleteTreatmentMutation();

  function confirmDelete() {
    deleteMut.mutate(id, {
      onSuccess: () => {
        setShowDelete(false);
        Toast.show({ type: "success", text1: "Tratamiento eliminado" });
        navigation.goBack();
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

  if (query.isLoading || !query.data) {
    return (
      <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
        <DetailHeader />
        <View style={styles.center}>
          {query.isLoading ? <Spinner size="lg" /> : <Text style={styles.muted}>Tratamiento no encontrado.</Text>}
        </View>
      </SafeAreaView>
    );
  }

  const treatment = query.data;
  const totalRelated =
    treatment.medicationCycles.length +
    treatment.appointments.length +
    treatment.documents.length +
    treatment.dailyCheckins.length +
    treatment.symptoms.length;

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <DetailHeader
        actions={[
          {
            icon: Pencil,
            label: "Editar",
            onPress: () => navigation.navigate("TreatmentForm", { id }),
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
        <View style={[styles.hero, { backgroundColor: t.brand.solid }]}>
          <View style={styles.heroTop}>
            <View style={styles.heroIcon}>
              <Activity size={28} color="#fff" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.heroTitle}>{treatment.name}</Text>
              {treatment.description ? (
                <Text style={styles.heroDescription}>{treatment.description}</Text>
              ) : null}
            </View>
          </View>
          <View style={styles.heroBadges}>
            <Text style={styles.heroBadge}>{statusLabel(treatment.status)}</Text>
            <Text style={styles.heroBadge}>
              {totalRelated === 1 ? "1 relacionado" : `${totalRelated} relacionados`}
            </Text>
          </View>
        </View>

        {(treatment.startDate || treatment.endDate) && (
          <View style={styles.metaCard}>
            <InfoText label="Inicio" value={formatDate(treatment.startDate) ?? "Sin fecha"} />
            <InfoText label="Fin" value={formatDate(treatment.endDate) ?? "En curso"} />
          </View>
        )}

        {totalRelated === 0 ? (
          <EmptyState
            message="Este tratamiento aun no tiene elementos asociados."
            description="Puedes asociarlo desde medicamentos, citas, documentos o check-ins."
          />
        ) : (
          <>
            <RelatedSection title="Medicamentos" empty={treatment.medicationCycles.length === 0}>
              {treatment.medicationCycles.map((cycle) => (
                <RelatedRow
                  key={cycle.id}
                  icon={<Pill size={18} color={t.accent.medFg} />}
                  title={cycle.medicationName}
                  subtitle={[cycle.dosage, formatDate(cycle.startDate)].filter(Boolean).join(" - ")}
                  onPress={() =>
                    navigation.navigate("CycleDetail", {
                      cycleId: cycle.id,
                      medicationId: cycle.medicationId,
                      medicationName: cycle.medicationName,
                    })
                  }
                />
              ))}
            </RelatedSection>

            <RelatedSection title="Citas y chequeos" empty={treatment.appointments.length === 0}>
              {treatment.appointments.map((appointment) => (
                <RelatedRow
                  key={appointment.id}
                  icon={<CalendarDays size={18} color={t.accent.calFg} />}
                  title={appointment.name || (appointment.type === "EXAM" ? "Examen" : "Cita medica")}
                  subtitle={[formatDate(appointment.date), appointment.status].filter(Boolean).join(" - ")}
                  onPress={() => navigation.navigate("AppointmentDetail", { id: appointment.id })}
                />
              ))}
            </RelatedSection>

            <RelatedSection title="Documentos" empty={treatment.documents.length === 0}>
              {treatment.documents.map((doc) => (
                <RelatedRow
                  key={doc.id}
                  icon={<FileText size={18} color={t.accent.docFg} />}
                  title={doc.title}
                  subtitle={[doc.format, formatDate(doc.documentDate ?? doc.uploadedAt)].filter(Boolean).join(" - ")}
                  onPress={() => navigation.navigate("DocumentDetail", { id: doc.id, title: doc.title, backTitle: "Tratamiento" })}
                />
              ))}
            </RelatedSection>

            <RelatedSection title="Check-ins" empty={treatment.dailyCheckins.length === 0}>
              {treatment.dailyCheckins.map((checkIn) => (
                <RelatedRow
                  key={checkIn.id}
                  icon={<HeartPulse size={18} color={t.accent.notifFg} />}
                  title={MOOD_LABELS[checkIn.mood] ?? checkIn.mood}
                  subtitle={[formatDate(checkIn.recordedAt), checkIn.notes].filter(Boolean).join(" - ")}
                />
              ))}
            </RelatedSection>

            <RelatedSection title="Sintomas" empty={treatment.symptoms.length === 0}>
              {treatment.symptoms.map((symptom) => (
                <RelatedRow
                  key={symptom.id}
                  icon={<HeartPulse size={18} color={t.status.warningFg} />}
                  title={symptom.name}
                  subtitle={[formatDate(symptom.recordedAt), symptom.severity ? `Severidad ${symptom.severity}` : null].filter(Boolean).join(" - ")}
                />
              ))}
            </RelatedSection>
          </>
        )}
      </ScrollView>

      {showDelete && (
        <ConfirmModal
          title="Eliminar tratamiento"
          message="Se quitara de todos los elementos asociados. Esta accion no se puede deshacer."
          confirmLabel="Eliminar"
          loading={deleteMut.isPending}
          onConfirm={confirmDelete}
          onCancel={() => setShowDelete(false)}
          icon={<Trash2 size={26} color={palette.status.error[500]} strokeWidth={2.25} />}
          iconTone="danger"
        />
      )}
    </SafeAreaView>
  );
}

function InfoText({ label, value }: { label: string; value: string }) {
  const t = useAppTheme();
  const styles = useMemo(() => makeStyles(t), [t]);
  return (
    <View style={styles.infoItem}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

function RelatedSection({
  title,
  empty,
  children,
}: {
  title: string;
  empty: boolean;
  children: ReactNode;
}) {
  const t = useAppTheme();
  const styles = useMemo(() => makeStyles(t), [t]);
  if (empty) return null;
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionCard}>{children}</View>
    </View>
  );
}

function RelatedRow({
  icon,
  title,
  subtitle,
  onPress,
}: {
  icon: ReactNode;
  title: string;
  subtitle?: string;
  onPress?: () => void;
}) {
  const t = useAppTheme();
  const styles = useMemo(() => makeStyles(t), [t]);
  const content = (
    <>
      <View style={styles.rowIcon}>{icon}</View>
      <View style={styles.rowBody}>
        <Text style={styles.rowTitle} numberOfLines={1}>{title}</Text>
        {subtitle ? <Text style={styles.rowSubtitle} numberOfLines={2}>{subtitle}</Text> : null}
      </View>
    </>
  );

  if (onPress) {
    return (
      <TouchableOpacity style={styles.relatedRow} onPress={onPress} activeOpacity={0.7}>
        {content}
      </TouchableOpacity>
    );
  }

  return <View style={styles.relatedRow}>{content}</View>;
}

function makeStyles(t: ThemeContextValue) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: t.surface.bg },
    center: { flex: 1, alignItems: "center", justifyContent: "center" },
    muted: { color: t.text.secondary },
    scroll: { flex: 1 },
    content: { padding: spacing[4], gap: spacing[4], paddingBottom: spacing[8] },
    hero: {
      borderRadius: radii.xl,
      padding: spacing[4],
      gap: spacing[4],
    },
    heroTop: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing[3],
    },
    heroIcon: {
      width: 52,
      height: 52,
      borderRadius: 26,
      backgroundColor: "rgba(255,255,255,0.2)",
      alignItems: "center",
      justifyContent: "center",
    },
    heroTitle: {
      color: "#fff",
      fontSize: fontSize.xl,
      fontWeight: fontWeight.bold,
    },
    heroDescription: {
      color: "rgba(255,255,255,0.82)",
      fontSize: fontSize.sm,
      marginTop: spacing[1],
      lineHeight: 19,
    },
    heroBadges: { flexDirection: "row", flexWrap: "wrap", gap: spacing[2] },
    heroBadge: {
      color: "#fff",
      backgroundColor: "rgba(255,255,255,0.2)",
      paddingHorizontal: spacing[2],
      paddingVertical: spacing[1],
      borderRadius: radii.full,
      fontSize: fontSize.xs,
      fontWeight: fontWeight.semibold,
    },
    metaCard: {
      flexDirection: "row",
      backgroundColor: t.surface.bgCard,
      borderColor: t.border.light,
      borderWidth: 1,
      borderRadius: radii.lg,
      overflow: "hidden",
    },
    infoItem: {
      flex: 1,
      padding: spacing[3],
      gap: spacing[1],
    },
    infoLabel: { color: t.text.secondary, fontSize: fontSize.xs },
    infoValue: {
      color: t.text.primary,
      fontSize: fontSize.sm,
      fontWeight: fontWeight.semibold,
    },
    section: { gap: spacing[2] },
    sectionTitle: {
      color: t.text.primary,
      fontSize: fontSize.base,
      fontWeight: fontWeight.bold,
    },
    sectionCard: {
      backgroundColor: t.surface.bgCard,
      borderColor: t.border.light,
      borderWidth: 1,
      borderRadius: radii.lg,
      overflow: "hidden",
    },
    relatedRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing[3],
      padding: spacing[3],
      borderBottomWidth: 1,
      borderBottomColor: t.border.light,
    },
    rowIcon: {
      width: 36,
      height: 36,
      borderRadius: radii.md,
      backgroundColor: t.border.light,
      alignItems: "center",
      justifyContent: "center",
    },
    rowBody: { flex: 1, gap: spacing[1] },
    rowTitle: {
      color: t.text.primary,
      fontSize: fontSize.sm,
      fontWeight: fontWeight.semibold,
    },
    rowSubtitle: {
      color: t.text.secondary,
      fontSize: fontSize.xs,
      lineHeight: 16,
    },
  });
}
