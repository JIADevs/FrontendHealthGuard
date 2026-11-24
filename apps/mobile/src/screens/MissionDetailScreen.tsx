import { useCallback, useRef } from "react";
import { useFocusEffect, useNavigation, useRoute, type RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useQueryClient } from "@tanstack/react-query";
import { missionQK } from "@helu/api";
import type { RootStackParamList } from "../navigation/RootNavigator";
import { MissionDetail } from "../components/missions";

/** Mission details are free-form JSON: only a non-empty string prefills the form. */
function textDetail(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

/** Screen: reads the route and wires navigation. The detail lives in `components/missions/MissionDetail`. */
export function MissionDetailScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { id, openStep } = useRoute<RouteProp<RootStackParamList, "MissionDetail">>().params;
  const qc = useQueryClient();
  const seen = useRef(false);

  // Coming back (from the appointment form, a document…): derived steps may have moved meanwhile,
  // and the list and «Tu próximo paso» under this screen show the same mission.
  useFocusEffect(
    useCallback(() => {
      if (seen.current) void qc.invalidateQueries({ queryKey: missionQK.all() });
      seen.current = true;
    }, [qc, id]),
  );

  return (
    <MissionDetail
      missionId={id}
      openStep={openStep}
      onSchedule={(mission) =>
        navigation.navigate("AppointmentForm", {
          missionId: mission.id,
          missionType: mission.type,
          missionSpecialty: textDetail(mission.details.specialty),
          missionExamName: textDetail(mission.details.examName),
        })
      }
      onAddMedication={(mission) =>
        navigation.navigate("MedicationForm", {
          missionId: mission.id,
          prefillName: textDetail(mission.details.medicationName),
        })
      }
      onOpenAppointment={(appointmentId) => navigation.navigate("AppointmentDetail", { id: appointmentId })}
      onAttach={(mode, missionId, stepKey) => {
        if (mode === "pick") navigation.navigate("MissionAddDocuments", { missionId, stepKey });
        else if (mode === "scan") navigation.navigate("Scanner");
        else navigation.navigate("DocumentUpload", { initialKind: "FILE" });
      }}
      onShare={(target) => navigation.navigate("ShareConfigure", { target, backTitle: "Misión" })}
      onOpenHistory={(missionId) => navigation.navigate("MissionHistory", { id: missionId, backTitle: "Misión" })}
      onOpenDocument={(documentId, title) => navigation.navigate("DocumentDetail", { id: documentId, title })}
      onBack={() => navigation.goBack()}
    />
  );
}
