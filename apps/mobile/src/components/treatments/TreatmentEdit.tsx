import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { CircleCheck, CirclePause, type LucideIcon } from "lucide-react-native";
import type { TreatmentDetail, TreatmentMedicationCycleRef } from "@helu/api";
import { useTreatmentByIdQuery } from "@helu/api/hooks";
import {
  BOTTOM_ACTION_BAR_HEIGHT,
  BottomActionBar,
  Button,
  ConfirmModal,
  DiscardChangesDialog,
  SegmentedControl,
  Skeleton,
  SkeletonGroup,
  nativeFont,
  radii,
  spacing,
  useAppTheme,
  useSkeletonVisible,
  type ThemeContextValue,
} from "@helu/ui";
import { ScreenHeader } from "../ScreenHeader";
import { SkeletonField, SkeletonFieldRow } from "../SkeletonPieces";
import { FormCard } from "../agenda/FormCard";
import type { SubscribeBeforeLeave } from "../agenda/AppointmentForm";
import { useTreatmentForm } from "../../hooks/useTreatmentForm";
import { notify } from "../../lib/notify";
import { TreatmentFields } from "./TreatmentFields";
import { TREATMENT_STATUS, TREATMENT_STATUS_ORDER, isTreatmentStatus, type TreatmentStatus } from "./treatmentFormat";

export interface TreatmentEditProps {
  id: string;
  /** Leaves the screen (after saving, or after confirming «Descartar») */
  onClose: () => void;
  subscribeBeforeLeave: SubscribeBeforeLeave;
}

const STATUS_OPTIONS = TREATMENT_STATUS_ORDER.map((status) => ({ value: status, label: TREATMENT_STATUS[status].label }));

/**
 * «Editar tratamiento» (decision 2 of #42: there is no mockup). A full screen pushed from the right:
 * the fields of «Nuevo tratamiento» plus «Estado» (Activo · Inactivo · Completado), and «Guardar
 * cambios» in the fixed bar. Loading draws the same cards with skeleton values (§6c).
 */
export function TreatmentEdit({ id, onClose, subscribeBeforeLeave }: TreatmentEditProps) {
  const t = useAppTheme();
  const styles = useMemo(() => makeStyles(t), [t]);
  const query = useTreatmentByIdQuery(id);
  const showSkeleton = useSkeletonVisible(query.isLoading);

  if (!showSkeleton && query.data) {
    return <TreatmentEditBody detail={query.data} onClose={onClose} subscribeBeforeLeave={subscribeBeforeLeave} />;
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScreenHeader title="Editar tratamiento" onBack={onClose} />
      {showSkeleton || query.isLoading ? (
        <>
          <SkeletonGroup label="Cargando el tratamiento" style={[styles.content, styles.skeleton]}>
            <FormCard title="Información básica">
              <SkeletonField label="Nombre" />
              <SkeletonField label="Descripción (opcional)" height={84} />
              <SkeletonFieldRow>
                <View style={styles.half}>
                  <SkeletonField label="Inicio" />
                </View>
                <View style={styles.half}>
                  <SkeletonField label="Fin (opcional)" />
                </View>
              </SkeletonFieldRow>
            </FormCard>
            <FormCard title="Estado">
              <Skeleton height={44} radius={radii.input} />
            </FormCard>
          </SkeletonGroup>
          <BottomActionBar primary={{ label: "Guardar cambios", onPress: () => undefined, disabled: true }} />
        </>
      ) : (
        // Deleted somewhere else, or the link is old (the m7 «Cita no encontrada» pattern).
        <View style={styles.centered}>
          <Text style={styles.h3} accessibilityRole="header">
            Tratamiento no encontrado
          </Text>
          <Text style={[styles.sub, styles.center]}>Puede que lo hayan eliminado.</Text>
          <Button variant="secondary" onPress={onClose}>
            Volver
          </Button>
        </View>
      )}
    </SafeAreaView>
  );
}

/** «Ibuprofeno 400 mg», «Losartán 50 mg y Metformina», «A, B, C y 2 más». */
function cycleList(cycles: TreatmentMedicationCycleRef[]): string {
  const names = cycles.map((c) => [c.medicationName, c.dosage].filter(Boolean).join(" "));
  const shown = names.length > 4 ? [...names.slice(0, 3), `${names.length - 3} más`] : names;
  if (shown.length === 1) return shown[0]!;
  return `${shown.slice(0, -1).join(", ")} y ${shown[shown.length - 1]}`;
}

