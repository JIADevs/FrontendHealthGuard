import { useCallback, useState, type ReactNode } from "react";
import * as Clipboard from "expo-clipboard";
import { useQueryClient } from "@tanstack/react-query";
import { Link2 } from "lucide-react-native";
import type { ShareLink } from "@helu/api";
import { useExtendShareMutation, useRevokeShareMutation } from "@helu/api/hooks";
import { ConfirmModal } from "@helu/ui";
import { notify } from "../../lib/notify";
import { resolveExpoReachableUrl } from "../../utils/shareLinks";

/**
 * «Copiar enlace», «Extender plazo» and «Revocar acceso» of a shared link, for its detail and for
 * the «Más» sheet of its row in «Compartidos» (#127). Revoking asks first (MASTER §7) and waits for
 * the server; render `revokeDialog` once on the screen.
 */
export function useShareLinkActions({ onRevoked }: { onRevoked?: () => void } = {}) {
  const qc = useQueryClient();
  const revoke = useRevokeShareMutation();
  const extendMut = useExtendShareMutation();
  const [revokeTarget, setRevokeTarget] = useState<ShareLink | null>(null);

  /** Resolves `true` when the link is on the clipboard. */
  const copy = useCallback(async (link: ShareLink) => {
    try {
      await Clipboard.setStringAsync(resolveExpoReachableUrl(link.shareUrl));
      notify({ message: "Enlace copiado" });
      return true;
    } catch {
      notify({ tone: "error", message: "No se pudo copiar el enlace" });
      return false;
    }
  }, []);

  const extend = useCallback(
    (link: ShareLink) =>
      extendMut.mutate(
        { linkId: link.linkId, resourceType: link.resourceType },
        {
          onSuccess: (updated) => {
            // The response is the updated link: show the new date with the toast, not after a refetch.
            qc.setQueriesData<ShareLink[]>({ queryKey: ["shares"] }, (list) =>
              list?.map((l) => (l.linkId === updated.linkId && l.resourceType === updated.resourceType ? updated : l)),
            );
            notify({ message: "Plazo extendido", description: "El enlace dura 24 horas más." });
          },
          onError: () => notify({ tone: "error", message: "No se pudo extender", description: "Revisa tu conexión e intenta de nuevo." }),
        },
      ),
    [extendMut, qc],
  );

  const doRevoke = () => {
    if (!revokeTarget) return;
    revoke.mutate(
      { linkId: revokeTarget.linkId, resourceType: revokeTarget.resourceType },
      {
        onSuccess: () => {
          setRevokeTarget(null);
          notify({ message: "Acceso revocado", description: "El enlace ya no funciona." });
          onRevoked?.();
        },
        onError: () => notify({ tone: "error", message: "No se pudo revocar", description: "Revisa tu conexión e intenta de nuevo." }),
      },
    );
  };

  const revokeDialog: ReactNode = revokeTarget ? (
    <ConfirmModal
      title="¿Revocar el acceso?"
      message="Quien tenga el enlace ya no podrá abrir los documentos. Puedes crear uno nuevo cuando quieras."
      keepLabel="Mantener enlace"
      confirmLabel="Revocar"
      icon={<Link2 />}
      iconTone="warning"
      confirmVariant="danger"
      loading={revoke.isPending}
      onConfirm={doRevoke}
      onCancel={() => setRevokeTarget(null)}
    />
  ) : null;

  return { copy, extend, extending: extendMut.isPending, requestRevoke: setRevokeTarget, revokeDialog };
}
