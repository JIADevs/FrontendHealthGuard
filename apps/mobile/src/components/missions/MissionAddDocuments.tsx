import { useMemo } from "react";
import { isApiError, useLinkMissionDocumentMutation, useMissionQuery } from "@helu/api";
import { DocumentPicker } from "../documents/DocumentPicker";
import { documentCountLabel } from "../backpacks/backpackCopy";
import { notify } from "../../lib/notify";

export interface MissionAddDocumentsProps {
  missionId: string;
  /** The step the documents are attached from (informative; `final_documents` matters for appointments). */
  stepKey?: string;
  onClose: () => void;
  onUpload: () => void;
  onScan: () => void;
}

/**
 * «Vincular un documento que ya subí» (RF-61): the shared document picker. Linking never copies the
 * file; a document already in the mission shows «Ya en la misión».
 */
export function MissionAddDocuments({ missionId, stepKey, onClose, onUpload, onScan }: MissionAddDocumentsProps) {
  const mission = useMissionQuery(missionId);
  const link = useLinkMissionDocumentMutation();
  const existing = useMemo(() => new Set((mission.data?.documents ?? []).map((d) => d.id)), [mission.data]);

  const add = async (ids: string[]): Promise<void> => {
    let failed = 0;
    for (const documentId of ids) {
      try {
        await link.mutateAsync({ missionId, documentId, stepKey });
      } catch (err) {
        if (!(isApiError(err) && err.isConflict)) failed += 1;
      }
    }
    if (failed === ids.length) {
      notify({
        tone: "error",
        message: "No se pudieron adjuntar",
        description: "Revisa tu conexión e intenta de nuevo.",
        action: { label: "Reintentar", onPress: () => void add(ids) },
      });
      return;
    }
    const added = ids.length - failed;
    notify({
      tone: failed > 0 ? "warning" : "success",
      message: added === 1 ? "Documento adjuntado" : `${documentCountLabel(added)} adjuntados`,
      description: failed > 0 ? `${failed} no se pudieron adjuntar. Intenta de nuevo.` : mission.data?.title,
    });
    onClose();
  };

  return (
    <DocumentPicker
      subtitle={mission.data?.title}
      existingIds={existing}
      loadingExisting={mission.isLoading}
      lockedLabel="Ya en la misión"
      emptyDescription="Para adjuntar a tu misión necesitas documentos. Sube uno y vuelves aquí para elegirlo."
      onAdd={add}
      onUpload={onUpload}
      onScan={onScan}
    />
  );
}
