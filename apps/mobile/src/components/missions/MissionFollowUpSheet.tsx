import { useRef, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { CalendarDays, Stethoscope } from "lucide-react-native";
import { BottomSheet, Button, ChoiceChips, IconTile, nativeFont, spacing, useAppTheme, type BottomSheetHandle } from "@helu/ui";
import { useMissionFollowUpMutation, type MissionType } from "@helu/api";
import type { PendingFollowUp } from "../../lib/missionClosure";
import { notify } from "../../lib/notify";
import { haptics } from "../../lib/haptics";
import { useManagingSomeone } from "../home/useManagingSomeone";
import { followUpNeeds, followUpQuestion } from "./missionCopy";

/**
 * «Seguimiento posterior» and «Seguimiento de cita · ¿algo más?» (RF-52–54, v2.22): over Inicio, after
 * the celebration. Optional; it never changes the completed mission. An appointment asks with
 * multiple choice; the other types ask one question that leaves a suggested appointment.
 * Each answer becomes a suggestion in «Sugeridas» (one per type, DU-21).
 */
export function MissionFollowUpSheet({ followUp, onClose }: { followUp: PendingFollowUp; onClose: () => void }) {
  const t = useAppTheme();
  const ref = useRef<BottomSheetHandle>(null);
  const send = useMissionFollowUpMutation();
  const isAppointment = followUp.type === "medical_appointment";
  const [needs, setNeeds] = useState<MissionType[]>([]);
  const managing = useManagingSomeone();
  const copy = followUpQuestion(followUp.type, managing);
  // Same key on «Reintentar»: a retry never duplicates (RNF-13).
  const key = useRef(`fu-${followUp.missionId}-${Date.now().toString(36)}`);

  const submit = (chosen: MissionType[]) => {
    if (chosen.length === 0) {
      ref.current?.close(); // «No, nada más» / «No por ahora»: nothing to send (RF-54)
      return;
    }
    send.mutate(
      { missionId: followUp.missionId, needs: chosen, idempotencyKey: key.current },
      {
        onSuccess: () => {
          haptics.success();
          ref.current?.close(() =>
            notify({
              message: chosen.length === 1 ? "Te la dejamos en «Sugeridas»" : `Te dejamos ${chosen.length} sugerencias`,
              description: "Las encuentras en Misiones.",
            }),
          );
        },
        onError: () =>
          notify({ tone: "error", message: "No se pudo guardar", action: { label: "Reintentar", onPress: () => submit(chosen) } }),
      },
    );
  };

  return (
    <BottomSheet
      ref={ref}
      eyebrow={copy.eyebrow}
      title={copy.question}
      icon={
        <IconTile
          round
          size="lg"
          tone="appointment"
          icon={
            isAppointment ? (
              <Stethoscope size={22} strokeWidth={2.2} color={t.text.secondary} />
            ) : (
              <CalendarDays size={22} strokeWidth={2.2} color={t.text.secondary} />
            )
          }
        />
      }
      onClose={onClose}
    >
      <View style={styles.body}>
        {isAppointment ? (
          <>
            <Text style={[styles.sub, { color: t.text.secondary }]}>
              Elige todo lo que aplique. Te dejamos cada cosa como misión sugerida.
            </Text>
            <ChoiceChips
              multiple
              options={followUpNeeds.map((n) => ({ value: n.type, label: n.label }))}
              value={needs}
              onChange={(v) => setNeeds(v as MissionType[])}
            />
            <Button
              variant="primary"
              fullWidth
              disabled={needs.length === 0}
              loading={send.isPending}
              loadingLabel="Guardando…"
              onPress={() => submit(needs)}
            >
              {needs.length === 1 ? "Crear 1 sugerencia" : needs.length > 1 ? `Crear ${needs.length} sugerencias` : "Elige al menos una"}
            </Button>
            <Button variant="secondary" fullWidth onPress={() => submit([])} disabled={send.isPending}>
              No, nada más
            </Button>
          </>
        ) : (
          <>
            <Button
              variant="primary"
              fullWidth
              loading={send.isPending}
              loadingLabel="Guardando…"
              onPress={() => submit(["medical_appointment"])}
            >
              {managing ? "Sí, la necesita" : "Sí, la necesito"}
            </Button>
            <Button variant="secondary" fullWidth onPress={() => submit([])} disabled={send.isPending}>
              No por ahora
            </Button>
          </>
        )}
        <Text style={[styles.note, { color: t.text.secondary }]}>
          {isAppointment ? "" : "Te la dejamos en «Sugeridas». "}Es opcional y no cambia la misión {managing ? "que se completó" : "que completaste"}.
        </Text>
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  body: { gap: spacing[3] },
  sub: { fontSize: 14, lineHeight: 20, fontFamily: nativeFont("body", 400) },
  note: { fontSize: 13, lineHeight: 18, textAlign: "center", fontFamily: nativeFont("body", 400) },
});