/** What the confirmation says when leaving «Activo» would end medication cycles (decision 3). */
const CLOSE_COPY: Record<Exclude<TreatmentStatus, "ACTIVE">, { title: string; confirm: string; icon: LucideIcon }> = {
  COMPLETED: { title: "¿Completar el tratamiento?", confirm: "Completar tratamiento", icon: CircleCheck },
  INACTIVE: { title: "¿Marcar como inactivo?", confirm: "Marcar como inactivo", icon: CirclePause },
};

function TreatmentEditBody({
  detail,
  onClose,
  subscribeBeforeLeave,
}: Omit<TreatmentEditProps, "id"> & { detail: TreatmentDetail }) {
  const t = useAppTheme();
  const styles = useMemo(() => makeStyles(t), [t]);
  const insets = useSafeAreaInsets();

  const allowLeave = useRef(false);
  const leave = useCallback(() => {
    allowLeave.current = true;
    onClose();
  }, [onClose]);

  const form = useTreatmentForm({
    initial: detail,
    onSaved: (name) => {
      leave();
      notify({ message: "Cambios guardados", description: name });
    },
  });

  // ── «¿Descartar los cambios?» (formularios.md §7), also for the edge swipe and Android back ──
  const [askDiscard, setAskDiscard] = useState(false);
  useEffect(
    () =>
      subscribeBeforeLeave((prevent) => {
        if (!form.dirty || allowLeave.current) return;
        prevent();
        setAskDiscard(true);
      }),
    [subscribeBeforeLeave, form.dirty],
  );

  // ── Decision 3: leaving «Activo» ends its open medication cycles on the server ──
  // `detail` is the live query data: a cycle added or ended meanwhile counts.
  const openCycles = detail.medicationCycles.filter((cycle) => !cycle.endDate);
  const closing = detail.status === "ACTIVE" && form.status !== "ACTIVE" ? form.status : null;
  const [confirmStatus, setConfirmStatus] = useState(false);
  const CloseIcon = closing ? CLOSE_COPY[closing].icon : CircleCheck;

  const submit = () => {
    if (form.saving || !form.validate()) return;
    if (closing && openCycles.length > 0) {
      setConfirmStatus(true);
      return;
    }
    form.save();
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScreenHeader title="Editar tratamiento" onBack={() => (form.dirty ? setAskDiscard(true) : leave())} />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[styles.content, { paddingBottom: BOTTOM_ACTION_BAR_HEIGHT + insets.bottom + spacing[8] }]}
        >
          <FormCard title="Información básica">
            <TreatmentFields form={form} />
          </FormCard>
          <FormCard title="Estado">
            <SegmentedControl
              accessibilityLabel="Estado del tratamiento"
              options={STATUS_OPTIONS}
              value={form.status}
              onChange={(value) => {
                if (isTreatmentStatus(value)) form.setStatus(value);
              }}
            />
          </FormCard>
        </ScrollView>
      </KeyboardAvoidingView>

      <BottomActionBar
        primary={{
          label: "Guardar cambios",
          onPress: submit,
          loading: form.saving,
          loadingLabel: "Guardando…",
          disabled: form.saving,
        }}
      />

      {confirmStatus && closing ? (
        <ConfirmModal
          title={CLOSE_COPY[closing].title}
          message={`Dejaremos de recordarte las tomas de ${cycleList(openCycles)}. El historial se conserva.`}
          keepLabel="Mantener activo"
          confirmLabel={CLOSE_COPY[closing].confirm}
          // Not destructive: the cycles end, nothing is deleted (as «¿Finalizar ciclo?» in m7).
          confirmVariant="primary"
          icon={<CloseIcon size={26} strokeWidth={2.25} color={t.brand.text} />}
          iconTone="primary"
          actionsLayout="stacked"
          onCancel={() => setConfirmStatus(false)}
          onConfirm={() => {
            setConfirmStatus(false);
            form.save();
          }}
        />
      ) : null}

      {askDiscard ? (
        <DiscardChangesDialog
          onKeep={() => setAskDiscard(false)}
          onDiscard={() => {
            setAskDiscard(false);
            leave();
          }}
        />
      ) : null}
    </SafeAreaView>
  );
}

function makeStyles(t: ThemeContextValue) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: t.surface.bg },
    flex: { flex: 1 },
    content: { padding: spacing[4], gap: spacing[4] },
    skeleton: { flex: 1, overflow: "hidden" },
    half: { flex: 1 },
    centered: { flex: 1, justifyContent: "center", alignItems: "center", gap: spacing[3], padding: spacing[6] },
    h3: { fontSize: 17, fontFamily: nativeFont("heading", 800), color: t.text.primary },
    sub: { fontSize: 14, lineHeight: 21, fontFamily: nativeFont("body", 400), color: t.text.secondary },
    center: { textAlign: "center" },
  });
}
